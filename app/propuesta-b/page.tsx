import type { Metadata } from "next";
import Link from "next/link";
import { Caveat, Courier_Prime } from "next/font/google";
import "./propuesta-b.css";
import { CUADROS, ENTREGA, PASOS, POR_PROYECTO, MENSUAL, EXTRA, PREGUNTAS } from "@/lib/landing-data";

// Propuesta B de portada: "La libreta del director". Papel, guion en Courier y notas a lápiz rojo,
// como los guiones anotados y las hojas de contactos de los cineastas.

const courier = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--nb-courier" });
const mano = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--nb-mano" });

export const metadata: Metadata = { title: "Toma uno · La libreta del director", robots: { index: false } };

const NOTAS = ["arranca en negro, sube con la niebla", "gimbal a la altura de ella", "foco en las manos, no en la cara", "cierre: órbita completa, logo"];

export default function PropuestaB() {
  return (
    <div className={`nb ${courier.variable} ${mano.variable}`}>
      <header className="nb-top">
        <Link href="/propuesta-b" className="nb-brand">TOMA UNO</Link>
        <span className="nb-ed">Edición del director · N.º 001</span>
        <nav>
          <a href="#guion">Guion</a>
          <a href="#contactos">Contactos</a>
          <a href="#planes">Planes</a>
          <Link href="/estudio" className="nb-in">Entrar al estudio →</Link>
        </nav>
      </header>

      {/* Portada del guion con el storyboard sujeto con cinta */}
      <section className="nb-hero">
        <div className="nb-title-page">
          <span className="nb-brads" aria-hidden><i /><i /><i /></span>
          <p className="nb-tp-title">DEL BRIEF<br />A LA CLAQUETA</p>
          <p className="nb-tp-sub">Guion, storyboard y plan de rodaje</p>
          <p className="nb-tp-by">escrito a partir de<br /><b>tu brief</b></p>
          <p className="nb-tp-by">dirigido por<br /><b>ti</b></p>
          <p className="nb-tp-foot"><span>Versión 1</span><span>Toma uno · México</span></p>
          <span className="nb-note nb-note-hero">¡en minutos, no en semanas!</span>
          <svg className="nb-arrow" viewBox="0 0 120 60" aria-hidden><path d="M4 50 C 40 10, 80 8, 112 22" /><path d="M100 12 L 113 22 L 99 30" /></svg>
          <figure className="nb-polaroid">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CUADROS[1].img} alt={CUADROS[1].alt} />
            <figcaption>{CUADROS[1].id} · {CUADROS[1].lente}</figcaption>
            <span className="nb-tape" aria-hidden />
          </figure>
        </div>
        <div className="nb-hero-copy">
          <span className="nb-kicker">Preproducción para directores, fotógrafos y pilotos</span>
          <h1>Llega al set sabiendo <span className="nb-circle">cada toma.</span></h1>
          <p>Sube el brief y Toma uno te devuelve el guion a dos columnas, el storyboard dibujado a lápiz, el guion técnico con ópticas y el plan de rodaje con fecha real. Lo corriges en sitio, como en tu libreta.</p>
          <div className="nb-ctas">
            <Link href="/estudio" className="nb-btn">Empezar un proyecto</Link>
            <a href="#planes" className="nb-link">Ver planes</a>
          </div>
        </div>
      </section>

      {/* Una página de guion de muestra, anotada al margen */}
      <section id="guion" className="nb-sec">
        <header className="nb-head">
          <span className="nb-kicker">Página 1 · Nace en la niebla · Café de altura, Chiapas</span>
          <h2>Un guion que ya trae <em>las notas del director.</em></h2>
        </header>
        <article className="nb-page">
          <span className="nb-pnum">1.</span>
          <p className="nb-fade">FUNDIDO DE NEGRO:</p>
          {CUADROS.map((c, i) => (
            <div key={c.id} className="nb-scene">
              <p className="nb-slug"><b>{i + 1}</b> {c.escena.toUpperCase().replace(" · ", " — ")}</p>
              <p className="nb-action">{c.alt}. {c.plano}.</p>
              <p className="nb-char">VOZ (V.O.)</p>
              <p className="nb-dial">{c.vo}</p>
              <aside className="nb-margin">
                <b>{c.id}</b> {c.lente.split(" · ")[0]}
                <span>{NOTAS[i]}</span>
              </aside>
            </div>
          ))}
          <p className="nb-fade nb-right">CORTE A NEGRO.</p>
        </article>
      </section>

      {/* Hoja de contactos con el storyboard */}
      <section id="contactos" className="nb-sec nb-contact-sec">
        <header className="nb-head">
          <span className="nb-kicker">Storyboard</span>
          <h2>La hoja de contactos <em>de tu idea.</em></h2>
          <p>Cada toma se dibuja a lápiz con su flecha de movimiento. Si una no te convence, la vuelves a dibujar.</p>
        </header>
        <div className="nb-strip">
          <div className="nb-film">
            {CUADROS.map((c, i) => (
              <figure key={c.id} className={i === 2 ? "nb-frame nb-pick" : "nb-frame"}>
                <span className="nb-edge">TOMA UNO 5219 ▸ {c.id}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.alt} loading="lazy" />
                <figcaption>{c.plano} · {c.lente}</figcaption>
                {i === 2 && (
                  <>
                    <svg className="nb-grease" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden><path d="M20 62 C 18 20, 170 8, 186 52 C 198 96, 40 118, 16 76 C 8 58, 40 30, 70 24" /></svg>
                    <span className="nb-note nb-note-pick">¡buena! ✓</span>
                  </>
                )}
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* El método en fichas */}
      <section className="nb-sec">
        <header className="nb-head">
          <span className="nb-kicker">Método</span>
          <h2>Tres fichas <em>y a rodar.</em></h2>
        </header>
        <div className="nb-cards">
          {PASOS.map(([n, t, d]) => (
            <article key={n} className="nb-card">
              <span className="nb-card-n">{n}.</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Índice de lo que recibes */}
      <section className="nb-sec nb-toc-sec">
        <header className="nb-head">
          <span className="nb-kicker">Contenido</span>
          <h2>Todo el proyecto, <em>en un solo cuaderno.</em></h2>
        </header>
        <ol className="nb-toc">
          {ENTREGA.map(([, t, d], i) => (
            <li key={t}>
              <span className="nb-toc-t">{t}</span>
              <span className="nb-dots" aria-hidden />
              <span className="nb-toc-n">{String(i + 1).padStart(2, "0")}</span>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Planes como boletos de cine */}
      <section id="planes" className="nb-sec">
        <header className="nb-head">
          <span className="nb-kicker">Planes · pesos mexicanos</span>
          <h2>Un boleto por proyecto <em>o el pase del mes.</em></h2>
          <p>Cobramos por tomas porque es lo que mide el tamaño real de un proyecto.</p>
        </header>
        <div className="nb-tickets">
          {[...POR_PROYECTO.map((p) => ({ ...p, tipo: "Por proyecto", extra: undefined as string | undefined })), ...MENSUAL.map((p) => ({ ...p, tipo: "Mensual" }))].map((p) => (
            <a key={p.id} href={`/api/checkout?plan=${p.id}`} className={p.top ? "nb-ticket nb-top-pick" : "nb-ticket"}>
              <span className="nb-t-admit">Admite uno · {p.tipo}</span>
              <b className="nb-t-name">{p.n}</b>
              <span className="nb-t-tope">{p.tope}</span>
              {p.extra && <span className="nb-t-extra">{p.extra}</span>}
              <span className="nb-t-price">${p.precio}<small>{p.tipo === "Mensual" ? " / mes" : ""}</small></span>
              <span className="nb-t-stub">N.º {p.precio.replace(",", "")}</span>
              {p.top && <span className="nb-note nb-note-ticket">el favorito</span>}
            </a>
          ))}
        </div>
        <p className="nb-extra">¿Te faltan tomas? Paquete extra de 25 tomas por ${EXTRA}.</p>
      </section>

      <section className="nb-sec">
        <header className="nb-head">
          <span className="nb-kicker">Preguntas al margen</span>
          <h2>Lo que nos <em>preguntan en el set.</em></h2>
        </header>
        <dl className="nb-faq">
          {PREGUNTAS.map(([q, a]) => (
            <div key={q}>
              <dt>{q}</dt>
              <dd><span className="nb-r">R:</span> {a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="nb-final">
        <p className="nb-fade">FUNDIDO A NEGRO.</p>
        <h2>CORTE A:<br />TU ESTUDIO.</h2>
        <Link href="/estudio" className="nb-btn nb-btn-light">Escribir mi primera escena</Link>
      </section>

      <footer className="nb-foot">
        <span>Toma uno · preproducción de video</span>
        <span>Hecho en México</span>
      </footer>
    </div>
  );
}
