import Link from "next/link";
import "./landing.css";

// Página de presentación: lo que ve un director o fotógrafo antes de entrar al estudio.

const CUADROS = [
  {
    id: "1A",
    plano: "GPG aéreo",
    lente: "24 mm",
    svg: (
      <svg viewBox="0 0 320 180" aria-hidden>
        <path d="M0 120 L60 70 L105 98 L160 40 L225 92 L270 62 L320 96" />
        <path d="M0 150 Q160 118 320 150" className="soft" />
        <path d="M120 150 L150 128 L190 128 L215 150" className="soft" />
        <path d="M168 140 L168 98 M160 108 L168 96 L176 108" className="arrow" />
        <circle cx="262" cy="34" r="12" className="soft" />
      </svg>
    ),
  },
  {
    id: "1B",
    plano: "PM gimbal",
    lente: "35 mm",
    svg: (
      <svg viewBox="0 0 320 180" aria-hidden>
        <path d="M0 140 L320 140" className="soft" />
        <circle cx="130" cy="52" r="13" />
        <path d="M130 65 L130 108 M130 78 L110 98 M130 78 L152 92 M130 108 L116 140 M130 108 L144 140" />
        <circle cx="196" cy="56" r="12" />
        <path d="M196 68 L196 108 M196 80 L178 96 M196 80 L216 98 M196 108 L184 140 M196 108 L208 140" />
        <path d="M60 160 L260 160 M246 152 L260 160 L246 168" className="arrow" />
      </svg>
    ),
  },
  {
    id: "2A",
    plano: "PP",
    lente: "85 mm",
    svg: (
      <svg viewBox="0 0 320 180" aria-hidden>
        <ellipse cx="160" cy="92" rx="46" ry="58" />
        <path d="M138 84 Q146 78 154 84 M168 84 Q176 78 184 84" />
        <path d="M150 122 Q160 130 172 122" />
        <path d="M160 92 L156 108 L164 108" className="soft" />
        <path d="M100 180 Q160 140 220 180" />
        <path d="M40 30 L40 150 M280 30 L280 150" className="soft" />
      </svg>
    ),
  },
  {
    id: "3A",
    plano: "Órbita dron",
    lente: "24 mm",
    svg: (
      <svg viewBox="0 0 320 180" aria-hidden>
        <path d="M0 132 L320 132" className="soft" />
        <path d="M140 132 L140 92 L180 92 L180 132 M132 92 L160 70 L188 92" />
        <ellipse cx="160" cy="108" rx="120" ry="44" className="arrow dash" />
        <path d="M268 96 L280 108 L264 112" className="arrow" />
        <circle cx="56" cy="40" r="4" />
        <path d="M44 40 L68 40 M56 28 L56 52" className="soft" />
      </svg>
    ),
  },
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
  ["01", "Sube el brief", "Word, PDF o una idea escrita. Eliges cámaras, dron y fecha de rodaje."],
  ["02", "Mira cómo se escribe", "Una sala de control muestra en vivo las escenas y tomas mientras se arma el proyecto."],
  ["03", "Compártelo y filma", "El cliente comenta y aprueba. Tu equipo recibe su hoja por WhatsApp."],
];

const POR_PROYECTO = [
  { n: "Spot / redes", tope: "Hasta 3 min · 30 tomas", precio: "349" },
  { n: "Institucional", tope: "Hasta 8 min · 60 tomas", precio: "790", top: true },
  { n: "Cortometraje", tope: "Hasta 20 min · 120 tomas", precio: "1,690" },
];

const MENSUAL = [
  { n: "Pro", tope: "250 tomas al mes · 1 usuario", precio: "1,290", top: true, extra: "Para directores y fotógrafos que filman cada semana." },
  { n: "Estudio", tope: "800 tomas al mes · equipo", precio: "3,490", extra: "Para casas productoras con varios directores." },
];

const PREGUNTAS = [
  ["¿Qué cuenta como una toma?", "Cada plano del guion técnico con su cuadro de storyboard. Un spot de 30 segundos suele tener entre 12 y 25 tomas."],
  ["¿Puedo corregir lo que escribe?", "Sí. Todo el guion, las tomas y el plan se editan en sitio, y el storyboard se vuelve a dibujar cuando quieras."],
  ["¿Sirve para tomas aéreas?", "Está pensado con pilotos RPAS: alturas, tipos de toma, viento, baterías y normativa AFAC vienen en cada plan."],
  ["¿Mis clientes necesitan cuenta?", "No. Reciben un link para ver el guion y el storyboard, comentar y aprobar desde el celular."],
];

export default function Landing() {
  return (
    <div className="ld">
      <header className="ld-nav">
        <Link href="/" className="ld-brand">
          <span className="ld-mark">T1</span>
          Toma <em>uno</em>
        </Link>
        <nav>
          <a href="#como">Cómo funciona</a>
          <a href="#entrega">Qué entrega</a>
          <a href="#planes">Planes</a>
        </nav>
        <Link href="/estudio" className="ld-btn ghost">Entrar al estudio</Link>
      </header>

      <section className="ld-hero">
        <div className="ld-hero-copy">
          <span className="ld-rec"><i /> Estudio de preproducción</span>
          <h1>
            Del brief
            <br />a la <span>claqueta</span>.
          </h1>
          <p>
            Sube el brief y en minutos tienes guion audiovisual, storyboard dibujado, guion técnico con ópticas y plan de rodaje con fecha real.
            Escrito con criterio de cine, no de plantilla.
          </p>
          <div className="ld-ctas">
            <Link href="/estudio" className="ld-btn">Empieza un proyecto</Link>
            <a href="#planes" className="ld-btn ghost">Ver planes</a>
          </div>
          <ul className="ld-proof">
            <li><b>8</b> entregables por proyecto</li>
            <li><b>1</b> link por persona del equipo</li>
            <li><b>0</b> plantillas genéricas</li>
          </ul>
        </div>

        <div className="ld-window" aria-label="Vista del estudio">
          <div className="ld-window-bar">
            <span /><span /><span />
            <b>Storyboard · Escena 01</b>
            <em className="ld-tc">REC 00:00:12:08</em>
          </div>
          <div className="ld-frames">
            {CUADROS.map((c, i) => (
              <figure key={c.id} style={{ animationDelay: `${0.15 * i}s` }}>
                <div className="ld-frame">
                  {c.svg}
                  <span className="ld-frame-id">{c.id}</span>
                </div>
                <figcaption>
                  <b>{c.plano}</b>
                  <span>{c.lente}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="ld-track">
            {[18, 26, 30, 26].map((w, i) => (
              <span key={i} style={{ flexGrow: w }}>
                <b>{String(i + 1).padStart(2, "0")}</b>
              </span>
            ))}
            <i className="ld-playhead" />
          </div>
        </div>
      </section>

      <section className="ld-for">
        <span>Para</span>
        <b>Directores</b>
        <b>Fotógrafos</b>
        <b>Casas productoras</b>
        <b>Agencias</b>
        <b>Pilotos de dron</b>
      </section>

      <section id="como" className="ld-sec">
        <header>
          <span className="ld-kicker">Cómo funciona</span>
          <h2>Tres pasos y estás listo para el llamado.</h2>
        </header>
        <ol className="ld-steps">
          {PASOS.map(([n, t, d]) => (
            <li key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="entrega" className="ld-sec">
        <header>
          <span className="ld-kicker">Qué entrega</span>
          <h2>Todo el paquete de preproducción, conectado.</h2>
          <p>Si cambias una escena, la toma, el cuadro y la jornada lo saben.</p>
        </header>
        <div className="ld-grid">
          {ENTREGA.map(([ico, t, d]) => (
            <article key={t}>
              <span className="ld-ico">{ico}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ld-sec ld-split">
        <div>
          <span className="ld-kicker">Un link para cada quien</span>
          <h2>Cada persona ve solo lo que le toca.</h2>
          <p>El cliente aprueba el guion y el storyboard. El fotógrafo abre su hoja con sus tomas, lentes y horario. El piloto, sus vuelos con altura y normativa.</p>
        </div>
        <ul className="ld-roles">
          <li><i className="c1" /><b>Cliente</b><span>Guion + storyboard · comenta y aprueba</span></li>
          <li><i className="c2" /><b>Director</b><span>Todo el proyecto, sin presupuesto</span></li>
          <li><i className="c3" /><b>Cámara A</b><span>12 tomas · 24-70 mm · llamado 06:00</span></li>
          <li><i className="c4" /><b>Piloto de dron</b><span>4 vuelos · 60 m AGL · ND 16</span></li>
        </ul>
      </section>

      <section className="ld-sec ld-split rev">
        <div>
          <span className="ld-kicker">Criterio de director</span>
          <h2>Piensa en lentes, luz y ritmo.</h2>
          <p>Cada proyecto se escribe con un manual de dirección: lenguaje de cámara, escuelas de fotografía, hora dorada, voz en off que no describe lo que ya se ve y ritmo de edición según el formato.</p>
        </div>
        <div className="ld-quote">
          <span className="ld-lab">Toma 2A · Plano medio</span>
          <p>“Push-in lento de 35 a 50 mm mientras ella entiende la palabra. La luz entra por la ventana a la izquierda; el corte llega con la mirada.”</p>
        </div>
      </section>

      <section id="planes" className="ld-sec">
        <header>
          <span className="ld-kicker">Planes</span>
          <h2>Paga por proyecto o suscríbete.</h2>
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
                {p.top && <span className="ld-badge">El más usado</span>}
                <h3>{p.n}</h3>
                <p className="ld-tope">{p.tope}</p>
                <p className="ld-price"><small>$</small>{p.precio}<small> MXN</small></p>
                <ul>
                  <li>Los 8 entregables</li>
                  <li>Storyboard dibujado + 2 redibujos</li>
                  <li>Links de cliente y equipo</li>
                </ul>
                <Link href="/estudio" className={p.top ? "ld-btn" : "ld-btn ghost"}>Crear proyecto</Link>
              </article>
            ))}
          </div>
          <div className="ld-cards mes">
            {MENSUAL.map((p) => (
              <article key={p.n} className={p.top ? "destacado" : ""}>
                {p.top && <span className="ld-badge">Recomendado</span>}
                <h3>{p.n}</h3>
                <p className="ld-tope">{p.tope}</p>
                <p className="ld-price"><small>$</small>{p.precio}<small> MXN / mes</small></p>
                <ul>
                  <li>{p.extra}</li>
                  <li>Redibujos ilimitados dentro de tu bolsa</li>
                  <li>Paquete extra de 25 tomas: $149</li>
                </ul>
                <Link href="/estudio" className={p.top ? "ld-btn" : "ld-btn ghost"}>Empezar</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ld-sec ld-faq">
        <header>
          <span className="ld-kicker">Preguntas</span>
          <h2>Lo que nos preguntan en set.</h2>
        </header>
        {PREGUNTAS.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <section className="ld-final">
        <span className="ld-rec"><i /> Listos</span>
        <h2>Tu próximo rodaje empieza aquí.</h2>
        <Link href="/estudio" className="ld-btn">Empieza un proyecto</Link>
      </section>

      <footer className="ld-foot">
        <span className="ld-brand small"><span className="ld-mark">T1</span> Toma <em>uno</em></span>
        <span>Estudio de preproducción · Hecho en México</span>
      </footer>
    </div>
  );
}
