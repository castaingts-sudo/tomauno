import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, userPrompt } from "@/lib/prompt";
import { samplePaquete } from "@/lib/sample";
import type { Brief } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
// Marca de respuesta completa: si no llega, Vercel cortó la función por tiempo.
const FIN = "\n[[FIN]]";

// Devuelve el texto del modelo en streaming; el cliente arma el JSON al final.
export async function POST(req: Request) {
  const brief = (await req.json()) as Brief;
  if (!brief?.idea?.trim()) {
    return Response.json({ error: "Escribe la idea del video." }, { status: 400 });
  }

  const encoder = new TextEncoder();

  // Sin clave: modo demo para probar la interfaz sin gastar.
  if (!process.env.ANTHROPIC_API_KEY) {
    const body = JSON.stringify(samplePaquete(brief));
    return new Response(
      new ReadableStream({
        async start(controller) {
          for (let i = 0; i < body.length; i += 400) {
            controller.enqueue(encoder.encode(body.slice(i, i + 400)));
            await new Promise((r) => setTimeout(r, Number(process.env.TOMA_DEMO_DELAY) || 15));
          }
          controller.enqueue(encoder.encode(FIN));
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Toma-Uno-Mode": "demo" } },
    );
  }

  const client = new Anthropic();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const msgStream = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 64000,
          thinking: { type: "adaptive" },
          output_config: { effort: "medium" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                ...(brief.pdf
                  ? [{ type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: brief.pdf } }]
                  : []),
                { type: "text" as const, text: userPrompt(brief) },
              ],
            },
          ],
        });
        msgStream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
        const final = await msgStream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n[[ERROR]]El modelo rechazó la solicitud."));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n[[ERROR]]La respuesta se cortó por longitud. Reduce la duración o el detalle."));
        } else {
          controller.enqueue(encoder.encode(FIN));
        }
      } catch (err) {
        const msg =
          err instanceof Anthropic.AuthenticationError
            ? "Clave de API inválida."
            : err instanceof Anthropic.RateLimitError
              ? "Límite de uso alcanzado, intenta en un momento."
              : err instanceof Anthropic.APIError
                ? `Error de la API (${err.status}): ${err.message}`
                : "Error de conexión con la API.";
        controller.enqueue(encoder.encode(`\n[[ERROR]]${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
