import { activarSesion, guardarAcceso, leerAcceso } from "@/lib/acceso";
import { planDe } from "@/lib/planes";
import { readJson } from "@/lib/store";
import { firmaValida } from "@/lib/stripe";

export const runtime = "nodejs";

// Eventos de Stripe: compra completada, renovación mensual y cancelación. Ignora todo lo que no sea de Toma uno.
export async function POST(req: Request) {
  const cuerpo = await req.text();
  if (!firmaValida(cuerpo, req.headers.get("stripe-signature"))) return new Response("firma inválida", { status: 400 });
  const ev = JSON.parse(cuerpo) as { type: string; data: { object: Record<string, unknown> } };
  const o = ev.data.object as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

  try {
    if (ev.type === "checkout.session.completed") await activarSesion(o as Parameters<typeof activarSesion>[0]);

    if (ev.type === "invoice.paid" && o.subscription && o.billing_reason === "subscription_cycle") {
      const ref = await readJson<{ token: string }>(`suscripciones/${o.subscription}.json`);
      const a = ref && (await leerAcceso(ref.token));
      const plan = a && planDe(a.plan);
      if (a && plan && !a.pagos.some((p) => p.ref === o.id)) {
        // Cada mes: las tomas del plan más lo que quede de paquetes extra.
        const extra = Math.max(0, a.tomas - a.usadas - plan.tomas);
        a.tomas = plan.tomas + extra;
        a.usadas = 0;
        a.activo = true;
        a.renovado = new Date().toISOString();
        a.pagos.push({ fecha: a.renovado, centavos: o.amount_paid, concepto: `${plan.nombre} (renovación)`, ref: o.id });
        await guardarAcceso(a);
      }
    }

    if (ev.type === "customer.subscription.deleted" || (ev.type === "customer.subscription.updated" && ["canceled", "unpaid"].includes(o.status))) {
      const ref = await readJson<{ token: string }>(`suscripciones/${o.id}.json`);
      const a = ref && (await leerAcceso(ref.token));
      if (a) { a.activo = false; await guardarAcceso(a); }
    }
  } catch (err) {
    console.error("webhook", ev.type, err);
    return new Response("error", { status: 500 });
  }
  return Response.json({ ok: true });
}
