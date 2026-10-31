"use client";

import { useEffect, useState } from "react";
import { ajustarEquipo, equipoDe, tomasDe } from "@/lib/equipo";
import { completarPaquete, parsePaquete } from "@/lib/prompt";
import { ThemeToggle } from "@/components/share-ui";
import { NuevoProyecto, SalaControl, SelectorCamara, Tablero, cuentaTexto, diasPara, fechaCorta, svgSrc } from "@/components/estudio";
import { download, slug, toMarkdown } from "@/lib/export";
import { Libro, moverFechas } from "@/components/libro";
import type { Brief, Operador, Paquete, Proyecto } from "@/lib/types";

const STORAGE_KEY = "toma-uno:proyectos";
const BORRADOR_KEY = "toma-uno:borrador";
const LECTURAS_KEY = "toma-uno:lecturas-opus"; // lecturas hechas con Opus

type Lectura = { campos: Partial<Brief> & { camaras?: number }; documento?: string; archivo: string };

async function huella(file: File): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, "0")).join("");
}

const base64De = (file: File) =>
  new Promise<string>((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = () => fail(r.error);
    r.readAsDataURL(file);
  });

// Briefs ya leídos, por huella del archivo: volver a subir el mismo no gasta otra lectura.
function leerLecturas(): Record<string, Lectura> {
  try {
    return JSON.parse(localStorage.getItem(LECTURAS_KEY) || "{}");
  } catch {
    return {};
  }
}

function guardarLectura(hash: string, l: Lectura) {
  const todas = Object.entries({ ...leerLecturas(), [hash]: l }).slice(-10);
  try {
    localStorage.setItem(LECTURAS_KEY, JSON.stringify(Object.fromEntries(todas)));
  } catch {}
}

const ETIQUETA = {
  resumen: "Resumen",
  audiovisual: "Guion audiovisual",
  storyboard: "Storyboard",
  tecnico: "Guion técnico",
  rodaje: "Plan de rodaje",
  locaciones: "Locaciones",
  equipo: "Equipo y crew",
  presupuesto: "Presupuesto",
  post: "Post y entregas",
  compartir: "Compartir",
} as const;
type Tab = keyof typeof ETIQUETA;
const ICONOS: Record<Tab, string> = { resumen: "◎", audiovisual: "¶", storyboard: "▦", tecnico: "◫", rodaje: "▤", locaciones: "⌖", equipo: "◉", presupuesto: "$", post: "✓", compartir: "↗" };
const GRUPOS: [string, Tab[]][] = [
  ["Proyecto", ["resumen"]],
  ["Historia", ["audiovisual", "storyboard", "tecnico"]],
  ["Rodaje", ["rodaje", "locaciones", "equipo"]],
  ["Producción", ["presupuesto", "post", "compartir"]],
];

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
    try {
      const b = JSON.parse(localStorage.getItem(BORRADOR_KEY) || "null");
      if (b?.idea !== undefined) setBrief(b);
    } catch {}
    setListo(true);
  }, []);

  // El formulario sobrevive a recargas y a generaciones fallidas.
  useEffect(() => {
    if (!listo) return;
    try {
      localStorage.setItem(BORRADOR_KEY, JSON.stringify(brief));
    } catch {
      try {
        const { pdf: _pdf, ...sinPdf } = brief;
        localStorage.setItem(BORRADOR_KEY, JSON.stringify(sinPdf));
      } catch {}
    }
  }, [brief, listo]);

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
      const hash = await huella(file).catch(() => "");
      const guardada = hash ? leerLecturas()[hash] : undefined;
      let j: Lectura & { pdf?: string };
      if (guardada) {
        j = { ...guardada, pdf: /\.pdf$/i.test(file.name) ? await base64De(file) : undefined };
      } else {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/extract", { method: "POST", body: fd });
        j = await res.json().catch(() => ({ error: `Error ${res.status}` }));
        if (!res.ok) throw new Error((j as { error?: string }).error || `Error ${res.status}`);
        if (hash) guardarLectura(hash, { campos: j.campos, documento: j.documento, archivo: j.archivo });
      }
      // Solo se sobrescriben los campos que el brief trae con contenido.
      const { camaras, ...campos } = j.campos;
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

  // Corre una etapa en streaming; "antes" es lo ya escrito, para que la sala de control siga mostrando todo.
  async function correrEtapa(etapa: 1 | 2, previo?: string, antes = ""): Promise<string> {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief, etapa, previo }),
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
      setTexto(antes + text);
    }
    const errIdx = text.indexOf("[[ERROR]]");
    if (errIdx !== -1) throw new Error(text.slice(errIdx + 9));
    const finIdx = text.lastIndexOf("[[FIN]]");
    if (finIdx === -1) {
      throw new Error(`La ${etapa === 1 ? "primera" : "segunda"} etapa se cortó antes de terminar (el servidor tiene un límite de 5 minutos). Vuelve a intentarlo.`);
    }
    return text.slice(0, finIdx);
  }

  function leerParte(t: string): Partial<Paquete> {
    try {
      return parsePaquete(t) as Partial<Paquete>;
    } catch {
      throw new Error("La respuesta llegó con un formato que no pude leer. Vuelve a generar, casi siempre sale bien al segundo intento.");
    }
  }

  async function generar() {
    setCargando(true);
    setError("");
    setTexto("");
    setInicio(Date.now());
    setAhora(Date.now());
    try {
      // Etapa 1: guion y tomas. Etapa 2: plan, equipo y presupuesto, con la etapa 1 como contexto.
      const t1 = await correrEtapa(1);
      const parte1 = leerParte(t1);
      const previo = JSON.stringify({ resumen: parte1.resumen, guionAudiovisual: parte1.guionAudiovisual, guionTecnico: parte1.guionTecnico });
      const t2 = await correrEtapa(2, previo, t1);
      const parte2 = leerParte(t2);
      let paquete: Paquete;
      try {
        paquete = completarPaquete({ ...parte1, ...parte2 });
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
      try {
        localStorage.removeItem(BORRADOR_KEY);
      } catch {}
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
        <button type="button" className="brand" onClick={() => { if (vista === "tablero") window.location.href = "/"; else { setProyecto(null); setCreando(false); } }} disabled={cargando} aria-label={vista === "tablero" ? "Ir al inicio" : "Ir a mis proyectos"} title={vista === "tablero" ? "Ir al inicio" : "Mis proyectos"}>
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
          pasoInicial={error ? 2 : 0}
        />
      )}

      {vista === "generando" && <SalaControl texto={texto} segundos={Math.max(0, Math.round((ahora - inicio) / 1000))} brief={brief} />}

      {vista === "proyecto" && proyecto && (
        <section className="result">
          <ProyectoHead proyecto={proyecto} onVolver={() => setProyecto(null)} onChange={actualizar} />
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

function ProyectoHead({ proyecto, onVolver, onChange }: { proyecto: Proyecto; onVolver: () => void; onChange: (p: Proyecto) => void }) {
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
        <div className="st-phead-when">
          <span className="kicker">{b.fechaRodaje ? `Rodaje ${fechaCorta(b.fechaRodaje)} · ${cuentaTexto(n, p.planRodaje.length || b.diasRodaje)}` : "Preproducción · sin fecha"}</span>
          <label className="lb-field no-print">
            <span>Primer día de rodaje</span>
            <input
              type="date"
              value={b.fechaRodaje ?? ""}
              onChange={(e) => onChange({ ...proyecto, brief: { ...b, fechaRodaje: e.target.value }, paquete: moverFechas(p, b.fechaRodaje, e.target.value) })}
            />
          </label>
        </div>
        <h2>{p.resumen.titulo}</h2>
        <p>{p.resumen.logline}</p>
        <div className="st-phead-chips">
          <span className="chip" title={p.resumen.duracion || b.duracion}>{p.resumen.duracion || b.duracion}</span>
          <span className="chip" title={p.resumen.formato || b.formato}>{p.resumen.formato || b.formato}</span>
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
  const [edit, setEdit] = useState(false);
  const cuenta: Partial<Record<Tab, number>> = { audiovisual: p.guionAudiovisual.length, tecnico: p.guionTecnico.length, storyboard: p.storyboard.length, rodaje: p.planRodaje.length, locaciones: p.locaciones.length };

  return (
    <>
      {demo && <p className="banner no-print">Modo demo: agrega ANTHROPIC_API_KEY en .env.local para generar con IA.</p>}
      <div className={`lb-layout${edit ? " editing" : ""}`}>
        <aside className="lb-rail no-print">
          <nav>
            {GRUPOS.map(([grupo, tabs]) => (
              <div key={grupo} className="lb-rail-group">
                <span className="lb-rail-title">{grupo}</span>
                {tabs.map((k) => (
                  <button key={k} type="button" className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
                    <span className="lb-ico" aria-hidden>{ICONOS[k]}</span>
                    {ETIQUETA[k]}
                    {cuenta[k] !== undefined && <small>{cuenta[k]}</small>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="lb-rail-tools">
            <button type="button" className={edit ? "lb-edit on" : "lb-edit"} onClick={() => setEdit(!edit)} aria-pressed={edit}>
              {edit ? "✓ Listo" : "✎ Editar textos"}
            </button>
            <div className="lb-export">
              <span className="lb-rail-title">Exportar</span>
              <button onClick={() => window.print()}>PDF</button>
              <button onClick={() => download(`${nombre}.md`, toMarkdown(proyecto), "text/markdown")}>Markdown</button>
              <button onClick={() => download(`${nombre}.json`, JSON.stringify(proyecto, null, 2), "application/json")}>JSON</button>
            </div>
          </div>
        </aside>
        <div className="lb-main">
          {edit && <p className="lb-editbar no-print">Modo edición: toca cualquier texto del guion, las tomas o el plan para corregirlo. Se guarda solo.</p>}
          <Libro proyecto={proyecto} tab={tab} edit={edit} onChange={onChange} irA={(t) => setTab(t as Tab)} dibujando={dibujando} onRedibujar={onRedibujar} />
          <section className={tab === "compartir" ? "sec lb-sec" : "sec lb-sec hide no-print"}>
            <header className="lb-sec-head">
              <div>
                <span className="lb-kicker">Cliente y equipo</span>
                <h2>Compartir</h2>
              </div>
            </header>
            <div className="links-grid">
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
          </section>
        </div>
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
