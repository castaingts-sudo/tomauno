// Código de acceso y clave de administrador guardados en el navegador; viajan como cabeceras a la IA.
const K_ACCESO = "toma-uno:acceso";
const K_ADMIN = "toma-uno:admin";

const leer = (k: string) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const poner = (k: string, v: string) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch {} };

export const tokenAcceso = () => leer(K_ACCESO);
export const claveAdmin = () => leer(K_ADMIN);
export const guardarToken = (t: string) => poner(K_ACCESO, t);
export const guardarAdmin = (c: string) => poner(K_ADMIN, c);

export function cabecerasAcceso(): Record<string, string> {
  const h: Record<string, string> = {};
  const t = tokenAcceso(), a = claveAdmin();
  if (t) h["x-toma-acceso"] = t;
  if (a) h["x-toma-admin"] = a;
  return h;
}
