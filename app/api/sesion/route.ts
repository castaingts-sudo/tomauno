import { guardarAcceso, leerAcceso } from "@/lib/acceso";
import { leerUsuario, MAIL_RE, normal, ponerClave, verificar } from "@/lib/usuarios";
import { StoreNotConfigured } from "@/lib/store";
import { anotar, fallo as intentoFallido, frenado } from "@/lib/actividad";

export const runtime = "nodejs";

const error = (msg: string, status = 400) => Response.json({ error: msg }, { status });
const fallo = (err: unknown) => error(err instanceof StoreNotConfigured ? err.message : "No se pudo completar. Intenta de nuevo.", 500);

// Iniciar sesión con correo y contraseña → devuelve el código de la cuenta.
export async function POST(req: Request) {
  const { email, clave } = (await req.json().catch(() => ({}))) as { email?: string; clave?: string };
  if (!email || !MAIL_RE.test(email) || !clave) return error("Escribe tu correo y tu contraseña.");
  if (await frenado(req, "sesion", 10)) return error("Demasiados intentos. Espera 15 minutos o recupera tu contraseña.", 429);
  try {
    const u = await verificar(email, clave);
    const a = u ? await leerAcceso(u.token) : null;
    if (!u || !a) {
      await Promise.all([intentoFallido(req, "sesion"), anotar(req, "entrar-fallido", { email: normal(email) })]);
      await new Promise((r) => setTimeout(r, 600));
      return error("Correo o contraseña incorrectos.", 401);
    }
    await anotar(req, "entrar", { email: u.email, detalle: "correo y contraseña" });
    return Response.json({ token: a.token, email: u.email });
  } catch (err) {
    return fallo(err);
  }
}

// Crear o cambiar la contraseña de la cuenta con la que ya se entró (cabecera x-toma-acceso).
export async function PUT(req: Request) {
  const a = await leerAcceso(req.headers.get("x-toma-acceso") || "");
  if (!a) return error("Primero inicia sesión.", 401);
  const { email, clave } = (await req.json().catch(() => ({}))) as { email?: string; clave?: string };
  const correo = normal(a.email || email || "");
  if (!MAIL_RE.test(correo)) return error("Escribe un correo válido.");
  if (!clave || clave.length < 8) return error("La contraseña debe tener al menos 8 caracteres.");
  try {
    const previo = await leerUsuario(correo);
    if (previo && previo.token !== a.token && (await leerAcceso(previo.token))?.activo) return error("Ese correo ya tiene otra cuenta. Inicia sesión con él.", 409);
    if (!a.email) await guardarAcceso({ ...a, email: correo });
    await ponerClave(correo, a.token, clave);
    return Response.json({ ok: true, email: correo });
  } catch (err) {
    return fallo(err);
  }
}
