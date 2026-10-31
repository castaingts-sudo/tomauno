import { gearDe } from "@/lib/camaras";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Countdown, ProgresoTomas, ThemeToggle, TomaCheck } from "@/components/share-ui";
import { tomasDe } from "@/lib/equipo";
import { materialDe, type HojaGuardada, type TomaHoja } from "@/lib/hoja";
import { ID_RE, segundos, tc } from "@/lib/share";
import { readJson } from "@/lib/store";
import type { Operador } from "@/lib/types";
import "../../../share.css";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; rol: string }> };

async function cargar(id: string, rol: string) {
  if (!ID_RE.test(id)) return null;
  const hoja = await readJson<HojaGuardada>(`equipo/${id}.json`);
  const op = hoja?.equipo.find((o) => o.id === rol);
  if (!hoja || !op) return null;
  const { ownerToken: _t, ...publica } = hoja;
  return { hoja: publica, op };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id, rol } = await params;
  const data = await cargar(id, rol);
  return { title: data ? `${data.op.rol} · ${data.hoja.titulo}` : "Hoja de llamado", robots: { index: false, follow: false } };
}

const svgSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const mapa = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

function Persona({ o, yo }: { o: Operador; yo: boolean }) {
  const tel = o.contacto.replace(/[^\d+]/g, "");
  const esTel = tel.replace(/\D/g, "").length >= 8;
  return (
    <div className={`tu-person${yo ? " me" : ""}`}>
      <span className="tu-role">{o.rol}{yo && " · tú"}</span>
      <span className="tu-name">{o.nombre || "Por confirmar"}</span>
      {gearDe(o) && <span className="tu-gear">{gearDe(o)}</span>}
      {o.contacto && !yo && (
        <div className="tu-actions">
          {esTel ? (
            <>
              <a className="tu-btn" href={`tel:${tel}`}>📞 Llamar</a>
              <a className="tu-btn" href={`https://wa.me/${tel.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>
            </>
          ) : (
            <span className="tu-gear">{o.contacto}</span>
          )}
        </div>
      )}
    </div>
  );
}

const CHECK_DRON = [
  "Autorización de vuelo y registro de la aeronave vigentes (AFAC en México o la autoridad local)",
  "Espacio aéreo, NOTAMs y distancia a aeropuertos y helipuertos revisados",
  "Pronóstico de viento y lluvia; límite de viento para cancelar definido",
  "Baterías de vuelo y de control cargadas; tarjetas formateadas",
  "Hélices y aeronave sin daños; firmware y brújula calibrados",
  "Zona de despegue y aterrizaje despejada; observador asignado",
  "Perímetro de seguridad con talento y público; plan de aterrizaje de emergencia",
];

export default async function HojaPage({ params }: Params) {
  const { id, rol } = await params;
  const data = await cargar(id, rol);
  if (!data) notFound();
  const { hoja, op } = data;
  const director = op.tipo === "director";

  // Orden de rodaje: el del plan; lo que no esté en el plan va al final.
  const orden = new Map<string, number>();
  hoja.planRodaje.forEach((d) => d.items.forEach((i) => i.planos.forEach((pid) => orden.has(pid) || orden.set(pid, orden.size))));
  const mias = (tomasDe(op, hoja.tomas, hoja.equipo) as TomaHoja[])
    .map((t, n) => ({ t, k: orden.get(t.id) ?? 10000 + n }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.t);
  const ids = new Set(mias.map((t) => t.id));

  const dias = hoja.planRodaje
    .map((d) => ({ ...d, items: director ? d.items : d.items.filter((i) => i.planos.some((pid) => ids.has(pid))) }))
    .filter((d) => d.items.length);
  const primero = dias[0];
  const primeraToma = primero?.items.find((i) => director || i.planos.some((pid) => ids.has(pid)));
  const material = materialDe(op.tipo, hoja.material);
  const operadores = hoja.equipo.filter((o) => o.tipo !== "director");
  const operadorDe = (t: TomaHoja) => operadores.find((o) => tomasDe(o, hoja.tomas, hoja.equipo).some((x) => x.id === t.id));
  const segTotal = mias.reduce((s, t) => s + (segundos(t.duracion) ?? 0), 0);
  const lentes = new Set(mias.map((t) => t.lente.trim()).filter(Boolean));
  const personas = director ? hoja.equipo : hoja.equipo.filter((o) => o.tipo === "director" || o.id === op.id);

  return (
    <div className="tu">
      <div className="tu-bar">
        <span className="tu-brand"><i>T1</i> Hoja de llamado</span>
        <div className="tu-bar-right">
          <span className="chip accent">{op.rol}</span>
          <ThemeToggle />
        </div>
      </div>

      <header className="tu-hero">
        <span className="kicker">{director ? "Dirección · todo el proyecto" : `${op.rol}${op.nombre ? ` · ${op.nombre}` : ""}`}</span>
        <h1>{hoja.titulo}</h1>
        {hoja.logline && <p className="tu-logline">{hoja.logline}</p>}
        <div className="tu-chips">
          {[hoja.duracion, hoja.formato, `${hoja.equipo.length} personas en set`].filter(Boolean).map((c) => (
            <span key={c} className="chip">{c}</span>
          ))}
        </div>
      </header>

      <section className="tu-call">
        <div>
          {hoja.fechaRodaje ? (
            <Countdown fecha={hoja.fechaRodaje} dias={hoja.planRodaje.length || 1} />
          ) : (
            <div className="tu-count">
              <span className="tu-count-big">{primero ? `Día ${primero.dia}` : "—"}</span>
              <span className="tu-count-label">{primero?.fecha || "Fecha por confirmar"}</span>
            </div>
          )}
        </div>
        <div>
          <p className="tu-label">Llamado</p>
          {(() => {
            // "04:45 en la finca, equipo hospedado…" → la hora en grande y el resto como nota.
            const ll = (primero?.llamado || "").trim();
            const m = ll.match(/^(\d{1,2}[:.]\d{2})\s*(?:h(?:rs?)?\.?)?\s*[,;.\-–—]?\s*(.*)$/i);
            const hora = m ? m[1].replace(".", ":") : ll.length <= 8 ? ll : "";
            const nota = m ? m[2] : hora ? "" : ll;
            return (
              <>
                <div className="tu-big">{hora || "—"}</div>
                {nota && <p className="tu-sub tu-nota">{nota}</p>}
              </>
            );
          })()}
          {primeraToma && <p className="tu-sub">{director ? "Arranca" : "Tu primera toma"}: {primeraToma.hora}</p>}
        </div>
        <div>
          <p className="tu-label">Locación</p>
          <div className="tu-loc-name">{primero?.locacion || "Por confirmar"}</div>
          {primero?.locacion && (
            <a className="tu-map" href={mapa(primero.locacion)} target="_blank" rel="noreferrer">↗ Abrir en Maps</a>
          )}
        </div>
      </section>

      <div className="tu-stats">
        <div className="tu-stat"><b>{mias.length}</b><span>{director ? "tomas en total" : "tus tomas"}</span></div>
        <div className="tu-stat"><b>{segTotal ? tc(segTotal) : "—"}</b><span>de pantalla</span></div>
        <div className="tu-stat"><b>{dias.length || "—"}</b><span>{dias.length === 1 ? "día" : "días"} de rodaje</span></div>
        <div className="tu-stat"><b>{director ? operadores.length : lentes.size || "—"}</b><span>{director ? "operadores" : "lentes"}</span></div>
      </div>

      {mias.length > 0 && <ProgresoTomas hoja={hoja.id} total={mias.length} ids={mias.map((t) => t.id)} />}

      <div className="tu-h2"><h2>Equipo en set</h2><span>contactos</span></div>
      <div className="tu-people">
        {personas.map((o) => <Persona key={o.id} o={o} yo={o.id === op.id} />)}
      </div>

      {dias.length > 0 && (
        <>
          <div className="tu-h2"><h2>{director ? "Plan de rodaje" : "Tu horario"}</h2><span>{dias.length} {dias.length === 1 ? "día" : "días"}</span></div>
          <div className="tu-panel">
            {dias.map((d) => (
              <div key={d.dia} className="tu-day">
                <div className="tu-day-head">
                  <span className="chip accent">Día {d.dia}</span>
                  <h3>{[d.fecha, d.locacion].filter(Boolean).join(" · ")}</h3>
                  <span className="chip">Llamado {d.llamado}</span>
                </div>
                <ol className="tu-tl">
                  {d.items.map((i, n) => (
                    <li key={n} className={i.planos.some((pid) => ids.has(pid)) ? "mine" : ""}>
                      <span className="tu-hour">{i.hora}</span>
                      <div>
                        {i.actividad}
                        {i.planos.length > 0 && (
                          <span className="tu-ids">
                            {i.planos.map((pid) => (
                              <a key={pid} href={`#toma-${pid}`} className={ids.has(pid) ? "mine" : ""}>{pid}</a>
                            ))}
                          </span>
                        )}
                        {i.locacion && i.locacion !== d.locacion && <small> · {i.locacion}</small>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="tu-h2"><h2>{director ? "Todas las tomas" : "Tus tomas"}</h2><span>en orden de rodaje</span></div>
      {mias.length === 0 && <p className="tu-panel">Aún no hay tomas asignadas a este rol. Pídele al productor que actualice los links.</p>}
      {mias.map((t) => {
        const esc = hoja.escenas.find((e) => e.numero === t.escena);
        const quien = director ? operadorDe(t) : undefined;
        return (
          <article key={t.id} id={`toma-${t.id}`} className="tu-shot">
            <div className="vf">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {t.imagen || t.svg ? <img src={t.imagen || svgSrc(t.svg!)} alt={t.cuadro || t.descripcion} loading="lazy" /> : <div className="vf-empty">Sin dibujo</div>}
              <span className="vf-tag">{t.id}</span>
              <span className="vf-meta"><span>{t.tipoPlano}</span><span>{t.lente}</span></span>
            </div>
            <div>
              <div className="tu-shot-head">
                <div>
                  <div className="tu-shot-id">{t.id}</div>
                  <div className="tu-shot-scene">Escena {t.escena}{esc && ` · ${esc.encabezado}`}</div>
                </div>
                {quien ? <span className="tu-who">{quien.rol}</span> : <TomaCheck hoja={hoja.id} id={t.id} />}
              </div>
              <dl className="tu-specs">
                <div><dt>Plano</dt><dd>{t.tipoPlano}</dd></div>
                <div><dt>Lente</dt><dd>{t.lente}</dd></div>
                <div><dt>Movimiento</dt><dd>{t.movimiento}</dd></div>
                <div><dt>Ángulo</dt><dd>{t.angulo}</dd></div>
                <div><dt>Cámara</dt><dd>{t.camara}</dd></div>
                <div><dt>Duración</dt><dd>{t.duracion}</dd></div>
              </dl>
              <p>{t.descripcion}</p>
              {t.cuadro && t.cuadro !== t.descripcion && <p className="tu-soft">Cuadro: {t.cuadro}</p>}
              {t.vozEnOff && <p className="tu-vo">{t.vozEnOff}</p>}
              {t.notas && <p className="tu-note">⚠ {t.notas}</p>}
              {director && <TomaCheck hoja={hoja.id} id={t.id} />}
            </div>
          </article>
        );
      })}

      {op.tipo === "dron" && (
        <>
          <div className="tu-h2"><h2>Seguridad y espacio aéreo</h2><span>RPAS</span></div>
          <div className="tu-panel">
            {hoja.locaciones.map((l, n) => (
              <div key={n} className="tu-loc">
                <h3>{l.nombre}</h3>
                {l.permisos && <p><b>Permisos:</b> {l.permisos}</p>}
                {l.riesgos && <p><b>Riesgos:</b> {l.riesgos}</p>}
              </div>
            ))}
          </div>
          <div className="tu-panel">
            <p className="tu-label">Antes de volar</p>
            <ul className="tu-list">
              {CHECK_DRON.map((c) => (
                <li key={c}><label><input type="checkbox" /> {c}</label></li>
              ))}
            </ul>
          </div>
        </>
      )}

      {director && (
        <>
          <div className="tu-h2"><h2>Guion y voz en off</h2><span>{hoja.escenas.length} escenas</span></div>
          <div className="tu-panel">
            {hoja.escenas.map((e) => (
              <div key={e.numero} className="tu-scene">
                <h3>{e.numero}. {e.encabezado} <span className="chip">{e.duracion}</span></h3>
                <p>{e.video}</p>
                {e.vozEnOff && <p className="tu-vo">{e.vozEnOff}</p>}
                {e.audio && <p className="tu-soft">♪ {e.audio}</p>}
                {e.textoPantalla && <p className="tu-soft">Texto en pantalla: {e.textoPantalla}</p>}
              </div>
            ))}
          </div>
          <div className="tu-h2"><h2>Locaciones y permisos</h2><span>{hoja.locaciones.length}</span></div>
          <div className="tu-panel">
            {hoja.locaciones.map((l, n) => (
              <div key={n} className="tu-loc">
                <h3>{l.nombre}</h3>
                <p>{l.descripcion}</p>
                {l.permisos && <p><b>Permisos:</b> {l.permisos}</p>}
                {l.riesgos && <p><b>Riesgos:</b> {l.riesgos}</p>}
              </div>
            ))}
          </div>
          <div className="tu-h2"><h2>Hojas del equipo</h2><span>lo que ve cada quien</span></div>
          <div className="tu-team-links">
            {operadores.map((o) => (
              <a key={o.id} href={`/e/${hoja.id}/${o.id}`}>
                <span className="tu-role">{o.rol}</span>
                <b>{o.nombre || "Por confirmar"}</b>
                <span className="tu-gear">{tomasDe(o, hoja.tomas, hoja.equipo).length} tomas →</span>
              </a>
            ))}
          </div>
        </>
      )}

      {material.length > 0 && (
        <>
          <div className="tu-h2"><h2>{director ? "Equipo técnico" : "Tu equipo"}</h2><span>checklist de carga</span></div>
          <div className="tu-panel">
            <ul className="tu-list">
              {material.map((m, n) => (
                <li key={n}><label><input type="checkbox" /> <span><b>{m.cantidad}×</b> {m.item} {m.notas && <small>· {m.notas}</small>}</span></label></li>
              ))}
            </ul>
          </div>
        </>
      )}

      <footer className="tu-foot">
        Actualizado {new Date(hoja.actualizado).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })} · Toma uno
      </footer>
    </div>
  );
}
