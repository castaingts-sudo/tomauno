import { planDe } from "@/lib/planes";
import { hayStripe, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

// /api/checkout?plan=spot → página de pago de Stripe. Para el paquete extra se manda también &token=…
export async function GET(req: Request) {
  const u = new URL(req.url);
  const plan = planDe(u.searchParams.get("plan"));
  const origen = u.origin;
  if (!plan) return Response.redirect(`${origen}/#planes`, 303);
  if (!hayStripe()) return Response.redirect(`${origen}/estudio`, 303);
  const token = u.searchParams.get("token") || undefined;
  const mensual = plan.tipo === "mensual";
  const metadata = { app: "toma-uno", plan: plan.id, ...(token ? { token } : {}) };

  try {
    const s = await stripe<{ url: string }>("checkout/sessions", {
      mode: mensual ? "subscription" : "payment",
      locale: "es-419",
      allow_promotion_codes: "true",
      billing_address_collection: "auto",
      success_url: `${origen}/estudio?pago={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origen}/#planes`,
      metadata,
      ...(mensual ? { subscription_data: { metadata } } : { customer_creation: "always", payment_intent_data: { metadata, description: `Toma uno · ${plan.nombre}` } }),
      line_items: {
        0: {
          quantity: 1,
          price_data: {
            currency: "mxn",
            unit_amount: plan.centavos,
            product_data: { name: `Toma uno · ${plan.nombre}`, description: plan.tope, metadata: { app: "toma-uno", plan: plan.id } },
            ...(mensual ? { recurring: { interval: "month" } } : {}),
          },
        },
      },
    });
    return Response.redirect(s.url, 303);
  } catch (err) {
    console.error("checkout", err);
    return new Response(`No se pudo abrir el pago: ${err instanceof Error ? err.message : err}`, { status: 502 });
  }
}
