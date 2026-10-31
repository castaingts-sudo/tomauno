"use client";

// Acceso al estudio: tomas disponibles, activación al regresar de Stripe, código para otro dispositivo y entrada del administrador.
import Link from "next/link";
import { useEffect, useState } from "react";
import { claveAdmin, guardarAdmin, guardarToken, tokenAcceso } from "@/lib/acceso-cliente";

interface Estado { token: string; plan: string; mensual: boolean; tomas: number; usadas: number; restantes: number; activo: boolean; email: string }

export function Acceso() {
  const [cobro, setCobro] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [acc, setAcc] = useState<Estado | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");

  async function consultar(qs: string, cabAdmin?: string) {
    const r = await fetch(`/api/acceso?${qs}`, { headers: cabAdmin ? { "x-toma-admin": cabAdmin } : {} });
    const j = await r.json().catch(() => ({}));
    setCobro(Boolean(j.cobro));
    return { ok: r.ok, j };
  }

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const pago = url.searchParams.get("pago");
      if (pago) {
        url.searchParams.delete("pago");
        window.history.replaceState(null, "", url.pathname + url.search);
        const { ok, j } = await consultar(`session_id=${encodeURIComponent(pago)}`);
        if (ok && j.acceso) {
          guardarToken(j.acceso.token);
          setAcc(j.acceso);
          setAviso(`¡Pago recibido! Tienes ${j.acceso.restantes} tomas para tus proyectos.`);
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

  if (admin) return <Link className="acc-chip admin" href="/admin">★ Admin</Link>;
  if (!cobro && !acc) return null;

  return (
    <div className="acc">
      <button type="button" className={`acc-chip${acc && acc.restantes > 0 ? "" : " vacio"}`} onClick={() => setAbierto(!abierto)}>
        {acc ? `${acc.restantes} tomas` : "Elegir plan"}
      </button>
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
              <details>
                <summary>Usar en otro dispositivo</summary>
                <p className="acc-dato">Tus proyectos se guardan en tu cuenta. Pega este código en el otro equipo y aparecen ahí:</p>
                <code className="acc-code">{acc.token}</code>
                <button type="button" onClick={() => navigator.clipboard?.writeText(acc.token)}>Copiar código</button>
              </details>
            </>
          ) : (
            <>
              <b className="acc-plan">Elige un plan para generar</b>
              <p className="acc-dato">Pagas por proyecto o por mes, según las tomas que necesites.</p>
              <Link className="btn primary" href="/#planes">Ver planes</Link>
            </>
          )}
          <form onSubmit={entrar} className="acc-form">
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder={acc ? "Otro código de acceso" : "Tengo un código de acceso"} aria-label="Código de acceso" />
            <button type="submit">Entrar</button>
          </form>
          {error && <small className="acc-err">{error}</small>}
        </div>
      )}
    </div>
  );
}
