import { randomBytes } from "node:crypto";
import { writeBytes } from "./store";
import type { Plano } from "./types";

// Dibujos de storyboard con el generador de imágenes de Google (Gemini).
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

export const hayGenerador = () => Boolean(process.env.GEMINI_API_KEY);

export interface Contexto {
  titulo?: string;
  estilo?: string;
  escenas?: { numero: number; encabezado: string }[];
  personajes?: string; // descripción fija del talento para que se vea igual en todas las tomas
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
  ]
    .filter(Boolean)
    .join("\n");
}

// Genera y guarda el dibujo; devuelve la URL interna para usar en <img>.
export async function dibujar(p: Plano, c: Contexto): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptDe(p, c) }] }],
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
