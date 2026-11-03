"use client";

import { useEffect, useState } from "react";
import type { PorConfirmar } from "@/lib/hoja";

interface Resp { estado: "llevo" | "no"; alternativa?: string }

// En la hoja de llamado: cada quien confirma lo que lleva o propone otra opción. El productor lo ve en el estudio.
export function ConfirmarEquipo({ id, rol, items }: { id: string; rol: string; items: PorConfirmar[] }) {
  const [resp, setResp] = useState<Record<string, Resp>>({});
  const [alt, setAlt] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState("");

  useEffect(() => {
    fetch(`/api/equipo/${id}/confirmar`).then((r) => r.json()).then((j) => {
      const mias = (j?.[rol] ?? {}) as Record<string, Resp>;
      setResp(mias);
      setAlt(Object.fromEntries(Object.entries(mias).map(([k, v]) => [k, v.alternativa ?? ""])));
    }).catch(() => {});
  }, [id, rol]);

  async function responder(item: string, estado: Resp["estado"]) {
    setGuardando(item);
    const r = await fetch(`/api/equipo/${id}/confirmar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rol, item, estado, alternativa: estado === "no" ? alt[item] : "" }) });
    setGuardando("");
    if (r.ok) setResp((x) => ({ ...x, [item]: { estado, alternativa: estado === "no" ? alt[item] : undefined } }));
  }

  const listos = items.filter((i) => resp[i.item]).length;
  return (
    <div className="tu-panel tu-confirma">
      <p className="tu-confirma-nota">Confirma lo que vas a llevar. Si no tienes algo, dilo y propón otra opción. La producción ve tus respuestas. <b>{listos}/{items.length}</b></p>
      <ul>
        {items.map((i) => {
          const r = resp[i.item];
          return (
            <li key={i.item} className={r ? `ok-${r.estado}` : ""}>
              <div className="tu-confirma-item">
                <span>{i.pedido && <em>Te pedimos · </em>}{i.item}</span>
                <div className="tu-confirma-btns">
                  <button type="button" className={r?.estado === "llevo" ? "on" : ""} disabled={guardando === i.item} onClick={() => responder(i.item, "llevo")}>✓ Lo llevo</button>
                  <button type="button" className={r?.estado === "no" ? "on no" : ""} disabled={guardando === i.item} onClick={() => setResp((x) => ({ ...x, [i.item]: { estado: "no", alternativa: alt[i.item] } }))}>No lo tengo</button>
                </div>
              </div>
              {r?.estado === "no" && (
                <div className="tu-confirma-alt">
                  <input value={alt[i.item] ?? ""} onChange={(e) => setAlt((x) => ({ ...x, [i.item]: e.target.value }))} placeholder="¿Qué puedes llevar en su lugar? (opcional)" />
                  <button type="button" onClick={() => responder(i.item, "no")} disabled={guardando === i.item}>Enviar</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
