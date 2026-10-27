import type { EquipoItem, Escena, Jornada, Locacion, Operador, Paquete, Plano } from "./types";

// Hojas de llamado del equipo de rodaje: un solo registro, una vista por operador.
// No lleva presupuesto ni datos del cliente que el equipo no necesita.

export interface TomaHoja extends Plano {
  svg?: string;
  cuadro: string; // descripción del cuadro en el storyboard
}

export interface Hoja {
  id: string;
  titulo: string;
  logline: string;
  duracion: string;
  formato: string;
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

export function armarHoja(p: Paquete, equipo: Operador[], id: string): Hoja {
  return {
    id,
    titulo: p.resumen.titulo,
    logline: p.resumen.logline,
    duracion: p.resumen.duracion,
    formato: p.resumen.formato,
    actualizado: new Date().toISOString(),
    equipo,
    escenas: p.guionAudiovisual,
    tomas: p.guionTecnico.map((s) => {
      const f = p.storyboard.find((x) => x.planoId === s.id);
      return { ...s, svg: f?.svg, cuadro: f?.descripcion ?? "" };
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
