import type { Brief, Operador, Plano } from "./types";

const LETRAS = "ABCDEF";

// Equipo por defecto: director, N cámaras y piloto si hay tomas aéreas.
export function equipoBase(camaras: number, dron: boolean): Operador[] {
  const ops: Operador[] = [{ id: "director", rol: "Director", tipo: "director", nombre: "", contacto: "" }];
  for (let i = 0; i < Math.max(1, Math.min(camaras, LETRAS.length)); i++) {
    ops.push({ id: `cam-${LETRAS[i].toLowerCase()}`, rol: `Cámara ${LETRAS[i]}`, tipo: "camara", nombre: "", contacto: "" });
  }
  if (dron) ops.push({ id: "dron", rol: "Piloto de dron", tipo: "dron", nombre: "", contacto: "" });
  return ops;
}

export const equipoDe = (b: Brief): Operador[] => b.equipoRodaje ?? equipoBase(1, b.incluirDron);

// Rehace el equipo con otro número de cámaras o dron, conservando nombres y contactos.
export function ajustarEquipo(actual: Operador[], camaras: number, dron: boolean): Operador[] {
  return equipoBase(camaras, dron).map((o) => {
    const prev = actual.find((x) => x.id === o.id);
    return prev ? { ...o, nombre: prev.nombre, contacto: prev.contacto, equipo: prev.equipo } : o;
  });
}

const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const esAereo = (p: Plano) => /dron|aereo|rpas/.test(norm(`${p.operador} ${p.camara}`));

// Tomas que le tocan a un operador. Usa "operador" y, en proyectos viejos, adivina por "camara".
export function tomasDe(op: Operador, planos: Plano[], equipo: Operador[]): Plano[] {
  if (op.tipo === "director") return planos;
  const asignadas = planos.filter((p) => norm(p.operador) === norm(op.rol));
  if (asignadas.length || planos.some((p) => p.operador)) return asignadas;
  if (op.tipo === "dron") return planos.filter(esAereo);
  const porNombre = planos.filter((p) => !esAereo(p) && norm(p.camara).includes(norm(op.rol)));
  if (porNombre.length) return porNombre;
  return equipo.filter((o) => o.tipo === "camara").length === 1 ? planos.filter((p) => !esAereo(p)) : [];
}

// Placeholder del campo de equipo según el rol.
export const ejemploEquipo = (o: Operador) =>
  o.tipo === "dron" ? "Dron (ej. Mavic 3 Cine, ND, 6 baterías)" : "Cámara y lentes (ej. FX3 · 24-70, 85 mm)";
