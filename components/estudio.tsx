"use client";

import { useEffect, useState } from "react";
import { CAMARAS, DRONES, fichaCamara, gearDe } from "@/lib/camaras";
import { ajustarEquipo, equipoDe } from "@/lib/equipo";
import { leerVivo } from "@/lib/vivo";
import type { Brief, Operador, Proyecto } from "@/lib/types";

// El SVG se muestra como <img>, así que ningún script dentro de él se ejecuta.
export const svgSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const iniciales = (n: string) =>
  n.trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "·";

// Corta en la última palabra completa.
const recorta = (t: string, n: number) => (t.length <= n ? t : `${t.slice(0, n).replace(/\s+\S*$/, "")}…`);

// Días al rodaje respecto a hoy (null si no hay fecha).
export function diasPara(fecha?: string): number | null {
  if (!fecha) return null;
  const f = new Date(`${fecha}T00:00:00`);
  if (isNaN(+f)) return null;
  const h = new Date();
  return Math.round((+f - +new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000);
}

export const fechaCorta = (fecha?: string) =>
  fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }) : "";

export function cuentaTexto(n: number | null, dias = 1): string {
  if (n === null) return "Sin fecha";
  if (n > 1) return `En ${n} días`;
  if (n === 1) return "Mañana";
  if (n <= 0 && n > -dias) return "Hoy se rueda";
  return "Rodado";
}

// ───────────────────────── Tablero ─────────────────────────

type Estado = { total: number; estado: "aprobado" | "cambios" | null };

function useEstados(proyectos: Proyecto[]) {
  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const ids = proyectos.map((p) => p.share?.id).filter(Boolean).join(",");
  useEffect(() => {
    if (!ids) return;
    let vivo = true;
    for (const id of ids.split(",")) {
      fetch(`/api/share/${id}/comentarios`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => vivo && j && setEstados((e) => ({ ...e, [id]: j })))
        .catch(() => {});
    }
    return () => {
      vivo = false;
    };
  }, [ids]);
  return estados;
}

function estadoDe(p: Proyecto, e?: Estado): { txt: string; cls: string } {
  if (e?.estado === "aprobado") return { txt: "Aprobado", cls: "ok" };
  if (e?.estado === "cambios") return { txt: "Pidió cambios", cls: "chg" };
  if (p.share) return { txt: e?.total ? `Con el cliente · ${e.total}` : "Con el cliente", cls: "info" };
  return { txt: "Borrador", cls: "" };
}

export function Tablero({ proyectos, onAbrir, onNuevo, onBorrar }: { proyectos: Proyecto[]; onAbrir: (p: Proyecto) => void; onNuevo: () => void; onBorrar: (id: string) => void }) {
  const estados = useEstados(proyectos);
  const [hoy, setHoy] = useState(false);
  // Fechas relativas solo en el cliente.
  useEffect(() => {
    setHoy(true);
  }, []);

  const proximos = hoy
    ? proyectos
        .map((p) => ({ p, n: diasPara(p.brief.fechaRodaje) }))
        .filter((x): x is { p: Proyecto; n: number } => x.n !== null && x.n > -(x.p.brief.diasRodaje ?? 1))
        .sort((a, b) => a.n - b.n)
    : [];
  const siguiente = proximos[0];
  const tomas = proyectos.reduce((s, p) => s + p.paquete.guionTecnico.length, 0);
  const aprobados = proyectos.filter((p) => p.share && estados[p.share.id]?.estado === "aprobado").length;

  if (!proyectos.length) return <Bienvenida onNuevo={onNuevo} />;

  return (
    <div className="st-board">
      <section className="st-head">
        <div>
          <span className="kicker">Sala de producción</span>
          <h2>Tus proyectos</h2>
        </div>
        <button className="primary st-cta" onClick={onNuevo}>
          <span>＋</span> Nuevo proyecto
        </button>
      </section>

      <div className="st-stats">
        <Stat n={proyectos.length} l="proyectos" />
        <Stat n={proximos.length} l="rodajes próximos" />
        <Stat n={tomas} l="tomas planeadas" />
        <Stat n={aprobados} l="aprobados por cliente" />
      </div>

      {siguiente && <ProximoRodaje p={siguiente.p} n={siguiente.n} onAbrir={onAbrir} />}

      <div className="st-grid">
        <button className="st-new" onClick={onNuevo}>
          <span className="st-new-plus">＋</span>
          <b>Nuevo proyecto</b>
          <small>Sube el brief o escribe la idea</small>
        </button>
        {proyectos.map((p) => (
          <TarjetaProyecto key={p.id} p={p} estado={estadoDe(p, p.share ? estados[p.share.id] : undefined)} hoy={hoy} onAbrir={() => onAbrir(p)} onBorrar={() => onBorrar(p.id)} />
        ))}
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="st-stat">
      <b>{n}</b>
      <span>{l}</span>
    </div>
  );
}

function Cuadro({ p, i = 0 }: { p: Proyecto; i?: number }) {
  const f = p.paquete.storyboard.filter((x) => x.imagen || x.svg)[i];
  if (!f) return <div className="vf-empty">{i === 0 ? "Sin storyboard" : ""}</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={f.imagen || svgSrc(f.svg!)} alt="" loading="lazy" />;
}

function Avatares({ equipo }: { equipo: Operador[] }) {
  return (
    <div className="st-avatars">
      {equipo.map((o) => (
        <span key={o.id} title={`${o.rol}${o.nombre ? ` · ${o.nombre}` : ""}`} className={o.tipo}>
          {o.nombre ? iniciales(o.nombre) : o.tipo === "dron" ? "✈" : o.tipo === "director" ? "D" : o.rol.slice(-1)}
        </span>
      ))}
    </div>
  );
}

function ProximoRodaje({ p, n, onAbrir }: { p: Proyecto; n: number; onAbrir: (p: Proyecto) => void }) {
  const dia = p.paquete.planRodaje[0];
  return (
    <button className="st-next" onClick={() => onAbrir(p)}>
      <div className="st-next-count">
        <b>{n > 0 ? n : "HOY"}</b>
        <span>{n > 1 ? "días para rodar" : n === 1 ? "día · es mañana" : "día de rodaje"}</span>
      </div>
      <div className="st-next-body">
        <span className="kicker">Próximo rodaje</span>
        <h3>{p.paquete.resumen.titulo}</h3>
        <p>
          {fechaCorta(p.brief.fechaRodaje)}
          {dia?.llamado ? ` · Llamado ${dia.llamado}` : ""}
          {dia?.locacion ? ` · ${dia.locacion}` : ""}
        </p>
        <Avatares equipo={equipoDe(p.brief)} />
      </div>
      <div className="st-next-strip">
        {[0, 1, 2].map((i) => (
          <div key={i} className="vf">
            <Cuadro p={p} i={i} />
          </div>
        ))}
      </div>
    </button>
  );
}

function TarjetaProyecto({ p, estado, hoy, onAbrir, onBorrar }: { p: Proyecto; estado: { txt: string; cls: string }; hoy: boolean; onAbrir: () => void; onBorrar: () => void }) {
  const [confirmar, setConfirmar] = useState(false);
  const r = p.paquete.resumen;
  const n = hoy ? diasPara(p.brief.fechaRodaje) : null;
  return (
    <article className="st-card">
      <button className="st-card-open" onClick={onAbrir} aria-label={`Abrir ${r.titulo}`}>
        <div className="vf">
          <Cuadro p={p} />
          <span className={`st-pill ${estado.cls}`}>{estado.txt}</span>
          <span className="vf-meta">
            <span>{p.paquete.guionTecnico.length} tomas</span>
            <span>{r.duracion || p.brief.duracion}</span>
          </span>
        </div>
        <div className="st-card-body">
          <h3>{r.titulo}</h3>
          <p>{r.logline}</p>
          <div className="st-card-foot">
            <span className={`chip${n !== null && n >= 0 && n <= 7 ? " accent" : ""}`}>
              {p.brief.fechaRodaje ? `${fechaCorta(p.brief.fechaRodaje)} · ${cuentaTexto(n, p.brief.diasRodaje)}` : "Sin fecha"}
            </span>
            <Avatares equipo={equipoDe(p.brief)} />
          </div>
        </div>
      </button>
      <div className="st-card-menu">
        {confirmar ? (
          <>
            <button onClick={onBorrar} className="danger">Borrar</button>
            <button onClick={() => setConfirmar(false)}>No</button>
          </>
        ) : (
          <button onClick={() => setConfirmar(true)} aria-label="Borrar proyecto" title="Borrar proyecto">×</button>
        )}
      </div>
    </article>
  );
}

function Bienvenida({ onNuevo }: { onNuevo: () => void }) {
  return (
    <section className="st-hello">
      <div className="st-hello-copy">
        <span className="kicker">De la idea al set</span>
        <h2>
          Sube el brief. Sal con <em>guion, storyboard y hojas de llamado</em> para todo tu equipo.
        </h2>
        <p>Guion audiovisual con voz en off, guion técnico por cámara, plan de rodaje con luz real, permisos de dron, presupuesto y un link para el cliente, el director y cada operador.</p>
        <button className="primary st-cta" onClick={onNuevo}>
          <span>＋</span> Crear mi primer proyecto
        </button>
      </div>
      <div className="st-hello-reel" aria-hidden>
        {[
          ["01", "Guion audiovisual", "Escenas y voz en off exacta"],
          ["02", "Guion técnico", "Plano, lente y movimiento por cámara"],
          ["03", "Storyboard", "Un dibujo a lápiz por toma"],
          ["04", "Plan de rodaje", "Horarios por luz y locación"],
          ["05", "Dron", "Alturas, maniobras y espacio aéreo"],
          ["06", "Links", "Cliente, director y cada operador"],
        ].map(([n, t, d]) => (
          <div key={n} className="st-reel-frame">
            <span className="mono">{n}</span>
            <b>{t}</b>
            <small>{d}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

// ───────────────────────── Proyecto nuevo ─────────────────────────

const PASOS = ["Brief", "Equipo", "Rodaje"] as const;
const DURACIONES = ["15 s", "30 s", "60 s", "90 s", "2 min", "3 min"];
const FORMATOS = ["16:9 YouTube", "9:16 Reels / TikTok", "1:1 Feed", "16:9 TV / cine"];
const ESTILOS = ["Cinematográfico", "Documental", "Publicitario", "Corporativo", "Aéreo / paisaje", "Testimonial"];

export function NuevoProyecto({
  brief,
  setBrief,
  leyendo,
  error,
  onSubir,
  onQuitarBrief,
  onGenerar,
  onCancelar,
  pasoInicial = 0,
}: {
  brief: Brief;
  setBrief: (f: (b: Brief) => Brief) => void;
  leyendo: boolean;
  error: string;
  onSubir: (f: File | undefined) => void;
  onQuitarBrief: () => void;
  onGenerar: () => void;
  onCancelar: () => void;
  pasoInicial?: number;
}) {
  const [paso, setPaso] = useState(pasoInicial);
  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief((b) => ({ ...b, [k]: v }));
  const equipo = equipoDe(brief);
  const listo = brief.idea.trim().length > 0;

  function siguiente(e: React.FormEvent) {
    e.preventDefault();
    if (paso < PASOS.length - 1) setPaso(paso + 1);
    else onGenerar();
  }

  return (
    <div className="st-new-wrap">
      <form className="st-wizard card" onSubmit={siguiente}>
        <div className="st-wizard-top">
          <button type="button" className="st-back" onClick={onCancelar}>← Proyectos</button>
          <ol className="st-steps">
            {PASOS.map((s, i) => (
              <li key={s} className={i === paso ? "now" : i < paso ? "done" : ""}>
                <button type="button" onClick={() => (i <= paso || listo) && setPaso(i)}>
                  <span>{i < paso ? "✓" : `0${i + 1}`}</span> {s}
                </button>
              </li>
            ))}
          </ol>
        </div>

        {paso === 0 && (
          <div className="st-pane" key="brief">
            <h2>¿Qué vamos a filmar?</h2>
            <p className="muted">Sube el brief del cliente y lleno todo por ti, o cuéntame la idea con tus palabras.</p>
            {brief.archivo ? (
              <div className="file-chip">
                <span>📄 {brief.archivo} · leído</span>
                <button type="button" className="x" onClick={onQuitarBrief} aria-label="Quitar brief">×</button>
              </div>
            ) : (
              <label className={`drop st-drop${leyendo ? " busy" : ""}`}>
                <input type="file" accept=".docx,.pdf,.txt,.md" disabled={leyendo} onChange={(e) => { onSubir(e.target.files?.[0]); e.target.value = ""; }} />
                <span className="st-drop-icon">{leyendo ? "◌" : "⇪"}</span>
                <b>{leyendo ? "Leyendo el brief y llenando todo…" : "Arrastra aquí el brief del cliente"}</b>
                <small>{leyendo ? "Unos segundos" : "Word, PDF o texto · o haz clic para buscarlo"}</small>
              </label>
            )}
            <label className="st-field">
              Idea del video
              <textarea required rows={5} value={brief.idea} onChange={(e) => set("idea", e.target.value)} placeholder="Ej.: Video promocional de 60 s para un viñedo en Valle de Guadalupe, mostrando la vendimia al amanecer y una cata al atardecer…" />
            </label>
            <Opciones label="Duración" valor={brief.duracion} opciones={DURACIONES} onChange={(v) => set("duracion", v)} libre />
            <Opciones label="Formato" valor={brief.formato} opciones={FORMATOS} onChange={(v) => set("formato", v)} libre />
            <Opciones label="Estilo visual" valor={brief.estilo} opciones={ESTILOS} onChange={(v) => set("estilo", v)} libre />
            <div className="st-field">
              Presupuesto
              <div className="st-seg">
                {(["bajo", "medio", "alto"] as const).map((v) => (
                  <button type="button" key={v} className={brief.presupuesto === v ? "on" : ""} onClick={() => set("presupuesto", v)}>
                    {v === "bajo" ? "Bajo" : v === "medio" ? "Medio" : "Alto"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {paso === 1 && (
          <div className="st-pane" key="equipo">
            <h2>¿Quién filma?</h2>
            <p className="muted">Con la cámara y lentes de cada quien armo las tomas, el storyboard y el plan con ese equipo. Cada persona recibe su propio link.</p>
            <label className="st-toggle">
              <input
                type="checkbox"
                checked={brief.incluirDron}
                onChange={(e) => {
                  const dron = e.target.checked;
                  setBrief((b) => ({ ...b, incluirDron: dron, equipoRodaje: ajustarEquipo(equipo, equipo.filter((o) => o.tipo === "camara").length, dron) }));
                }}
              />
              <span className="st-switch" />
              <span>
                <b>Tomas aéreas con dron</b>
                <small>Agrega piloto, alturas, maniobras y permisos de espacio aéreo</small>
              </span>
            </label>
            <EquipoForm equipo={equipo} dron={brief.incluirDron} onChange={(eq) => set("equipoRodaje", eq)} />
          </div>
        )}

        {paso === 2 && (
          <div className="st-pane" key="rodaje">
            <h2>¿Cuándo y dónde?</h2>
            <p className="muted">Con la fecha calculo la luz del día (amanecer, hora dorada) y la cuenta regresiva para tu equipo.</p>
            <div className="row">
              <label className="st-field">
                Fecha de rodaje
                <input type="date" value={brief.fechaRodaje ?? ""} onChange={(e) => set("fechaRodaje", e.target.value)} />
              </label>
              <label className="st-field">
                Días de rodaje
                <input type="number" min={1} max={30} value={brief.diasRodaje ?? 1} onChange={(e) => set("diasRodaje", Math.max(1, +e.target.value || 1))} />
              </label>
            </div>
            <label className="st-field">
              Notas: cliente, locación, talento, entregables
              <textarea rows={4} value={brief.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Ej.: Locación Hacienda La Lomita, 2 actores, subtítulos en inglés, entregar versión 9:16…" />
            </label>
            {!listo && <p className="error">Falta la idea del video en el paso 1.</p>}
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <div className="st-wizard-foot">
          {paso > 0 ? <button type="button" onClick={() => setPaso(paso - 1)}>← Atrás</button> : <span />}
          <button className="primary st-go" disabled={leyendo || (paso === PASOS.length - 1 && !listo)}>
            {paso < PASOS.length - 1 ? "Siguiente →" : <><span className="st-rec" /> Acción: generar preproducción</>}
          </button>
        </div>
      </form>

      <Claqueta brief={brief} />
    </div>
  );
}

function Opciones({ label, valor, opciones, onChange, libre }: { label: string; valor: string; opciones: string[]; onChange: (v: string) => void; libre?: boolean }) {
  return (
    <div className="st-field">
      {label}
      <div className="st-chips">
        {opciones.map((o) => (
          <button type="button" key={o} className={valor === o ? "on" : ""} onClick={() => onChange(valor === o ? "" : o)}>
            {o}
          </button>
        ))}
        {libre && <input className="st-chip-input" style={{ width: `${Math.max(9, (opciones.includes(valor) ? 0 : valor.length) + 3)}ch` }} value={opciones.includes(valor) ? "" : valor} onChange={(e) => onChange(e.target.value)} placeholder="Otro…" aria-label={`${label}: otro`} />}
      </div>
    </div>
  );
}

// Quién filma: define cuántas cámaras hay y a quién le llega cada hoja de llamado.
function EquipoForm({ equipo, dron, onChange }: { equipo: Operador[]; dron: boolean; onChange: (eq: Operador[]) => void }) {
  const camaras = equipo.filter((o) => o.tipo === "camara").length;
  const editar = (id: string, k: "nombre" | "contacto" | "equipo" | "camara", v: string) => onChange(equipo.map((o) => (o.id === id ? { ...o, [k]: v } : o)));
  return (
    <div className="st-crew">
      <div className="st-crew-count">
        <span>Cámaras</span>
        <button type="button" onClick={() => onChange(ajustarEquipo(equipo, camaras - 1, dron))} disabled={camaras <= 1} aria-label="Quitar cámara">−</button>
        <b>{camaras}</b>
        <button type="button" onClick={() => onChange(ajustarEquipo(equipo, camaras + 1, dron))} disabled={camaras >= 6} aria-label="Agregar cámara">+</button>
        <small className="muted">{dron ? "+ director y piloto de dron" : "+ director"}</small>
      </div>
      <div className="st-crew-grid">
        {equipo.map((o) => (
          <div key={o.id} className={`st-op ${o.tipo}`}>
            <div className="st-op-head">
              <span className={`st-op-av ${o.tipo}`}>{o.nombre ? iniciales(o.nombre) : o.tipo === "dron" ? "✈" : o.tipo === "director" ? "D" : o.rol.slice(-1)}</span>
              <b>{o.rol}</b>
            </div>
            <input placeholder="Nombre" value={o.nombre} onChange={(e) => editar(o.id, "nombre", e.target.value)} />
            <input placeholder="WhatsApp / teléfono" inputMode="tel" value={o.contacto} onChange={(e) => editar(o.id, "contacto", e.target.value)} />
            {o.tipo !== "director" && (
              <>
                <SelectorCamara o={o} onChange={(v) => editar(o.id, "camara", v)} />
                <FichaCamara o={o} />
                <input
                  placeholder={o.tipo === "dron" ? "Extras (opcional): ND, baterías…" : "Lentes que traes (opcional)"}
                  value={o.equipo ?? ""}
                  onChange={(e) => editar(o.id, "equipo", e.target.value)}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const OTRA = "__otra";

// Menú de cámaras (o drones) por marca, con opción de escribir otra.
export function SelectorCamara({ o, onChange }: { o: Operador; onChange: (v: string) => void }) {
  const catalogo = o.tipo === "dron" ? DRONES : CAMARAS;
  const enCatalogo = !!fichaCamara(o.camara, o.tipo);
  const [otra, setOtra] = useState(!!o.camara && !enCatalogo);
  const valor = otra ? OTRA : enCatalogo ? o.camara : "";
  return (
    <>
      <select
        value={valor}
        className={valor ? "" : "empty"}
        aria-label={o.tipo === "dron" ? "Dron" : "Cámara"}
        onChange={(e) => {
          const v = e.target.value;
          setOtra(v === OTRA);
          onChange(v === OTRA ? "" : v);
        }}
      >
        <option value="">{o.tipo === "dron" ? "Elige el dron…" : "Elige la cámara…"}</option>
        {Object.entries(catalogo).map(([marca, lista]) => (
          <optgroup key={marca} label={marca}>
            {lista.map((c) => (
              <option key={c.modelo} value={c.modelo}>{c.modelo}</option>
            ))}
          </optgroup>
        ))}
        <option value={OTRA}>Otra (escribir)…</option>
      </select>
      {otra && <input autoFocus placeholder={o.tipo === "dron" ? "Modelo del dron" : "Modelo de la cámara"} value={o.camara ?? ""} onChange={(e) => onChange(e.target.value)} />}
    </>
  );
}

function FichaCamara({ o }: { o: Operador }) {
  const f = fichaCamara(o.camara, o.tipo);
  if (!f) return null;
  return (
    <div className="st-ficha">
      <span>{f.sensor}</span>
      <span>{f.montura}</span>
      <span>{f.max}</span>
    </div>
  );
}

// Vista previa en vivo con forma de claqueta.
function Claqueta({ brief }: { brief: Brief }) {
  const equipo = equipoDe(brief);
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    setN(diasPara(brief.fechaRodaje));
  }, [brief.fechaRodaje]);
  const titulo = brief.archivo?.replace(/\.[^.]+$/, "") || recorta(brief.idea.split(/[.\n]/)[0] ?? "", 72) || "Tu próximo proyecto";
  const camaras = equipo.filter((o) => o.tipo === "camara").length;
  return (
    <aside className="st-slate">
      <div className="st-slate-clap" aria-hidden><i /><i /><i /><i /><i /><i /></div>
      <div className="st-slate-body">
        <div className="st-slate-row full">
          <span>Producción</span>
          <b className={brief.idea || brief.archivo ? "" : "dim"}>{titulo}</b>
        </div>
        <div className="st-slate-row"><span>Duración</span><b>{brief.duracion || "—"}</b></div>
        <div className="st-slate-row"><span>Formato</span><b>{brief.formato || "—"}</b></div>
        <div className="st-slate-row"><span>Estilo</span><b>{brief.estilo || "—"}</b></div>
        <div className="st-slate-row"><span>Presupuesto</span><b>{brief.presupuesto.charAt(0).toUpperCase() + brief.presupuesto.slice(1)}</b></div>
        <div className="st-slate-row"><span>Fecha</span><b>{brief.fechaRodaje ? fechaCorta(brief.fechaRodaje) : "—"}</b></div>
        <div className="st-slate-row"><span>Días</span><b>{brief.diasRodaje ?? 1}</b></div>
        <div className="st-slate-row"><span>Cámaras</span><b>{camaras}</b></div>
        <div className="st-slate-row"><span>Dron</span><b>{brief.incluirDron ? "Sí" : "No"}</b></div>
      </div>
      {brief.fechaRodaje && n !== null && (
        <div className="st-slate-count">
          <b>{n > 0 ? n : n === 0 ? "HOY" : "✓"}</b>
          <span>{n > 1 ? "días para rodar" : n === 1 ? "día · mañana" : n === 0 ? "día de rodaje" : "fecha pasada"}</span>
        </div>
      )}
      <div className="st-slate-crew">
        <span className="card-title">Equipo en set</span>
        {equipo.map((o) => (
          <div key={o.id}>
            <span className={`st-op-av sm ${o.tipo}`}>{o.nombre ? iniciales(o.nombre) : o.tipo === "dron" ? "✈" : o.tipo === "director" ? "D" : o.rol.slice(-1)}</span>
            <span>
              <b>{o.nombre || o.rol}</b>
              <small>{o.nombre ? o.rol : "sin asignar"}{gearDe(o) ? ` · ${gearDe(o)}` : ""}</small>
            </span>
          </div>
        ))}
      </div>
      <p className="st-slate-foot">Genero: guion audiovisual · guion técnico · storyboard · plan de rodaje · permisos · presupuesto · links</p>
    </aside>
  );
}

// ───────────────────────── Sala de control (generando) ─────────────────────────

export const ETAPAS = [
  ["resumen", "Concepto"],
  ["guionAudiovisual", "Guion y voz en off"],
  ["guionTecnico", "Guion técnico"],
  ["storyboard", "Storyboard"],
  ["planRodaje", "Plan de rodaje"],
  ["equipo", "Equipo y crew"],
  ["locaciones", "Locaciones y permisos"],
  ["presupuesto", "Presupuesto"],
  ["postproduccion", "Post y checklist"],
] as const;

export function etapaActual(text: string): number {
  let idx = -1;
  ETAPAS.forEach(([k], i) => {
    if (text.includes(`"${k}"`)) idx = i;
  });
  return idx;
}

const tc = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function SalaControl({ texto, segundos, brief }: { texto: string; segundos: number; brief: Brief }) {
  const etapa = etapaActual(texto);
  const v = leerVivo(texto);
  const pct = etapa < 0 ? Math.min(8, 2 + segundos / 10) : Math.round(8 + ((etapa + 0.5) / ETAPAS.length) * 92);
  const cola = texto.slice(-220).replace(/\s+/g, " ");
  return (
    <div className="st-control">
      <header className="st-control-top">
        <span className="st-live"><span className="st-rec" /> REC</span>
        <span className="mono st-tc">{tc(segundos)}</span>
        <div className="st-control-title">
          <span className="kicker">{etapa < 0 ? "Leyendo el brief y planeando el video" : `Escribiendo · ${ETAPAS[etapa][1]}`}</span>
          <h2 className={v.titulo ? "" : "dim"}>{v.titulo || brief.archivo?.replace(/\.[^.]+$/, "") || "Preparando tu proyecto…"}</h2>
          {v.logline && <p>{v.logline}</p>}
        </div>
      </header>
      <div className="bar"><div style={{ width: `${pct}%` }} /></div>

      <div className="st-control-grid">
        <ol className="st-etapas">
          {ETAPAS.map(([k, label], i) => (
            <li key={k} className={i < etapa ? "done" : i === etapa ? "now" : ""}>
              <span>{i < etapa ? "✓" : i === etapa ? "●" : ""}</span> {label}
            </li>
          ))}
        </ol>

        <div className="st-monitor">
          <div className="st-counters">
            <div><b>{v.escenas.length}</b><span>escenas</span></div>
            <div><b>{v.planos.length}</b><span>tomas</span></div>
            <div><b>{v.dias}</b><span>días</span></div>
            <div><b>{v.locaciones.length}</b><span>locaciones</span></div>
            <div className="wide"><b>{v.total || "—"}</b><span>presupuesto</span></div>
          </div>

          {v.escenas.length > 0 && (
            <section>
              <p className="card-title">Escenas</p>
              <div className="st-feed">
                {v.escenas.map((e) => (
                  <article key={e.numero} className="st-feed-item">
                    <span className="mono">ESC {e.numero}</span>
                    <b>{e.encabezado}</b>
                    {e.video && <p>{e.video}</p>}
                    {e.vozEnOff && <p className="vo">{e.vozEnOff}</p>}
                  </article>
                ))}
              </div>
            </section>
          )}

          {v.planos.length > 0 && (
            <section>
              <p className="card-title">Lista de tomas</p>
              <div className="st-shots">
                {v.planos.map((p) => (
                  <div key={p.id} className="st-shot">
                    <span className="mono">{p.id}</span>
                    <b>{p.tipoPlano}</b>
                    <small>{[p.lente, p.movimiento].filter(Boolean).join(" · ")}</small>
                    {p.operador && <em>{p.operador}</em>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {!v.escenas.length && (
            <div className="st-standby">
              <div className="st-standby-bars" aria-hidden>{Array.from({ length: 7 }, (_, i) => <i key={i} />)}</div>
              <p>Analizando el brief, el equipo y la luz del día. Las escenas aparecen aquí en cuanto se escriben.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="st-signal">
        <span className="mono">SEÑAL</span>
        <code>{cola || "…"}</code>
        <span className="mono">{Math.round(texto.length / 1000)}k</span>
      </footer>
      <p className="muted st-note">Tarda de 1 a 4 minutos. No cierres esta pestaña; después se dibuja el storyboard toma por toma.</p>
    </div>
  );
}
