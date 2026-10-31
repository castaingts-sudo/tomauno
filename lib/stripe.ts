import { createHmac, timingSafeEqual } from "node:crypto";

// Cliente mínimo de la API de Stripe (sin SDK): formulario anidado y verificación de webhooks.

export const hayStripe = () => Boolean(process.env.STRIPE_SECRET_KEY);

function aplanar(obj: Record<string, unknown>, prefijo = "", out: [string, string][] = []): [string, string][] {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const clave = prefijo ? `${prefijo}[${k}]` : k;
    if (typeof v === "object") aplanar(v as Record<string, unknown>, clave, out);
    else out.push([clave, String(v)]);
  }
  return out;
}

export async function stripe<T = Record<string, unknown>>(ruta: string, params?: Record<string, unknown>, metodo: "GET" | "POST" = params ? "POST" : "GET"): Promise<T> {
  const qs = params ? new URLSearchParams(aplanar(params)).toString() : "";
  const res = await fetch(`https://api.stripe.com/v1/${ruta}${metodo === "GET" && qs ? `?${qs}` : ""}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    body: metodo === "POST" ? qs : undefined,
    cache: "no-store",
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error?.message || `Stripe ${res.status}`);
  return j as T;
}

// Firma "t=…,v1=…" con tolerancia de 5 minutos.
export function firmaValida(cuerpo: string, cabecera: string | null): boolean {
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secreto || !cabecera) return false;
  const partes = Object.fromEntries(cabecera.split(",").map((x) => x.split("=") as [string, string]));
  const t = Number(partes.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const esperada = createHmac("sha256", secreto).update(`${t}.${cuerpo}`).digest("hex");
  return cabecera
    .split(",")
    .filter((x) => x.startsWith("v1="))
    .some((x) => {
      const a = Buffer.from(x.slice(3)), b = Buffer.from(esperada);
      return a.length === b.length && timingSafeEqual(a, b);
    });
}
