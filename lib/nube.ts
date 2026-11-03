import { cabecerasAcceso, claveAdmin, tokenAcceso } from "./acceso-cliente";
import type { Proyecto } from "./types";

// Sincroniza los proyectos del navegador con la cuenta (código de acceso o admin).
// Cada proyecto lleva "editado"; en un choque gana el más reciente.

export type Sincronizable = Proyecto & { editado?: string; borrado?: boolean };

export const hayCuenta = () => Boolean(tokenAcceso() || claveAdmin());
const fecha = (p: Sincronizable) => p.editado || p.creado || "";

const pendientes = new Map<string, ReturnType<typeof setTimeout>>();

// Sube con una pequeña espera: el storyboard llega por lotes y no vale la pena subir cada uno.
export function subir(p: Sincronizable, espera = 1500) {
  if (!hayCuenta()) return;
  clearTimeout(pendientes.get(p.id));
  pendientes.set(
    p.id,
    setTimeout(() => {
      pendientes.delete(p.id);
      fetch("/api/proyectos", { method: "PUT", headers: { "Content-Type": "application/json", ...cabecerasAcceso() }, body: JSON.stringify(p), keepalive: JSON.stringify(p).length < 60000 }).catch(() => {});
    }, espera),
  );
}

export function borrarEnNube(id: string) {
  subir({ id, borrado: true, editado: new Date().toISOString() } as Sincronizable, 0);
}

// Junta lo local con lo de la cuenta; sube lo que la nube no tiene o tiene más viejo.
export async function sincronizar(locales: Sincronizable[]): Promise<Sincronizable[] | null> {
  if (!hayCuenta()) return null;
  const res = await fetch("/api/proyectos", { headers: cabecerasAcceso() }).catch(() => null);
  if (!res?.ok) return null;
  const { proyectos: remotos } = (await res.json()) as { proyectos: Sincronizable[] };
  const porId = new Map<string, Sincronizable>();
  for (const r of remotos) porId.set(r.id, r);
  for (const l of locales) {
    const r = porId.get(l.id);
    if (!r || fecha(l) > fecha(r)) {
      porId.set(l.id, l);
      subir(l, 0);
    }
  }
  return [...porId.values()].filter((p) => !p.borrado && p.paquete).sort((a, b) => (b.creado || "").localeCompare(a.creado || ""));
}

// Cerrar sesión: primero se aseguran en la cuenta los proyectos de este navegador; luego se borran de aquí
// para que quien use después esta computadora no los vea. Si algo no se pudo subir, no se borra nada.
export async function cerrarSesion(): Promise<boolean> {
  let locales: Sincronizable[] = [];
  try { locales = JSON.parse(localStorage.getItem("toma-uno:proyectos") || "[]"); } catch {}
  if (hayCuenta() && locales.length) {
    const r = await Promise.all(
      locales.map((p) => fetch("/api/proyectos", { method: "PUT", headers: { "Content-Type": "application/json", ...cabecerasAcceso() }, body: JSON.stringify(p) }).then((x) => x.ok).catch(() => false)),
    );
    if (r.includes(false)) return false;
  }
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("toma-uno:") && k !== "toma-uno:tema" && k !== "toma-uno:recursos") localStorage.removeItem(k);
  } catch {}
  return true;
}
