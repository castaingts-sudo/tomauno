"use client";

// Panel del administrador: ingresos, clientes, tomas y gasto de IA. Entra con TOMA_ADMIN_CODE.
import Link from "next/link";
import { useEffect, useState } from "react";
import { claveAdmin, guardarAdmin } from "@/lib/acceso-cliente";
import { ThemeToggle } from "@/components/share-ui";

interface Datos {
  stripe: boolean;
  webhook: boolean;
  resumen: { ingresos: number; ingresosMes: number; clientes: number; suscripcionesActivas: number; proyectos: number; tomasUsadas: number; dibujos: number; costoIA: number };
  clientes: { email: string; nombre: string; plan: string; mensual: boolean; activo: boolean; creado: string; tomas: number; usadas: number; restantes: number; proyectos: number; dibujos: number; pagado: number }[];
  pagos: { fecha: string; centavos: number; concepto: string; email: string; nombre: string }[];
  usos: { fecha: string; tipo: string; cantidad: number; titulo?: string; costo: number; cliente: string }[];
}

const mxn = (n: number) => `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
const fecha = (s: string) => new Date(s).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Admin() {
  const [clave, setClave] = useState("");
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function cargar(c: string) {
    setCargando(true);
    setError("");
    try {
      const r = await fetch("/api/admin", { headers: { "x-toma-admin": c }, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
      guardarAdmin(c);
      setDatos(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { const c = claveAdmin(); if (c) cargar(c); }, []);

  if (!datos) {
    return (
      <main className="ad ad-login">
        <form onSubmit={(e) => { e.preventDefault(); cargar(clave.trim()); }}>
          <div className="brand-mark">T1</div>
          <h1>Administración</h1>
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Clave de administrador" autoFocus />
          <button type="submit" disabled={cargando || !clave.trim()}>{cargando ? "Entrando…" : "Entrar"}</button>
          {error && <p className="ad-err">{error}</p>}
        </form>
      </main>
    );
  }

  const r = datos.resumen;
  const margen = r.ingresos - r.costoIA;
  return (
    <main className="ad">
      <header className="ad-top">
        <Link href="/" className="ad-brand"><span className="brand-mark">T1</span> Toma uno · Admin</Link>
        <div className="ad-top-r">
          <Link className="btn" href="/estudio">Estudio</Link>
          <button onClick={() => cargar(claveAdmin())} disabled={cargando}>{cargando ? "…" : "↻ Actualizar"}</button>
          <button onClick={() => { guardarAdmin(""); setDatos(null); }}>Salir</button>
          <ThemeToggle />
        </div>
      </header>

      {(!datos.stripe || !datos.webhook) && (
        <p className="ad-aviso">
          {!datos.stripe ? "Cobro apagado: falta STRIPE_SECRET_KEY en Vercel, así que el estudio está abierto para todos. " : ""}
          {!datos.webhook ? "Falta STRIPE_WEBHOOK_SECRET: las renovaciones mensuales no se registran." : ""}
        </p>
      )}

      <section className="ad-kpis">
        {[
          ["Ingresos totales", mxn(r.ingresos)],
          ["Este mes", mxn(r.ingresosMes)],
          ["Clientes", String(r.clientes)],
          ["Suscripciones activas", String(r.suscripcionesActivas)],
          ["Proyectos generados", String(r.proyectos)],
          ["Tomas usadas", String(r.tomasUsadas)],
          ["Dibujos", String(r.dibujos)],
          ["Gasto IA aprox.", mxn(r.costoIA)],
          ["Margen aprox.", mxn(margen)],
        ].map(([k, v]) => (
          <div key={k} className="ad-kpi"><span className="lb-lab">{k}</span><b>{v}</b></div>
        ))}
      </section>

      <section className="ad-sec">
        <h2>Clientes</h2>
        <div className="ad-tabla">
          <table>
            <thead><tr><th>Cliente</th><th>Plan</th><th>Estado</th><th>Tomas</th><th>Proyectos</th><th>Pagado</th><th>Desde</th></tr></thead>
            <tbody>
              {datos.clientes.map((c, i) => (
                <tr key={i}>
                  <td><b>{c.nombre || "—"}</b><small>{c.email}</small></td>
                  <td>{c.plan}{c.mensual ? " · mes" : ""}</td>
                  <td><span className={`ad-st ${c.activo ? "on" : "off"}`}>{c.activo ? "Activo" : "Cancelado"}</span></td>
                  <td>{c.usadas}/{c.tomas}<small>quedan {c.restantes}</small></td>
                  <td>{c.proyectos}<small>{c.dibujos} dibujos</small></td>
                  <td>{mxn(c.pagado)}</td>
                  <td>{fecha(c.creado)}</td>
                </tr>
              ))}
              {!datos.clientes.length && <tr><td colSpan={7} className="ad-vacio">Todavía no hay clientes.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ad-dos">
        <section className="ad-sec">
          <h2>Pagos</h2>
          <ul className="ad-lista">
            {datos.pagos.map((p, i) => (
              <li key={i}><span>{fecha(p.fecha)}</span><b>{mxn(p.centavos / 100)}</b><em>{p.concepto} · {p.email}</em></li>
            ))}
            {!datos.pagos.length && <li className="ad-vacio">Sin pagos todavía.</li>}
          </ul>
        </section>
        <section className="ad-sec">
          <h2>Actividad</h2>
          <ul className="ad-lista">
            {datos.usos.map((u, i) => (
              <li key={i}><span>{fecha(u.fecha)}</span><b>{u.tipo === "proyecto" ? `${u.cantidad} tomas` : `${u.cantidad} dibujos`}</b><em>{u.titulo || "Sin título"} · {u.cliente}</em></li>
            ))}
            {!datos.usos.length && <li className="ad-vacio">Sin actividad todavía.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
