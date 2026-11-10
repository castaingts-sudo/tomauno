import { createHash, randomBytes } from "node:crypto";
import { list } from "@vercel/blob";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { readJson, writeJson } from "./store";

// Bitácora de accesos: quién entró, desde dónde y qué hizo. Se ve en /admin → "Accesos".
// Un archivo por evento en actividad/AAAA-MM/… para poder leer solo lo más reciente.

export type Evento =
  | "entrar" | "entrar-fallido" | "cuenta-gratis" | "cuenta-gratis-bloqueada" | "link-correo"
  | "admin" | "admin-fallido" | "proyecto" | "dibujos" | "dibujos-bloqueados" | "replan" | "brief" | "bloqueado";

export interface Actividad { fecha: string; evento: Evento; email?: string; detalle?: string; ip: string; lugar?: string; navegador?: string }

export const ipDe = (req: Request) => (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "sin-ip";

function lugarDe(req: Request) {
  const h = (k: string) => { const v = req.headers.get(k); try { return v ? decodeURIComponent(v) : ""; } catch { return v || ""; } };
  return [h("x-vercel-ip-city"), h("x-vercel-ip-country-region"), h("x-vercel-ip-country")].filter(Boolean).join(", ");
}

function navegadorDe(req: Request) {
  const ua = req.headers.get("user-agent") || "";
  const so = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  const nav = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /curl|python|node|axios|bot|spider|crawl/i.test(ua) ? `Script (${ua.slice(0, 40)})` : ua.slice(0, 60);
  return [nav, so].filter(Boolean).join(" · ");
}

export async function anotar(req: Request, evento: Evento, extra: { email?: string; detalle?: string } = {}) {
  try {
    const fecha = new Date().toISOString();
    const a: Actividad = { fecha, evento, ...extra, ip: ipDe(req), lugar: lugarDe(req) || undefined, navegador: navegadorDe(req) || undefined };
    await writeJson(`actividad/${fecha.slice(0, 7)}/${fecha.replace(/[:.]/g, "-")}-${randomBytes(3).toString("hex")}.json`, a);
  } catch (e) {
    console.error("anotar", e);
  }
}

// Los eventos más recientes de este mes y el anterior.
export async function ultimas(n = 150): Promise<Actividad[]> {
  const ahora = new Date();
  const meses = [ahora, new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 1, 1))].map((d) => d.toISOString().slice(0, 7));
  let rutas: string[] = [];
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
      for (const m of meses) {
        let cursor: string | undefined;
        do {
          const r = await list({ prefix: `actividad/${m}/`, limit: 1000, cursor });
          rutas.push(...r.blobs.map((b) => b.pathname));
          cursor = r.hasMore ? r.cursor : undefined;
        } while (cursor);
      }
    } else {
      for (const m of meses) rutas.push(...(await readdir(path.join(process.cwd(), ".data/actividad", m)).catch(() => [] as string[])).map((f) => `actividad/${m}/${f}`));
    }
  } catch (e) {
    console.error("ultimas", e);
  }
  rutas = rutas.sort().reverse().slice(0, n);
  const xs = await Promise.all(rutas.map((r) => readJson<Actividad>(r).catch(() => null)));
  return xs.filter((x): x is Actividad => Boolean(x));
}

// Freno por conexión: cuenta intentos fallidos por IP en una ventana de 15 minutos.
const ventana = () => Math.floor(Date.now() / (15 * 60_000));
const rutaFreno = (req: Request, tipo: string) => `frenos/${tipo}/${ventana()}-${createHash("sha256").update(ipDe(req)).digest("hex").slice(0, 24)}.json`;

export async function frenado(req: Request, tipo: string, max: number): Promise<boolean> {
  try {
    return ((await readJson<{ n: number }>(rutaFreno(req, tipo)))?.n ?? 0) >= max;
  } catch {
    return false;
  }
}

export async function fallo(req: Request, tipo: string) {
  try {
    const r = rutaFreno(req, tipo);
    const n = (await readJson<{ n: number }>(r))?.n ?? 0;
    await writeJson(r, { n: n + 1 });
  } catch {}
}
