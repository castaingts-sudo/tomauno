import type { Metadata } from "next";
import Link from "next/link";
import "./propuesta-c.css";
import { CUADROS, PASOS, POR_PROYECTO, MENSUAL, EXTRA } from "@/lib/landing-data";

// Propuesta C de portada: abstracta. Luz, color y forma; el diafragma de la lente como figura central.

export const metadata: Metadata = { title: "Toma uno · Luz", robots: { index: false } };

const ASPAS = Array.from({ length: 7 }, (_, i) => i);

const FORMAS = [
  { f: "luz", t: "Luz", d: "La hora dorada, la ventana, el contraluz. Cada toma sabe de dónde viene la luz." },
  { f: "cuadro", t: "Encuadre", d: "Tamaño de plano, lente y eje. Del gran general aéreo al detalle de las manos." },
  { f: "ritmo", t: "Ritmo", d: "Duración por escena, corte y voz en off medidos contra el timecode." },
];

export default function PropuestaC() {
  return (
    <div className="ab">
      <div className="ab-light" aria-hidden><i /><i /><i /></div>

      <header className="ab-top">
        <Link href="/propuesta-c" className="ab-brand"><span className="ab-dot" />toma uno</Link>
        <Link href="/estudio" className="ab-enter">Entrar</Link>
      </header>

      <section className="ab-hero">
        <svg className="ab-iris" viewBox="-100 -100 200 200" aria-hidden>
          <defs>
            <clipPath id="ab-lente"><circle r="96" /></clipPath>
            <radialGradient id="ab-luz">
              <stop offset="0" stopColor="#fff6dc" />
              <stop offset="0.35" stopColor="#ffb000" />
              <stop offset="0.7" stopColor="#ff3d6e" />
              <stop offset="1" stopColor="#2b1a6b" />
            </radialGradient>
          </defs>
          <circle r="96" fill="url(#ab-luz)" />
          <g clipPath="url(#ab-lente)"><g className="ab-aspas">
            {ASPAS.map((i) => (
              <rect key={i} x="0" y="-220" width="240" height="440" style={{ ["--r" as string]: `${(360 / ASPAS.length) * i}deg` }} />
            ))}
          </g></g>
          <circle r="96" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
          <circle r="99" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" strokeDasharray="1 3" />
        </svg>
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
        <p className="ab-label">Nace en la niebla · cuatro tomas</p>
        <div className="ab-tiles">
          {CUADROS.map((c, i) => (
            <figure key={c.id} className="ab-tile" style={{ ["--i" as string]: i }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt={c.alt} loading="lazy" />
              <figcaption><b>{c.id}</b> {c.vo}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="ab-steps">
        {PASOS.map(([n, t, d]) => (
          <div key={n} className="ab-step">
            <span className="ab-n">{n}</span>
            <div><h3>{t}</h3><p>{d}</p></div>
          </div>
        ))}
      </section>

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
