import Anthropic from "@anthropic-ai/sdk";
import { permiso } from "@/lib/acceso";
import { anotar } from "@/lib/actividad";
import type { Jornada } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

interface TomaCorta { id: string; escena: number; descripcion: string; tipoPlano?: string; operador?: string }
interface Cuerpo {
  titulo?: string;
  plan: Jornada[];
  tomas: TomaCorta[];
  hechas: string[];
  cambios: string;
  ahora: string; // "10:25" hora local del rodaje
  fecha?: string;
  equipo?: { nombre: string; rol: string; equipo?: string }[];
}

const SISTEMA = `Eres el primer asistente de dirección (1st AD) de un rodaje que está ocurriendo AHORA. Tu trabajo: rehacer el plan de rodaje del resto del día con los cambios que te dicta la producción, sin romper lo que ya funciona.

Reglas:
- Los bloques que ya terminaron (su hora final es anterior a la hora actual) se quedan tal cual, con la misma hora y texto; solo agrega al inicio de su actividad "✓ " si sus tomas están marcadas como hechas, o "✗ " si no se hicieron.
- Las tomas marcadas como hechas no se vuelven a programar.
- Las tomas que debían hacerse antes de la hora actual y no están hechas se reprograman más tarde en el día. Si de plano no caben, ponlas en un bloque final "Tomas que se caen" con el motivo y una alternativa (otra toma que cubra la idea, o grabarlas otro día).
- Lo que diga la producción en los cambios manda (horarios nuevos, talento que no llegó, lluvia, locación cerrada, equipo que falló, toma nueva…).
- Respeta las ventanas que ya estaban en el plan: disponibilidad del talento, horarios de cada locación, luz (hora dorada, atardecer) y la comida del crew. Deja 5 a 10 min de traslado entre locaciones.
- El nuevo plan arranca en la hora actual (redondeada a los siguientes 5 min). Usa el formato de hora "H:MM - H:MM" de 24 h.
- Usa los mismos nombres de personas, locaciones e ids de toma. Cada bloque dice quién hace qué y con qué equipo, en frases cortas en español de México.
- Actualiza "llamado" solo si cambian horas de talento; si no, déjalo igual.

Responde SOLO con JSON válido, sin texto antes ni después:
{"resumen":"1 a 3 frases: qué se movió y qué se cae, para mandar al equipo","planRodaje":[{"dia":1,"fecha":"…","locacion":"…","llamado":"…","items":[{"hora":"…","locacion":"…","actividad":"…","planos":["1A"]}]}]}`;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Cuerpo | null;
  if (!b?.plan?.length) return Response.json({ error: "Este proyecto no tiene plan de rodaje." }, { status: 400 });
  if (!b.cambios?.trim() && !b.hechas?.length) return Response.json({ error: "Escribe qué cambió o marca las tomas que ya se grabaron." }, { status: 400 });
  const p = await permiso(req, 0);
  if (p instanceof Response) return p;
  await anotar(req, "replan", { email: p.acceso?.email || (p.admin ? "admin" : undefined), detalle: b.titulo });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "Falta la clave de la IA." }, { status: 503 });

  const pendientes = b.tomas.filter((t) => !b.hechas.includes(t.id));
  const texto = [
    `Proyecto: ${b.titulo ?? ""}`,
    `Hora actual en el set: ${b.ahora}${b.fecha ? ` (${b.fecha})` : ""}`,
    `CAMBIOS QUE DICTA LA PRODUCCIÓN:\n${b.cambios?.trim() || "(ninguno; solo actualiza con las tomas hechas)"}`,
    `Tomas YA HECHAS: ${b.hechas.length ? b.hechas.join(", ") : "ninguna"}`,
    `Tomas PENDIENTES:\n${pendientes.map((t) => `- ${t.id} (esc. ${t.escena}${t.tipoPlano ? `, ${t.tipoPlano}` : ""}${t.operador ? `, ${t.operador}` : ""}): ${t.descripcion.slice(0, 160)}`).join("\n")}`,
    b.equipo?.length ? `Equipo en set:\n${b.equipo.map((o) => `- ${o.nombre} · ${o.rol}${o.equipo ? ` · ${o.equipo}` : ""}`).join("\n")}` : "",
    `PLAN ACTUAL (JSON):\n${JSON.stringify(b.plan)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const client = new Anthropic();
    const msg = await client.beta.messages
      .stream({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: "low" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: SISTEMA,
        messages: [{ role: "user", content: texto }],
      })
      .finalMessage();
    const out = msg.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const i = out.indexOf("{");
    const f = out.lastIndexOf("}");
    if (i === -1 || f === -1) throw new Error("La IA no devolvió el plan. Intenta otra vez.");
    const j = JSON.parse(out.slice(i, f + 1)) as { resumen?: string; planRodaje?: Jornada[] };
    if (!Array.isArray(j.planRodaje) || !j.planRodaje.length || !j.planRodaje.every((d) => Array.isArray(d.items)))
      throw new Error("El plan nuevo vino incompleto. Intenta otra vez.");
    for (const d of j.planRodaje) d.items = d.items.map((x) => ({ hora: String(x.hora ?? ""), locacion: String(x.locacion ?? ""), actividad: String(x.actividad ?? ""), planos: Array.isArray(x.planos) ? x.planos.map(String) : [] }));
    return Response.json({ resumen: j.resumen ?? "", planRodaje: j.planRodaje });
  } catch (err) {
    const m =
      err instanceof Anthropic.APIError ? `Error de la IA (${err.status}). Intenta otra vez.` : err instanceof Error ? err.message : "No se pudo rehacer el plan.";
    return Response.json({ error: m }, { status: 500 });
  }
}
