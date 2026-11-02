import { createHash } from "node:crypto";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { readBytes, writeBytes } from "./store";

// Voz en off del animatic con voces neuronales (las mismas que usa el orquestador con edge-tts).
// Cada texto se genera una sola vez y se guarda; después se sirve desde el store.

export const VOCES = { m: "es-MX-JorgeNeural", f: "es-MX-DaliaNeural" } as const;
export type Voz = keyof typeof VOCES;

// Quita la etiqueta "VO (Arquitecta):" y decide la voz por quién habla.
export function prepara(texto: string): { limpio: string; voz: Voz } {
  const m = /^\s*(VO|VOZ EN OFF|V\.O\.|TESTIMONIAL)\s*(\(([^)]*)\))?[^:]*:\s*/i.exec(texto);
  const quien = (m?.[3] || "").toLowerCase();
  const fem = /(a|mujer|ella|femenin\w*)$|arquitecta|narradora|estudiante\s+\w+a\b|madre|chica|ni[ñn]a|se[ñn]ora/.test(quien);
  return { limpio: (m ? texto.slice(m[0].length) : texto).trim(), voz: fem ? "f" : "m" };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function vozEnOff(texto: string, voz: Voz): Promise<{ ruta: string; nueva: boolean }> {
  const hash = createHash("sha256").update(`${VOCES[voz]}|${texto}`).digest("hex").slice(0, 32);
  const ruta = `voz/${hash}.mp3`;
  if (await readBytes(ruta)) return { ruta, nueva: false };
  const tts = new MsEdgeTTS({ connectionTimeoutMs: 10000, synthesisTimeoutMs: 30000 });
  try {
    await tts.setMetadata(VOCES[voz], OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(esc(texto), { rate: "-4%" });
    const partes: Buffer[] = [];
    await new Promise<void>((ok, mal) => {
      audioStream.on("data", (d: Buffer) => partes.push(d));
      audioStream.on("close", () => ok());
      audioStream.on("error", mal);
    });
    const audio = Buffer.concat(partes);
    if (audio.length < 1000) throw new Error("Audio vacío");
    await writeBytes(ruta, audio, "audio/mpeg");
    return { ruta, nueva: true };
  } finally {
    tts.close();
  }
}
