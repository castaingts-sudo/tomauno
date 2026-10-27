import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ID_RE, segundos, tc, type Comentario, type RevisionGuardada } from "@/lib/share";
import { listJson, readJson } from "@/lib/store";
import { Aprobacion, ComentarEscena } from "./feedback";
import "./review.css";

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
  let t = 0;
  const tiempos = rev.escenas.map((e) => {
    const d = segundos(e.duracion);
    if (d === null || t === null) return null;
    const r = `${tc(t)} – ${tc(t + d)}`;
    t += d;
    return r;
  });

  const ultimo = [...comentarios].reverse().find((c) => c.tipo !== "comentario");

  return (
    <div className="review">
      <header className="rv-head">
        <p className="rv-kicker">Revisión de guion y storyboard</p>
        <h1>{rev.titulo}</h1>
        {rev.logline && <p className="rv-logline">{rev.logline}</p>}
        <p className="rv-meta">
          {[rev.duracion, rev.formato, `${rev.escenas.length} escenas`].filter(Boolean).join(" · ")}
        </p>
        {ultimo && (
          <p className={`rv-status ${ultimo.tipo}`}>
            {ultimo.tipo === "aprobado" ? "✅ Aprobado" : "✏️ Cambios solicitados"} por {ultimo.nombre} ·{" "}
            {new Date(ultimo.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
          </p>
        )}
        <p className="rv-help">Revisa cada escena: lo que se ve, lo que se escucha y los dibujos de cada toma. Puedes comentar cualquier escena y, al final, aprobar o pedir cambios.</p>
      </header>

      <main className="rv-main">
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.imagen || svgSrc(f.svg)} alt={f.descripcion} loading="lazy" />
                    <figcaption>
                      <span className="rv-shot">
                        Toma {f.planoId}
                        {f.tipoPlano && ` · ${f.tipoPlano}`}
                      </span>
                      {f.descripcion}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            <div className="rv-cols">
              <div>
                <h3>Lo que se ve</h3>
                <p>{e.video}</p>
                {e.textoPantalla && (
                  <p className="rv-onscreen">
                    <b>Texto en pantalla:</b> {e.textoPantalla}
                  </p>
                )}
              </div>
              <div>
                <h3>Lo que se escucha</h3>
                {e.vozEnOff && <blockquote>{e.vozEnOff}</blockquote>}
                {e.audio && <p className="rv-music">♪ {e.audio}</p>}
              </div>
            </div>

            <ComentarEscena id={id} escena={e.numero} comentarios={comentarios.filter((c) => c.escena === e.numero)} />
          </section>
        ))}

        <Aprobacion id={id} comentarios={comentarios.filter((c) => c.escena === null)} />
      </main>
      <footer className="rv-foot">Preparado con Toma uno</footer>
    </div>
  );
}
