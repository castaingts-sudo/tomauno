import type { Proyecto } from "./types";

const cell = (s: unknown) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const table = (headers: string[], rows: unknown[][]) =>
  [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n");

export function toMarkdown({ paquete: p }: Proyecto): string {
  const r = p.resumen;
  return [
    `# ${r.titulo}`,
    `> ${r.logline}`,
    `**Objetivo:** ${r.objetivo}  \n**Público:** ${r.publico}  \n**Tono:** ${r.tono}  \n**Duración:** ${r.duracion}  \n**Formato:** ${r.formato}`,
    `**Referencias:** ${r.referencias.join("; ")}`,
    `## Guion audiovisual`,
    table(["#", "Escena", "Video", "Audio", "Dur."], p.guionAudiovisual.map((e) => [e.numero, e.encabezado, e.video, e.audio, e.duracion])),
    `## Guion técnico`,
    table(
      ["Plano", "Esc.", "Tipo", "Ángulo", "Movimiento", "Lente", "Cámara", "Descripción", "Audio", "Dur.", "Notas"],
      p.guionTecnico.map((s) => [s.id, s.escena, s.tipoPlano, s.angulo, s.movimiento, s.lente, s.camara, s.descripcion, s.audio, s.duracion, s.notas]),
    ),
    `## Storyboard`,
    p.storyboard.map((f) => `- **${f.planoId}** ${f.descripcion}${f.dialogo ? ` — _${f.dialogo}_` : ""} (${f.transicion})`).join("\n"),
    `## Plan de rodaje`,
    p.planRodaje
      .map((d) => `### Día ${d.dia} · ${d.fecha} · ${d.locacion} (llamado ${d.llamado})\n` + table(["Hora", "Actividad", "Planos", "Locación"], d.items.map((i) => [i.hora, i.actividad, i.planos.join(", "), i.locacion])))
      .join("\n\n"),
    `## Equipo`,
    table(["Categoría", "Item", "Cant.", "Notas"], p.equipo.map((e) => [e.categoria, e.item, e.cantidad, e.notas])),
    `## Crew`,
    table(["Rol", "Responsabilidades"], p.crew.map((c) => [c.rol, c.responsabilidades])),
    `## Locaciones y permisos`,
    table(["Locación", "Descripción", "Permisos", "Riesgos"], p.locaciones.map((l) => [l.nombre, l.descripcion, l.permisos, l.riesgos])),
    `## Presupuesto (${p.presupuesto.moneda})`,
    table(["Concepto", "Estimado"], [...p.presupuesto.items.map((i) => [i.concepto, i.estimado]), ["**Total**", p.presupuesto.total]]),
    p.presupuesto.notas,
    `## Postproducción`,
    `- Edición: ${p.postproduccion.edicion}\n- Color: ${p.postproduccion.color}\n- Audio: ${p.postproduccion.audio}\n- Gráficos: ${p.postproduccion.graficos}\n- Entregables: ${p.postproduccion.entregables.join(", ")}`,
    `## Checklist de preproducción`,
    p.checklist.map((c) => `- [ ] ${c}`).join("\n"),
  ].join("\n\n");
}

export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "proyecto";
