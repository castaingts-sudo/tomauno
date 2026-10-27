"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Comentario } from "@/lib/share";

const NAME_KEY = "toma-uno:nombre";

function useNombre() {
  const [nombre, setNombre] = useState("");
  useEffect(() => {
    try {
      setNombre(localStorage.getItem(NAME_KEY) || "");
    } catch {}
    // Mantiene el mismo nombre en todos los formularios de la página.
    const sync = (e: Event) => setNombre((e as CustomEvent<string>).detail);
    window.addEventListener(NAME_KEY, sync);
    return () => window.removeEventListener(NAME_KEY, sync);
  }, []);
  const guardar = (n: string) => {
    try {
      localStorage.setItem(NAME_KEY, n);
    } catch {}
    window.dispatchEvent(new CustomEvent(NAME_KEY, { detail: n }));
  };
  return [nombre, guardar] as const;
}

async function enviar(id: string, c: Omit<Comentario, "fecha">) {
  const res = await fetch(`/api/share/${id}/comentarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "No se pudo enviar.");
}

function Lista({ comentarios }: { comentarios: Comentario[] }) {
  if (!comentarios.length) return null;
  return (
    <ul className="rv-comments">
      {comentarios.map((c, i) => (
        <li key={i} className={c.tipo}>
          <b>{c.nombre}</b>
          {c.tipo === "aprobado" && <span className="rv-badge ok">Aprobado</span>}
          {c.tipo === "cambios" && <span className="rv-badge chg">Pidió cambios</span>}
          <small>{new Date(c.fecha).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</small>
          {c.texto && <p>{c.texto}</p>}
        </li>
      ))}
    </ul>
  );
}

export function ComentarEscena({ id, escena, comentarios }: { id: string; escena: number; comentarios: Comentario[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useNombre();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      await enviar(id, { escena, nombre, texto, tipo: "comentario" });
      setTexto("");
      setAbierto(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rv-feedback">
      <Lista comentarios={comentarios} />
      {abierto ? (
        <form onSubmit={submit} className="rv-form">
          <input placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <textarea autoFocus rows={3} placeholder="¿Qué cambiarías en esta escena?" value={texto} onChange={(e) => setTexto(e.target.value)} required />
          <div className="rv-row">
            <button type="submit" className="rv-btn primary" disabled={enviando}>{enviando ? "Enviando…" : "Enviar comentario"}</button>
            <button type="button" className="rv-btn" onClick={() => setAbierto(false)}>Cancelar</button>
          </div>
          {error && <p className="rv-error">{error}</p>}
        </form>
      ) : (
        <button className="rv-btn ghost" onClick={() => setAbierto(true)}>💬 Comentar esta escena</button>
      )}
    </div>
  );
}

export function Aprobacion({ id, comentarios }: { id: string; comentarios: Comentario[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useNombre();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState<"" | Comentario["tipo"]>("");
  const [error, setError] = useState("");
  const [listo, setListo] = useState("");

  async function mandar(tipo: Comentario["tipo"]) {
    if (tipo === "cambios" && !texto.trim()) {
      setError("Cuéntanos qué cambios necesitas.");
      return;
    }
    setEnviando(tipo);
    setError("");
    try {
      await enviar(id, { escena: null, nombre, texto, tipo });
      setTexto("");
      setListo(tipo === "aprobado" ? "¡Gracias! Registramos tu aprobación." : "¡Gracias! Recibimos tus comentarios.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setEnviando("");
    }
  }

  return (
    <section className="rv-approve">
      <h2>¿Cómo lo ves?</h2>
      <p>Cuando termines de revisar, apruébalo o dinos qué cambiarías.</p>
      <Lista comentarios={comentarios} />
      <input placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <textarea rows={3} placeholder="Comentarios generales (opcional para aprobar)" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div className="rv-row">
        <button className="rv-btn ok" disabled={!!enviando} onClick={() => mandar("aprobado")}>
          {enviando === "aprobado" ? "Enviando…" : "✅ Aprobar"}
        </button>
        <button className="rv-btn chg" disabled={!!enviando} onClick={() => mandar("cambios")}>
          {enviando === "cambios" ? "Enviando…" : "✏️ Pedir cambios"}
        </button>
      </div>
      {error && <p className="rv-error">{error}</p>}
      {listo && <p className="rv-done">{listo}</p>}
    </section>
  );
}
