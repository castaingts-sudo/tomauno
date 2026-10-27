"use client";

import { useEffect, useState } from "react";

const TEMA_KEY = "toma-uno:tema";

// Alterna entre modo noche (cine) y modo sol (para leer en exteriores).
export function ThemeToggle() {
  const [sol, setSol] = useState(false);
  useEffect(() => setSol(document.documentElement.dataset.theme === "sol"), []);
  const toggle = () => {
    const next = !sol;
    setSol(next);
    if (next) document.documentElement.dataset.theme = "sol";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem(TEMA_KEY, next ? "sol" : "noche");
    } catch {}
  };
  return (
    <button type="button" className="tu-theme" onClick={toggle} aria-label={sol ? "Cambiar a modo noche" : "Cambiar a modo sol"}>
      {sol ? "☾ Noche" : "☀ Sol"}
    </button>
  );
}

// Días que faltan al rodaje, calculado con el reloj del dispositivo.
export function Countdown({ fecha, dias = 1 }: { fecha: string; dias?: number }) {
  const [hoy, setHoy] = useState<Date | null>(null);
  useEffect(() => setHoy(new Date()), []);
  const inicio = new Date(`${fecha}T00:00:00`);
  if (isNaN(+inicio)) return null;
  const larga = inicio.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  let big = "—";
  let label = "Rodaje";
  if (hoy) {
    const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const n = Math.round((+inicio - +base) / 86400000);
    if (n > 1) [big, label] = [String(n), "días para rodar"];
    else if (n === 1) [big, label] = ["1", "día · es mañana"];
    else if (n <= 0 && n > -dias) [big, label] = ["HOY", "día de rodaje"];
    else [big, label] = ["✓", "rodaje terminado"];
  }
  return (
    <div className="tu-count">
      <span className="tu-count-big">{big}</span>
      <span className="tu-count-label">{label}</span>
      <span className="tu-count-date">{larga}</span>
    </div>
  );
}

// "Toma lograda": se marca en el set y se guarda en el dispositivo de cada operador.
const evento = (hoja: string) => `toma-uno:logradas:${hoja}`;
function leer(hoja: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(evento(hoja)) || "[]");
  } catch {
    return [];
  }
}

function useLogradas(hoja: string) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(leer(hoja));
    const sync = () => setIds(leer(hoja));
    window.addEventListener(evento(hoja), sync);
    return () => window.removeEventListener(evento(hoja), sync);
  }, [hoja]);
  const toggle = (id: string) => {
    const cur = leer(hoja);
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try {
      localStorage.setItem(evento(hoja), JSON.stringify(next));
    } catch {}
    window.dispatchEvent(new Event(evento(hoja)));
  };
  return [ids, toggle] as const;
}

export function TomaCheck({ hoja, id }: { hoja: string; id: string }) {
  const [ids, toggle] = useLogradas(hoja);
  const on = ids.includes(id);
  return (
    <button type="button" className={`tu-check${on ? " on" : ""}`} onClick={() => toggle(id)} aria-pressed={on}>
      {on ? "✓ Lograda" : "Marcar lograda"}
    </button>
  );
}

export function ProgresoTomas({ hoja, total, ids: mias }: { hoja: string; total: number; ids: string[] }) {
  const [ids] = useLogradas(hoja);
  const n = ids.filter((x) => mias.includes(x)).length;
  const pct = total ? Math.round((n / total) * 100) : 0;
  return (
    <div className="tu-prog">
      <div className="tu-prog-head">
        <span>Tomas logradas</span>
        <b>
          {n}/{total}
        </b>
      </div>
      <div className="tu-prog-bar">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
