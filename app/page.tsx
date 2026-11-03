import type { Metadata } from "next";
import Link from "next/link";
import "./propuesta-c.css";
import { Timecode } from "@/components/timecode";
import {
  CUADROS, POR_PROYECTO, MENSUAL, EXTRA, RECIBES, PARA_QUIEN, METODO,
  VOLTA_GUION, VOLTA_TECNICO, VOLTA_PLAN, CONFIANZA, FAQ, INCLUYE,
} from "@/lib/landing-data";

// Portada principal (propuesta C): el diafragma de la lente como figura central,
// y debajo todo lo que hace falta para decidir comprar: qué hace, para quién, un ejemplo real, precios y preguntas.

export const metadata: Metadata = {
  title: "Toma uno · Preproducción de video con IA",
  description: "De la idea al rodaje: guion audiovisual, guion técnico, storyboard dibujado, animatic, plan de rodaje con clima y link de aprobación para tu cliente. Desde $891 MXN por proyecto.",
};

const ASPAS = Array.from({ length: 7 }, (_, i) => i);
// Anillo de enfoque: 120 marcas y los pasos de diafragma alrededor.
const MARCAS = Array.from({ length: 120 }, (_, i) => i);
const PASOS_F = ["1.4", "2", "2.8", "4", "5.6", "8", "11", "16", "22"];

const DESDE = POR_PROYECTO[0]?.precio ?? "891";

function Indice({ n, t, id }: { n: string; t: string; id?: string }) {
  return <p className="ab-index" id={id}><span>{n}</span> {t}</p>;
}

export default function Portada() {
  return (
    <div className="ab">
      <div className="ab-light" aria-hidden><i /><i /></div>
      <div className="ab-grid" aria-hidden />
      <div className="ab-grain" aria-hidden />

      <header className="ab-top">
        <Link href="/" className="ab-brand"><span className="ab-dot" />toma uno</Link>
        <nav className="ab-nav" aria-label="Secciones">
          <a href="#que-hace">Qué hace</a>
          <a href="#ejemplo">Ejemplo</a>
          <a href="#como">Cómo funciona</a>
          <a href="#planes">Precios</a>
          <a href="#preguntas">Preguntas</a>
        </nav>
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
          <p className="ab-kicker"><i className="ab-rec" /> Preproducción de video con IA</p>
          <h1>
            <span>ver</span>
            <span className="ab-thin">antes de</span>
            <span>filmar</span>
          </h1>
          <p className="ab-lead">
            Escribe tu idea o sube el brief del cliente. En minutos tienes <b>guion</b>, <b>storyboard dibujado</b>, <b>guion técnico</b> y
            <b> plan de rodaje con clima</b>, listo para que tu cliente lo apruebe desde su celular.
          </p>
          <p className="ab-for">Para directores, fotógrafos y casas productoras.</p>
          <div className="ab-ctas">
            <a href="#planes" className="ab-btn">Ver planes y precios</a>
            <a href="#ejemplo" className="ab-ghost">Ver un proyecto real</a>
          </div>
          <ul className="ab-chips">
            <li>Desde ${DESDE} MXN por proyecto</li>
            <li>Pago seguro con Stripe</li>
            <li>Sin suscripción obligatoria</li>
          </ul>
        </div>
        <span className="ab-f">f / 1.4</span>
      </section>

      <div className="ab-strip" aria-label="En resumen">
        <div><b>10</b><span>entregables por proyecto</span></div>
        <div><b>1</b><span>dibujo por cada toma</span></div>
        <div><b>METAR</b><span>clima real del aeropuerto</span></div>
        <div><b>0</b><span>cuentas para tu cliente</span></div>
      </div>

      <Indice n="01" t="Qué hace" id="que-hace" />
      <section className="ab-sec">
        <div className="ab-sec-head">
          <h2 className="ab-h2">Todo lo que necesitas <span className="ab-thin">para llegar al set</span></h2>
          <p>Toma uno escribe y organiza la preproducción completa de tu video. Lo que antes eran días entre Word, Excel y referencias, sale en un solo proyecto que puedes editar, compartir y exportar.</p>
        </div>
        <ol className="ab-get">
          {RECIBES.map((r) => (
            <li key={r.k}>
              <span className="ab-get-k">{r.k}</span>
              <h3>{r.t}</h3>
              <p>{r.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <Indice n="02" t="Un proyecto real" id="ejemplo" />
      <section className="ab-sec">
        <div className="ab-sec-head">
          <h2 className="ab-h2">VOLTA <span className="ab-thin">· la línea de luz</span></h2>
          <p>Así salió del estudio un spot de 30 segundos para un auto eléctrico, de noche en Paseo de la Reforma, con dron cenital y persecución FPV. Estos dibujos los hizo Toma uno.</p>
        </div>
        <blockquote className="ab-brief">
          <span>Brief</span>
          “Spot de 30 s para VOLTA, auto eléctrico. Noche con lluvia en Reforma, mucho reflejo de neón. Queremos dron y una persecución entre las torres. Cierre al amanecer.”
        </blockquote>
      </section>

      <section className="ab-reel" aria-label="Storyboard de muestra">
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
            <span className="ab-mon-tag"><i className="ab-rec" /> ANIMATIC · <Timecode /></span>
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

        <div className="ab-pack">
          <article className="ab-panel ab-panel-wide">
            <header><span>Guion audiovisual</span><small>3 de 6 escenas</small></header>
            <div className="ab-av-head"><span>Imagen</span><span>Sonido</span></div>
            {VOLTA_GUION.map((g) => (
              <div key={g.n} className="ab-av">
                <div className="ab-av-esc"><b>{g.n}</b> {g.esc}<small>{g.tc}</small></div>
                <p className="ab-av-img">{g.img}</p>
                <div className="ab-av-son"><em>VO: “{g.vo}”</em><small>{g.son}</small></div>
              </div>
            ))}
          </article>

          <article className="ab-panel">
            <header><span>Guion técnico</span><small>4 de 15 tomas</small></header>
            <table className="ab-tec">
              <thead><tr><th>Toma</th><th>Plano · movimiento</th><th>Lente</th><th>Quién</th></tr></thead>
              <tbody>
                {VOLTA_TECNICO.map(([id, plano, mov, lente, quien]) => (
                  <tr key={id}><td><b>{id}</b></td><td>{plano}<small>{mov}</small></td><td>{lente}</td><td>{quien}</td></tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="ab-panel">
            <header><span>Plan de rodaje</span><small>Jornada 1 · Noche</small></header>
            <div className="ab-wx">
              <div><small>Ocaso</small><b>18:02</b></div>
              <div><small>Lluvia</small><b>60%</b></div>
              <div><small>Viento</small><b>9 km/h</b></div>
              <div className="ab-wx-ok"><small>MMMX</small><b>VFR</b></div>
            </div>
            <ol className="ab-plan-day">
              {VOLTA_PLAN.map(([h, t, q, toma]) => (
                <li key={h}><b>{h}</b><span>{t}<small>{q}</small></span>{toma && <i>{toma}</i>}</li>
              ))}
            </ol>
          </article>

          <article className="ab-panel ab-panel-client">
            <header><span>Link del cliente</span><small>Desde su celular</small></header>
            <div className="ab-comment">
              <small>Escena 01 · Cliente</small>
              <p>“Me encanta el cenital. ¿Podemos ver el logo un poco antes?”</p>
            </div>
            <div className="ab-comment ab-comment-me">
              <small>Escena 01 · Dirección</small>
              <p>Listo, el logo entra en el reflejo del charco en 00:04.</p>
            </div>
            <span className="ab-approved">✓ Guion y storyboard aprobados</span>
          </article>
        </div>
      </section>

      <Indice n="03" t="El estudio en 42 segundos" />
      <section className="ab-video" aria-label="Toma uno en video">
        <video autoPlay muted loop playsInline preload="metadata" poster="/promo/poster.jpg">
          <source src="/promo/toma-uno-9x16.mp4" type="video/mp4" media="(max-width: 640px) and (orientation: portrait)" />
          <source src="/promo/toma-uno-16x9.mp4" type="video/mp4" />
        </video>
      </section>

      <Indice n="04" t="Para quién" />
      <section className="ab-sec">
        <div className="ab-who">
          {PARA_QUIEN.map((p) => (
            <article key={p.t}>
              <span className="ab-who-k">{p.k}</span>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </article>
          ))}
        </div>
      </section>

      <Indice n="05" t="Cómo funciona" id="como" />
      <section className="ab-steps">
        {METODO.map(([n, t, d]) => (
          <div key={n} className="ab-step">
            <span className="ab-n">{n}</span>
            <div><h3>{t}</h3><p>{d}</p></div>
          </div>
        ))}
      </section>

      <Indice n="06" t="Planes y precios" id="planes" />
      <section className="ab-sec ab-pricing">
        <div className="ab-sec-head">
          <h2 className="ab-h2">Pagas por tomas, <span className="ab-thin">no por horas</span></h2>
          <p>Elige un proyecto suelto si filmas de vez en cuando, o un plan mensual si filmas cada semana. Todos los planes incluyen los 10 entregables.</p>
        </div>

        <h3 className="ab-tier">Por proyecto <small>Pago único · sin suscripción</small></h3>
        <div className="ab-cards">
          {POR_PROYECTO.map((p) => (
            <a key={p.id} href={`/api/checkout?plan=${p.id}`} className={p.top ? "ab-card ab-card-top" : "ab-card"}>
              {p.top && <span className="ab-badge">Recomendado</span>}
              <span className="ab-card-n">{p.n}</span>
              <span className="ab-card-p">${p.precio}<small> MXN</small></span>
              <span className="ab-card-t">{p.tope}</span>
              <ul>{(INCLUYE[p.id] ?? []).map((x) => <li key={x}>{x}</li>)}</ul>
              <span className="ab-card-cta">Comprar {p.n}</span>
            </a>
          ))}
        </div>

        <h3 className="ab-tier">Mensual <small>Para quien filma cada semana</small></h3>
        <div className="ab-cards ab-cards-2">
          {MENSUAL.map((p) => (
            <a key={p.id} href={`/api/checkout?plan=${p.id}`} className={p.top ? "ab-card ab-card-top" : "ab-card"}>
              {p.top && <span className="ab-badge">Recomendado</span>}
              <span className="ab-card-n">{p.n}</span>
              <span className="ab-card-p">${p.precio}<small> MXN / mes</small></span>
              <span className="ab-card-t">{p.extra ?? p.tope}</span>
              <ul>{(INCLUYE[p.id] ?? []).map((x) => <li key={x}>{x}</li>)}</ul>
              <span className="ab-card-cta">Suscribirme a {p.n}</span>
            </a>
          ))}
        </div>
        <p className="ab-extra">¿Se te acabaron las tomas? Paquete de 25 tomas extra por ${EXTRA} MXN. Todos los precios en pesos mexicanos.</p>
        <p className="ab-secure"><span aria-hidden>🔒</span> Pago con tarjeta de crédito o débito en la página segura de Stripe.</p>
      </section>

      <Indice n="07" t="Por qué confiar" />
      <section className="ab-sec">
        <div className="ab-trust">
          {CONFIANZA.map((c) => (
            <article key={c.t}><h3>{c.t}</h3><p>{c.d}</p></article>
          ))}
        </div>
      </section>

      <Indice n="08" t="Preguntas frecuentes" id="preguntas" />
      <section className="ab-sec ab-faq">
        {FAQ.map(([q, a], i) => (
          <details key={q} open={i === 0}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <section className="ab-final">
        <div className="ab-orb" aria-hidden />
        <h2 className="ab-big">toma<br /><span className="ab-thin">uno</span></h2>
        <p className="ab-final-p">Tu próximo rodaje, visto antes de filmarlo.</p>
        <div className="ab-ctas ab-ctas-c">
          <a href="#planes" className="ab-btn">Elegir mi plan</a>
          <Link href="/estudio" className="ab-ghost">Ya tengo cuenta</Link>
        </div>
      </section>

      <footer className="ab-foot">
        <span><span className="ab-dot" /> toma uno · preproducción de video</span>
        <nav aria-label="Pie">
          <a href="#que-hace">Qué hace</a>
          <a href="#planes">Precios</a>
          <a href="#preguntas">Preguntas</a>
          <Link href="/estudio">Entrar</Link>
        </nav>
        <small>Precios en MXN · Pagos procesados por Stripe</small>
      </footer>
    </div>
  );
}
