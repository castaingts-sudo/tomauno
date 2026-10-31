// Correos del estudio vía Resend (RESEND_API_KEY). Sin llave, no se envía nada y se avisa en el log.

const DE = () => process.env.RESEND_FROM || "Toma uno <acceso@toma1.com.mx>";
export const SITIO = () => process.env.NEXT_PUBLIC_SITE_URL || "https://www.toma1.com.mx";
export const hayCorreo = () => Boolean(process.env.RESEND_API_KEY);

export async function enviarCorreo(para: string, asunto: string, html: string): Promise<boolean> {
  if (!hayCorreo()) {
    console.warn("enviarCorreo: falta RESEND_API_KEY");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: DE(), to: [para], subject: asunto, html }),
  }).catch((e) => (console.error("enviarCorreo", e), null));
  if (!res) return false;
  if (!res.ok) console.error("enviarCorreo", res.status, (await res.text()).slice(0, 300));
  return res.ok;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Plantilla sobria, en sala oscura, como el sitio.
export function plantilla(titulo: string, texto: string, boton: { texto: string; url: string }, pie = "") {
  return `<!doctype html><html><body style="margin:0;background:#050505;padding:40px 16px;font-family:Georgia,serif;color:#ece7dc">
<table role="presentation" width="100%" style="max-width:520px;margin:0 auto"><tr><td>
<p style="font:600 11px monospace;letter-spacing:3px;text-transform:uppercase;color:#ffc53d;margin:0 0 28px">Toma uno · Estudio de preproducción</p>
<h1 style="font:400 34px/1.1 Georgia,serif;margin:0 0 18px;color:#ece7dc">${esc(titulo)}</h1>
<p style="font:16px/1.6 -apple-system,Segoe UI,sans-serif;color:#9a958b;margin:0 0 30px">${texto}</p>
<a href="${esc(boton.url)}" style="display:inline-block;background:#ffb000;color:#1a1200;text-decoration:none;font:600 12px monospace;letter-spacing:2px;text-transform:uppercase;padding:15px 26px">${esc(boton.texto)}</a>
${pie ? `<p style="font:13px/1.6 -apple-system,Segoe UI,sans-serif;color:#5f5b54;margin:34px 0 0">${pie}</p>` : ""}
</td></tr></table></body></html>`;
}
