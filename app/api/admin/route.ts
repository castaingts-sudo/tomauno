import { esAdmin, listarAccesos, listarUsos, restantes } from "@/lib/acceso";
import { planDe } from "@/lib/planes";
import { hayStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Métricas para el panel del administrador.
export async function GET(req: Request) {
  if (!process.env.TOMA_ADMIN_CODE) return Response.json({ error: "Falta poner TOMA_ADMIN_CODE en Vercel." }, { status: 503 });
  if (!esAdmin(req)) return Response.json({ error: "Clave incorrecta." }, { status: 401 });
  const [accesos, usos] = await Promise.all([listarAccesos(), listarUsos()]);
  const pagos = accesos.flatMap((a) => a.pagos.map((p) => ({ ...p, email: a.email, nombre: a.nombre })));
  const mes = new Date().toISOString().slice(0, 7);
  const suma = (xs: { centavos: number }[]) => xs.reduce((s, p) => s + p.centavos, 0) / 100;
  return Response.json({
    stripe: hayStripe(),
    webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    resumen: {
      ingresos: suma(pagos),
      ingresosMes: suma(pagos.filter((p) => p.fecha.startsWith(mes))),
      clientes: accesos.length,
      suscripcionesActivas: accesos.filter((a) => a.activo && planDe(a.plan)?.tipo === "mensual").length,
      proyectos: usos.filter((u) => u.tipo === "proyecto").length,
      tomasUsadas: usos.filter((u) => u.tipo === "proyecto").reduce((s, u) => s + u.cantidad, 0),
      dibujos: usos.filter((u) => u.tipo === "dibujo").reduce((s, u) => s + u.cantidad, 0),
      costoIA: Math.round(usos.reduce((s, u) => s + u.costo, 0)),
    },
    clientes: accesos
      .sort((a, b) => b.creado.localeCompare(a.creado))
      .map((a) => ({ email: a.email, nombre: a.nombre, plan: planDe(a.plan)?.nombre || a.plan, mensual: planDe(a.plan)?.tipo === "mensual", activo: a.activo, creado: a.creado, tomas: a.tomas, usadas: a.usadas, restantes: restantes(a), proyectos: a.proyectos, dibujos: a.dibujos, pagado: suma(a.pagos) })),
    pagos: pagos.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 50),
    usos: usos.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 60).map((u) => ({ ...u, cliente: u.token === "admin" ? "Tú (admin)" : u.token === "libre" ? "Sin cobro" : accesos.find((a) => a.token === u.token)?.email || "—" })),
  });
}
