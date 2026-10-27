import Anthropic from "@anthropic-ai/sdk";
import { STORYBOARD_PROMPT, STORYBOARD_SCHEMA } from "@/lib/prompt";
import type { Plano } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

// Dibuja los bocetos SVG de un grupo de planos. El cliente lo llama en paralelo por lotes.
export async function POST(req: Request) {
  const { planos, estilo } = (await req.json()) as { planos: Plano[]; estilo?: string };
  if (!Array.isArray(planos) || !planos.length) return Response.json({ error: "Sin planos." }, { status: 400 });

  // Modo demo: un recuadro con el tipo de plano.
  if (!process.env.ANTHROPIC_API_KEY) {
    const paneles = planos.map((p) => ({
      planoId: p.id,
      svg: `<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="318" height="178" fill="#fff" stroke="#222"/><line x1="0" y1="120" x2="320" y2="120" stroke="#999"/></svg>`,
    }));
    return Response.json({ paneles });
  }

  const lista = planos
    .map((p) => `- ${p.id}: ${p.tipoPlano}, ${p.angulo}, ${p.movimiento}, lente ${p.lente}, ${p.camara}. ${p.descripcion}`)
    .join("\n");

  const client = new Anthropic();
  try {
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low", format: { type: "json_schema", schema: STORYBOARD_SCHEMA } },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: STORYBOARD_PROMPT,
      messages: [{ role: "user", content: `Estilo del video: ${estilo || "a definir"}\n\nPlanos:\n${lista}` }],
    });
    if (msg.stop_reason === "refusal") return Response.json({ error: "El modelo rechazó la solicitud." }, { status: 422 });
    const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return Response.json(JSON.parse(text));
  } catch (err) {
    const msg =
      err instanceof Anthropic.APIError ? `Error de la API (${err.status}): ${err.message}` : err instanceof SyntaxError ? "Formato inesperado." : "Error de conexión.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
