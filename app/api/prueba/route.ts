import { createHash } from "node:crypto";
import { guardarAcceso, nuevoToken, type Acceso } from "@/lib/acceso";
import { planDe } from "@/lib/planes";
import { leerUsuario, MAIL_RE, normal, ponerClave } from "@/lib/usuarios";
import { readJson, StoreNotConfigured, writeJson } from "@/lib/store";

export const runtime = "nodejs";

// Primer proyecto gratis: crea la cuenta (correo + contraseña) con 15 tomas. Uno por correo y pocos por conexión al día.
export async function POST(req: Request) {
  const { email, clave, nombre } = (await req.json().catch(() => ({}))) as { email?: string; clave?: string; nombre?: string };
  const correo = normal(email || "");
  if (!MAIL_RE.test(correo)) return Response.json({ error: "Escribe un correo válido." }, { status: 400 });
  if (!clave || clave.length < 8) return Response.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  const plan = planDe("prueba")!;
  try {
    if (await leerUsuario(correo)) return Response.json({ error: "Ese correo ya tiene cuenta. Inicia sesión con tu contraseña." }, { status: 409 });
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "sin-ip";
    const dia = new Date().toISOString().slice(0, 10);
    const rIp = `pruebas-ip/${dia}/${createHash("sha256").update(ip).digest("hex").slice(0, 24)}.json`;
    const usadas = (await readJson<{ n: number }>(rIp))?.n ?? 0;
    if (usadas >= 3) return Response.json({ error: "Ya se crearon varias cuentas desde esta conexión hoy. Intenta mañana o elige un plan." }, { status: 429 });
    const a: Acceso = {
      token: nuevoToken(), plan: plan.id, email: correo, nombre: String(nombre || "").trim().slice(0, 80),
      tomas: plan.tomas, usadas: 0, proyectos: 0, dibujos: 0, activo: true, creado: new Date().toISOString(),
      stripe: { sessions: [] }, pagos: [],
    };
    await guardarAcceso(a);
    await ponerClave(correo, a.token, clave);
    await writeJson(rIp, { n: usadas + 1 });
    return Response.json({ token: a.token, email: correo });
  } catch (err) {
    return Response.json({ error: err instanceof StoreNotConfigured ? err.message : "No se pudo crear la cuenta." }, { status: 500 });
  }
}
