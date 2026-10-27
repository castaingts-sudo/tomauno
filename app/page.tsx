"use client";

import { useEffect, useState } from "react";
import { ajustarEquipo, ejemploEquipo, equipoDe, tomasDe } from "@/lib/equipo";
import { completarPaquete, parsePaquete } from "@/lib/prompt";
import { ThemeToggle } from "@/components/share-ui";
import { download, slug, toMarkdown } from "@/lib/export";
import type { Brief, Operador, Paquete, Proyecto } from "@/lib/types";

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

// Secciones en el orden en que la IA las escribe; sirven para la barra de progreso.
const ETAPAS = [
  ["resumen", "Resumen"],
  ["guionAudiovisual", "Guion y voz en off"],
  ["guionTecnico", "Guion técnico"],
  ["storyboard", "Storyboard"],
  ["planRodaje", "Plan de rodaje"],
  ["equipo", "Equipo y crew"],
  ["locaciones", "Locaciones"],
  ["presupuesto", "Presupuesto"],
  ["postproduccion", "Post y checklist"],
] as const;

function etapaActual(text: string): number {
  let idx = -1;
  ETAPAS.forEach(([k], i) => {
    if (text.includes(`"${k}"`)) idx = i;
  });
  return idx;
}

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
  const [progreso, setProgreso] = useState({ chars: 0, etapa: -1 });
  const [inicio, setInicio] = useState(0);
  const [ahora, setAhora] = useState(0);

  useEffect(() => {
    if (!cargando) return;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [cargando]);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [dibujando, setDibujando] = useState<{ hechos: number; total: number } | null>(null);

  useEffect(() => setHistorial(loadProyectos()), []);

  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief((b) => ({ ...b, [k]: v }));

  async function subirBrief(file: File | undefined) {
    if (!file) return;
    setLeyendo(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error(j.error || `Error ${res.status}`);
      // Solo se sobrescriben los campos que el brief trae con contenido.
      const { camaras, ...campos } = j.campos as Partial<Brief> & { camaras?: number };
      if (!campos.diasRodaje) delete campos.diasRodaje;
      const llenos = Object.fromEntries(Object.entries(campos).filter(([, v]) => v !== "" && v != null));
      setBrief((b) => {
        const nb = { ...b, ...llenos, archivo: j.archivo, documento: j.documento, pdf: j.pdf };
        const actual = equipoDe(b);
        const n = camaras || actual.filter((o) => o.tipo === "camara").length;
        return { ...nb, equipoRodaje: ajustarEquipo(actual, n, nb.incluirDron) };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLeyendo(false);
    }
  }

  const quitarBrief = () => setBrief((b) => ({ ...b, archivo: undefined, documento: undefined, pdf: undefined }));

  async function generar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    setProgreso({ chars: 0, etapa: -1 });
    setInicio(Date.now());
    setAhora(Date.now());
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
        setProgreso({ chars: text.length, etapa: etapaActual(text) });
      }
      const errIdx = text.indexOf("[[ERROR]]");
      if (errIdx !== -1) throw new Error(text.slice(errIdx + 9));
      const finIdx = text.lastIndexOf("[[FIN]]");
      if (finIdx === -1) {
        throw new Error("La generación se cortó antes de terminar (el servidor tiene un límite de 5 minutos). Vuelve a intentarlo; si se repite, baja la duración o el detalle del video.");
      }
      let paquete: Paquete;
      try {
        paquete = completarPaquete(parsePaquete(text.slice(0, finIdx)) as Partial<Paquete>);
      } catch {
        throw new Error("La respuesta llegó con un formato que no pude leer. Vuelve a generar, casi siempre sale bien al segundo intento.");
      }
      const { pdf: _pdf, ...briefGuardado } = brief; // el PDF no cabe en el historial del navegador
      const nuevo: Proyecto = { id: crypto.randomUUID(), creado: new Date().toISOString(), brief: briefGuardado, paquete };
      const list = [nuevo, ...historial];
      setHistorial(list);
      saveProyectos(list);
      setProyecto(nuevo);
      setTab("resumen");
      dibujarStoryboard(nuevo);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCargando(false);
    }
  }

  // Los bocetos se piden aparte, en lotes paralelos, para no rebasar el límite de tiempo de Vercel.
  async function dibujarStoryboard(p: Proyecto) {
    const pendientes = p.paquete.guionTecnico.filter((s) => {
      const f = p.paquete.storyboard.find((x) => x.planoId === s.id);
      return !f?.svg && !f?.imagen;
    });
    const contexto = { titulo: p.paquete.resumen.titulo, escenas: p.paquete.guionAudiovisual.map((e) => ({ numero: e.numero, encabezado: e.encabezado })) };
    if (!pendientes.length) return;
    const lotes: (typeof pendientes)[] = [];
    for (let i = 0; i < pendientes.length; i += 4) lotes.push(pendientes.slice(i, i + 4));
    let hechos = 0;
    setDibujando({ hechos, total: lotes.length });
    const dibujos: Record<string, { svg?: string; imagen?: string }> = {};
    await Promise.all(
      lotes.map(async (planos) => {
        try {
          const res = await fetch("/api/storyboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planos, estilo: p.brief.estilo, contexto }),
          });
          const j = await res.json();
          for (const panel of j.paneles ?? []) dibujos[panel.planoId] = { svg: panel.svg, imagen: panel.imagen };
        } catch {}
        hechos++;
        setDibujando({ hechos, total: lotes.length });
        // Muestra cada lote en cuanto llega.
        const storyboard = p.paquete.storyboard.map((f) => (dibujos[f.planoId] ? { ...f, ...dibujos[f.planoId] } : f));
        const actualizado = { ...p, paquete: { ...p.paquete, storyboard } };
        setProyecto((cur) => (cur?.id === p.id ? actualizado : cur));
        setHistorial((list) => {
          const nueva = list.map((x) => (x.id === p.id ? actualizado : x));
          saveProyectos(nueva);
          return nueva;
        });
      }),
    );
    setDibujando(null);
  }

  // Borra los dibujos y los vuelve a pedir (p. ej. al activar el generador de imágenes).
  function redibujar(p: Proyecto) {
    const limpio = { ...p, paquete: { ...p.paquete, storyboard: p.paquete.storyboard.map(({ svg: _s, imagen: _i, ...f }) => f) } };
    actualizar(limpio);
    dibujarStoryboard(limpio);
  }

  function actualizar(p: Proyecto) {
    const list = historial.map((x) => (x.id === p.id ? p : x));
    setHistorial(list);
    saveProyectos(list);
    setProyecto(p);
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
        <div className="brand">
          <div className="brand-mark">T1</div>
          <div>
            <h1>
              Toma <span>uno</span>
            </h1>
            <p>Estudio de preproducción</p>
          </div>
        </div>
        <div className="top-right">
          {proyecto && <span className="chip accent">{proyecto.paquete.resumen.titulo}</span>}
          <ThemeToggle />
        </div>
      </header>
      {!proyecto && !cargando && (
        <div className="hero-line no-print">
          <span className="kicker">De la idea al set</span>
          <h2>
            Sube el brief. Sal con <em>guion, storyboard y hojas de llamado</em> para todo tu equipo.
          </h2>
          <p>Guion audiovisual con voz en off, guion técnico por cámara, plan de rodaje, permisos de dron, presupuesto y links listos para el cliente, el director y cada operador.</p>
        </div>
      )}

      <div className="layout">
        <aside className="no-print">
          <form onSubmit={generar} className="card">
            <p className="card-title">Nuevo proyecto</p>
            {brief.archivo ? (
              <div className="file-chip">
                <span>📄 {brief.archivo}</span>
                <button type="button" className="x" onClick={quitarBrief} aria-label="Quitar brief">×</button>
              </div>
            ) : (
              <label className={`drop${leyendo ? " busy" : ""}`}>
                <input
                  type="file"
                  accept=".docx,.pdf,.txt,.md"
                  disabled={leyendo}
                  onChange={(e) => { subirBrief(e.target.files?.[0]); e.target.value = ""; }}
                />
                {leyendo ? "Leyendo el brief y llenando el formulario…" : <>📎 <b>Subir brief</b> (Word, PDF, TXT) para llenar todo en automático</>}
              </label>
            )}
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
            <div className="row">
              <label>
                Fecha de rodaje
                <input type="date" value={brief.fechaRodaje ?? ""} onChange={(e) => set("fechaRodaje", e.target.value)} />
              </label>
              <label>
                Días
                <input type="number" min={1} max={30} value={brief.diasRodaje ?? 1} onChange={(e) => set("diasRodaje", Math.max(1, +e.target.value || 1))} />
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
              <input
                type="checkbox"
                checked={brief.incluirDron}
                onChange={(e) => {
                  const dron = e.target.checked;
                  const actual = equipoDe(brief);
                  setBrief((b) => ({ ...b, incluirDron: dron, equipoRodaje: ajustarEquipo(actual, actual.filter((o) => o.tipo === "camara").length, dron) }));
                }}
              />
              Incluir tomas aéreas con dron
            </label>
            <EquipoForm equipo={equipoDe(brief)} dron={brief.incluirDron} onChange={(eq) => set("equipoRodaje", eq)} />
            <label>
              Notas (cliente, locación, talento…)
              <textarea rows={3} value={brief.notas} onChange={(e) => set("notas", e.target.value)} />
            </label>
            <button disabled={cargando || leyendo}>{cargando ? "Generando…" : "Generar preproducción"}</button>
            {error && <p className="error">{error}</p>}
          </form>

          {historial.length > 0 && (
            <div className="card">
              <p className="card-title">Proyectos guardados</p>
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
          {!proyecto && !cargando && (
            <div className="empty card no-print">
              <h3>Tu paquete aparecerá aquí</h3>
              <p>Llena el brief a la izquierda o sube el documento del cliente. En 2 a 4 minutos tienes todo esto:</p>
              <div className="empty-grid">
                {[
                  ["01", "Guion audiovisual", "Escenas, voz en off exacta y textos en pantalla"],
                  ["02", "Guion técnico", "Plano, lente y movimiento por cámara"],
                  ["03", "Storyboard", "Un dibujo por toma"],
                  ["04", "Plan de rodaje", "Horarios por luz y locación"],
                  ["05", "Dron", "Alturas, maniobras y espacio aéreo"],
                  ["06", "Links", "Cliente, director y cada operador"],
                ].map(([n, t, d]) => (
                  <div key={n}>
                    <span>{n}</span>
                    <b>{t}</b>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          )}
          {cargando && <Progreso etapa={progreso.etapa} chars={progreso.chars} segundos={Math.max(0, Math.round((ahora - inicio) / 1000))} />}
          {dibujando && (
            <div className="card progress no-print">
              <div className="progress-head">
                <b>Dibujando el storyboard… {dibujando.hechos} de {dibujando.total} grupos</b>
              </div>
              <div className="bar"><div style={{ width: `${Math.round(((dibujando.hechos + 0.3) / dibujando.total) * 100)}%` }} /></div>
              <p className="muted">El guion ya está listo; puedes revisarlo mientras tanto.</p>
            </div>
          )}
          {proyecto && !cargando && <Resultado proyecto={proyecto} tab={tab} setTab={setTab} demo={demo} onChange={actualizar} dibujando={dibujando} onRedibujar={redibujar} />}
        </section>
      </div>
    </main>
  );
}

function Progreso({ etapa, chars, segundos }: { etapa: number; chars: number; segundos: number }) {
  // Mientras piensa (sin texto aún) la barra avanza despacio hasta 8 %; luego, por secciones.
  const pct = etapa < 0 ? Math.min(8, 2 + segundos / 10) : Math.round(8 + ((etapa + 0.5) / ETAPAS.length) * 92);
  const tiempo = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
  return (
    <div className="card progress">
      <div className="progress-head">
        <b>{etapa < 0 ? "Analizando el brief y planeando el video…" : `Escribiendo: ${ETAPAS[etapa][1]}`}</b>
        <span className="mono">{tiempo}</span>
      </div>
      <div className="bar"><div style={{ width: `${pct}%` }} /></div>
      <ol className="steps">
        {ETAPAS.map(([k, label], i) => (
          <li key={k} className={i < etapa ? "done" : i === etapa ? "now" : ""}>
            {i < etapa ? "✓" : i === etapa ? "●" : "○"} {label}
          </li>
        ))}
      </ol>
      <p className="muted">{chars > 0 ? `${Math.round(chars / 1000)}k caracteres escritos · ` : ""}Suele tardar de 1 a 4 minutos. No cierres esta pestaña.</p>
    </div>
  );
}

function Resultado({ proyecto, tab, setTab, demo, onChange, dibujando, onRedibujar }: { proyecto: Proyecto; tab: Tab; setTab: (t: Tab) => void; demo: boolean; onChange: (p: Proyecto) => void; dibujando: { hechos: number; total: number } | null; onRedibujar: (p: Proyecto) => void }) {
  const p = proyecto.paquete;
  const [compartiendo, setCompartiendo] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const shareUrl = proyecto.share && typeof window !== "undefined" ? `${window.location.origin}/r/${proyecto.share.id}` : "";

  async function compartir() {
    setCompartiendo(true);
    setShareMsg("");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paquete: p, id: proyecto.share?.id, ownerToken: proyecto.share?.ownerToken, fechaRodaje: proyecto.brief.fechaRodaje }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `Error ${res.status}`);
      onChange({ ...proyecto, share: { id: j.id, ownerToken: j.ownerToken } });
      const url = `${window.location.origin}${j.url}`;
      await navigator.clipboard?.writeText(url).catch(() => {});
      setShareMsg(proyecto.share ? "Link actualizado y copiado." : "Link creado y copiado.");
    } catch (err) {
      setShareMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setCompartiendo(false);
    }
  }
  const nombre = slug(p.resumen.titulo);
  const show = (t: Tab) => (tab === t ? "sec" : "sec hide");

  return (
    <>
      {demo && <p className="banner no-print">Modo demo: agrega ANTHROPIC_API_KEY en .env.local para generar con IA.</p>}
      <div className="links-grid no-print">
      <div className="share card">
        <div className="share-main">
          <div className="share-icon">🎬</div>
          <div>
          <b>Link para el cliente</b>
          <p>Solo muestra el guion audiovisual y el storyboard, con opción de comentar y aprobar.</p>
          {shareUrl && (
            <p className="share-url">
              <a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a>
            </p>
          )}
          {shareMsg && <p className="muted">{shareMsg}</p>}
          </div>
        </div>
        <div className="share-actions">
          <button className="primary" onClick={compartir} disabled={compartiendo}>
            {compartiendo ? "Guardando…" : proyecto.share ? "Actualizar link" : "🔗 Compartir con cliente"}
          </button>
          {shareUrl && <button onClick={() => navigator.clipboard?.writeText(shareUrl)}>Copiar</button>}
          {shareUrl && <a className="btn" href={shareUrl} target="_blank" rel="noreferrer">Ver comentarios</a>}
        </div>
      </div>
      <LinksEquipo proyecto={proyecto} onChange={onChange} />
      </div>
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
          <thead><tr><th>#</th><th>Escena</th><th>Video</th><th>Voz en off</th><th>Música / SFX</th><th>Texto en pantalla</th><th>Dur.</th></tr></thead>
          <tbody>
            {p.guionAudiovisual.map((e) => (
              <tr key={e.numero}><td>{e.numero}</td><td className="mono">{e.encabezado}</td><td>{e.video}</td><td className="vo">{e.vozEnOff}</td><td>{e.audio}</td><td>{e.textoPantalla}</td><td>{e.duracion}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={show("tecnico")}>
        <h2>Guion técnico</h2>
        <div className="scroll">
          <table>
            <thead><tr><th>Plano</th><th>Tipo</th><th>Ángulo</th><th>Movimiento</th><th>Lente</th><th>Operador</th><th>Descripción</th><th>Voz en off</th><th>Audio</th><th>Dur.</th><th>Notas</th></tr></thead>
            <tbody>
              {p.guionTecnico.map((s) => (
                <tr key={s.id}><td className="mono">{s.id}</td><td>{s.tipoPlano}</td><td>{s.angulo}</td><td>{s.movimiento}</td><td>{s.lente}</td><td>{s.operador || s.camara}</td><td>{s.descripcion}</td><td className="vo">{s.vozEnOff}</td><td>{s.audio}</td><td>{s.duracion}</td><td>{s.notas}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={show("storyboard")}>
        <div className="sec-head">
          <h2>Storyboard</h2>
          <button className="no-print" disabled={!!dibujando} onClick={() => onRedibujar(proyecto)}>↻ Volver a dibujar</button>
        </div>
        <div className="board">
          {p.storyboard.map((f) => {
            const plano = p.guionTecnico.find((s) => s.id === f.planoId);
            return (
              <figure key={f.planoId}>
                <div className="vf">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {f.imagen || f.svg ? <img src={f.imagen || svgSrc(f.svg!)} alt={f.descripcion} /> : <div className={`vf-empty${dibujando ? " busy" : ""}`}>{dibujando ? "Dibujando…" : "Sin boceto"}</div>}
                  <span className="vf-tag">{f.planoId}</span>
                  {plano && (
                    <span className="vf-meta">
                      <span>{plano.tipoPlano}</span>
                      <span>{plano.lente}</span>
                    </span>
                  )}
                </div>
                <figcaption>
                  <b>{f.planoId}</b> {plano && <span className="tag">{plano.tipoPlano} · {plano.movimiento}</span>}
                  <p>{f.descripcion}</p>
                  {(f.dialogo || plano?.vozEnOff) && <p className="dlg">{f.dialogo || plano?.vozEnOff}</p>}
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
            <div className="day-head">
              <span className="chip accent">Día {d.dia}</span>
              <h3>{d.fecha} · {d.locacion}</h3>
              <span className="chip">Llamado {d.llamado}</span>
            </div>
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

// Quién filma: define cuántas cámaras hay y a quién le llega cada hoja de llamado.
function EquipoForm({ equipo, dron, onChange }: { equipo: Operador[]; dron: boolean; onChange: (eq: Operador[]) => void }) {
  const camaras = equipo.filter((o) => o.tipo === "camara").length;
  const editar = (id: string, k: "nombre" | "contacto" | "equipo", v: string) => onChange(equipo.map((o) => (o.id === id ? { ...o, [k]: v } : o)));
  return (
    <fieldset className="crew-form">
      <legend>Equipo de rodaje</legend>
      <div className="crew-count">
        Cámaras
        <button type="button" onClick={() => onChange(ajustarEquipo(equipo, camaras - 1, dron))} disabled={camaras <= 1} aria-label="Quitar cámara">−</button>
        <b>{camaras}</b>
        <button type="button" onClick={() => onChange(ajustarEquipo(equipo, camaras + 1, dron))} disabled={camaras >= 6} aria-label="Agregar cámara">+</button>
        {dron && <span className="muted">+ piloto de dron</span>}
      </div>
      {equipo.map((o) => (
        <div key={o.id} className="crew-row">
          <span>{o.rol}</span>
          <input placeholder="Nombre" value={o.nombre} onChange={(e) => editar(o.id, "nombre", e.target.value)} />
          <input placeholder="Teléfono" inputMode="tel" value={o.contacto} onChange={(e) => editar(o.id, "contacto", e.target.value)} />
          {o.tipo !== "director" && (
            <textarea className="crew-gear" rows={2} placeholder={ejemploEquipo(o)} value={o.equipo ?? ""} onChange={(e) => editar(o.id, "equipo", e.target.value)} />
          )}
        </div>
      ))}
      <p className="muted crew-hint">Con la cámara y lentes de cada quien, la IA arma tomas, storyboard y plan con ese equipo.</p>
    </fieldset>
  );
}

// Un link por persona del equipo; mismo registro, cada quien ve solo lo suyo.
function LinksEquipo({ proyecto, onChange }: { proyecto: Proyecto; onChange: (p: Proyecto) => void }) {
  const equipo = equipoDe(proyecto.brief);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");
  const base = proyecto.equipoShare && typeof window !== "undefined" ? `${window.location.origin}/e/${proyecto.equipoShare.id}` : "";
  const editar = (id: string, k: "nombre" | "contacto" | "equipo", v: string) =>
    onChange({ ...proyecto, brief: { ...proyecto.brief, equipoRodaje: equipo.map((o) => (o.id === id ? { ...o, [k]: v } : o)) } });

  async function guardar() {
    setGuardando(true);
    setMsg("");
    try {
      const res = await fetch("/api/equipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paquete: proyecto.paquete, equipo, id: proyecto.equipoShare?.id, ownerToken: proyecto.equipoShare?.ownerToken, fechaRodaje: proyecto.brief.fechaRodaje }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `Error ${res.status}`);
      onChange({ ...proyecto, equipoShare: { id: j.id, ownerToken: j.ownerToken } });
      setAbierto(true);
      setMsg(proyecto.equipoShare ? "Links actualizados: cada quien verá los cambios con el mismo link." : "Links listos.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setGuardando(false);
    }
  }

  const texto = (o: Operador, url: string) =>
    `Hola${o.nombre ? ` ${o.nombre.split(" ")[0]}` : ""}, esta es tu hoja de llamado (${o.rol}) para "${proyecto.paquete.resumen.titulo}": ${url}`;
  const wa = (o: Operador, url: string) => {
    const tel = o.contacto.replace(/\D/g, "");
    return `https://wa.me/${tel.length >= 8 ? tel : ""}?text=${encodeURIComponent(texto(o, url))}`;
  };

  return (
    <div className="share card crew-links">
      <div className="crew-links-head">
        <div className="share-main">
          <div className="share-icon">🎥</div>
          <div>
            <b>Links del equipo</b>
            <p>Hoja de llamado por persona. El director ve todo (sin presupuesto); cada cámara y el piloto, solo sus tomas, horario y equipo.</p>
          </div>
        </div>
        <div className="share-actions">
          <button className="primary" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : proyecto.equipoShare ? "Actualizar links" : "👥 Crear links del equipo"}
          </button>
          {base && <button onClick={() => setAbierto(!abierto)}>{abierto ? "Ocultar" : "Ver links"}</button>}
        </div>
      </div>
      {msg && <p className="muted">{msg}</p>}
      {(abierto || !base) && (
        <ul className="crew-list">
          {equipo.map((o) => {
            const url = base ? `${base}/${o.id}` : "";
            const n = tomasDe(o, proyecto.paquete.guionTecnico, equipo).length;
            return (
              <li key={o.id}>
                <div className="crew-who">
                  <b>{o.rol}</b> <small>{o.tipo === "director" ? "todo el proyecto" : `${n} ${n === 1 ? "toma" : "tomas"}`}</small>
                  <div className="crew-row">
                    <input placeholder="Nombre" value={o.nombre} onChange={(e) => editar(o.id, "nombre", e.target.value)} />
                    <input placeholder="Teléfono" inputMode="tel" value={o.contacto} onChange={(e) => editar(o.id, "contacto", e.target.value)} />
                    {o.tipo !== "director" && (
                      <input className="crew-gear" placeholder={ejemploEquipo(o)} value={o.equipo ?? ""} onChange={(e) => editar(o.id, "equipo", e.target.value)} />
                    )}
                  </div>
                </div>
                {url && (
                  <div className="share-actions">
                    <a className="btn" href={url} target="_blank" rel="noreferrer">Abrir</a>
                    <button onClick={() => navigator.clipboard?.writeText(url)}>Copiar</button>
                    <a className="btn" href={wa(o, url)} target="_blank" rel="noreferrer">WhatsApp</a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
