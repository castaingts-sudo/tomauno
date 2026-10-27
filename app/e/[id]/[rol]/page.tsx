import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tomasDe } from "@/lib/equipo";
import { materialDe, type HojaGuardada, type TomaHoja } from "@/lib/hoja";
import { ID_RE } from "@/lib/share";
import { readJson } from "@/lib/store";
import type { Operador } from "@/lib/types";
import "../hoja.css";

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

function Contacto({ o }: { o: Operador }) {
  const tel = o.contacto.replace(/[^\d+]/g, "");
  const esTel = tel.replace(/\D/g, "").length >= 8;
  return (
    <li>
      <b>{o.rol}</b> {o.nombre && <span>· {o.nombre}</span>}
      {o.equipo && <span className="hj-gear-line">{o.equipo}</span>}
      {o.contacto &&
        (esTel ? (
          <span className="hj-links">
            <a href={`tel:${tel}`}>📞 {o.contacto}</a>
            <a href={`https://wa.me/${tel.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>
          </span>
        ) : (
          <span className="hj-links">{o.contacto}</span>
        ))}
    </li>
  );
}

const CHECK_DRON = [
  "Autorización de vuelo y registro de la aeronave vigentes (AFAC en México o la autoridad local)",
  "Revisar espacio aéreo, NOTAMs y distancia a aeropuertos y helipuertos",
  "Pronóstico de viento y lluvia; definir el límite de viento para cancelar",
  "Baterías de vuelo y de control cargadas; tarjetas formateadas",
  "Hélices y aeronave sin daños; firmware y calibración de brújula",
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
  const material = materialDe(op.tipo, hoja.material);
  const jefe = hoja.equipo.find((o) => o.tipo === "director");
  const operadorDe = (t: TomaHoja) => hoja.equipo.find((o) => tomasDe(o, hoja.tomas, hoja.equipo).some((x) => x.id === t.id) && o.tipo !== "director");

  return (
    <div className="hoja">
      <header className="hj-head">
        <p className="hj-kicker">Hoja de llamado · {op.rol}</p>
        <h1>{hoja.titulo}</h1>
        {hoja.logline && <p className="hj-logline">{hoja.logline}</p>}
        <p className="hj-meta">
          {[op.nombre && `Para ${op.nombre}`, `${mias.length} ${mias.length === 1 ? "toma" : "tomas"}`, dias.length && `${dias.length} ${dias.length === 1 ? "día" : "días"} de rodaje`, hoja.formato].filter(Boolean).join(" · ")}
        </p>
      </header>

      <section className="hj-card">
        <h2>Contactos</h2>
        <ul className="hj-contacts">
          {(director ? hoja.equipo : [jefe, op].filter((o): o is Operador => !!o && (o.tipo === "director" || o.id === op.id))).map((o) => (
            <Contacto key={o.id} o={o} />
          ))}
        </ul>
      </section>

      {dias.length > 0 && (
        <section className="hj-card">
          <h2>{director ? "Plan de rodaje" : "Tu horario"}</h2>
          {dias.map((d) => (
            <div key={d.dia} className="hj-day">
              <h3>
                Día {d.dia}
                {d.fecha && ` · ${d.fecha}`} · {d.locacion}
              </h3>
              <p className="hj-call">Llamado {d.llamado}</p>
              <ol className="hj-sched">
                {d.items.map((i, n) => (
                  <li key={n}>
                    <span className="hj-hour">{i.hora}</span>
                    <div>
                      {i.actividad}
                      {i.planos.length > 0 && (
                        <span className="hj-chips">
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
        </section>
      )}

      <section>
        <h2 className="hj-sec">{director ? `Todas las tomas (${mias.length})` : `Tus tomas (${mias.length})`}</h2>
        {mias.length === 0 && <p className="hj-card">Aún no hay tomas asignadas a este rol. Pídele al director que actualice los links.</p>}
        {mias.map((t) => {
          const esc = hoja.escenas.find((e) => e.numero === t.escena);
          const quien = director ? operadorDe(t) : undefined;
          return (
            <article key={t.id} id={`toma-${t.id}`} className="hj-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {t.svg ? <img src={svgSrc(t.svg)} alt={t.cuadro || t.descripcion} loading="lazy" /> : <div className="hj-noimg">Sin dibujo</div>}
              <div className="hj-shot-body">
                <p className="hj-shot-id">
                  <b>{t.id}</b> Escena {t.escena}
                  {esc && ` · ${esc.encabezado}`}
                  {quien && <span className="hj-who">{quien.rol}</span>}
                </p>
                <dl className="hj-specs">
                  <dt>Plano</dt><dd>{t.tipoPlano}</dd>
                  <dt>Ángulo</dt><dd>{t.angulo}</dd>
                  <dt>Movimiento</dt><dd>{t.movimiento}</dd>
                  <dt>Lente</dt><dd>{t.lente}</dd>
                  <dt>Duración</dt><dd>{t.duracion}</dd>
                </dl>
                <p>{t.descripcion}</p>
                {t.cuadro && t.cuadro !== t.descripcion && <p className="hj-soft">Cuadro: {t.cuadro}</p>}
                {t.vozEnOff && <blockquote>{t.vozEnOff}</blockquote>}
                {t.notas && <p className="hj-note">⚠️ {t.notas}</p>}
              </div>
            </article>
          );
        })}
      </section>

      {op.tipo === "dron" && (
        <section className="hj-card hj-air">
          <h2>Seguridad y espacio aéreo</h2>
          {hoja.locaciones.map((l, n) => (
            <div key={n} className="hj-loc">
              <h3>{l.nombre}</h3>
              {l.permisos && <p><b>Permisos:</b> {l.permisos}</p>}
              {l.riesgos && <p><b>Riesgos:</b> {l.riesgos}</p>}
            </div>
          ))}
          <h3>Antes de volar</h3>
          <ul className="hj-check">
            {CHECK_DRON.map((c) => (
              <li key={c}><label><input type="checkbox" /> {c}</label></li>
            ))}
          </ul>
        </section>
      )}

      {director && (
        <>
          <section className="hj-card">
            <h2>Guion y voz en off</h2>
            {hoja.escenas.map((e) => (
              <div key={e.numero} className="hj-scene">
                <h3>{e.numero}. {e.encabezado} <small>{e.duracion}</small></h3>
                <p>{e.video}</p>
                {e.vozEnOff && <blockquote>{e.vozEnOff}</blockquote>}
                {e.audio && <p className="hj-soft">♪ {e.audio}</p>}
                {e.textoPantalla && <p className="hj-soft">Texto en pantalla: {e.textoPantalla}</p>}
              </div>
            ))}
          </section>
          <section className="hj-card">
            <h2>Locaciones y permisos</h2>
            {hoja.locaciones.map((l, n) => (
              <div key={n} className="hj-loc">
                <h3>{l.nombre}</h3>
                <p>{l.descripcion}</p>
                {l.permisos && <p><b>Permisos:</b> {l.permisos}</p>}
                {l.riesgos && <p><b>Riesgos:</b> {l.riesgos}</p>}
              </div>
            ))}
          </section>
          <section className="hj-card">
            <h2>Hojas del equipo</h2>
            <ul className="hj-contacts">
              {hoja.equipo.filter((o) => o.tipo !== "director").map((o) => (
                <li key={o.id}>
                  <a href={`/e/${hoja.id}/${o.id}`}>{o.rol}{o.nombre && ` · ${o.nombre}`}</a> <small>{tomasDe(o, hoja.tomas, hoja.equipo).length} tomas</small>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {material.length > 0 && (
        <section className="hj-card">
          <h2>{director ? "Equipo técnico" : "Tu equipo"}</h2>
          <ul className="hj-gear">
            {material.map((m, n) => (
              <li key={n}><label><input type="checkbox" /> <b>{m.cantidad}×</b> {m.item} {m.notas && <small>· {m.notas}</small>}</label></li>
            ))}
          </ul>
        </section>
      )}

      <footer className="hj-foot">
        Actualizado {new Date(hoja.actualizado).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })} · Preparado con Toma uno
      </footer>
    </div>
  );
}
