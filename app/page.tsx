"use client";

import { useEffect, useState } from "react";
import { ajustarEquipo, equipoDe, tomasDe } from "@/lib/equipo";
import { completarPaquete, parsePaquete } from "@/lib/prompt";
import { ThemeToggle } from "@/components/share-ui";
import { NuevoProyecto, SalaControl, SelectorCamara, Tablero, cuentaTexto, diasPara, fechaCorta, svgSrc } from "@/components/estudio";
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

export default function Home() {
  const [brief, setBrief] = useState<Brief>(EMPTY);
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [historial, setHistorial] = useState<Proyecto[]>([]);
  const [listo, setListo] = useState(false);
  const [creando, setCreando] = useState(false);
  const [tab, setTab] = useState<Tab>("resumen");
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState("");
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
  const [avisoDibujo, setAvisoDibujo] = useState("");

  useEffect(() => {
    setHistorial(loadProyectos());
    setListo(true);
  }, []);

  // Cada vista arriba de la página, como cambiar de pantalla.
  const vista = cargando ? "generando" : proyecto ? "proyecto" : creando ? "nuevo" : "tablero";
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [vista]);

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

  async function generar() {
    setCargando(true);
    setError("");
    setTexto("");
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
        setTexto(text);
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
      setCreando(false);
      setBrief(EMPTY);
      setTab("storyboard");
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
    setAvisoDibujo("");
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
          if (j.aviso) setAvisoDibujo(`El generador de dibujos falló y se usaron bocetos simples: ${j.aviso}`);
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

  function nuevo() {
    setProyecto(null);
    setError("");
    setCreando(true);
  }

  return (
    <main>
      <header className="top no-print">
        <button type="button" className="brand" onClick={() => { setProyecto(null); setCreando(false); }} disabled={cargando} aria-label="Ir a mis proyectos">
          <div className="brand-mark">T1</div>
          <div>
            <h1>
              Toma <span>uno</span>
            </h1>
            <p>Estudio de preproducción</p>
          </div>
        </button>
        <div className="top-right">
          {vista === "proyecto" && (
            <button type="button" className="primary top-new" onClick={nuevo}>＋ Nuevo</button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {vista === "tablero" && listo && <Tablero proyectos={historial} onAbrir={(p) => { setProyecto(p); setTab("resumen"); }} onNuevo={nuevo} onBorrar={borrar} />}

      {vista === "nuevo" && (
        <NuevoProyecto
          brief={brief}
          setBrief={setBrief}
          leyendo={leyendo}
          error={error}
          onSubir={subirBrief}
          onQuitarBrief={quitarBrief}
          onGenerar={generar}
          onCancelar={() => setCreando(false)}
        />
      )}

      {vista === "generando" && <SalaControl texto={texto} segundos={Math.max(0, Math.round((ahora - inicio) / 1000))} brief={brief} />}

      {vista === "proyecto" && proyecto && (
        <section className="result">
          <ProyectoHead proyecto={proyecto} onVolver={() => setProyecto(null)} />
          {dibujando && (
            <div className="card progress st-drawing no-print">
              <div className="progress-head">
                <b>Dibujando el storyboard · {dibujando.hechos} de {dibujando.total} grupos</b>
                <span className="mono">{Math.round(((dibujando.hechos + 0.3) / dibujando.total) * 100)}%</span>
              </div>
              <div className="bar"><div style={{ width: `${Math.round(((dibujando.hechos + 0.3) / dibujando.total) * 100)}%` }} /></div>
              <p className="muted">El guion ya está listo; cada dibujo aparece en cuanto se termina.</p>
            </div>
          )}
          {avisoDibujo && <p className="error no-print">{avisoDibujo}</p>}
          <Resultado proyecto={proyecto} tab={tab} setTab={setTab} demo={demo} onChange={actualizar} dibujando={dibujando} onRedibujar={redibujar} />
        </section>
      )}
    </main>
  );
}

function ProyectoHead({ proyecto, onVolver }: { proyecto: Proyecto; onVolver: () => void }) {
  const p = proyecto.paquete;
  const b = proyecto.brief;
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    setN(diasPara(b.fechaRodaje));
  }, [b.fechaRodaje]);
  const portada = p.storyboard.find((f) => f.imagen || f.svg);
  return (
    <section className="st-phead">
      <div className="st-phead-copy">
        <button type="button" className="st-back no-print" onClick={onVolver}>← Proyectos</button>
        <span className="kicker">{b.fechaRodaje ? `Rodaje ${fechaCorta(b.fechaRodaje)} · ${cuentaTexto(n, b.diasRodaje)}` : "Preproducción"}</span>
        <h2>{p.resumen.titulo}</h2>
        <p>{p.resumen.logline}</p>
        <div className="st-phead-chips">
          <span className="chip">{p.resumen.duracion || b.duracion}</span>
          <span className="chip">{p.resumen.formato || b.formato}</span>
          <span className="chip">{p.guionAudiovisual.length} escenas</span>
          <span className="chip">{p.guionTecnico.length} tomas</span>
          <span className="chip">{p.planRodaje.length} {p.planRodaje.length === 1 ? "día" : "días"}</span>
          {b.incluirDron && <span className="chip accent">✈ Dron</span>}
        </div>
      </div>
      {portada && (
        <div className="vf st-phead-cover no-print">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portada.imagen || svgSrc(portada.svg!)} alt="" />
          <span className="vf-tag">{portada.planoId}</span>
        </div>
      )}
    </section>
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
        <h2>Resumen</h2>
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

// Un link por persona del equipo; mismo registro, cada quien ve solo lo suyo.
function LinksEquipo({ proyecto, onChange }: { proyecto: Proyecto; onChange: (p: Proyecto) => void }) {
  const equipo = equipoDe(proyecto.brief);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");
  const base = proyecto.equipoShare && typeof window !== "undefined" ? `${window.location.origin}/e/${proyecto.equipoShare.id}` : "";
  const editar = (id: string, k: "nombre" | "contacto" | "equipo" | "camara", v: string) =>
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
          <button onClick={() => setAbierto(!abierto)}>{abierto ? "Ocultar" : base ? "Ver links" : "Editar equipo"}</button>
        </div>
      </div>
      {msg && <p className="muted">{msg}</p>}
      {abierto && (
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
                      <div className="crew-gear crew-gear-pair">
                        <SelectorCamara o={o} onChange={(v) => editar(o.id, "camara", v)} />
                        <input placeholder={o.tipo === "dron" ? "Extras (opcional)" : "Lentes (opcional)"} value={o.equipo ?? ""} onChange={(e) => editar(o.id, "equipo", e.target.value)} />
                      </div>
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
