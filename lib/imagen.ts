import { randomBytes } from "node:crypto";
import { readBytes, writeBytes } from "./store";
import type { Plano } from "./types";

// Dibujos de storyboard con el generador de imágenes de Google (Gemini).
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

export const hayGenerador = () => Boolean(process.env.GEMINI_API_KEY);

export interface Contexto {
  titulo?: string;
  estilo?: string;
  escenas?: { numero: number; encabezado: string }[];
  personajes?: string; // descripción fija del talento para que se vea igual en todas las tomas
  indicaciones?: string; // cambios que pide el director para este cuadro
  base?: string; // dibujo anterior (/api/img/storyboard/…) para corregirlo en vez de empezar de cero
}

// Lee un dibujo guardado para mandarlo como referencia.
async function dibujoAnterior(url?: string): Promise<{ data: string; mime: string } | null> {
  const m = url?.match(/^\/api\/img\/(storyboard\/[\w-]+\.(png|jpg))$/);
  if (!m) return null;
  const raw = await readBytes(m[1]).catch(() => null);
  if (!raw) return null;
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(await new Response(raw).arrayBuffer());
  return { data: buf.toString("base64"), mime: m[2] === "jpg" ? "image/jpeg" : "image/png" };
}

function promptDe(p: Plano, c: Contexto): string {
  const esc = c.escenas?.find((e) => e.numero === p.escena);
  return [
    "Professional film storyboard frame, hand-drawn by a feature-film storyboard artist in graphite pencil and grey marker on white paper.",
    "Black and white only, confident loose linework, tonal shading for light and depth, cinematic composition, 16:9 frame filling the whole image.",
    "No text, no letters, no captions, no frame numbers, no borders, no color.",
    `Shot size: ${p.tipoPlano}. Camera angle: ${p.angulo}. Lens: ${p.lente} (wide lenses exaggerate depth and space, long lenses compress the background and isolate the subject; draw the perspective accordingly).`,
    "Compose like a master cinematographer: deliberate horizon, rule of thirds, foreground elements for depth, leading lines, headroom and looking room.",
    p.movimiento && !/^fijo$/i.test(p.movimiento.trim()) ? `Camera movement: ${p.movimiento}; show it with one bold drawn arrow.` : "Static camera.",
    esc ? `Scene: ${esc.encabezado}.` : "",
    `Action in frame: ${p.descripcion}`,
    c.personajes ? `Characters (keep consistent): ${c.personajes}` : "",
    c.estilo ? `Mood of the production: ${c.estilo}.` : "",
    c.indicaciones ? `Director's notes for this frame (these take priority over everything above): ${c.indicaciones}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// Genera y guarda el dibujo; devuelve la URL interna para usar en <img>.
export async function dibujar(p: Plano, c: Contexto): Promise<string> {
  const ref = c.indicaciones ? await dibujoAnterior(c.base) : null;
  const parts = ref
    ? [
        { inlineData: { mimeType: ref.mime, data: ref.data } },
        { text: `Redraw this storyboard frame applying the director's notes. Keep the same pencil style, characters, location and camera setup unless the notes change them.\n\n${promptDe(p, c)}` },
      ]
    : [{ text: promptDe(p, c) }];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  const parte = j.candidates?.[0]?.content?.parts?.find((x: { inlineData?: { data: string } }) => x.inlineData?.data);
  if (!parte) throw new Error("Gemini no devolvió imagen");
  const mime: string = parte.inlineData.mimeType || "image/png";
  const ext = mime.includes("jpeg") ? "jpg" : "png";
  const nombre = `storyboard/${randomBytes(10).toString("base64url")}-${p.id.replace(/[^\w-]/g, "")}.${ext}`;
  await writeBytes(nombre, Buffer.from(parte.inlineData.data, "base64"), mime);
  return `/api/img/${nombre}`;
}
