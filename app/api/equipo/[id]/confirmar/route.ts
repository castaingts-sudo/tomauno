import type { HojaGuardada } from "@/lib/hoja";
import { ID_RE } from "@/lib/share";
import { readJson, writeJson } from "@/lib/store";

export const runtime = "nodejs";

// Confirmación de equipo desde cada hoja de llamado: "lo llevo", "no lo tengo" y una alternativa.
export interface Confirmacion { estado: "llevo" | "no"; alternativa?: string; fecha: string }
export type Confirmaciones = Record<string, Record<string, Confirmacion>>; // rol → item → respuesta

const ruta = (id: string) => `equipo/${id}-confirmaciones.json`;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_RE.test(id)) return Response.json({}, { status: 404 });
  return Response.json((await readJson<Confirmaciones>(ruta(id))) ?? {}, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_RE.test(id)) return Response.json({ error: "Link no encontrado." }, { status: 404 });
  const hoja = await readJson<HojaGuardada>(`equipo/${id}.json`);
  const b = (await req.json().catch(() => ({}))) as { rol?: string; item?: string; estado?: string; alternativa?: string };
  if (!hoja || !hoja.equipo.some((o) => o.id === b.rol)) return Response.json({ error: "Link no encontrado." }, { status: 404 });
  const item = String(b.item ?? "").trim().slice(0, 200);
  if (!item || (b.estado !== "llevo" && b.estado !== "no")) return Response.json({ error: "Respuesta inválida." }, { status: 400 });
  const todas = (await readJson<Confirmaciones>(ruta(id))) ?? {};
  todas[b.rol!] = { ...todas[b.rol!], [item]: { estado: b.estado, alternativa: String(b.alternativa ?? "").trim().slice(0, 300) || undefined, fecha: new Date().toISOString() } };
  await writeJson(ruta(id), todas);
  return Response.json({ ok: true });
}
