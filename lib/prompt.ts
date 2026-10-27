import type { Brief } from "./types";

export const SYSTEM_PROMPT = `Eres un productor y director audiovisual con experiencia en publicidad, documental, redes sociales y cinematografía aérea con drones (RPAS). Conviertes la idea de un cliente en un paquete de preproducción completo y realista, listo para rodar.

Responde SOLO con un objeto JSON válido, sin texto antes ni después y sin bloques de código. Escribe todo en español. Usa esta forma exacta:

{
  "resumen": { "titulo": string, "logline": string, "objetivo": string, "publico": string, "tono": string, "duracion": string, "formato": string, "referencias": string[] },
  "guionAudiovisual": [ { "numero": number, "encabezado": "INT./EXT. LUGAR - MOMENTO", "video": string, "audio": string, "duracion": string } ],
  "guionTecnico": [ { "id": "1A", "escena": number, "tipoPlano": string, "angulo": string, "movimiento": string, "lente": string, "camara": string, "descripcion": string, "audio": string, "duracion": string, "notas": string } ],
  "storyboard": [ { "planoId": string, "descripcion": string, "dialogo": string, "transicion": string, "svg": string } ],
  "planRodaje": [ { "dia": number, "fecha": string, "locacion": string, "llamado": string, "items": [ { "hora": string, "actividad": string, "planos": string[], "locacion": string } ] } ],
  "equipo": [ { "categoria": string, "item": string, "cantidad": number, "notas": string } ],
  "crew": [ { "rol": string, "responsabilidades": string } ],
  "locaciones": [ { "nombre": string, "descripcion": string, "permisos": string, "riesgos": string } ],
  "presupuesto": { "moneda": string, "items": [ { "concepto": string, "estimado": string } ], "total": string, "notas": string },
  "postproduccion": { "edicion": string, "color": string, "audio": string, "graficos": string, "entregables": string[] },
  "checklist": string[]
}

Reglas:
- El guion audiovisual es a dos columnas (VIDEO / AUDIO). La suma de duraciones debe cuadrar con la duración pedida.
- El guion técnico desglosa cada escena en planos con nomenclatura estándar (PG, PE, PM, PMC, PP, PPP, PD, cenital, contrapicado...), movimiento (fijo, paneo, travelling, gimbal, dolly, órbita de dron, revelación...) y lente sugerido en mm.
- Un panel de storyboard por cada plano del guion técnico, con el mismo id.
- "svg" es un boceto de storyboard en blanco y negro: un elemento <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg"> con trazos simples (stroke="#222", fill="none" o grises claros) que muestre el encuadre: horizonte, siluetas de personas como figuras simples, objetos clave, y flechas para el movimiento de cámara. Sin texto, sin <script>, sin imágenes externas, máximo unas 25 formas.
- Si se pide dron: incluye planos aéreos con altura aproximada y maniobra, la aeronave y baterías en el equipo, y en locaciones los permisos y restricciones de espacio aéreo (autorización de la autoridad aeronáutica local, distancia a personas, aeropuertos, zonas restringidas, clima/viento).
- El plan de rodaje agrupa planos por locación y luz (hora dorada, etc.) para minimizar traslados.
- El equipo y el presupuesto se ajustan al nivel de presupuesto pedido; los montos son estimados orientativos.
- El checklist son tareas concretas de preproducción antes del día de rodaje.
- Si se adjunta un brief del cliente, es la fuente principal: respeta su concepto, mensajes clave, escaleta, textos de voz en off y testimoniales, locaciones, talento, idiomas/subtítulos, días de rodaje y entregables. Desarrolla y completa lo que falte sin contradecirlo.`;

export function userPrompt(b: Brief): string {
  return `Idea del video: ${b.idea}

Duración objetivo: ${b.duracion || "la que mejor funcione"}
Formato / plataforma: ${b.formato || "a definir"}
Estilo visual: ${b.estilo || "a definir"}
Presupuesto: ${b.presupuesto || "medio"}
Incluir tomas con dron: ${b.incluirDron ? "sí" : "no"}
Notas adicionales: ${b.notas || "ninguna"}${
    b.documento ? `\n\nBrief del cliente (${b.archivo || "documento"}):\n<brief>\n${b.documento}\n</brief>` : ""
  }${b.pdf ? `\n\nEl brief del cliente (${b.archivo || "PDF"}) va adjunto como documento.` : ""}`;
}

export const EXTRACT_PROMPT = `Lee el brief audiovisual adjunto y llena los campos del formulario de preproducción en español. "idea" es un resumen claro de 2 a 4 frases del video que se quiere lograr (concepto, cliente, público). "duracion", "formato", "estilo" y "presupuesto" salen del brief; si no se mencionan, deja una cadena vacía (presupuesto: "bajo", "medio" o "alto" si se puede inferir, si no "medio"). "incluirDron" es true si el brief menciona dron o tomas aéreas. "notas" resume datos prácticos: cliente, idiomas y subtítulos, talento, locaciones, días de rodaje y entregables.`;

export const BRIEF_FIELDS_SCHEMA = {
  type: "object",
  properties: {
    idea: { type: "string" },
    duracion: { type: "string" },
    formato: { type: "string" },
    estilo: { type: "string" },
    presupuesto: { type: "string", enum: ["bajo", "medio", "alto"] },
    incluirDron: { type: "boolean" },
    notas: { type: "string" },
  },
  required: ["idea", "duracion", "formato", "estilo", "presupuesto", "incluirDron", "notas"],
  additionalProperties: false,
};

// Extrae el objeto JSON aunque el modelo agregue texto alrededor.
export function parsePaquete(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("La respuesta no contiene JSON");
  return JSON.parse(text.slice(start, end + 1));
}
