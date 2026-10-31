"use client";

// Clima real en el plan de rodaje: sol, hora dorada, lluvia y viento por jornada, y el METAR del aeropuerto más cercano.
import { useEffect, useState } from "react";
import { hhmm, minDe, solDe } from "@/lib/sol";
import type { Proyecto } from "@/lib/types";

export interface Dia { codigo?: number; max?: number; min?: number; lluvia?: number; viento?: number; rafagas?: number; nubes?: number; sale?: string; pone?: string }
export interface Metar { icao: string; nombre: string; km: number; raw: string; taf: string; hora: number; wdir?: number | string; wspd?: number; wgst?: number; visib?: number | string; cat?: string }
export interface Clima { lugar: { nombre: string; lat: number; lon: number }; offset: number; dias: Record<string, Dia>; metar: Metar | null }

// Ciudades y estados para adivinar el lugar a partir de las locaciones y el brief.
const LUGARES = [
  "Ciudad de México", "CDMX", "Guadalajara", "Monterrey", "Puebla", "Querétaro", "León", "Aguascalientes", "San Luis Potosí", "Zacatecas", "Morelia", "Toluca",
  "Cuernavaca", "Pachuca", "Tlaxcala", "Mérida", "Cancún", "Playa del Carmen", "Tulum", "Campeche", "Villahermosa", "Tuxtla Gutiérrez", "San Cristóbal de las Casas",
  "Oaxaca", "Huatulco", "Acapulco", "Puerto Vallarta", "Tepic", "Colima", "Manzanillo", "Mazatlán", "Culiacán", "Hermosillo", "La Paz", "Los Cabos", "Ensenada",
  "Tijuana", "Mexicali", "Chihuahua", "Ciudad Juárez", "Durango", "Saltillo", "Torreón", "Ciudad Victoria", "Tampico", "Veracruz", "Xalapa", "Guanajuato",
  "San Miguel de Allende", "Irapuato", "Celaya", "Valle de Bravo", "Tequila", "Jalisco", "Nuevo León", "Yucatán", "Quintana Roo", "Chiapas", "Sonora", "Sinaloa",
  "Baja California", "Coahuila", "Tamaulipas", "Michoacán", "Hidalgo", "Morelos", "Guerrero", "Nayarit", "Tabasco",
];

export function adivinarLugar(pr: Proyecto): string {
  const p = pr.paquete;
  const textos = [
    ...p.locaciones.map((l) => `${l.nombre} ${l.descripcion}`),
    ...p.planRodaje.map((j) => j.locacion),
    pr.brief.idea, pr.brief.notas, pr.brief.documento || "", p.resumen.logline,
  ].join(" \n ").toLowerCase();
  let mejor = "", pos = Infinity;
  for (const l of LUGARES) {
    const i = textos.indexOf(l.toLowerCase());
    if (i >= 0 && i < pos) { pos = i; mejor = l === "CDMX" ? "Ciudad de México" : l; }
  }
  return mejor;
}

export function useClima(pr: Proyecto, onChange: (p: Proyecto) => void) {
  const [clima, setClima] = useState<Clima | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function pedir(qs: string, guardar: boolean) {
    setCargando(true);
    setError("");
    try {
      const r = await fetch(`/api/clima?${qs}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
      setClima(j);
      if (guardar) onChange({ ...pr, clima: j.lugar });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCargando(false);
    }
  }

  const l = pr.clima;
  useEffect(() => {
    if (l) pedir(`lat=${l.lat}&lon=${l.lon}&nombre=${encodeURIComponent(l.nombre)}`, false);
    else {
      const q = adivinarLugar(pr);
      if (q) pedir(`q=${encodeURIComponent(q)}`, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pr.id, l?.lat, l?.lon]);

  return { clima, error, cargando, buscar: (q: string) => q.trim() && pedir(`q=${encodeURIComponent(q.trim())}`, true) };
}

const CIELO: Record<number, [string, string]> = {
  0: ["☀️", "Despejado"], 1: ["🌤️", "Casi despejado"], 2: ["⛅", "Medio nublado"], 3: ["☁️", "Nublado"], 45: ["🌫️", "Niebla"], 48: ["🌫️", "Niebla con escarcha"],
  51: ["🌦️", "Llovizna ligera"], 53: ["🌦️", "Llovizna"], 55: ["🌧️", "Llovizna intensa"], 61: ["🌦️", "Lluvia ligera"], 63: ["🌧️", "Lluvia"], 65: ["🌧️", "Lluvia fuerte"],
  66: ["🌧️", "Lluvia helada"], 67: ["🌧️", "Lluvia helada"], 71: ["🌨️", "Nieve ligera"], 73: ["🌨️", "Nieve"], 75: ["🌨️", "Nieve fuerte"], 77: ["🌨️", "Granizo fino"],
  80: ["🌦️", "Chubascos"], 81: ["🌧️", "Chubascos"], 82: ["⛈️", "Chubascos fuertes"], 85: ["🌨️", "Nevadas"], 86: ["🌨️", "Nevadas"], 95: ["⛈️", "Tormenta"],
  96: ["⛈️", "Tormenta con granizo"], 99: ["⛈️", "Tormenta con granizo"],
};

// Franja del día de una jornada: sol siempre (calculado), pronóstico cuando la fecha está dentro de 16 días.
export function ClimaDia({ clima, fecha, dron }: { clima: Clima | null; fecha: string; dron: boolean }) {
  if (!clima) return null;
  if (!fecha) return <p className="lb-wx muted">Pon la fecha de la jornada para ver el sol y el pronóstico.</p>;
  const d = clima.dias[fecha];
  const calc = solDe(fecha, clima.lugar.lat, clima.lugar.lon, clima.offset);
  const sale = d?.sale ? minDe(d.sale) : calc?.sale ?? NaN;
  const pone = d?.pone ? minDe(d.pone) : calc?.pone ?? NaN;
  const [ico, cielo] = d?.codigo != null ? CIELO[d.codigo] || ["🌡️", "—"] : ["", ""];
  const avisos: string[] = [];
  if (d?.lluvia != null && d.lluvia >= 50) avisos.push(`Lluvia probable (${d.lluvia}%): plan B bajo techo y protección para equipo.`);
  if (dron && d?.rafagas != null && d.rafagas >= 35) avisos.push(`Ráfagas de ${Math.round(d.rafagas)} km/h: vuelo de dron en riesgo, programa tomas aéreas temprano.`);
  return (
    <div className="lb-wx">
      {Number.isFinite(sale) && (
        <span className="lb-wx-sol">
          <span className="lb-lab">Amanece</span>
          <b>{hhmm(sale)}</b>
          <small>Dorada {hhmm(sale)}–{hhmm(sale + 50)}</small>
        </span>
      )}
      {Number.isFinite(pone) && (
        <span className="lb-wx-sol">
          <span className="lb-lab">Atardece</span>
          <b>{hhmm(pone)}</b>
          <small>Dorada {hhmm(pone - 50)}–{hhmm(pone)} · Azul hasta {hhmm(pone + 25)}</small>
        </span>
      )}
      {d ? (
        <>
          <span className="lb-wx-dato">
            <span className="lb-lab">Cielo</span>
            <b>{ico} {cielo}</b>
            <small>{Math.round(d.min ?? 0)}° / {Math.round(d.max ?? 0)}°{d.nubes != null ? ` · nubes ${Math.round(d.nubes)}%` : ""}</small>
          </span>
          <span className={`lb-wx-dato${(d.lluvia ?? 0) >= 50 ? " alerta" : ""}`}>
            <span className="lb-lab">Lluvia</span>
            <b>{d.lluvia ?? 0}%</b>
          </span>
          <span className={`lb-wx-dato${dron && (d.rafagas ?? 0) >= 35 ? " alerta" : ""}`}>
            <span className="lb-lab">Viento</span>
            <b>{Math.round(d.viento ?? 0)} km/h</b>
            <small>ráfagas {Math.round(d.rafagas ?? 0)}</small>
          </span>
        </>
      ) : (
        <span className="lb-wx-dato muted">
          <span className="lb-lab">Pronóstico</span>
          <small>{fecha < Object.keys(clima.dias)[0] ? "Fecha pasada" : "Se publica 16 días antes del rodaje"}</small>
        </span>
      )}
      {avisos.map((a) => <p key={a} className="lb-wx-aviso">⚠ {a}</p>)}
    </div>
  );
}

const CAT: Record<string, string> = { VFR: "Visual (VFR)", MVFR: "Marginal (MVFR)", IFR: "Instrumentos (IFR)", LIFR: "Muy baja (LIFR)" };

// Cabecera del plan: lugar del pronóstico y condiciones actuales en el aeropuerto más cercano.
export function ClimaLugar({ clima, error, cargando, buscar, sugerido }: { clima: Clima | null; error: string; cargando: boolean; buscar: (q: string) => void; sugerido: string }) {
  const [q, setQ] = useState("");
  const m = clima?.metar;
  const hace = m ? Math.max(0, Math.round((Date.now() / 1000 - m.hora) / 60)) : 0;
  return (
    <div className="lb-wx-head">
      <form className="lb-wx-lugar no-print" onSubmit={(e) => { e.preventDefault(); buscar(q); }}>
        <span className="lb-lab">Clima en</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={clima?.lugar.nombre || sugerido || "Ciudad del rodaje"} aria-label="Ciudad del rodaje" />
        <button type="submit" disabled={cargando || !q.trim()}>{cargando ? "…" : "Cambiar"}</button>
        {error && <small className="lb-wx-err">{error}</small>}
      </form>
      {clima && <span className="lb-wx-donde print-only">Clima en {clima.lugar.nombre}</span>}
      {m && (
        <div className="lb-metar">
          <span className="lb-lab">Ahora en {m.icao} · {m.nombre.replace(/ (Intl|Arpt|International)$/, "")} · {m.km} km · hace {hace < 90 ? `${hace} min` : `${Math.round(hace / 60)} h`}</span>
          <div className="lb-metar-datos">
            {m.cat && <b className={`cat cat-${m.cat.toLowerCase()}`}>{CAT[m.cat] || m.cat}</b>}
            {m.wspd != null && <span>Viento {m.wdir === "VRB" ? "variable" : `${m.wdir}°`} {Math.round(m.wspd * 1.852)} km/h{m.wgst ? `, ráfagas ${Math.round(m.wgst * 1.852)}` : ""}</span>}
            {m.visib != null && <span>Visibilidad {String(m.visib).replace("+", " o más")} mi</span>}
          </div>
          <code>{m.raw}</code>
          {m.taf && <details><summary>TAF</summary><code>{m.taf}</code></details>}
        </div>
      )}
    </div>
  );
}
