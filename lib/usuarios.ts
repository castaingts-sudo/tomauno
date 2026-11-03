import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { readJson, writeJson } from "./store";

// Usuario y contraseña: cada correo apunta al código (token) de su cuenta; la contraseña se guarda con scrypt.
const scrypt = promisify(_scrypt) as (p: string, s: Buffer, n: number) => Promise<Buffer>;

export interface Usuario { email: string; token: string; sal: string; hash: string; creado: string; cambiado: string }

export const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normal = (e: string) => e.trim().toLowerCase();
const ruta = (email: string) => `usuarios/${createHash("sha256").update(normal(email)).digest("hex")}.json`;

export const leerUsuario = (email: string) => readJson<Usuario>(ruta(email));

export async function ponerClave(email: string, token: string, clave: string): Promise<Usuario> {
  const previo = await leerUsuario(email);
  const sal = randomBytes(16);
  const hash = await scrypt(clave, sal, 64);
  const ahora = new Date().toISOString();
  const u: Usuario = { email: normal(email), token, sal: sal.toString("base64"), hash: hash.toString("base64"), creado: previo?.creado || ahora, cambiado: ahora };
  await writeJson(ruta(email), u);
  return u;
}

export async function verificar(email: string, clave: string): Promise<Usuario | null> {
  const u = await leerUsuario(email);
  if (!u) {
    await scrypt(clave, randomBytes(16), 64); // mismo tiempo exista o no
    return null;
  }
  const h = await scrypt(clave, Buffer.from(u.sal, "base64"), 64);
  const g = Buffer.from(u.hash, "base64");
  return h.length === g.length && timingSafeEqual(h, g) ? u : null;
}
