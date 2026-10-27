import { randomBytes } from "node:crypto";
import { ID_RE, type Comentario } from "@/lib/share";
import { readJson, writeJson } from "@/lib/store";

export const runtime = "nodejs";

const TIPOS = ["comentario", "aprobado", "cambios"] as const;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_RE.test(id) || !(await readJson(`shares/${id}.json`))) {
    return Response.json({ error: "Link no encontrado." }, { status: 404 });
  }
  const b = (await req.json()) as Partial<Comentario>;
  const texto = String(b.texto ?? "").trim().slice(0, 2000);
  const tipo = TIPOS.includes(b.tipo as Comentario["tipo"]) ? (b.tipo as Comentario["tipo"]) : "comentario";
  if (!texto && tipo === "comentario") return Response.json({ error: "Escribe un comentario." }, { status: 400 });

  const c: Comentario = {
    escena: typeof b.escena === "number" ? b.escena : null,
    nombre: String(b.nombre ?? "").trim().slice(0, 80) || "Cliente",
    texto,
    tipo,
    fecha: new Date().toISOString(),
  };
  await writeJson(`comentarios/${id}/${Date.now()}-${randomBytes(4).toString("hex")}.json`, c);
  return Response.json({ ok: true });
}
