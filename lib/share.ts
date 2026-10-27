import type { Paquete } from "./types";

// Lo que ve el cliente: solo guion audiovisual y storyboard, agrupado por escena.

export interface PanelCliente {
  planoId: string;
  svg?: string;
  descripcion: string;
  dialogo: string;
  transicion: string;
  tipoPlano: string;
  movimiento: string;
  vozEnOff: string;
  imagen?: string; // dibujo generado (opcional, sustituye al boceto SVG)
}

export interface EscenaCliente {
  numero: number;
  encabezado: string;
  video: string;
  vozEnOff?: string;
  audio: string;
  textoPantalla?: string;
  duracion: string;
  paneles: PanelCliente[];
}

export interface Revision {
  id: string;
  titulo: string;
  logline: string;
  duracion: string;
  formato: string;
  fechaRodaje?: string;
  actualizado: string;
  escenas: EscenaCliente[];
}

export interface RevisionGuardada extends Revision {
  ownerToken: string; // solo quien creó el link puede actualizarlo
}

export interface Comentario {
  escena: number | null; // null = comentario general
  nombre: string;
  texto: string;
  tipo: "comentario" | "aprobado" | "cambios";
  fecha: string;
}

export function armarRevision(p: Paquete, id: string, fechaRodaje?: string): Revision {
  return {
    id,
    titulo: p.resumen.titulo,
    logline: p.resumen.logline,
    duracion: p.resumen.duracion,
    formato: p.resumen.formato,
    fechaRodaje,
    actualizado: new Date().toISOString(),
    escenas: p.guionAudiovisual.map((e) => ({
      ...e,
      paneles: p.storyboard
        .filter((f) => p.guionTecnico.find((s) => s.id === f.planoId)?.escena === e.numero)
        .map((f) => {
          const plano = p.guionTecnico.find((s) => s.id === f.planoId);
          return { ...f, tipoPlano: plano?.tipoPlano ?? "", movimiento: plano?.movimiento ?? "", vozEnOff: plano?.vozEnOff ?? "" };
        }),
    })),
  };
}

// "8 s", "0:08", "1 min" → segundos; null si no se puede leer.
export function segundos(d: string): number | null {
  const mmss = d.match(/(\d+):(\d{2})/);
  if (mmss) return +mmss[1] * 60 + +mmss[2];
  const n = parseFloat(d.replace(",", "."));
  if (isNaN(n)) return null;
  return /min/i.test(d) ? n * 60 : n;
}

export const tc = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export const ID_RE = /^[a-zA-Z0-9_-]{10,40}$/;
