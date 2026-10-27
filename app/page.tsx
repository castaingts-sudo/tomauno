"use client";

import { useEffect, useState } from "react";
import { parsePaquete } from "@/lib/prompt";
import { download, slug, toMarkdown } from "@/lib/export";
import type { Brief, Paquete, Proyecto } from "@/lib/types";

const STORAGE_KEY = "toma-uno:proyectos";

const TABS = [
  ["resumen", "Resumen"],
  ["audiovisual", "Guion audiovisual"],
  ["tecnico", "Guion técnico"],
  ["storyboard", "Storyboard"],
  ["rodaje", "Plan de rodaje"],
  ["equipo", "Equipo y crew"],
  ["locaciones", "Locaciones"],
  ["presupuesto", "Presupuesto"],
  ["post", "Post y checklist"],
] as const;
type Tab = (typeof TABS)[number][0];

const EMPTY: Brief = { idea: "", duracion: "60 s", formato: "16:9 YouTube", estilo: "", presupuesto: "medio", incluirDron: true, notas: "" };

function loadProyectos(): Proyecto[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveProyectos(list: Proyecto[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {}
}

// El SVG se muestra como <img>, así que ningún script dentro de él se ejecuta.
const svgSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export default function Home() {
  const [brief, setBrief] = useState<Brief>(EMPTY);
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [historial, setHistorial] = useState<Proyecto[]>([]);
  const [tab, setTab] = useState<Tab>("resumen");
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);

  useEffect(() => setHistorial(loadProyectos()), []);

  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief((b) => ({ ...b, [k]: v }));

  async function generar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    setProgreso(0);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Error ${res.status}`);
      }
      setDemo(res.headers.get("X-Toma-Uno-Mode") === "demo");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setProgreso(text.length);
      }
      const errIdx = text.indexOf("[[ERROR]]");
      if (errIdx !== -1) throw new Error(text.slice(errIdx + 9));
      const paquete = parsePaquete(text) as Paquete;
      const nuevo: Proyecto = { id: crypto.randomUUID(), creado: new Date().toISOString(), brief, paquete };
      const list = [nuevo, ...historial];
      setHistorial(list);
      saveProyectos(list);
      setProyecto(nuevo);
      setTab("resumen");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCargando(false);
    }
  }

  function borrar(id: string) {
    const list = historial.filter((p) => p.id !== id);
    setHistorial(list);
    saveProyectos(list);
    if (proyecto?.id === id) setProyecto(null);
  }

  return (
    <main>
      <header className="top no-print">
        <h1>
          Toma <span>uno</span>
        </h1>
        <p>Escribe tu idea de video. Obtén guion, guion técnico, storyboard, plan de rodaje, equipo y presupuesto.</p>
      </header>

      <div className="layout">
        <aside className="no-print">
          <form onSubmit={generar} className="card">
            <label>
              Idea del video
              <textarea
                required
                rows={6}
                value={brief.idea}
                onChange={(e) => set("idea", e.target.value)}
                placeholder="Ej.: Video promocional de 60 s para un viñedo en Valle de Guadalupe, mostrando la vendimia al amanecer y una cata al atardecer…"
              />
            </label>
            <div className="row">
              <label>
                Duración
                <input value={brief.duracion} onChange={(e) => set("duracion", e.target.value)} />
              </label>
              <label>
                Presupuesto
                <select value={brief.presupuesto} onChange={(e) => set("presupuesto", e.target.value)}>
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </label>
            </div>
            <label>
              Formato / plataforma
              <input value={brief.formato} onChange={(e) => set("formato", e.target.value)} placeholder="16:9 YouTube, 9:16 Reels…" />
            </label>
            <label>
              Estilo visual
              <input value={brief.estilo} onChange={(e) => set("estilo", e.target.value)} placeholder="Cinematográfico, documental, corporativo…" />
            </label>
            <label className="check">
              <input type="checkbox" checked={brief.incluirDron} onChange={(e) => set("incluirDron", e.target.checked)} />
              Incluir tomas aéreas con dron
            </label>
            <label>
              Notas (cliente, locación, talento…)
              <textarea rows={3} value={brief.notas} onChange={(e) => set("notas", e.target.value)} />
            </label>
            <button disabled={cargando}>{cargando ? `Generando… ${Math.round(progreso / 1000)}k caracteres` : "Generar preproducción"}</button>
            {error && <p className="error">{error}</p>}
          </form>

          {historial.length > 0 && (
            <div className="card">
              <h3>Proyectos guardados</h3>
              <ul className="hist">
                {historial.map((p) => (
                  <li key={p.id} className={p.id === proyecto?.id ? "on" : ""}>
                    <button type="button" className="link" onClick={() => { setProyecto(p); setBrief(p.brief); }}>
                      {p.paquete.resumen.titulo}
                      <small>{new Date(p.creado).toLocaleString()}</small>
                    </button>
                    <button type="button" className="x" onClick={() => borrar(p.id)} aria-label="Borrar">×</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <section className="result">
          {!proyecto && !cargando && <div className="empty card no-print">Tu paquete de preproducción aparecerá aquí.</div>}
          {cargando && !proyecto && <div className="empty card">Escribiendo el guion y dibujando el storyboard…</div>}
          {proyecto && <Resultado proyecto={proyecto} tab={tab} setTab={setTab} demo={demo} />}
        </section>
      </div>
    </main>
  );
}

function Resultado({ proyecto, tab, setTab, demo }: { proyecto: Proyecto; tab: Tab; setTab: (t: Tab) => void; demo: boolean }) {
  const p = proyecto.paquete;
  const nombre = slug(p.resumen.titulo);
  const show = (t: Tab) => (tab === t ? "sec" : "sec hide");

  return (
    <>
      {demo && <p className="banner no-print">Modo demo: agrega ANTHROPIC_API_KEY en .env.local para generar con IA.</p>}
      <div className="toolbar no-print">
        <nav className="tabs">
          {TABS.map(([k, label]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="actions">
          <button onClick={() => window.print()}>PDF / Imprimir</button>
          <button onClick={() => download(`${nombre}.md`, toMarkdown(proyecto), "text/markdown")}>Markdown</button>
          <button onClick={() => download(`${nombre}.json`, JSON.stringify(proyecto, null, 2), "application/json")}>JSON</button>
        </div>
      </div>

      <div className={show("resumen")}>
        <h2>{p.resumen.titulo}</h2>
        <p className="logline">{p.resumen.logline}</p>
        <dl className="grid">
          <dt>Objetivo</dt><dd>{p.resumen.objetivo}</dd>
          <dt>Público</dt><dd>{p.resumen.publico}</dd>
          <dt>Tono</dt><dd>{p.resumen.tono}</dd>
          <dt>Duración</dt><dd>{p.resumen.duracion}</dd>
          <dt>Formato</dt><dd>{p.resumen.formato}</dd>
          <dt>Referencias</dt><dd>{p.resumen.referencias.join(" · ")}</dd>
        </dl>
      </div>

      <div className={show("audiovisual")}>
        <h2>Guion audiovisual</h2>
        <table>
          <thead><tr><th>#</th><th>Escena</th><th>Video</th><th>Audio</th><th>Dur.</th></tr></thead>
          <tbody>
            {p.guionAudiovisual.map((e) => (
              <tr key={e.numero}><td>{e.numero}</td><td className="mono">{e.encabezado}</td><td>{e.video}</td><td>{e.audio}</td><td>{e.duracion}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={show("tecnico")}>
        <h2>Guion técnico</h2>
        <div className="scroll">
          <table>
            <thead><tr><th>Plano</th><th>Tipo</th><th>Ángulo</th><th>Movimiento</th><th>Lente</th><th>Cámara</th><th>Descripción</th><th>Audio</th><th>Dur.</th><th>Notas</th></tr></thead>
            <tbody>
              {p.guionTecnico.map((s) => (
                <tr key={s.id}><td className="mono">{s.id}</td><td>{s.tipoPlano}</td><td>{s.angulo}</td><td>{s.movimiento}</td><td>{s.lente}</td><td>{s.camara}</td><td>{s.descripcion}</td><td>{s.audio}</td><td>{s.duracion}</td><td>{s.notas}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={show("storyboard")}>
        <h2>Storyboard</h2>
        <div className="board">
          {p.storyboard.map((f) => {
            const plano = p.guionTecnico.find((s) => s.id === f.planoId);
            return (
              <figure key={f.planoId}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={svgSrc(f.svg)} alt={f.descripcion} />
                <figcaption>
                  <b>{f.planoId}</b> {plano && <span className="tag">{plano.tipoPlano} · {plano.movimiento}</span>}
                  <p>{f.descripcion}</p>
                  {f.dialogo && <p className="dlg">{f.dialogo}</p>}
                  <small>{f.transicion}</small>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      <div className={show("rodaje")}>
        <h2>Plan de rodaje</h2>
        {p.planRodaje.map((d) => (
          <div key={d.dia}>
            <h3>Día {d.dia} · {d.fecha} · {d.locacion} <small>Llamado {d.llamado}</small></h3>
            <table>
              <thead><tr><th>Hora</th><th>Actividad</th><th>Planos</th><th>Locación</th></tr></thead>
              <tbody>
                {d.items.map((i, n) => (
                  <tr key={n}><td className="mono">{i.hora}</td><td>{i.actividad}</td><td className="mono">{i.planos.join(", ")}</td><td>{i.locacion}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className={show("equipo")}>
        <h2>Equipo</h2>
        <table>
          <thead><tr><th>Categoría</th><th>Item</th><th>Cant.</th><th>Notas</th></tr></thead>
          <tbody>
            {p.equipo.map((e, n) => (
              <tr key={n}><td>{e.categoria}</td><td>{e.item}</td><td>{e.cantidad}</td><td>{e.notas}</td></tr>
            ))}
          </tbody>
        </table>
        <h2>Crew</h2>
        <table>
          <thead><tr><th>Rol</th><th>Responsabilidades</th></tr></thead>
          <tbody>
            {p.crew.map((c, n) => (
              <tr key={n}><td>{c.rol}</td><td>{c.responsabilidades}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={show("locaciones")}>
        <h2>Locaciones y permisos</h2>
        {p.locaciones.map((l, n) => (
          <div key={n} className="card loc">
            <h3>{l.nombre}</h3>
            <p>{l.descripcion}</p>
            <p><b>Permisos:</b> {l.permisos}</p>
            <p><b>Riesgos:</b> {l.riesgos}</p>
          </div>
        ))}
      </div>

      <div className={show("presupuesto")}>
        <h2>Presupuesto estimado ({p.presupuesto.moneda})</h2>
        <table>
          <tbody>
            {p.presupuesto.items.map((i, n) => (
              <tr key={n}><td>{i.concepto}</td><td className="num">{i.estimado}</td></tr>
            ))}
            <tr className="total"><td>Total</td><td className="num">{p.presupuesto.total}</td></tr>
          </tbody>
        </table>
        <p className="muted">{p.presupuesto.notas}</p>
      </div>

      <div className={show("post")}>
        <h2>Postproducción</h2>
        <dl className="grid">
          <dt>Edición</dt><dd>{p.postproduccion.edicion}</dd>
          <dt>Color</dt><dd>{p.postproduccion.color}</dd>
          <dt>Audio</dt><dd>{p.postproduccion.audio}</dd>
          <dt>Gráficos</dt><dd>{p.postproduccion.graficos}</dd>
          <dt>Entregables</dt><dd>{p.postproduccion.entregables.join(" · ")}</dd>
        </dl>
        <h2>Checklist de preproducción</h2>
        <ul className="checklist">
          {p.checklist.map((c, n) => (
            <li key={n}><label><input type="checkbox" /> {c}</label></li>
          ))}
        </ul>
      </div>
    </>
  );
}
