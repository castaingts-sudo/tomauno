import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { BRIEF_FIELDS_SCHEMA, EXTRACT_PROMPT } from "@/lib/prompt";
import { permiso } from "@/lib/acceso";
import type { Brief } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

// Calidad primero: el mismo modelo que la generación. El gasto se controla reutilizando lecturas en el navegador.
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const MAX_BYTES = 4 * 1024 * 1024; // límite de cuerpo en Vercel: 4.5 MB

type Campos = Omit<Brief, "archivo" | "documento" | "pdf">;

// Recibe un brief (Word, PDF, TXT o MD) y devuelve los campos del formulario llenos.
export async function POST(req: Request) {
  const pm = await permiso(req, 1);
  if (pm instanceof Response) return pm;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No se recibió archivo." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "El archivo pesa más de 4 MB." }, { status: 413 });

  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  let documento: string | undefined;
  let pdf: string | undefined;

  try {
    if (name.endsWith(".docx")) documento = (await mammoth.extractRawText({ buffer: buf })).value;
    else if (name.endsWith(".pdf")) pdf = buf.toString("base64");
    else if (/\.(txt|md|markdown)$/.test(name)) documento = buf.toString("utf8");
    else return Response.json({ error: "Formato no soportado. Usa .docx, .pdf, .txt o .md (los .doc antiguos guárdalos como .docx)." }, { status: 415 });
  } catch {
    return Response.json({ error: "No se pudo leer el archivo." }, { status: 422 });
  }
  documento = documento?.replace(/\n{3,}/g, "\n\n").trim();
  if (documento !== undefined && !documento) return Response.json({ error: "El archivo no tiene texto." }, { status: 422 });

  // Modo demo: sin IA no se puede resumir; se usa el inicio del texto como idea.
  if (!process.env.ANTHROPIC_API_KEY) {
    if (pdf) return Response.json({ error: "Leer PDF requiere la clave de API. En modo demo usa .docx, .txt o .md." }, { status: 400 });
    const campos: Partial<Campos> = { idea: documento!.slice(0, 600), incluirDron: /dron|aére/i.test(documento!) };
    return Response.json({ campos, documento, archivo: file.name });
  }

  const client = new Anthropic();
  try {
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low", format: { type: "json_schema", schema: BRIEF_FIELDS_SCHEMA } },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [
        {
          role: "user",
          content: [
            pdf
              ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf } }
              : { type: "text", text: `<brief>\n${documento}\n</brief>` },
            { type: "text", text: `${EXTRACT_PROMPT}\nHoy es ${new Date().toISOString().slice(0, 10)}.` },
          ],
        },
      ],
    });
    if (msg.stop_reason === "refusal") return Response.json({ error: "El modelo rechazó el documento." }, { status: 422 });
    const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const campos = JSON.parse(text) as Campos;
    return Response.json({ campos, documento, pdf, archivo: file.name });
  } catch (err) {
    const msg =
      err instanceof Anthropic.AuthenticationError
        ? "Clave de API inválida."
        : err instanceof Anthropic.RateLimitError
          ? "Límite de uso alcanzado, intenta en un momento."
          : err instanceof Anthropic.APIError
            ? `Error de la API (${err.status}): ${err.message}`
            : err instanceof SyntaxError
              ? "La IA devolvió un formato inesperado, intenta de nuevo."
              : "Error de conexión con la API.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
