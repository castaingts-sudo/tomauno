import type { EquipoItem, Escena, Jornada, Locacion, Operador, Paquete, Plano } from "./types";

// Hojas de llamado del equipo de rodaje: un solo registro, una vista por operador.
// No lleva presupuesto ni datos del cliente que el equipo no necesita.

export interface TomaHoja extends Plano {
  svg?: string;
  imagen?: string;
  cuadro: string; // descripción del cuadro en el storyboard
}

export interface Hoja {
  id: string;
  titulo: string;
  logline: string;
  duracion: string;
  formato: string;
  fechaRodaje?: string;
  actualizado: string;
  equipo: Operador[];
  escenas: Escena[];
  tomas: TomaHoja[];
  planRodaje: Jornada[];
  locaciones: Locacion[];
  material: EquipoItem[];
}

export interface HojaGuardada extends Hoja {
  ownerToken: string;
}

export function armarHoja(p: Paquete, equipo: Operador[], id: string, fechaRodaje?: string): Hoja {
  return {
    id,
    titulo: p.resumen.titulo,
    logline: p.resumen.logline,
    duracion: p.resumen.duracion,
    formato: p.resumen.formato,
    fechaRodaje,
    actualizado: new Date().toISOString(),
    equipo,
    escenas: p.guionAudiovisual,
    tomas: p.guionTecnico.map((s) => {
      const f = p.storyboard.find((x) => x.planoId === s.id);
      return { ...s, svg: f?.svg, imagen: f?.imagen, cuadro: f?.descripcion ?? "" };
    }),
    planRodaje: p.planRodaje,
    locaciones: p.locaciones,
    material: p.equipo,
  };
}

// Material que le interesa a cada tipo de operador.
export function materialDe(tipo: Operador["tipo"], items: EquipoItem[]): EquipoItem[] {
  if (tipo === "director") return items;
  const re = tipo === "dron" ? /dron|rpas|a[eé]re|h[eé]lice|radiocontrol|control remoto|nd/i : /c[aá]mara|lente|[oó]ptic|gimbal|estabiliz|tr[ií]pode|slider|monitor|tarjeta|bater|filtro|grip/i;
  return items.filter((i) => re.test(`${i.categoria} ${i.item}`) && !(tipo === "camara" && /dron/i.test(`${i.categoria} ${i.item}`)));
}

// Lo que cada persona debe confirmar que lleva: el equipo del plan que dice que lo trae ella, más lo que se le pidió.
export interface PorConfirmar { item: string; detalle?: string; pedido?: boolean }
const sinAcentos = (t = "") => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function porConfirmar(op: Operador, items: EquipoItem[]): PorConfirmar[] {
  const nombre = sinAcentos(op.nombre).trim();
  const partes = nombre.split(/\s+/).filter((x) => x.length > 2);
  const suyo = (i: EquipoItem) => {
    const n = sinAcentos(i.notas);
    const trae = n.match(/trae:\s*([^.;]*)/)?.[1] ?? "";
    if (!trae) return false;
    if (nombre && (trae.includes(nombre) || (partes.length >= 2 && partes.every((x) => trae.includes(x))))) return true;
    return trae.includes(sinAcentos(op.rol));
  };
  const lista: PorConfirmar[] = items.filter(suyo).map((i) => ({ item: `${i.cantidad > 1 ? `${i.cantidad}× ` : ""}${i.item}` }));
  for (const l of (op.pide || "").split("\n").map((x) => x.trim()).filter(Boolean)) lista.push({ item: l, pedido: true });
  return lista;
}
