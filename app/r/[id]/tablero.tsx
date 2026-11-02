"use client";

import { useCallback, useEffect, useState } from "react";

// Storyboard del link de cliente: cuadros grandes, datos de cámara fuera del dibujo
// y visor a pantalla completa para recorrer todo el storyboard con flechas.

export interface CuadroCliente {
  planoId: string;
  src?: string;
  descripcion: string;
  tipoPlano: string;
  movimiento: string;
  escena: number;
  encabezado: string;
  vozEnOff?: string;
}

export function Tablero({ todos, escena }: { todos: CuadroCliente[]; escena: number }) {
  const [abierto, setAbierto] = useState<number | null>(null);
  const propios = todos.map((c, i) => ({ c, i })).filter((x) => x.c.escena === escena);
  if (!propios.length) return null;
  return (
    <>
      <div className={`rv-tablero n${Math.min(propios.length, 3)}`}>
        {propios.map(({ c, i }) => (
          <figure key={c.planoId} className="rv-cuadro">
            <button type="button" className="rv-cuadro-img" onClick={() => setAbierto(i)} aria-label={`Ver ${c.planoId} en grande`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.src ? <img src={c.src} alt={c.descripcion} loading="lazy" /> : <span className="vf-empty">Dibujo en proceso</span>}
              <span className="rv-cuadro-id">{c.planoId}</span>
              <span className="rv-cuadro-zoom" aria-hidden>⤢</span>
            </button>
            <figcaption>
              <span className="rv-cuadro-cam">
                <b>{c.tipoPlano}</b>
                {c.movimiento && <span>{c.movimiento}</span>}
              </span>
              <span className="rv-cuadro-txt">{c.descripcion}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {abierto !== null && <Visor todos={todos} inicio={abierto} cerrar={() => setAbierto(null)} />}
    </>
  );
}

function Visor({ todos, inicio, cerrar }: { todos: CuadroCliente[]; inicio: number; cerrar: () => void }) {
  const [i, setI] = useState(inicio);
  const ir = useCallback((d: number) => setI((v) => (v + d + todos.length) % todos.length), [todos.length]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowRight") ir(1);
      if (e.key === "ArrowLeft") ir(-1);
    };
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [cerrar, ir]);
  const c = todos[i];
  return (
    <div className="rv-visor" role="dialog" aria-modal="true" aria-label={`Cuadro ${c.planoId}`} onClick={cerrar}>
      <div className="rv-visor-top" onClick={(e) => e.stopPropagation()}>
        <span>ESC {c.escena} · {c.encabezado}</span>
        <span>{i + 1} / {todos.length}</span>
        <button type="button" onClick={cerrar} aria-label="Cerrar">✕</button>
      </div>
      <div className="rv-visor-frame" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {c.src && <img key={c.planoId} src={c.src} alt={c.descripcion} />}
        <button type="button" className="rv-visor-nav prev" onClick={() => ir(-1)} aria-label="Anterior">‹</button>
        <button type="button" className="rv-visor-nav next" onClick={() => ir(1)} aria-label="Siguiente">›</button>
      </div>
      <div className="rv-visor-info" onClick={(e) => e.stopPropagation()}>
        <p className="rv-visor-cam"><b>{c.planoId}</b> {c.tipoPlano}{c.movimiento ? ` · ${c.movimiento}` : ""}</p>
        <p>{c.descripcion}</p>
        {c.vozEnOff && <p className="rv-visor-vo">{c.vozEnOff}</p>}
      </div>
      <div className="rv-visor-tira" onClick={(e) => e.stopPropagation()}>
        {todos.map((x, k) => (
          <button key={x.planoId} type="button" className={k === i ? "on" : ""} onClick={() => setI(k)} aria-label={x.planoId}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {x.src && <img src={x.src} alt="" loading="lazy" />}
            <span>{x.planoId}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
