import { randomBytes } from "node:crypto";
import { cuentaDe, listarAccesos } from "@/lib/acceso";
import { enviarCorreo, hayCorreo, plantilla } from "@/lib/correo";
import { readJson, StoreNotConfigured, writeJson } from "@/lib/store";

export const runtime = "nodejs";

// Entrar con tu correo: se manda un link de un solo uso que deja el código de acceso en ese navegador.

interface Entrada { token: string; email: string; vence: string; usado?: boolean }
const ID_RE = /^[A-Za-z0-9_-]{20,64}$/;
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || !MAIL_RE.test(email)) return Response.json({ error: "Escribe un correo válido." }, { status: 400 });
  if (!hayCorreo()) return Response.json({ error: "El envío de correos todavía no está configurado." }, { status: 503 });
  try {
    const a = cuentaDe(await listarAccesos(), email);
    // Misma respuesta exista o no la cuenta, para no revelar quién es cliente.
    if (a) {
      const id = randomBytes(24).toString("base64url");
      await writeJson(`entradas/${id}.json`, { token: a.token, email: a.email, vence: new Date(Date.now() + 30 * 60_000).toISOString() } satisfies Entrada);
      const url = `${new URL(req.url).origin}/estudio?entrar=${id}`;
      await enviarCorreo(a.email, "Tu link para entrar a Toma uno", plantilla("Entra a tu estudio", "Toca el botón para abrir Toma uno con tus proyectos y tus tomas en este dispositivo. El link sirve una vez y vence en 30 minutos.", { texto: "Entrar al estudio", url }, "Si no lo pediste, ignora este correo."));
    }
    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof StoreNotConfigured ? err.message : "No se pudo enviar el link.";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!ID_RE.test(id)) return Response.json({ error: "Link inválido." }, { status: 400 });
  const e = await readJson<Entrada>(`entradas/${id}.json`);
  if (!e || e.usado || e.vence < new Date().toISOString()) return Response.json({ error: "Ese link ya se usó o venció. Pide otro." }, { status: 410 });
  await writeJson(`entradas/${id}.json`, { ...e, usado: true });
  return Response.json({ token: e.token, email: e.email });
}
