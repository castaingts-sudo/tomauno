import { activarSesion, esAdmin, leerAcceso, restantes, type Acceso } from "@/lib/acceso";
import { planDe } from "@/lib/planes";
import { hayStripe, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const publico = (a: Acceso) => ({ token: a.token, plan: planDe(a.plan)?.nombre || a.plan, mensual: planDe(a.plan)?.tipo === "mensual", tomas: a.tomas, usadas: a.usadas, restantes: restantes(a), activo: a.activo, email: a.email });

// ?session_id=… al regresar de Stripe (activa el acceso); ?token=… para ver el saldo.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const cobro = hayStripe();
  if (esAdmin(req)) return Response.json({ cobro, admin: true });
  const sid = u.searchParams.get("session_id");
  try {
    if (sid && cobro && /^cs_[A-Za-z0-9_]+$/.test(sid)) {
      const s = await stripe<Parameters<typeof activarSesion>[0]>(`checkout/sessions/${sid}`);
      const a = await activarSesion(s);
      if (!a) return Response.json({ cobro, error: "El pago todavía no aparece como completado." }, { status: 402 });
      return Response.json({ cobro, acceso: publico(a) });
    }
    const token = u.searchParams.get("token");
    const a = token ? await leerAcceso(token) : null;
    return Response.json({ cobro, acceso: a ? publico(a) : null });
  } catch (err) {
    return Response.json({ cobro, error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
