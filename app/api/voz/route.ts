import { prepara, vozEnOff } from "@/lib/voz";
import { readBytes } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

// GET /api/voz?t=<voz en off de la escena> → mp3 (se genera la primera vez y luego se reutiliza).
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t")?.slice(0, 800) || "";
  const { limpio, voz } = prepara(t);
  if (!limpio) return new Response("Sin texto", { status: 400 });
  try {
    const { ruta } = await vozEnOff(limpio, voz);
    const data = await readBytes(ruta);
    if (!data) throw new Error("No se guardó");
    return new Response(data as BodyInit, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch (err) {
    console.error("voz", err);
    return new Response(`No se pudo generar la voz: ${String(err instanceof Error ? err.message : err).slice(0, 200)}`, { status: 502 });
  }
}
