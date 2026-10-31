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
    return prev ? { ...o, nombre: prev.nombre, contacto: prev.contacto, camara: prev.camara, equipo: prev.equipo } : o;
  });
}

const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const esAereo = (p: Plano) => /dron|aereo|rpas/.test(norm(`${p.operador} ${p.camara}`));

// ¿Esta toma es de este operador? Acepta variantes como "Cam A", "Cámara A (Steadicam)" o "Piloto RPAS".
function esDe(p: Plano, op: Operador): boolean {
  const n = norm(p.operador);
  if (!n) return false;
  if (n === norm(op.rol)) return true;
  if (op.tipo === "dron") return /dron|piloto|rpas|aere/.test(n);
  if (/dron|piloto|rpas|aere/.test(n)) return false;
  const letra = norm(op.rol).slice(-1);
  return n.includes(norm(op.rol)) || new RegExp(`\\b(camara|cam|camera|operador)\\s*${letra}\\b|\\b${letra}[\\s-]*cam`).test(n);
}

// Tomas que le tocan a un operador. Usa "operador" y, en proyectos viejos o con nombres libres, adivina por "camara".
export function tomasDe(op: Operador, planos: Plano[], equipo: Operador[]): Plano[] {
  if (op.tipo === "director") return planos;
  const asignadas = planos.filter((p) => esDe(p, op));
  if (asignadas.length) return asignadas;
  if (planos.some((p) => equipo.some((o) => o.tipo !== "director" && esDe(p, o)))) return [];
  if (op.tipo === "dron") return planos.filter(esAereo);
  const porNombre = planos.filter((p) => !esAereo(p) && norm(p.camara).includes(norm(op.rol)));
  if (porNombre.length) return porNombre;
  return equipo.filter((o) => o.tipo === "camara").length === 1 ? planos.filter((p) => !esAereo(p)) : [];
}

// Placeholder del campo de equipo según el rol.
export const ejemploEquipo = (o: Operador) =>
  o.tipo === "dron" ? "Dron (ej. Mavic 3 Cine, ND, 6 baterías)" : "Cámara y lentes (ej. FX3 · 24-70, 85 mm)";
