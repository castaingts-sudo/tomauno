"use client";

// Acceso al estudio: tomas disponibles, activación al regresar de Stripe, código para otro dispositivo y entrada del administrador.
import Link from "next/link";
import { useEffect, useState } from "react";
import { claveAdmin, guardarAdmin, guardarToken, tokenAcceso } from "@/lib/acceso-cliente";

const SITIO = "https://www.toma1.com.mx";

interface Estado { token: string; plan: string; mensual: boolean; tomas: number; usadas: number; restantes: number; activo: boolean; email: string; conClave?: boolean }

export function Acceso() {
  const [cobro, setCobro] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [mandando, setMandando] = useState(false);
  const [acc, setAcc] = useState<Estado | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [hayMail, setHayMail] = useState(false);
  const [viejo, setViejo] = useState(false);
  const [pasando, setPasando] = useState(false);
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [listo, setListo] = useState("");

  async function consultar(qs: string, cabAdmin?: string) {
    const r = await fetch(`/api/acceso?${qs}`, { headers: cabAdmin ? { "x-toma-admin": cabAdmin } : {} });
    const j = await r.json().catch(() => ({}));
    setCobro(Boolean(j.cobro));
    setHayMail(Boolean(j.correo));
    return { ok: r.ok, j };
  }

  useEffect(() => {
    (async () => {
      setViejo(window.location.hostname.endsWith(".vercel.app"));
      const url = new URL(window.location.href);
      const pago = url.searchParams.get("pago");
      const entrada = url.searchParams.get("entrar");
      if (entrada) {
        url.searchParams.delete("entrar");
        window.history.replaceState(null, "", url.pathname + url.search);
        const r = await fetch(`/api/entrar?id=${encodeURIComponent(entrada)}`);
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.token) {
          guardarToken(j.token);
          setAviso(`Entraste como ${j.email}. Tus proyectos se están cargando.`);
        } else setAviso(j.error || "No se pudo entrar con ese link.");
        setAbierto(true);
      }
      if (pago) {
        url.searchParams.delete("pago");
        window.history.replaceState(null, "", url.pathname + url.search);
        const { ok, j } = await consultar(`session_id=${encodeURIComponent(pago)}`);
        if (ok && j.acceso) {
          guardarToken(j.acceso.token);
          setAcc(j.acceso);
          setAviso(`¡Pago recibido! Tienes ${j.acceso.restantes} tomas. Crea tu contraseña para entrar desde cualquier computadora.`);
          setAbierto(true);
          return;
        }
        setAviso(j.error || "No pudimos confirmar el pago. Si ya pagaste, recarga en un minuto.");
        setAbierto(true);
      }
      if (claveAdmin()) {
        const { j } = await consultar("", claveAdmin());
        if (j.admin) { setAdmin(true); return; }
        guardarAdmin("");
      }
      const t = tokenAcceso();
      const { j } = await consultar(t ? `token=${encodeURIComponent(t)}` : "");
      if (j.acceso) setAcc(j.acceso);
      else if (t) guardarToken("");
    })();
  }, []);

  async function pedirLink(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setMandando(true);
    const r = await fetch("/api/entrar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: correo.trim() }) });
    const j = await r.json().catch(() => ({}));
    setMandando(false);
    if (r.ok) setEnviado(true);
    else setError(j.error || "No se pudo enviar el link.");
  }

  async function iniciar(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setEntrando(true);
    const r = await fetch("/api/sesion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: correo.trim(), clave }) });
    const j = await r.json().catch(() => ({}));
    setEntrando(false);
    if (!r.ok || !j.token) { setError(j.error || "No se pudo entrar."); return; }
    guardarToken(j.token);
    setClave("");
    const t = await consultar(`token=${encodeURIComponent(j.token)}`);
    if (t.j.acceso) setAcc(t.j.acceso);
    setAviso(`Entraste como ${j.email}.`);
  }

  async function crearClave(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setListo("");
    if (clave !== clave2) { setError("Las contraseñas no coinciden."); return; }
    setEntrando(true);
    const r = await fetch("/api/sesion", { method: "PUT", headers: { "Content-Type": "application/json", "x-toma-acceso": tokenAcceso() }, body: JSON.stringify({ email: correo.trim(), clave }) });
    const j = await r.json().catch(() => ({}));
    setEntrando(false);
    if (!r.ok) { setError(j.error || "No se pudo guardar."); return; }
    setClave(""); setClave2("");
    setAcc((a) => (a ? { ...a, email: j.email, conClave: true } : a));
    setListo(`Listo. Ya puedes entrar en cualquier computadora con ${j.email} y tu contraseña.`);
  }

  async function entrar(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    const c = codigo.trim();
    if (!c) return;
    const a = await consultar("", c);
    if (a.j.admin) { guardarAdmin(c); setAdmin(true); setCodigo(""); setAbierto(false); return; }
    const t = await consultar(`token=${encodeURIComponent(c)}`);
    if (t.j.acceso) { guardarToken(c); setAcc(t.j.acceso); setCodigo(""); return; }
    setError("Ese código no existe.");
  }

  // El estudio vive en www.toma1.com.mx: desde la dirección vieja se pasa la sesión con un link de un solo uso.
  async function pasarADominio() {
    setPasando(true);
    const r = await fetch("/api/entrar", { method: "PUT", headers: { "x-toma-acceso": tokenAcceso() } });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.id) window.location.href = `${SITIO}/estudio?entrar=${j.id}`;
    else { setPasando(false); setError(j.error || "No se pudo pasar la sesión."); setAbierto(true); }
  }

  const formClave = () => (
    <form onSubmit={crearClave} className="acc-login">
      {!acc?.email && <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Tu correo" aria-label="Correo" autoComplete="username" required />}
      {acc?.email && <input type="email" value={acc.email} readOnly aria-label="Correo" autoComplete="username" hidden />}
      <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Contraseña (mínimo 8)" aria-label="Contraseña nueva" autoComplete="new-password" minLength={8} required />
      <input type="password" value={clave2} onChange={(e) => setClave2(e.target.value)} placeholder="Repite la contraseña" aria-label="Repite la contraseña" autoComplete="new-password" minLength={8} required />
      <button type="submit" disabled={entrando}>{entrando ? "Guardando…" : "Guardar contraseña"}</button>
    </form>
  );

  if (admin) return <Link className="acc-chip admin" href="/admin">★ Admin</Link>;
  if (!cobro && !acc) return null;

  return (
    <div className="acc">
      <button type="button" className={`acc-chip${acc && acc.restantes > 0 ? "" : " vacio"}`} onClick={() => setAbierto(!abierto)}>
        {acc ? `${acc.restantes} tomas` : "Iniciar sesión"}
      </button>
      {viejo && acc && (
        <button type="button" className="acc-chip" onClick={pasarADominio} disabled={pasando}>{pasando ? "Abriendo…" : "Abrir en toma1.com.mx →"}</button>
      )}
      {abierto && (
        <div className="acc-panel" role="dialog">
          {aviso && <p className="acc-aviso">{aviso}</p>}
          {acc ? (
            <>
              <span className="lb-lab">Tu plan</span>
              <b className="acc-plan">{acc.plan}{acc.mensual ? " · mensual" : ""}</b>
              <div className="acc-barra"><i style={{ width: `${acc.tomas ? (acc.usadas / acc.tomas) * 100 : 0}%` }} /></div>
              <p className="acc-dato">{acc.usadas} de {acc.tomas} tomas usadas · quedan <b>{acc.restantes}</b></p>
              {acc.email && <p className="acc-dato">{acc.email}</p>}
              <a className="btn primary" href={`/api/checkout?plan=extra&token=${encodeURIComponent(acc.token)}`}>＋ 25 tomas más · $791</a>
              {listo && <p className="acc-aviso">{listo}</p>}
              {acc.conClave ? (
                <details>
                  <summary>Cambiar contraseña</summary>
                  {formClave()}
                </details>
              ) : (
                <>
                  <span className="lb-lab acc-sep">Crea tu contraseña</span>
                  <p className="acc-dato">Para entrar desde cualquier computadora con tu correo y contraseña.</p>
                  {formClave()}
                </>
              )}
            </>
          ) : (
            <>
              <b className="acc-plan">Inicia sesión</b>
              <form onSubmit={iniciar} className="acc-login">
                <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Correo" aria-label="Correo" autoComplete="username" required />
                <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Contraseña" aria-label="Contraseña" autoComplete="current-password" required />
                <button type="submit" className="primary" disabled={entrando}>{entrando ? "Entrando…" : "Entrar"}</button>
              </form>
              {hayMail && (enviado ? (
                <p className="acc-aviso">Si {correo} tiene un plan, te llegó un link para entrar. Revisa también spam.</p>
              ) : (
                <button type="button" className="acc-salir" onClick={(e) => { if (correo.trim()) pedirLink(e as unknown as React.FormEvent); else setError("Escribe tu correo y te mandamos un link para entrar."); }} disabled={mandando}>¿Olvidaste tu contraseña? Te mandamos un link</button>
              ))}
              <details>
                <summary>Entrar con código de acceso</summary>
                <form onSubmit={entrar} className="acc-form">
                  <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código de acceso" aria-label="Código de acceso" />
                  <button type="submit">Entrar</button>
                </form>
              </details>
              <span className="lb-lab acc-sep">¿Aún no tienes plan?</span>
              <p className="acc-dato">Pagas por proyecto o por mes, según las tomas que necesites.</p>
              <Link className="btn primary" href="/#planes">Ver planes</Link>
            </>
          )}
          {acc && <button type="button" className="acc-salir" onClick={() => { guardarToken(""); window.location.reload(); }}>Cerrar sesión</button>}
          {error && <small className="acc-err">{error}</small>}
        </div>
      )}
    </div>
  );
}
