import { createHash } from "node:crypto";
import { esAdmin, leerAcceso } from "@/lib/acceso";
import { listJson, StoreNotConfigured, writeJson } from "@/lib/store";
import type { Proyecto } from "@/lib/types";

export const runtime = "nodejs";

// Proyectos guardados en la cuenta (código de acceso o administrador) para verlos desde cualquier dispositivo o dominio.
// Al borrar se deja una marca { id, borrado } para que los otros dispositivos también lo quiten.

type Guardado = Proyecto & { editado?: string; borrado?: boolean };
const ID_RE = /^[A-Za-z0-9-]{8,64}$/;

async function dueno(req: Request): Promise<string | null> {
  if (esAdmin(req)) return "admin";
  const token = req.headers.get("x-toma-acceso") || "";
  if (!token || !(await leerAcceso(token))) return null;
  return createHash("sha256").update(token).digest("hex").slice(0, 32);
}

function falla(err: unknown) {
  const msg = err instanceof StoreNotConfigured ? err.message : "No se pudo guardar en la nube.";
  return Response.json({ error: msg }, { status: 500 });
}

export async function GET(req: Request) {
  const d = await dueno(req);
  if (!d) return Response.json({ error: "Sin cuenta." }, { status: 401 });
  try {
    return Response.json({ proyectos: await listJson<Guardado>(`proyectos/${d}/`) });
  } catch (err) {
    return falla(err);
  }
}

export async function PUT(req: Request) {
  const d = await dueno(req);
  if (!d) return Response.json({ error: "Sin cuenta." }, { status: 401 });
  const p = (await req.json().catch(() => null)) as Guardado | null;
  if (!p || !ID_RE.test(p.id || "") || (!p.borrado && !p.paquete)) return Response.json({ error: "Proyecto inválido." }, { status: 400 });
  const limpio: Guardado = p.borrado ? { id: p.id, borrado: true, editado: p.editado } as Guardado : { ...p, brief: { ...p.brief, pdf: undefined } };
  try {
    await writeJson(`proyectos/${d}/${p.id}.json`, limpio);
    return Response.json({ ok: true });
  } catch (err) {
    return falla(err);
  }
}
