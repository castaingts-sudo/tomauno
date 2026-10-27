import { randomBytes } from "node:crypto";
import { armarHoja, type HojaGuardada } from "@/lib/hoja";
import { ID_RE } from "@/lib/share";
import { readJson, StoreNotConfigured, writeJson } from "@/lib/store";
import type { Operador, Paquete } from "@/lib/types";

export const runtime = "nodejs";

// Crea (o actualiza) las hojas de llamado del equipo: un link por operador.
export async function POST(req: Request) {
  const { paquete, equipo, id, ownerToken, fechaRodaje } = (await req.json()) as { paquete: Paquete; equipo: Operador[]; id?: string; ownerToken?: string; fechaRodaje?: string };
  if (!paquete?.guionTecnico || !Array.isArray(equipo) || !equipo.length) return Response.json({ error: "Proyecto inválido." }, { status: 400 });

  try {
    let hojaId = randomBytes(12).toString("base64url");
    let token = randomBytes(24).toString("base64url");
    if (id && ownerToken && ID_RE.test(id)) {
      const prev = await readJson<HojaGuardada>(`equipo/${id}.json`);
      if (prev?.ownerToken === ownerToken) {
        hojaId = id;
        token = ownerToken;
      }
    }
    const hoja: HojaGuardada = { ...armarHoja(paquete, equipo, hojaId, fechaRodaje), ownerToken: token };
    await writeJson(`equipo/${hojaId}.json`, hoja);
    return Response.json({ id: hojaId, ownerToken: token });
  } catch (err) {
    const msg = err instanceof StoreNotConfigured ? err.message : "No se pudieron guardar los links.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
