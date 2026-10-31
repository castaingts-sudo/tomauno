import Link from "next/link";
import "./landing.css";
import { PLANES, planDe, precioTexto } from "@/lib/planes";
import { Timecode } from "@/components/timecode";

// Página de presentación: lo que ve un director o fotógrafo antes de entrar al estudio.

// Dibujos reales hechos por el estudio (proyecto de muestra "Café de altura").
const CUADROS = [
  { id: "1A", plano: "Gran plano general aéreo", lente: "24 mm · Dron", escena: "Ext. Sierra y cafetal · Amanecer", vo: "Antes del café, está la niebla.", img: "/api/img/storyboard/JhSnNbIg5snLyw-1A.png", alt: "Vista aérea de la sierra con niebla y un camino hacia la finca" },
  { id: "1B", plano: "Plano medio en gimbal", lente: "35 mm · Cámara A", escena: "Ext. Cafetal · Mañana", vo: "Y alguien que la camina todos los días.", img: "/api/img/storyboard/EQcJ7Ka9Yg-bbA-1B.png", alt: "Productora y su hijo caminan entre los cafetos" },
  { id: "2A", plano: "Primer plano", lente: "85 mm · Cámara B", escena: "Ext. Patio de secado · Mañana", vo: "Cada grano pasa por sus manos.", img: "/api/img/storyboard/d8YhmVaIyKatzQ-2A.png", alt: "Primer plano de la productora con granos de café en la mano" },
  { id: "3A", plano: "Órbita de dron", lente: "24 mm · Dron", escena: "Ext. Casa de la finca · Atardecer", vo: "Nace en la niebla. Llega a tu taza.", img: "/api/img/storyboard/HXPkpebjrtwN2w-3A.png", alt: "Órbita de dron sobre la casa de la finca y el patio de secado" },
];

const ENTREGA = [
  ["¶", "Guion audiovisual", "A dos columnas, imagen y sonido, con voz en off, música y timecode por escena."],
  ["▦", "Storyboard dibujado", "Cada toma a lápiz, con flechas de movimiento de cámara y su óptica."],
  ["◫", "Guion técnico", "Tamaño de plano, ángulo, movimiento, lente y quién la filma: cámara A, B o dron."],
  ["▤", "Plan de rodaje", "Jornadas con fecha real, llamado y horario pensado en la hora dorada."],
  ["◉", "Hojas de llamado", "Un link para cada quien. El fotógrafo ve sus tomas y el piloto, sus vuelos."],
  ["⌖", "Locaciones y permisos", "Riesgos, permisos y normativa de dron (AFAC) por locación."],
  ["$", "Presupuesto", "Estimado por rubro en pesos, listo para ajustar y cotizar."],
  ["✓", "Post y entregables", "Edición, color, audio, gráficos y versiones 60/30/15 en vertical."],
];

const PASOS = [
  ["I", "Sube el brief", "Word, PDF o una idea escrita. Eliges cámaras, dron y fecha de rodaje."],
  ["II", "Mira cómo se escribe", "Una sala de control muestra en vivo las escenas y tomas mientras se arma el proyecto."],
  ["III", "Compártelo y filma", "El cliente comenta y aprueba. Tu equipo recibe su hoja por WhatsApp."],
];

// Precios y topes salen del mismo catálogo que cobra Stripe.
const DESTACADO = ["institucional", "pro"];
const EXTRA_MES: Record<string, string> = { pro: "Para directores y fotógrafos que filman cada semana.", estudio: "Para casas productoras con varios directores." };
const POR_PROYECTO = PLANES.filter((p) => p.tipo === "proyecto").map((p) => ({ id: p.id, n: p.nombre, tope: p.tope, precio: precioTexto(p), top: DESTACADO.includes(p.id) }));
const MENSUAL = PLANES.filter((p) => p.tipo === "mensual").map((p) => ({ id: p.id, n: p.nombre, tope: p.tope, precio: precioTexto(p), top: DESTACADO.includes(p.id), extra: EXTRA_MES[p.id] }));
const EXTRA = precioTexto(planDe("extra")!);

const PREGUNTAS = [
  ["¿Qué cuenta como una toma?", "Cada plano del guion técnico con su cuadro de storyboard. Un spot de 30 segundos suele tener entre 12 y 25 tomas."],
  ["¿Puedo corregir lo que escribe?", "Sí. Todo el guion, las tomas y el plan se editan en sitio, y el storyboard se vuelve a dibujar cuando quieras."],
  ["¿Sirve para tomas aéreas?", "Está pensado con pilotos RPAS: alturas, tipos de toma, viento, baterías y normativa AFAC vienen en cada plan."],
  ["¿Mis clientes necesitan cuenta?", "No. Reciben un link para ver el guion y el storyboard, comentar y aprobar desde el celular."],
];

export default function Landing() {
  return (
    <div className="ld">
      <div className="ld-grain" aria-hidden />
      <header className="ld-nav">
        <Link href="/" className="ld-brand">
          <span className="ld-mark">T1</span>
          <span>Toma <em>uno</em></span>
        </Link>
        <nav>
          <a href="#secuencia">Secuencia</a>
          <a href="#como">Método</a>
          <a href="#entrega">Créditos</a>
          <a href="#planes">Planes</a>
        </nav>
        <Link href="/estudio" className="ld-link">Entrar al estudio</Link>
      </header>

      {/* Apertura: el storyboard corre como animatic, en formato scope. */}
      <section className="ld-open">
        <div className="ld-open-top">
          <span>Toma uno presenta</span>
          <span className="ld-rec"><i /> REC <Timecode /></span>
        </div>
        <div className="ld-scope" aria-label="Storyboard de muestra: Nace en la niebla">
          {CUADROS.map((c, i) => (
            <figure key={c.id} className="ld-shot" style={{ ["--i" as string]: i }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt={c.alt} loading="eager" />
              <figcaption>
                <span className="ld-sub">{c.vo}</span>
                <span className="ld-slate">
                  <b>{c.id}</b> {c.escena} <i>·</i> {c.plano} <i>·</i> {c.lente}
                </span>
              </figcaption>
            </figure>
          ))}
          <span className="ld-corner tl" /><span className="ld-corner tr" /><span className="ld-corner bl" /><span className="ld-corner br" />
        </div>
        <div className="ld-open-title">
          <h1>
            Del brief <br />a la <em>claqueta.</em>
          </h1>
          <div className="ld-open-side">
            <p>Sube el brief y en minutos tienes guion, storyboard dibujado a lápiz, guion técnico con ópticas y plan de rodaje con fecha real. Escrito con criterio de cine, no de plantilla.</p>
            <div className="ld-ctas">
              <Link href="/estudio" className="ld-btn">Empieza un proyecto</Link>
              <a href="#planes" className="ld-link">Ver planes →</a>
            </div>
          </div>
        </div>
        <p className="ld-credit">Muestra: <b>Nace en la niebla</b> · Café de altura, Chiapas · 30 s · Storyboard generado en Toma uno</p>
      </section>

      <section className="ld-manifesto">
        <p>
          Un buen rodaje se gana <em>antes</em> de encender la cámara. Toma uno piensa en lentes, luz y ritmo: la hora dorada, el eje, la voz en off que no repite lo que ya se ve. Para que llegues al set sabiendo <em>cada toma.</em>
        </p>
        <ul className="ld-for">
          <li>Directores</li><li>Fotógrafos</li><li>Casas productoras</li><li>Agencias</li><li>Pilotos de dron</li>
        </ul>
      </section>

      <section id="secuencia" className="ld-seq">
        <header className="ld-head">
          <span className="ld-kicker">Secuencia · Escenas 1 a 3</span>
          <h2>Cada toma, <em>dibujada.</em></h2>
        </header>
        <div className="ld-strip">
          {CUADROS.map((c) => (
            <figure key={c.id}>
              <div className="ld-still">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.alt} loading="lazy" />
                <span>{c.id}</span>
              </div>
              <figcaption>
                <b>{c.plano}</b>
                <span>{c.lente}</span>
                <em>“{c.vo}”</em>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="ld-reel" aria-label="Toma uno en video">
        <div className="ld-reel-frame">
          <video autoPlay muted loop playsInline preload="metadata" poster="/promo/poster.jpg">
            <source src="/promo/toma-uno-9x16.mp4" type="video/mp4" media="(max-width: 640px) and (orientation: portrait)" />
            <source src="/promo/toma-uno-16x9.mp4" type="video/mp4" />
          </video>
        </div>
        <p className="ld-credit">El estudio en 42 segundos</p>
      </section>

      <section id="como" className="ld-acts">
        <header className="ld-head">
          <span className="ld-kicker">El método</span>
          <h2>Tres actos y estás <em>listo para el llamado.</em></h2>
        </header>
        <ol>
          {PASOS.map(([n, t, d]) => (
            <li key={n}>
              <span className="ld-act">Acto {n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="entrega" className="ld-credits">
        <span className="ld-kicker">Lo que recibes</span>
        <h2>Créditos de un <em>proyecto.</em></h2>
        <dl>
          {ENTREGA.map(([, t, d]) => (
            <div key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="ld-callsheet">
        <div>
          <span className="ld-kicker">Hoja de llamado</span>
          <h2>Cada quien ve <em>solo lo suyo.</em></h2>
          <p>El cliente aprueba el guion y el storyboard. El fotógrafo abre su hoja con sus tomas, lentes y horario. El piloto, sus vuelos con altura y normativa.</p>
        </div>
        <table>
          <thead>
            <tr><th>Rol</th><th>Ve</th><th>Llamado</th></tr>
          </thead>
          <tbody>
            <tr><td>Cliente</td><td>Guion + storyboard · comenta y aprueba</td><td>—</td></tr>
            <tr><td>Director</td><td>Todo el proyecto</td><td>05:45</td></tr>
            <tr><td>Cámara A</td><td>12 tomas · 24-70 mm</td><td>06:00</td></tr>
            <tr><td>Piloto de dron</td><td>4 vuelos · 60 m AGL · ND 16</td><td>06:15</td></tr>
          </tbody>
        </table>
      </section>

      <section className="ld-quote">
        <span className="ld-kicker">Toma 2A · Plano medio · 50 mm</span>
        <blockquote>“Push-in lento de 35 a 50 mm mientras ella entiende la palabra. La luz entra por la ventana a la izquierda; el corte llega con la mirada.”</blockquote>
        <p>Así se escribe cada toma.</p>
      </section>

      <section id="planes" className="ld-plans-sec">
        <header className="ld-head">
          <span className="ld-kicker">Planes</span>
          <h2>Paga por proyecto <em>o suscríbete.</em></h2>
          <p>Precios en pesos mexicanos. Cobramos por tomas porque es lo que mide el tamaño real de un proyecto.</p>
        </header>
        <div className="ld-plans">
          <input type="radio" name="plan" id="p-proyecto" defaultChecked />
          <input type="radio" name="plan" id="p-mes" />
          <div className="ld-toggle">
            <label htmlFor="p-proyecto">Por proyecto</label>
            <label htmlFor="p-mes">Mensual</label>
          </div>
          <div className="ld-cards proyecto">
            {POR_PROYECTO.map((p) => (
              <article key={p.n} className={p.top ? "destacado" : ""}>
                <span className="ld-badge">{p.top ? "El más usado" : "\u00a0"}</span>
                <h3>{p.n}</h3>
                <p className="ld-tope">{p.tope}</p>
                <p className="ld-price"><small>$</small>{p.precio}<small> MXN</small></p>
                <ul>
                  <li>Los 8 entregables</li>
                  <li>Storyboard dibujado + 2 redibujos</li>
                  <li>Links de cliente y equipo</li>
                </ul>
                <a href={`/api/checkout?plan=${p.id}`} className={p.top ? "ld-btn" : "ld-btn ghost"}>Comprar</a>
              </article>
            ))}
          </div>
          <div className="ld-cards mes">
            {MENSUAL.map((p) => (
              <article key={p.n} className={p.top ? "destacado" : ""}>
                <span className="ld-badge">{p.top ? "Recomendado" : "\u00a0"}</span>
                <h3>{p.n}</h3>
                <p className="ld-tope">{p.tope}</p>
                <p className="ld-price"><small>$</small>{p.precio}<small> MXN / mes</small></p>
                <ul>
                  <li>{p.extra}</li>
                  <li>Redibujos ilimitados dentro de tu bolsa</li>
                  <li>Paquete extra de 25 tomas: ${EXTRA}</li>
                </ul>
                <a href={`/api/checkout?plan=${p.id}`} className={p.top ? "ld-btn" : "ld-btn ghost"}>Suscribirme</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ld-faq">
        <header className="ld-head">
          <span className="ld-kicker">Preguntas</span>
          <h2>Lo que nos preguntan <em>en set.</em></h2>
        </header>
        {PREGUNTAS.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <section className="ld-final">
        <p className="ld-slate-final"><span>Escena 1</span><span>Toma 1</span><span>Rollo A</span></p>
        <h2>Tu próximo rodaje <em>empieza aquí.</em></h2>
        <Link href="/estudio" className="ld-btn">Empieza un proyecto</Link>
      </section>

      <footer className="ld-foot">
        <span className="ld-brand small"><span className="ld-mark">T1</span> <span>Toma <em>uno</em></span></span>
        <span>Estudio de preproducción · Hecho en México</span>
      </footer>
    </div>
  );
}
