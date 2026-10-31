// Salida y puesta del sol para cualquier fecha (algoritmo de NOAA), sin depender del pronóstico.
// Devuelve minutos desde medianoche en la hora local del lugar (offset en minutos respecto a UTC).

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function solDe(fecha: string, lat: number, lon: number, offsetMin: number): { sale: number; pone: number } | null {
  const d = new Date(`${fecha}T12:00:00Z`);
  const n = Math.floor((+d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000);
  const g = ((2 * Math.PI) / 365) * (n - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosH = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(decl)) - Math.tan(rad(lat)) * Math.tan(decl);
  if (cosH > 1 || cosH < -1) return null;
  const h = deg(Math.acos(cosH));
  const mediodia = 720 - 4 * lon - eq;
  return { sale: mediodia - 4 * h + offsetMin, pone: mediodia + 4 * h + offsetMin };
}

export const hhmm = (min: number) => {
  const m = Math.round(((min % 1440) + 1440) % 1440);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
};

// "2026-11-03T06:58" → minutos desde medianoche.
export const minDe = (t?: string) => (t && /T\d{2}:\d{2}/.test(t) ? Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16)) : NaN);
