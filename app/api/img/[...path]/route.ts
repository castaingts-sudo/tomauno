import { readBytes } from "@/lib/store";

export const runtime = "nodejs";

// Sirve los dibujos del storyboard guardados en el store privado.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const pathname = parts.join("/");
  if (parts[0] !== "storyboard" || parts.length !== 2 || !/^[\w-]+\.(png|jpg)$/.test(parts[1])) return new Response("No encontrado", { status: 404 });
  const data = await readBytes(pathname);
  if (!data) return new Response("No encontrado", { status: 404 });
  return new Response(data as BodyInit, {
    headers: { "Content-Type": pathname.endsWith(".jpg") ? "image/jpeg" : "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
