"use client";

// Libro de producción: cómo ve el proyecto un director (guion a dos columnas, tomas con su cuadro, calendario real).
import { useState, type ReactNode } from "react";
import { svgSrc } from "@/components/estudio";
import { equipoDe } from "@/lib/equipo";
import { gearDe } from "@/lib/camaras";
import { Animatic } from "@/components/animatic";
import { cabecerasAcceso } from "@/lib/acceso-cliente";
import { adivinarLugar, ClimaDia, ClimaLugar, useClima } from "@/components/clima";
import type { Jornada, Paquete, Plano, Proyecto } from "@/lib/types";

// ───────────────────────── utilidades ─────────────────────────

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function sumarDias(fecha: string, n: number): string {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d);
}

// Fecha real de una jornada: la que se fijó a mano o la del primer día más los días que siguen.
export function fechaDe(j: Jornada, inicio?: string): string {
  if (ISO.test(j.fecha)) return j.fecha;
  return inicio && ISO.test(inicio) ? sumarDias(inicio, j.dia - 1) : "";
}

// Al mover el primer día, las fechas fijadas a mano se recorren lo mismo.
export function moverFechas(paquete: Paquete, antes: string | undefined, despues: string): Paquete {
  if (!antes || !ISO.test(antes) || !ISO.test(despues)) return paquete;
  const delta = Math.round((+new Date(`${despues}T00:00:00`) - +new Date(`${antes}T00:00:00`)) / 86400000);
  return { ...paquete, planRodaje: paquete.planRodaje.map((j) => (ISO.test(j.fecha) ? { ...j, fecha: sumarDias(j.fecha, delta) } : j)) };
}

// "8 s (00:00-00:08)" → 8; "1 min" → 60; "0:45" → 45.
export function segundos(d = ""): number {
  const m = d.match(/(\d+(?:[.,]\d+)?)\s*(min|seg|s)\b/i);
  if (m) return parseFloat(m[1].replace(",", ".")) * (/^min/i.test(m[2]) ? 60 : 1);
  const t = d.match(/(\d+):(\d{2})/);
  if (t) return +t[1] * 60 + +t[2];
  return parseFloat(d) || 0;
}

const tc = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const sinTc = (d = "") => d.replace(/\s*\(.*\)\s*$/, "");

// "$188,650 MXN (estimado orientativo)" → "$188,650".
const montoCorto = (s = "") => s.match(/\$\s?[\d.,]+/)?.[0].replace(/\s/g, "") || s;

// "$12,500 MXN" → 12500.
const monto = (s = "") => Number(s.replace(/[^\d.]/g, "")) || 0;

const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Color por operador para leer de un vistazo quién filma qué.
export function tonoDe(op = ""): string {
  const n = norm(op);
  if (/dron|aere|piloto|rpas/.test(n)) return "op-dron";
  const l = n.match(/camara\s*([a-f])\b/)?.[1];
  return l ? `op-${l}` : "op-x";
}

const DIA = (f: string) => new Date(`${f}T00:00:00`);

// ───────────────────────── piezas ─────────────────────────

// Texto que se corrige en sitio cuando el modo edición está activo.
function Ed({ v, on, edit, className = "", block }: { v?: string; on: (t: string) => void; edit: boolean; className?: string; block?: boolean }) {
  const Tag = block ? "div" : "span";
  if (!edit) return v ? <Tag className={className}>{v}</Tag> : null;
  return (
    <Tag
      className={`${className} ed`}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-ph="Escribe…"
      onBlur={(e) => {
        const t = e.currentTarget.innerText.trim();
        if (t !== (v ?? "").trim()) on(t);
      }}
    >
      {v}
    </Tag>
  );
}

function Cuadro({ p, id, className = "" }: { p: Paquete; id: string; className?: string }) {
  const f = p.storyboard.find((x) => x.planoId === id);
  const src = f?.imagen || (f?.svg ? svgSrc(f.svg) : "");
  return (
    <div className={`vf ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} /> : <div className="vf-empty">{id}</div>}
    </div>
  );
}

function Sec({ id, tab, titulo, kicker, extra, children }: { id: string; tab: string; titulo: string; kicker?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className={tab === id ? "sec lb-sec" : "sec lb-sec hide"}>
      <header className="lb-sec-head">
        <div>
          {kicker && <span className="lb-kicker">{kicker}</span>}
          <h2>{titulo}</h2>
        </div>
        {extra}
      </header>
      {children}
    </section>
  );
}

// Redibuja un solo cuadro con las indicaciones del director, partiendo del dibujo actual.
function Retoque({ proyecto, planoId, onChange }: { proyecto: Proyecto; planoId: string; onChange: (p: Proyecto) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<"" | "dibujando" | "error">("");
  const [anterior, setAnterior] = useState<string | null>(null);
  const p = proyecto.paquete;
  const panel = p.storyboard.find((x) => x.planoId === planoId);
  const plano = p.guionTecnico.find((x) => x.id === planoId);
  if (!panel || !plano) return null;

  const poner = (imagen: string) =>
    onChange({ ...proyecto, paquete: { ...p, storyboard: p.storyboard.map((x) => (x.planoId === planoId ? { ...x, imagen } : x)) } });

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!texto.trim()) return;
    setEstado("dibujando");
    try {
      const res = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabecerasAcceso() },
        body: JSON.stringify({
          planos: [plano],
          estilo: proyecto.brief.estilo,
          contexto: { titulo: p.resumen.titulo, escenas: p.guionAudiovisual.map((e) => ({ numero: e.numero, encabezado: e.encabezado })), indicaciones: texto.trim(), base: panel!.imagen },
        }),
      });
      const j = await res.json();
      const nuevo = j.paneles?.find((x: { planoId: string; imagen?: string }) => x.planoId === planoId)?.imagen;
      if (!nuevo) throw new Error(j.aviso || j.error || "sin dibujo");
      setAnterior(panel!.imagen || null);
      poner(nuevo);
      setEstado("");
      setAbierto(false);
      setTexto("");
    } catch {
      setEstado("error");
    }
  }

  return (
    <div className="lb-retoque no-print">
      {!abierto ? (
        <span className="lb-retoque-acc">
          <button type="button" onClick={() => setAbierto(true)}>✎ Redibujar este cuadro</button>
          {anterior && <button type="button" onClick={() => { poner(anterior); setAnterior(null); }}>↺ Deshacer</button>}
        </span>
      ) : (
        <form onSubmit={enviar}>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} autoFocus placeholder="Ej. que ella mire a cámara, más gente al fondo, plano más cerrado…" disabled={estado === "dibujando"} />
          <span className="lb-retoque-acc">
            <button type="submit" className="primary" disabled={estado === "dibujando" || !texto.trim()}>{estado === "dibujando" ? "Dibujando…" : "Redibujar"}</button>
            <button type="button" onClick={() => { setAbierto(false); setEstado(""); }} disabled={estado === "dibujando"}>Cancelar</button>
          </span>
          {estado === "error" && <small className="lb-retoque-err">No se pudo redibujar. Intenta de nuevo en un momento.</small>}
        </form>
      )}
    </div>
  );
}

// ───────────────────────── libro ─────────────────────────

export interface LibroProps {
  proyecto: Proyecto;
  tab: string;
  edit: boolean;
  onChange: (p: Proyecto) => void;
  irA: (t: string) => void;
  dibujando: { hechos: number; total: number } | null;
  onRedibujar: (p: Proyecto) => void;
}

export function Libro({ proyecto, tab, edit, onChange, irA, dibujando, onRedibujar }: LibroProps) {
  const p = proyecto.paquete;
  const b = proyecto.brief;
  const set = (fn: (x: Paquete) => Paquete) => onChange({ ...proyecto, paquete: fn(p) });
  const escena = (i: number, k: string, v: string) => set((x) => ({ ...x, guionAudiovisual: x.guionAudiovisual.map((e, n) => (n === i ? { ...e, [k]: v } : e)) }));
  const plano = (id: string, k: keyof Plano, v: string) => set((x) => ({ ...x, guionTecnico: x.guionTecnico.map((s) => (s.id === id ? { ...s, [k]: v } : s)) }));
  const jornada = (dia: number, cambio: Partial<Jornada>) => set((x) => ({ ...x, planRodaje: x.planRodaje.map((j) => (j.dia === dia ? { ...j, ...cambio } : j)) }));
  const item = (dia: number, i: number, k: "hora" | "actividad" | "locacion", v: string) =>
    set((x) => ({ ...x, planRodaje: x.planRodaje.map((j) => (j.dia === dia ? { ...j, items: j.items.map((it, n) => (n === i ? { ...it, [k]: v } : it)) } : j)) }));

  // Timecode acumulado por escena.
  let acc = 0;
  const tiempos = p.guionAudiovisual.map((e) => {
    const ini = acc;
    acc += segundos(e.duracion);
    return { ini, fin: acc };
  });
  const total = acc;
  const wx = useClima(proyecto, onChange);
  const [animatic, setAnimatic] = useState(false);
  const dron = b.incluirDron || p.guionTecnico.some((s) => /dron/i.test(`${s.camara} ${s.operador}`));

  return (
    <div className="lb">
      {animatic && <Animatic p={p} onClose={() => setAnimatic(false)} />}
      <Resumen p={p} b={b} tiempos={tiempos} total={total} irA={irA} tab={tab} edit={edit} set={set} />

      <Sec id="audiovisual" tab={tab} kicker={`${p.guionAudiovisual.length} escenas · ${tc(total)}`} titulo="Guion audiovisual">
        <div className="lb-av-cols" aria-hidden>
          <span>Imagen</span>
          <span>Sonido</span>
        </div>
        {p.guionAudiovisual.map((e, i) => (
          <article key={e.numero} className="lb-scene">
            <header className="lb-scene-head">
              <span className="lb-scene-n">{String(e.numero).padStart(2, "0")}</span>
              <Ed v={e.encabezado} on={(t) => escena(i, "encabezado", t)} edit={edit} className="lb-slug" />
              <span className="lb-tc">{tc(tiempos[i].ini)} – {tc(tiempos[i].fin)}</span>
            </header>
            <div className="lb-av">
              <div className="lb-img">
                <Ed v={e.video} on={(t) => escena(i, "video", t)} edit={edit} block className="lb-video" />
                {(e.textoPantalla || edit) && (
                  <div className="lb-super">
                    <span className="lb-lab">En pantalla</span>
                    <Ed v={e.textoPantalla} on={(t) => escena(i, "textoPantalla", t)} edit={edit} block />
                  </div>
                )}
                <div className="lb-scene-shots">
                  {p.guionTecnico.filter((s) => s.escena === e.numero).map((s) => (
                    <button key={s.id} type="button" className="lb-mini" onClick={() => irA("tecnico")} title={`${s.id} · ${s.tipoPlano}`}>
                      <Cuadro p={p} id={s.id} />
                      <span>{s.id}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="lb-snd">
                {(e.vozEnOff || edit) && (
                  <div className="lb-vo">
                    <span className="lb-lab">Voz</span>
                    <Ed v={e.vozEnOff} on={(t) => escena(i, "vozEnOff", t)} edit={edit} block />
                  </div>
                )}
                <div>
                  <span className="lb-lab">Música · SFX</span>
                  <Ed v={e.audio} on={(t) => escena(i, "audio", t)} edit={edit} block className="lb-audio" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </Sec>

      <Tomas p={p} tab={tab} edit={edit} plano={plano} tiempos={tiempos} />

      <Sec
        id="storyboard"
        tab={tab}
        kicker={`${p.storyboard.length} cuadros`}
        titulo="Storyboard"
        extra={
          <span className="lb-sb-acc no-print">
            <button className="primary" disabled={!p.storyboard.some((f) => f.imagen || f.svg)} onClick={() => setAnimatic(true)}>▶ Ver animatic</button>
            <button disabled={!!dibujando} onClick={() => onRedibujar(proyecto)}>↻ Volver a dibujar</button>
          </span>
        }
      >
        <div className="board">
          {p.storyboard.map((f) => {
            const s = p.guionTecnico.find((x) => x.id === f.planoId);
            return (
              <figure key={f.planoId}>
                <div className="vf">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {f.imagen || f.svg ? <img src={f.imagen || svgSrc(f.svg!)} alt="" onError={(ev) => { ev.currentTarget.style.visibility = "hidden"; }} /> : <div className={`vf-empty${dibujando ? " busy" : ""}`}>{dibujando ? "Dibujando…" : "Sin boceto"}</div>}
                  <span className="vf-tag">{f.planoId}</span>
                  {s && (
                    <span className="vf-meta">
                      <span>{s.tipoPlano}</span>
                      <span>{s.lente}</span>
                    </span>
                  )}
                </div>
                <figcaption>
                  <b>{f.planoId}</b> {s && <span className="tag">{s.tipoPlano} · {s.movimiento}</span>}
                  <p>{f.descripcion}</p>
                  {(f.dialogo || s?.vozEnOff) && <p className="dlg">{f.dialogo || s?.vozEnOff}</p>}
                  <small>{f.transicion}</small>
                  <Retoque proyecto={proyecto} planoId={f.planoId} onChange={onChange} />
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Sec>

      <Sec id="rodaje" tab={tab} kicker={`${p.planRodaje.length} ${p.planRodaje.length === 1 ? "jornada" : "jornadas"}`} titulo="Plan de rodaje">
        {!b.fechaRodaje && !p.planRodaje.some((j) => ISO.test(j.fecha)) && (
          <p className="lb-aviso no-print">Pon la fecha de cada jornada aquí abajo, o la del primer día arriba junto al título, y el plan se acomoda solo.</p>
        )}
        <ClimaLugar clima={wx.clima} error={wx.error} cargando={wx.cargando} buscar={wx.buscar} sugerido={adivinarLugar(proyecto)} />
        {p.planRodaje.map((j) => {
          const f = fechaDe(j, b.fechaRodaje);
          const tomas = new Set(j.items.flatMap((it) => it.planos));
          return (
            <article key={j.dia} className="lb-day">
              <header className="lb-day-head">
                <div className="lb-cal">
                  <span>{f ? DIA(f).toLocaleDateString("es-MX", { month: "short" }) : `Día`}</span>
                  <b>{f ? DIA(f).getDate() : j.dia}</b>
                  <span>{f ? DIA(f).toLocaleDateString("es-MX", { weekday: "short" }) : "s/f"}</span>
                </div>
                <div className="lb-day-info">
                  <span className="lb-kicker">Jornada {j.dia}{f ? ` · ${DIA(f).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}` : j.fecha ? ` · ${j.fecha.length > 32 ? j.fecha.split(/[.,;]/)[0].slice(0, 32) : j.fecha}` : ""}</span>
                  <Ed v={j.locacion} on={(t) => jornada(j.dia, { locacion: t })} edit={edit} className="lb-day-loc" block />
                  <div className="lb-day-meta">
                    <label className="lb-field no-print">
                      <span>Fecha</span>
                      <input type="date" value={f} onChange={(ev) => jornada(j.dia, { fecha: ev.target.value })} />
                    </label>
                    <label className="lb-field">
                      <span>Llamado</span>
                      <input value={j.llamado} onChange={(ev) => jornada(j.dia, { llamado: ev.target.value })} />
                    </label>
                    <span className="chip">{tomas.size} tomas</span>
                  </div>
                </div>
              </header>
              <ClimaDia clima={wx.clima} fecha={f} dron={dron} />
              <ol className="lb-strips">
                {j.items.map((it, n) => {
                  const ops = it.planos.map((id) => p.guionTecnico.find((s) => s.id === id)).filter(Boolean) as Plano[];
                  const tono = !it.planos.length ? "op-pausa" : tonoDe(ops[0]?.operador || ops[0]?.camara);
                  return (
                    <li key={n} className={`lb-strip ${tono}`}>
                      <Ed v={it.hora} on={(t) => item(j.dia, n, "hora", t)} edit={edit} className="lb-hora" />
                      <div className="lb-strip-body">
                        <Ed v={it.actividad} on={(t) => item(j.dia, n, "actividad", t)} edit={edit} block />
                        {it.locacion && <Ed v={it.locacion} on={(t) => item(j.dia, n, "locacion", t)} edit={edit} className="lb-strip-loc" block />}
                      </div>
                      {ops.length > 0 && (
                        <div className="lb-strip-shots">
                          {ops.slice(0, 4).map((s) => (
                            <span key={s.id} className="lb-mini" title={`${s.id} · ${s.tipoPlano} · ${s.operador || s.camara}`}>
                              <Cuadro p={p} id={s.id} />
                              <span>{s.id}</span>
                            </span>
                          ))}
                          {ops.length > 4 && <span className="lb-more">+{ops.length - 4}</span>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </article>
          );
        })}
      </Sec>

      <Sec id="equipo" tab={tab} kicker="Quién y con qué" titulo="Equipo y crew">
        <div className="lb-ops">
          {equipoDe(b).map((o) => (
            <div key={o.id} className={`lb-op ${o.tipo === "director" ? "" : tonoDe(o.rol)}`}>
              <span className="lb-lab">{o.rol}</span>
              <b>{o.nombre || "Por asignar"}</b>
              {o.tipo !== "director" && <small>{gearDe(o) || "Equipo por definir"}</small>}
            </div>
          ))}
        </div>
        <div className="lb-cats">
          {Object.entries(
            p.equipo.reduce<Record<string, typeof p.equipo>>((g, e) => ({ ...g, [e.categoria || "Otros"]: [...(g[e.categoria || "Otros"] ?? []), e] }), {}),
          ).map(([cat, items]) => (
            <div key={cat} className="card lb-cat">
              <h3>{cat}</h3>
              <ul>
                {items.map((e, n) => (
                  <li key={n}>
                    <span className="lb-qty">{e.cantidad}×</span>
                    <div>
                      <b>{e.item}</b>
                      {e.notas && <small>{e.notas}</small>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <h3 className="lb-h3">Crew</h3>
        <div className="lb-crew">
          {p.crew.map((c, n) => (
            <div key={n} className="lb-crew-item">
              <b>{c.rol}</b>
              <p>{c.responsabilidades}</p>
            </div>
          ))}
        </div>
      </Sec>

      <Sec id="locaciones" tab={tab} kicker={`${p.locaciones.length} locaciones`} titulo="Locaciones y permisos">
        <div className="lb-locs">
          {p.locaciones.map((l, n) => {
            const dias = p.planRodaje.filter((j) => norm(`${j.locacion} ${j.items.map((i) => i.locacion).join(" ")}`).includes(norm(l.nombre).split(/[,(·-]/)[0].trim()));
            return (
              <article key={n} className="card lb-loc">
                <header>
                  <span className="lb-loc-n">{String(n + 1).padStart(2, "0")}</span>
                  <h3>{l.nombre}</h3>
                  {dias.length > 0 && <span className="chip">{dias.map((d) => `Día ${d.dia}`).join(" · ")}</span>}
                </header>
                <p>{l.descripcion}</p>
                <div className="lb-loc-grid">
                  <div className="lb-permiso">
                    <span className="lb-lab">Permisos</span>
                    <p>{l.permisos}</p>
                  </div>
                  <div className="lb-riesgo">
                    <span className="lb-lab">Riesgos</span>
                    <p>{l.riesgos}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Sec>

      <Sec id="presupuesto" tab={tab} kicker={`Estimado en ${p.presupuesto.moneda}`} titulo="Presupuesto">
        <div className="lb-budget">
          <div className="lb-budget-total">
            <span className="lb-lab">Total estimado</span>
            <b>{p.presupuesto.total}</b>
            <small>{p.presupuesto.moneda}</small>
          </div>
          <ul className="lb-budget-rows">
            {(() => {
              const max = Math.max(1, ...p.presupuesto.items.map((i) => monto(i.estimado)));
              return p.presupuesto.items.map((i, n) => (
                <li key={n}>
                  <span>{i.concepto}</span>
                  <span className="lb-bar"><i style={{ width: `${(monto(i.estimado) / max) * 100}%` }} /></span>
                  <b>{i.estimado}</b>
                </li>
              ));
            })()}
          </ul>
        </div>
        {p.presupuesto.notas && <p className="muted">{p.presupuesto.notas}</p>}
      </Sec>

      <Sec id="post" tab={tab} kicker="Después del rodaje" titulo="Post y entregas">
        <div className="lb-post">
          {([["Edición", p.postproduccion.edicion], ["Color", p.postproduccion.color], ["Audio", p.postproduccion.audio], ["Gráficos", p.postproduccion.graficos]] as const).map(([k, v]) => (
            <div key={k} className="card">
              <span className="lb-lab">{k}</span>
              <p>{v}</p>
            </div>
          ))}
        </div>
        <h3 className="lb-h3">Entregables</h3>
        <div className="lb-chips">
          {p.postproduccion.entregables.map((e, n) => (
            <span key={n} className="chip">{e}</span>
          ))}
        </div>
        <h3 className="lb-h3">
          Checklist de preproducción <small className="muted">{proyecto.checks?.length ?? 0} de {p.checklist.length}</small>
        </h3>
        <ul className="checklist">
          {p.checklist.map((c, n) => {
            const hecho = proyecto.checks?.includes(n) ?? false;
            return (
              <li key={n}>
                <label className={hecho ? "hecho" : ""}>
                  <input
                    type="checkbox"
                    checked={hecho}
                    onChange={() => onChange({ ...proyecto, checks: hecho ? proyecto.checks!.filter((x) => x !== n) : [...(proyecto.checks ?? []), n] })}
                  />{" "}
                  {c}
                </label>
              </li>
            );
          })}
        </ul>
      </Sec>
    </div>
  );
}

// ───────────────────────── resumen ─────────────────────────

function Resumen({ p, b, tiempos, total, irA, tab, edit, set }: { p: Paquete; b: Proyecto["brief"]; tiempos: { ini: number; fin: number }[]; total: number; irA: (t: string) => void; tab: string; edit: boolean; set: (fn: (x: Paquete) => Paquete) => void }) {
  const r = p.resumen;
  const campo = (k: keyof typeof r, v: string) => set((x) => ({ ...x, resumen: { ...x.resumen, [k]: v } }));
  const aereas = p.guionTecnico.filter((s) => tonoDe(s.operador || s.camara) === "op-dron").length;
  const stats: [string, string, string, string][] = [
    ["Duración", total ? tc(total) : sinTc(r.duracion || b.duracion), r.formato || b.formato, "audiovisual"],
    ["Escenas", String(p.guionAudiovisual.length), `${p.guionTecnico.length} tomas`, "audiovisual"],
    ["Tomas aéreas", String(aereas), aereas ? "con dron" : "sin dron", "tecnico"],
    ["Rodaje", `${p.planRodaje.length} ${p.planRodaje.length === 1 ? "día" : "días"}`, `${p.locaciones.length} locaciones`, "rodaje"],
    ["Presupuesto", montoCorto(p.presupuesto.total), p.presupuesto.moneda, "presupuesto"],
  ];
  return (
    <Sec id="resumen" tab={tab} kicker="Visión general" titulo="Resumen">
      <div className="lb-stats">
        {stats.map(([k, v, s, t]) => (
          <button key={k} type="button" className="lb-stat" onClick={() => irA(t)}>
            <span className="lb-lab">{k}</span>
            <b title={v}>{v}</b>
            <small title={s}>{s}</small>
          </button>
        ))}
      </div>

      {total > 0 && (
        <div className="card lb-timeline">
          <div className="lb-timeline-head">
            <span className="lb-lab">Línea de tiempo</span>
            <span className="lb-tc">{tc(total)}</span>
          </div>
          <div className="lb-track">
            {p.guionAudiovisual.map((e, i) => (
              <button
                key={e.numero}
                type="button"
                className="lb-seg"
                style={{ flexGrow: Math.max(1, tiempos[i].fin - tiempos[i].ini) }}
                onClick={() => irA("audiovisual")}
                title={`${e.numero} · ${e.encabezado}`}
              >
                <b>{e.numero}</b>
                <span>{e.encabezado.replace(/^(INT|EXT)[^ ]*\s*/i, "").split(" - ")[0]}</span>
              </button>
            ))}
          </div>
          <div className="lb-ruler">
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <span key={f}>{tc(total * f)}</span>
            ))}
          </div>
        </div>
      )}

      <div className="lb-brief">
        {([["objetivo", "Objetivo"], ["publico", "Público"], ["tono", "Tono y estilo"]] as const).map(([k, label]) => (
          <div key={k} className="card">
            <span className="lb-lab">{label}</span>
            <Ed v={r[k]} on={(t) => campo(k, t)} edit={edit} block className="lb-p" />
          </div>
        ))}
      </div>
      {r.referencias.length > 0 && (
        <div className="card lb-refs">
          <span className="lb-lab">Referencias visuales</span>
          <ul>
            {r.referencias.map((x, n) => (
              <li key={n}>{x}</li>
            ))}
          </ul>
        </div>
      )}
    </Sec>
  );
}

// ───────────────────────── guion técnico ─────────────────────────

function Tomas({ p, tab, edit, plano, tiempos }: { p: Paquete; tab: string; edit: boolean; plano: (id: string, k: keyof Plano, v: string) => void; tiempos: { ini: number; fin: number }[] }) {
  const [filtro, setFiltro] = useState("");
  const ops = [...new Set(p.guionTecnico.map((s) => s.operador || s.camara).filter(Boolean))];
  const visibles = p.guionTecnico.filter((s) => !filtro || (s.operador || s.camara) === filtro);
  return (
    <Sec id="tecnico" tab={tab} kicker={`${p.guionTecnico.length} tomas`} titulo="Guion técnico">
      {ops.length > 1 && (
        <div className="lb-filter no-print" role="group" aria-label="Filtrar por cámara">
          <button type="button" className={!filtro ? "on" : ""} onClick={() => setFiltro("")}>Todas · {p.guionTecnico.length}</button>
          {ops.map((o) => (
            <button key={o} type="button" className={`${filtro === o ? "on " : ""}${tonoDe(o)}`} onClick={() => setFiltro(filtro === o ? "" : o)}>
              <i /> {o} · {p.guionTecnico.filter((s) => (s.operador || s.camara) === o).length}
            </button>
          ))}
        </div>
      )}
      {[...p.guionAudiovisual.map((e, i) => ({ e, i })), { e: null, i: -1 }].map(({ e, i }) => {
        const planos = visibles.filter((s) => (e ? s.escena === e.numero : !p.guionAudiovisual.some((x) => x.numero === s.escena)));
        if (!planos.length) return null;
        return (
          <div key={e?.numero ?? "otras"} className="lb-group">
            <div className="lb-group-head">
              <span className="lb-scene-n">{e ? String(e.numero).padStart(2, "0") : "··"}</span>
              <span className="lb-slug">{e ? e.encabezado : "Otras tomas"}</span>
              {e && <span className="lb-tc">{tc(tiempos[i].ini)} – {tc(tiempos[i].fin)}</span>}
            </div>
            {planos.map((s) => (
              <article key={s.id} className={`lb-shot ${tonoDe(s.operador || s.camara)}`}>
                <div className="lb-shot-frame">
                  <Cuadro p={p} id={s.id} />
                  <span className="lb-shot-id">{s.id}</span>
                </div>
                <div className="lb-shot-body">
                  <div className="lb-badges">
                    <span className="lb-badge strong">{s.tipoPlano}</span>
                    {s.angulo && <span className="lb-badge">{s.angulo}</span>}
                    {s.movimiento && <span className="lb-badge">{s.movimiento}</span>}
                    {s.lente && <span className="lb-badge lens">{s.lente}</span>}
                  </div>
                  <Ed v={s.descripcion} on={(t) => plano(s.id, "descripcion", t)} edit={edit} block className="lb-shot-desc" />
                  {(s.vozEnOff || edit) && <Ed v={s.vozEnOff} on={(t) => plano(s.id, "vozEnOff", t)} edit={edit} block className="lb-shot-vo" />}
                  {(s.audio || s.notas) && (
                    <div className="lb-shot-notes">
                      {s.audio && <span><span className="lb-lab">Audio</span> <Ed v={s.audio} on={(t) => plano(s.id, "audio", t)} edit={edit} /></span>}
                      {s.notas && <span><span className="lb-lab">Notas</span> <Ed v={s.notas} on={(t) => plano(s.id, "notas", t)} edit={edit} /></span>}
                    </div>
                  )}
                </div>
                <div className="lb-shot-side">
                  <span className="lb-op-chip"><i />{s.operador || s.camara}</span>
                  <span className="lb-tc">{sinTc(s.duracion)}</span>
                </div>
              </article>
            ))}
          </div>
        );
      })}
    </Sec>
  );
}
