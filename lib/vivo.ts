// Lee lo que la IA lleva escrito (JSON a medias) para mostrarlo en vivo mientras genera.
const S = '"((?:[^"\\\\]|\\\\.)*)"';

function texto(s: string | undefined): string {
  if (!s) return "";
  try {
    return JSON.parse(`"${s}"`);
  } catch {
    return s;
  }
}

const campo = (t: string, k: string) => texto(t.match(new RegExp(`"${k}"\\s*:\\s*${S}`))?.[1]);
const opc = (k: string) => `(?:\\s*,\\s*"${k}"\\s*:\\s*${S})?`;

export interface EscenaVivo { numero: number; encabezado: string; video: string; vozEnOff: string }
export interface PlanoVivo { id: string; tipoPlano: string; movimiento: string; lente: string; operador: string }
export interface Vivo {
  titulo: string;
  logline: string;
  escenas: EscenaVivo[];
  planos: PlanoVivo[];
  dias: number;
  locaciones: string[];
  total: string;
}

const RE_ESCENA = new RegExp(`"numero"\\s*:\\s*(\\d+)\\s*,\\s*"encabezado"\\s*:\\s*${S}${opc("video")}${opc("vozEnOff")}`, "g");
const RE_PLANO = new RegExp(
  `"id"\\s*:\\s*${S}\\s*,\\s*"escena"\\s*:\\s*\\d+\\s*,\\s*"tipoPlano"\\s*:\\s*${S}${opc("angulo")}${opc("movimiento")}${opc("lente")}${opc("camara")}${opc("operador")}`,
  "g",
);
const RE_LOC = new RegExp(`"nombre"\\s*:\\s*${S}\\s*,\\s*"descripcion"`, "g");

export function leerVivo(t: string): Vivo {
  const ini = t.indexOf('"guionTecnico"');
  const audiovisual = ini === -1 ? t : t.slice(0, ini);
  const escenas = [...audiovisual.matchAll(RE_ESCENA)].map((m) => ({ numero: +m[1], encabezado: texto(m[2]), video: texto(m[3]), vozEnOff: texto(m[4]) }));
  const planos = [...t.matchAll(RE_PLANO)].map((m) => ({ id: texto(m[1]), tipoPlano: texto(m[2]), movimiento: texto(m[4]), lente: texto(m[5]), operador: texto(m[7]) }));
  const locIni = t.indexOf('"locaciones"');
  return {
    titulo: campo(t, "titulo"),
    logline: campo(t, "logline"),
    escenas,
    planos,
    dias: (t.match(/"dia"\s*:\s*\d+/g) ?? []).length,
    locaciones: locIni === -1 ? [] : [...t.slice(locIni).matchAll(RE_LOC)].map((m) => texto(m[1])),
    total: campo(t, "total"),
  };
}
