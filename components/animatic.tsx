"use client";

// Animatic: el storyboard en tiempo real, con el movimiento de cámara de cada toma, timecode y la voz en off leída en voz alta.
import { useEffect, useMemo, useRef, useState } from "react";
import { svgSrc } from "@/components/estudio";
import type { Paquete } from "@/lib/types";

const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function segs(d = ""): number {
  const m = d.match(/(\d+(?:[.,]\d+)?)\s*(min|seg|s)\b/i);
  if (m) return parseFloat(m[1].replace(",", ".")) * (/^min/i.test(m[2]) ? 60 : 1);
  const t = d.match(/(\d+):(\d{2})/);
  if (t) return +t[1] * 60 + +t[2];
  return parseFloat(d) || 0;
}

// Movimiento de cámara → animación del cuadro.
function movDe(mov = "", tipo = ""): string {
  const m = norm(`${mov} ${tipo}`);
  if (/orbit/.test(m)) return "am-orbita";
  if (/dolly out|pull|alej|retroce|zoom out|reveal|revel|ascen|sube|eleva/.test(m)) return "am-out";
  if (/dolly|push|acerc|avanz|zoom in|travelling in|entra/.test(m)) return "am-in";
  if (/pan.*izq|izquierda/.test(m)) return "am-pan-izq";
  if (/pan|paneo|travelling|lateral|seguimiento|tracking|steadicam|gimbal|camina/.test(m)) return "am-pan";
  if (/tilt.*abajo|baja|descien|cenital/.test(m)) return "am-tilt-abajo";
  if (/tilt|arriba/.test(m)) return "am-tilt";
  return "am-fijo";
}

const tc = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}:${String(Math.floor((s % 1) * 24)).padStart(2, "0")}`;

export function Animatic({ p, onClose }: { p: Paquete; onClose: () => void }) {
  // Una entrada por toma con dibujo, en orden del guion técnico, con su duración.
  const pista = useMemo(() => {
    let t = 0;
    return p.guionTecnico
      .map((s) => ({ s, f: p.storyboard.find((x) => x.planoId === s.id) }))
      .filter((x) => x.f && (x.f.imagen || x.f.svg))
      .map(({ s, f }) => {
        const dur = Math.min(Math.max(segs(s.duracion) || 3, 1.5), 12);
        const e = p.guionAudiovisual.find((x) => x.numero === s.escena);
        const item = { s, f: f!, e, ini: t, dur, mov: movDe(s.movimiento, s.tipoPlano) };
        t += dur;
        return item;
      });
  }, [p]);
  const total = pista.reduce((a, x) => a + x.dur, 0);

  const [t, setT] = useState(0);
  const [play, setPlay] = useState(true);
  const [voz, setVoz] = useState(true);
  const ult = useRef<number | null>(null);
  const escenaHablada = useRef<number | null>(null);

  const i = Math.max(0, pista.findIndex((x) => t >= x.ini && t < x.ini + x.dur));
  const actual = pista[i];

  useEffect(() => {
    if (!play) { ult.current = null; return; }
    let raf = 0;
    const tick = (now: number) => {
      if (ult.current != null) setT((v) => Math.min(total, v + (now - ult.current!) / 1000));
      ult.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, total]);

  useEffect(() => { if (t >= total) setPlay(false); }, [t, total]);

  // Voz en off: se lee al entrar a cada escena.
  useEffect(() => {
    const ss = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!ss) return;
    if (!play || !voz) { ss.cancel(); escenaHablada.current = null; return; }
    const e = actual?.e;
    if (!e || escenaHablada.current === e.numero) return;
    escenaHablada.current = e.numero;
    ss.cancel();
    if (!e.vozEnOff) return;
    const u = new SpeechSynthesisUtterance(e.vozEnOff.replace(/^\s*(VO|VOZ EN OFF|TESTIMONIAL)[^:]*:\s*/i, ""));
    u.lang = "es-MX";
    const v = ss.getVoices().find((x) => x.lang === "es-MX") || ss.getVoices().find((x) => x.lang.startsWith("es"));
    if (v) u.voice = v;
    u.rate = 1.02;
    ss.speak(u);
  }, [actual?.e, play, voz]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const ir = (n: number) => {
    const k = Math.min(Math.max(n, 0), pista.length - 1);
    setT(pista[k].ini + 0.001);
    escenaHablada.current = null;
  };

  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
      else if (ev.key === " ") { ev.preventDefault(); setPlay((x) => { if (!x && t >= total) setT(0); return !x; }); }
      else if (ev.key === "ArrowRight") ir(i + 1);
      else if (ev.key === "ArrowLeft") ir(i - 1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (!actual) return null;
  const local = (t - actual.ini) / actual.dur;

  return (
    <div className="am" role="dialog" aria-label="Animatic">
      <div className="am-bar">
        <span className="am-rec">{play ? "● PLAY" : "❚❚ PAUSA"}</span>
        <b>{p.resumen.titulo}</b>
        <span className="am-tc">{tc(t)} / {tc(total)}</span>
        <button className="am-x" onClick={onClose} aria-label="Cerrar">✕</button>
      </div>

      <div className="am-stage">
        {/* La clave reinicia la animación de cámara en cada toma. */}
        <div key={actual.s.id} className={`am-frame ${actual.mov}`} style={{ animationDuration: `${actual.dur}s`, animationPlayState: play ? "running" : "paused" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={actual.f.imagen || svgSrc(actual.f.svg!)} alt={actual.f.descripcion} />
        </div>
        <div className="am-hud">
          <span className="am-id">{actual.s.id}</span>
          <span>{actual.s.tipoPlano} · {actual.s.movimiento} · {actual.s.lente}</span>
        </div>
        {actual.e && <div className="am-slug">{actual.e.numero}. {actual.e.encabezado}</div>}
        {(actual.e?.vozEnOff || actual.e?.textoPantalla) && (
          <div className="am-sub">
            {actual.e?.textoPantalla && <em>{actual.e.textoPantalla}</em>}
            {actual.e?.vozEnOff && <span>{actual.e.vozEnOff}</span>}
          </div>
        )}
        <div className="am-shot-bar"><i style={{ width: `${Math.min(100, local * 100)}%` }} /></div>
      </div>

      <div className="am-track" role="slider" aria-valuemin={0} aria-valuemax={Math.round(total)} aria-valuenow={Math.round(t)}
        onClick={(ev) => { const r = ev.currentTarget.getBoundingClientRect(); setT(((ev.clientX - r.left) / r.width) * total); escenaHablada.current = null; }}>
        {pista.map((x, n) => (
          <span key={x.s.id} className={n === i ? "on" : n < i ? "past" : ""} style={{ flexGrow: x.dur }} title={`${x.s.id} · ${x.dur}s`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={x.f.imagen || svgSrc(x.f.svg!)} alt="" loading="lazy" />
          </span>
        ))}
        <b className="am-head" style={{ left: `${(t / total) * 100}%` }} />
      </div>

      <div className="am-ctrl">
        <button onClick={() => ir(i - 1)} aria-label="Toma anterior">⏮</button>
        <button className="primary" onClick={() => { if (t >= total) setT(0); setPlay(!play); }}>{play ? "Pausa" : t >= total ? "Ver de nuevo" : "Reproducir"}</button>
        <button onClick={() => ir(i + 1)} aria-label="Toma siguiente">⏭</button>
        <label className="am-voz"><input type="checkbox" checked={voz} onChange={(e) => setVoz(e.target.checked)} /> Voz en off</label>
        <span className="am-n">Toma {i + 1} de {pista.length}</span>
      </div>
    </div>
  );
}

// Botón del link de cliente: arma un paquete mínimo con las escenas y sus dibujos (la duración de la escena se reparte entre sus tomas).
interface EscenaRev { numero: number; encabezado: string; video: string; vozEnOff?: string; audio: string; textoPantalla?: string; duracion: string; paneles: { planoId: string; svg?: string; imagen?: string; descripcion: string; dialogo: string; transicion: string; tipoPlano: string; movimiento: string }[] }

export function AnimaticCliente({ titulo, escenas }: { titulo: string; escenas: EscenaRev[] }) {
  const [abierto, setAbierto] = useState(false);
  const p = useMemo(() => {
    const guionTecnico = escenas.flatMap((e) => {
      const d = (segs(e.duracion) || 3 * e.paneles.length) / Math.max(1, e.paneles.length);
      return e.paneles.map((f) => ({ id: f.planoId, escena: e.numero, tipoPlano: f.tipoPlano, angulo: "", movimiento: f.movimiento, lente: "", camara: "", descripcion: f.descripcion, audio: "", duracion: `${d.toFixed(1)} s`, notas: "" }));
    });
    return {
      resumen: { titulo },
      guionAudiovisual: escenas.map(({ paneles: _p, ...e }) => e),
      guionTecnico,
      storyboard: escenas.flatMap((e) => e.paneles),
    } as unknown as Paquete;
  }, [titulo, escenas]);
  if (!escenas.some((e) => e.paneles.some((f) => f.imagen || f.svg))) return null;
  return (
    <>
      <button className="tu-btn primary rv-animatic" onClick={() => setAbierto(true)}>▶ Ver el video en dibujos</button>
      {abierto && <Animatic p={p} onClose={() => setAbierto(false)} />}
    </>
  );
}
