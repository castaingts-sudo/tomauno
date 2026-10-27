import { randomBytes } from "node:crypto";
import { armarRevision, ID_RE, type RevisionGuardada } from "@/lib/share";
import { readJson, StoreNotConfigured, writeJson } from "@/lib/store";
import type { Paquete } from "@/lib/types";

export const runtime = "nodejs";

// Crea (o actualiza) el link de revisión para el cliente.
export async function POST(req: Request) {
  const { paquete, id, ownerToken } = (await req.json()) as { paquete: Paquete; id?: string; ownerToken?: string };
  if (!paquete?.guionAudiovisual) return Response.json({ error: "Proyecto inválido." }, { status: 400 });

  try {
    let shareId = randomBytes(12).toString("base64url");
    let token = randomBytes(24).toString("base64url");
    if (id && ownerToken && ID_RE.test(id)) {
      const prev = await readJson<RevisionGuardada>(`shares/${id}.json`);
      if (prev?.ownerToken === ownerToken) {
        shareId = id;
        token = ownerToken;
      }
    }
    const rev: RevisionGuardada = { ...armarRevision(paquete, shareId), ownerToken: token };
    await writeJson(`shares/${shareId}.json`, rev);
    return Response.json({ id: shareId, ownerToken: token, url: `/r/${shareId}` });
  } catch (err) {
    const msg = err instanceof StoreNotConfigured ? err.message : "No se pudo guardar el link.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
