import type { Metadata } from "next";
import Link from "next/link";
import "./propuesta-c.css";
import { Timecode } from "@/components/timecode";
import { CUADROS, PASOS, POR_PROYECTO, MENSUAL, EXTRA } from "@/lib/landing-data";

// Propuesta C de portada: abstracta. Luz, color y forma; el diafragma de la lente como figura central.

export const metadata: Metadata = { title: "Toma uno · Preproducción de video con IA" };

const ASPAS = Array.from({ length: 7 }, (_, i) => i);
// Anillo de enfoque: 120 marcas y los pasos de diafragma alrededor.
const MARCAS = Array.from({ length: 120 }, (_, i) => i);
const PASOS_F = ["1.4", "2", "2.8", "4", "5.6", "8", "11", "16", "22"];

const FORMAS = [
  { f: "luz", t: "Luz", d: "La hora dorada, la ventana, el contraluz. Cada toma sabe de dónde viene la luz." },
  { f: "cuadro", t: "Encuadre", d: "Tamaño de plano, lente y eje. Del gran general aéreo al detalle de las manos." },
  { f: "ritmo", t: "Ritmo", d: "Duración por escena, corte y voz en off medidos contra el timecode." },
];

export default function Portada() {
  return (
    <div className="ab">
      <div className="ab-light" aria-hidden><i /><i /></div>
      <div className="ab-grid" aria-hidden />
      <div className="ab-grain" aria-hidden />

      <header className="ab-top">
        <Link href="/" className="ab-brand"><span className="ab-dot" />toma uno</Link>
        <Link href="/estudio" className="ab-enter">Entrar</Link>
      </header>

      <section className="ab-hero">
        <div className="ab-lens">
        <svg className="ab-iris" viewBox="-100 -100 200 200" aria-hidden>
          <defs>
            <clipPath id="ab-lente"><circle r="96" /></clipPath>
            <radialGradient id="ab-luz">
              <stop offset="0" stopColor="#fffaf0" />
              <stop offset="0.3" stopColor="#ffd27a" />
              <stop offset="0.62" stopColor="#ff8a1f" />
              <stop offset="1" stopColor="#3a1505" />
            </radialGradient>
            <linearGradient id="ab-flare" x1="0" x2="1">
              <stop offset="0" stopColor="#ffb000" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff4dc" stopOpacity="1" />
              <stop offset="1" stopColor="#ffb000" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="ab-halo">
              <stop offset="0" stopColor="#ffd27a" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle r="96" fill="url(#ab-luz)" />
          <g clipPath="url(#ab-lente)"><g className="ab-aspas">
            {ASPAS.map((i) => (
              <rect key={i} x="0" y="-220" width="240" height="440" style={{ ["--r" as string]: `${(360 / ASPAS.length) * i}deg` }} />
            ))}
          </g></g>
          <circle r="96" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
          <g className="ab-ring">
            {MARCAS.map((i) => (
              <line key={i} x1="0" y1={i % 10 === 0 ? -103 : -104} x2="0" y2={i % 10 === 0 ? -110 : -106.5} transform={`rotate(${i * 3})`} />
            ))}
            {PASOS_F.map((f, i) => (
              <text key={f} transform={`rotate(${-100 + i * 25}) translate(0 -115)`}>{f}</text>
            ))}
          </g>
          <circle className="ab-scan" r="100" />
          <g className="ab-cross">
            <line x1="-8" y1="0" x2="-3" y2="0" /><line x1="3" y1="0" x2="8" y2="0" />
            <line x1="0" y1="-8" x2="0" y2="-3" /><line x1="0" y1="3" x2="0" y2="8" />
          </g>
          <g className="ab-flare">
            <ellipse rx="70" ry="18" fill="url(#ab-halo)" />
            <rect x="-190" y="-0.6" width="380" height="1.2" fill="url(#ab-flare)" />
          </g>
        </svg>
        <div className="ab-hud">
          <span className="ab-hud-tl"><i className="ab-rec" /> REC <Timecode /></span>
          <span className="ab-hud-tr">ISO 800 · 1/48 · 5600K</span>
          <span className="ab-hud-bl">24 FPS · 2.39:1</span>
          <span className="ab-hud-br">FOCO ∞ · 35 mm</span>
        </div>
        </div>
        <div className="ab-hero-type">
          <h1>
            <span>ver</span>
            <span className="ab-thin">antes de</span>
            <span>filmar</span>
          </h1>
          <p>Toma uno convierte un brief en guion, storyboard y plan de rodaje. Lo demás es luz.</p>
          <Link href="/estudio" className="ab-btn">Abrir el diafragma</Link>
        </div>
        <span className="ab-f">f / 1.4</span>
      </section>

      <p className="ab-index"><span>01</span> Lenguaje</p>
      <section className="ab-forms">
        {FORMAS.map((x) => (
          <article key={x.f} className="ab-form">
            <div className={`ab-shape ab-${x.f}`} aria-hidden>{x.f === "ritmo" && <><i /><i /><i /><i /><i /><i /></>}</div>
            <h2>{x.t}</h2>
            <p>{x.d}</p>
          </article>
        ))}
      </section>

      <section className="ab-reel" aria-label="Storyboard de muestra">
        <p className="ab-index ab-index-in"><span>02</span> VOLTA · La línea de luz · cuatro tomas</p>
        <div className="ab-editor">
          <div className="ab-monitor">
            {CUADROS.map((c, i) => (
              <figure key={c.id} className="ab-cut" style={{ ["--i" as string]: i }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.alt} loading="lazy" />
                <figcaption>
                  <span className="ab-cut-id">{c.id}</span>
                  <span className="ab-cut-vo">{c.vo}</span>
                  <span className="ab-cut-meta">{c.plano} · {c.lente}</span>
                </figcaption>
              </figure>
            ))}
            <span className="ab-safe" aria-hidden />
            <span className="ab-mon-tag"><i className="ab-rec" /> PREVIEW · <Timecode /></span>
          </div>
          <ol className="ab-shots">
            {CUADROS.map((c, i) => (
              <li key={c.id} style={{ ["--i" as string]: i }}>
                <span className="ab-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt="" loading="lazy" />
                </span>
                <span className="ab-shot-txt"><b>{c.id} · {c.plano}</b><small>{c.escena} · {c.lente}</small></span>
              </li>
            ))}
          </ol>
          <div className="ab-track" aria-hidden>
            {CUADROS.map((c, i) => <span key={c.id} style={{ ["--i" as string]: i }}>{c.id}</span>)}
            <i className="ab-playhead" />
          </div>
        </div>
      </section>

      <section className="ab-video" aria-label="Toma uno en video">
        <p className="ab-index ab-index-in"><span>03</span> El estudio en 42 segundos</p>
        <video autoPlay muted loop playsInline preload="metadata" poster="/promo/poster.jpg">
          <source src="/promo/toma-uno-9x16.mp4" type="video/mp4" media="(max-width: 640px) and (orientation: portrait)" />
          <source src="/promo/toma-uno-16x9.mp4" type="video/mp4" />
        </video>
      </section>

      <p className="ab-index"><span>04</span> Método</p>
      <section className="ab-steps">
        {PASOS.map(([n, t, d]) => (
          <div key={n} className="ab-step">
            <span className="ab-n">{n}</span>
            <div><h3>{t}</h3><p>{d}</p></div>
          </div>
        ))}
      </section>

      <p className="ab-index"><span>05</span> Planes</p>
      <section id="planes" className="ab-plans">
        <h2 className="ab-big">tomas<br /><span className="ab-thin">no horas</span></h2>
        <div className="ab-plan-list">
          {[...POR_PROYECTO.map((p) => ({ ...p, mes: false })), ...MENSUAL.map((p) => ({ ...p, mes: true }))].map((p) => (
            <a key={p.id} href={`/api/checkout?plan=${p.id}`} className={p.top ? "ab-plan ab-plan-top" : "ab-plan"}>
              <span className="ab-plan-n">{p.n}</span>
              <span className="ab-plan-t">{p.tope}</span>
              <span className="ab-plan-p">${p.precio}<small>{p.mes ? " /mes" : ""}</small></span>
            </a>
          ))}
        </div>
        <p className="ab-extra">25 tomas extra · ${EXTRA} MXN · todos los precios en pesos mexicanos</p>
      </section>

      <section className="ab-final">
        <div className="ab-orb" aria-hidden />
        <h2 className="ab-big">toma<br /><span className="ab-thin">uno</span></h2>
        <Link href="/estudio" className="ab-btn">Empezar</Link>
      </section>
    </div>
  );
}
