import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Countdown, ThemeToggle } from "@/components/share-ui";
import { ID_RE, segundos, tc, type Comentario, type RevisionGuardada } from "@/lib/share";
import { listJson, readJson } from "@/lib/store";
import { Aprobacion, ComentarEscena } from "./feedback";
import "../../share.css";

export const dynamic = "force-dynamic";

async function cargar(id: string) {
  if (!ID_RE.test(id)) return null;
  const rev = await readJson<RevisionGuardada>(`shares/${id}.json`);
  if (!rev) return null;
  const comentarios = (await listJson<Comentario>(`comentarios/${id}/`)).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const { ownerToken: _t, ...publica } = rev;
  return { rev: publica, comentarios };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const data = await cargar((await params).id);
  return { title: data ? `${data.rev.titulo} · Revisión` : "Revisión", robots: { index: false, follow: false } };
}

const svgSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export default async function RevisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await cargar(id);
  if (!data) notFound();
  const { rev, comentarios } = data;

  // Código de tiempo acumulado por escena, si las duraciones se pueden leer.
  const durs = rev.escenas.map((e) => segundos(e.duracion));
  const total = durs.every((d) => d !== null) ? durs.reduce<number>((s, d) => s + (d ?? 0), 0) : null;
  let t = 0;
  const tiempos = rev.escenas.map((_, i) => {
    const d = durs[i];
    if (d === null || total === null) return null;
    const r = `${tc(t)} – ${tc(t + d)}`;
    t += d;
    return r;
  });

  const ultimo = [...comentarios].reverse().find((c) => c.tipo !== "comentario");
  const tomas = rev.escenas.reduce((s, e) => s + e.paneles.length, 0);

  return (
    <div className="tu">
      <div className="tu-bar">
        <span className="tu-brand"><i>T1</i> Revisión</span>
        <div className="tu-bar-right">
          <a className="tu-btn primary" href="#aprobar">Aprobar</a>
          <ThemeToggle />
        </div>
      </div>

      <header className="tu-hero">
        <span className="kicker">Guion y storyboard para revisión</span>
        <h1>{rev.titulo}</h1>
        {rev.logline && <p className="tu-logline">{rev.logline}</p>}
        <div className="tu-chips">
          {[rev.duracion, rev.formato, `${rev.escenas.length} escenas`, `${tomas} tomas dibujadas`].filter(Boolean).map((c) => (
            <span key={c} className="chip">{c}</span>
          ))}
        </div>
        {ultimo && (
          <p className={`rv-status ${ultimo.tipo}`}>
            {ultimo.tipo === "aprobado" ? "● Aprobado" : "● Cambios solicitados"} por {ultimo.nombre} ·{" "}
            {new Date(ultimo.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
          </p>
        )}
        <div className="rv-steps">
          <div><span>01</span><b>Mira</b>Cada escena con sus dibujos: así se verá cada toma.</div>
          <div><span>02</span><b>Escucha</b>La voz en off y la música de cada momento.</div>
          <div><span>03</span><b>Comenta y aprueba</b>Deja notas por escena y al final aprueba o pide cambios.</div>
        </div>
      </header>

      {rev.fechaRodaje && (
        <section className="tu-call" style={{ gridTemplateColumns: "1fr" }}>
          <div><Countdown fecha={rev.fechaRodaje} /></div>
        </section>
      )}

      {total !== null && total > 0 && (
        <nav className="rv-timeline" aria-label="Línea de tiempo del video">
          <div className="rv-track">
            {rev.escenas.map((e, i) => (
              <a key={e.numero} href={`#escena-${e.numero}`} style={{ ["--w" as string]: String(durs[i]) }} className={e.vozEnOff ? "has-vo" : ""} title={`${e.numero}. ${e.encabezado} · ${e.duracion}`}>
                {e.numero}
              </a>
            ))}
          </div>
          <div className="rv-ticks">
            <span>00:00</span>
            <span>{tc(total / 2)}</span>
            <span>{tc(total)}</span>
          </div>
        </nav>
      )}

      <main>
        {rev.escenas.map((e, i) => (
          <section key={e.numero} className="rv-scene" id={`escena-${e.numero}`}>
            <div className="rv-scene-head">
              <span className="rv-num">{e.numero}</span>
              <div>
                <h2>{e.encabezado}</h2>
                <p className="rv-time">{tiempos[i] ?? e.duracion}</p>
              </div>
            </div>

            {e.paneles.length > 0 && (
              <div className="rv-board">
                {e.paneles.map((f) => (
                  <figure key={f.planoId}>
                    <div className="vf">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {f.imagen || f.svg ? <img src={f.imagen || svgSrc(f.svg!)} alt={f.descripcion} loading="lazy" /> : <div className="vf-empty">Dibujo en proceso</div>}
                      <span className="vf-tag">{f.planoId}</span>
                      {f.tipoPlano && <span className="vf-meta"><span>{f.tipoPlano}</span><span>{f.movimiento}</span></span>}
                    </div>
                    <figcaption>{f.descripcion}</figcaption>
                  </figure>
                ))}
              </div>
            )}

            <div className="rv-cols">
              <div>
                <p className="tu-label">Lo que se ve</p>
                <p>{e.video}</p>
                {e.textoPantalla && <p className="rv-onscreen"><b>Texto en pantalla:</b> {e.textoPantalla}</p>}
              </div>
              <div>
                <p className="tu-label">Lo que se escucha</p>
                {e.vozEnOff && <p className="rv-vo">{e.vozEnOff}</p>}
                {e.audio && <p className="rv-music">♪ {e.audio}</p>}
                {!e.vozEnOff && !e.audio && <p className="rv-music">Sin audio indicado.</p>}
              </div>
            </div>

            <ComentarEscena id={id} escena={e.numero} comentarios={comentarios.filter((c) => c.escena === e.numero)} />
          </section>
        ))}

        <div id="aprobar">
          <Aprobacion id={id} comentarios={comentarios.filter((c) => c.escena === null)} />
        </div>
      </main>
      <footer className="tu-foot">Preparado con Toma uno</footer>
    </div>
  );
}
