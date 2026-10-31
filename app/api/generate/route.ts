import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, etapaPrompt, userPrompt } from "@/lib/prompt";
import { samplePaquete } from "@/lib/sample";
import { limiteDe, permiso, registrarUso } from "@/lib/acceso";
import type { Brief } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
// Marca de respuesta completa: si no llega, Vercel cortó la función por tiempo.
const FIN = "\n[[FIN]]";

const ETAPA1 = ["resumen", "guionAudiovisual", "guionTecnico", "storyboard"] as const;

// Devuelve el texto del modelo en streaming; el cliente arma el JSON al final.
// Va en dos etapas (guion y tomas; luego plan, equipo y presupuesto) para que cada una quepa en el límite de 5 min.
export async function POST(req: Request) {
  const body = (await req.json()) as { brief: Brief; etapa?: 1 | 2; previo?: string };
  const { brief, previo } = body;
  const etapa = body.etapa === 2 ? 2 : 1;
  if (!brief?.idea?.trim()) {
    return Response.json({ error: "Escribe la idea del video." }, { status: 400 });
  }
  const p = await permiso(req, etapa === 1 ? 1 : 0);
  if (p instanceof Response) return p;
  const lim = limiteDe(p);
  const limite =
    etapa === 1 && (lim.tomas || lim.minutos)
      ? `\n\nLÍMITE DEL PLAN DEL USUARIO: ${lim.tomas ? `máximo ${lim.tomas} tomas en el guion técnico (y el mismo número de cuadros de storyboard)` : ""}${lim.tomas && lim.minutos ? "; " : ""}${lim.minutos ? `duración total de hasta ${lim.minutos} minutos` : ""}. Respétalo aunque el brief pida más; si no cabe, condensa.`
      : "";

  const encoder = new TextEncoder();

  // Sin clave: modo demo para probar la interfaz sin gastar.
  if (!process.env.ANTHROPIC_API_KEY) {
    const muestra = samplePaquete(brief) as unknown as Record<string, unknown>;
    const body = JSON.stringify(
      Object.fromEntries(Object.entries(muestra).filter(([k]) => (ETAPA1 as readonly string[]).includes(k) === (etapa === 1))),
    );
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
                { type: "text" as const, text: `${userPrompt(brief)}${limite}\n\n${etapaPrompt(etapa, previo)}` },
              ],
            },
          ],
        });
        let todo = "";
        msgStream.on("text", (delta) => {
          todo += delta;
          controller.enqueue(encoder.encode(delta));
        });
        const final = await msgStream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n[[ERROR]]El modelo rechazó la solicitud."));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n[[ERROR]]La respuesta se cortó por longitud. Reduce la duración o el detalle."));
        } else {
          controller.enqueue(encoder.encode(FIN));
          if (etapa === 1) {
            const gt = todo.slice(todo.indexOf('"guionTecnico"'), todo.indexOf('"storyboard"') > 0 ? todo.indexOf('"storyboard"') : undefined);
            const tomas = (gt.match(/"tipoPlano"\s*:/g) || []).length;
            const titulo = todo.match(/"titulo"\s*:\s*"([^"]{0,120})"/)?.[1];
            await registrarUso(p, "proyecto", tomas, titulo);
          }
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
