import { get, list, put } from "@vercel/blob";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Almacenamiento de links compartidos: Vercel Blob en producción,
// carpeta .data/ en local cuando no hay BLOB_READ_WRITE_TOKEN.

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const LOCAL_DIR = path.join(process.cwd(), ".data");

export class StoreNotConfigured extends Error {}

function checkConfigured() {
  if (!useBlob() && process.env.VERCEL) {
    throw new StoreNotConfigured("Falta conectar Vercel Blob al proyecto (Storage → Blob).");
  }
}

export async function writeJson(pathname: string, data: unknown) {
  checkConfigured();
  const body = JSON.stringify(data);
  if (useBlob()) {
    await put(pathname, body, { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
    return;
  }
  const file = path.join(LOCAL_DIR, pathname);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

export async function readJson<T>(pathname: string): Promise<T | null> {
  checkConfigured();
  if (useBlob()) {
    const res = await get(pathname, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text()) as T;
  }
  try {
    return JSON.parse(await readFile(path.join(LOCAL_DIR, pathname), "utf8")) as T;
  } catch {
    return null;
  }
}

export async function listJson<T>(prefix: string): Promise<T[]> {
  checkConfigured();
  if (useBlob()) {
    const { blobs } = await list({ prefix, limit: 1000 });
    const items = await Promise.all(blobs.map((b) => readJson<T>(b.pathname)));
    return items.filter((x): x is Awaited<T> => x !== null) as T[];
  }
  try {
    const dir = path.join(LOCAL_DIR, prefix);
    const files = (await readdir(dir)).sort();
    return Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(dir, f), "utf8")) as T));
  } catch {
    return [];
  }
}
