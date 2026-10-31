import { randomBytes, timingSafeEqual } from "node:crypto";
import { COSTO_DIBUJO_MXN, COSTO_PROYECTO_MXN, planDe } from "./planes";
import { hayStripe } from "./stripe";
import { listJson, readJson, writeJson } from "./store";
import { enviarCorreo, plantilla, SITIO } from "./correo";

// Acceso pagado al estudio: cada compra da un token con tomas; los proyectos las descuentan.
// El cobro solo se exige cuando Stripe está configurado; el administrador entra con TOMA_ADMIN_CODE.

export interface Pago { fecha: string; centavos: number; concepto: string; ref: string }

export interface Acceso {
  token: string;
  plan: string;
  email: string;
  nombre: string;
  tomas: number; // disponibles en total (compra + extras + renovación)
  usadas: number;
  proyectos: number;
  dibujos: number;
  activo: boolean;
  creado: string;
  renovado?: string;
  stripe: { customer?: string; subscription?: string; sessions: string[] };
  pagos: Pago[];
}

export interface Uso { fecha: string; token: string; tipo: "proyecto" | "dibujo"; cantidad: number; titulo?: string; costo: number }

export const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
export const nuevoToken = () => randomBytes(18).toString("base64url");

export const leerAcceso = (token: string) => (TOKEN_RE.test(token) ? readJson<Acceso>(`accesos/${token}.json`) : Promise.resolve(null));
export const guardarAcceso = (a: Acceso) => writeJson(`accesos/${a.token}.json`, a);
export const listarAccesos = () => listJson<Acceso>("accesos/");
export const listarUsos = () => listJson<Uso>("usos/");

export const restantes = (a: Acceso) => Math.max(0, a.tomas - a.usadas);

export function esAdmin(req: Request): boolean {
  const clave = process.env.TOMA_ADMIN_CODE;
  const dada = req.headers.get("x-toma-admin") || "";
  if (!clave || !dada) return false;
  const a = Buffer.from(clave), b = Buffer.from(dada);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type Permiso = { libre: true; admin: boolean; acceso?: undefined } | { libre: false; admin: false; acceso: Acceso };

// ¿Puede usar la IA? Sin Stripe configurado todo sigue abierto como hasta ahora.
export async function permiso(req: Request, minimo = 1): Promise<Permiso | Response> {
  if (esAdmin(req)) return { libre: true, admin: true };
  if (!hayStripe()) return { libre: true, admin: false };
  const token = req.headers.get("x-toma-acceso") || "";
  const a = token ? await leerAcceso(token) : null;
  if (!a || !a.activo) return Response.json({ error: "Necesitas un plan para generar proyectos.", codigo: "sin-acceso" }, { status: 402 });
  if (restantes(a) < minimo) return Response.json({ error: "Ya usaste todas tus tomas. Compra un paquete extra o cambia de plan.", codigo: "sin-tomas" }, { status: 402 });
  return { libre: false, admin: false, acceso: a };
}

// De varias compras con el mismo correo, la activa con más tomas; luego la más reciente.
export function cuentaDe(accesos: Acceso[], email: string): Acceso | null {
  const e = email.trim().toLowerCase();
  const suyas = accesos.filter((a) => a.email?.toLowerCase() === e);
  suyas.sort((a, b) => Number(b.activo) - Number(a.activo) || restantes(b) - restantes(a) || b.creado.localeCompare(a.creado));
  return suyas[0] || null;
}

// Registra el uso y, si hay acceso pagado, descuenta tomas (los dibujos no descuentan).
export async function registrarUso(p: Permiso, tipo: Uso["tipo"], cantidad: number, titulo?: string) {
  const costo = tipo === "proyecto" ? COSTO_PROYECTO_MXN : cantidad * COSTO_DIBUJO_MXN;
  const token = p.acceso?.token || (p.admin ? "admin" : "libre");
  try {
    if (p.acceso) {
      const a = (await leerAcceso(p.acceso.token)) || p.acceso;
      if (tipo === "proyecto") { a.usadas += cantidad; a.proyectos += 1; } else a.dibujos += cantidad;
      await guardarAcceso(a);
    }
    const fecha = new Date().toISOString();
    await writeJson(`usos/${fecha.replace(/[:.]/g, "-")}-${randomBytes(3).toString("hex")}.json`, { fecha, token, tipo, cantidad, titulo, costo } satisfies Uso);
  } catch (e) {
    console.error("registrarUso", e);
  }
}

// Límite que se le da a la IA según el plan y las tomas que quedan.
export function limiteDe(p: Permiso): { tomas?: number; minutos?: number } {
  if (!p.acceso) return {};
  const plan = planDe(p.acceso.plan);
  const quedan = restantes(p.acceso);
  return { tomas: plan?.tipo === "proyecto" ? Math.min(quedan, plan.tomas) : quedan, minutos: plan?.minutos };
}

// Alta o recarga a partir de una sesión de Checkout pagada (la llaman el regreso del cliente y el webhook; es idempotente).
export async function activarSesion(s: {
  id: string; payment_status: string; status: string; amount_total: number; customer?: string | null; subscription?: string | null;
  metadata?: Record<string, string>; customer_details?: { email?: string | null; name?: string | null } | null;
}): Promise<Acceso | null> {
  if (s.metadata?.app !== "toma-uno" || s.status !== "complete" || (s.payment_status !== "paid" && s.payment_status !== "no_payment_required")) return null;
  const ya = await readJson<{ token: string }>(`sesiones/${s.id}.json`);
  if (ya) return leerAcceso(ya.token);
  const plan = planDe(s.metadata.plan);
  if (!plan) return null;
  const pago: Pago = { fecha: new Date().toISOString(), centavos: s.amount_total, concepto: plan.nombre, ref: s.id };

  let a: Acceso | null = null;
  let nueva = false;
  if (plan.tipo === "extra" && s.metadata.token) a = await leerAcceso(s.metadata.token);
  if (a) {
    a.tomas += plan.tomas;
    a.pagos.push(pago);
    a.stripe.sessions.push(s.id);
  } else {
    a = {
      token: nuevoToken(),
      plan: plan.id,
      email: s.customer_details?.email || "",
      nombre: s.customer_details?.name || "",
      tomas: plan.tomas,
      usadas: 0,
      proyectos: 0,
      dibujos: 0,
      activo: true,
      creado: new Date().toISOString(),
      stripe: { customer: s.customer || undefined, subscription: s.subscription || undefined, sessions: [s.id] },
      pagos: [pago],
    };
    nueva = true;
    if (s.subscription) await writeJson(`suscripciones/${s.subscription}.json`, { token: a.token });
  }
  await guardarAcceso(a);
  await writeJson(`sesiones/${s.id}.json`, { token: a.token });
  if (nueva && a.email) {
    await enviarCorreo(
      a.email,
      `Bienvenido a Toma uno · ${plan.nombre}`,
      plantilla(
        "Tu estudio está listo",
        `Tienes <b style="color:#ece7dc">${plan.tomas} tomas</b> en el plan ${plan.nombre}. Para entrar desde cualquier dispositivo, usa <b style="color:#ece7dc">Entrar con tu correo</b> con esta misma dirección.`,
        { texto: "Abrir el estudio", url: `${SITIO()}/estudio` },
        `Tu código de acceso, por si lo necesitas: <span style="font-family:monospace;color:#9a958b">${a.token}</span>`,
      ),
    ).catch(() => false);
  }
  return a;
}
