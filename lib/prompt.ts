import { equipoDe } from "./equipo";
import type { Brief, Paquete } from "./types";

export const SYSTEM_PROMPT = `Eres un productor y director audiovisual con experiencia en publicidad, documental, redes sociales y cinematografía aérea con drones (RPAS). Conviertes la idea de un cliente en un paquete de preproducción completo y realista, listo para rodar.

Responde SOLO con un objeto JSON válido, sin texto antes ni después y sin bloques de código. Escribe todo en español. Usa esta forma exacta:

{
  "resumen": { "titulo": string, "logline": string, "objetivo": string, "publico": string, "tono": string, "duracion": string, "formato": string, "referencias": string[] },
  "guionAudiovisual": [ { "numero": number, "encabezado": "INT./EXT. LUGAR - MOMENTO", "video": string, "vozEnOff": string, "audio": string, "textoPantalla": string, "duracion": string } ],
  "guionTecnico": [ { "id": "1A", "escena": number, "tipoPlano": string, "angulo": string, "movimiento": string, "lente": string, "camara": string, "operador": string, "descripcion": string, "vozEnOff": string, "audio": string, "duracion": string, "notas": string } ],
  "storyboard": [ { "planoId": string, "descripcion": string, "dialogo": string, "transicion": string } ],
  "planRodaje": [ { "dia": number, "fecha": string, "locacion": string, "llamado": string, "items": [ { "hora": string, "actividad": string, "planos": string[], "locacion": string } ] } ],
  "equipo": [ { "categoria": string, "item": string, "cantidad": number, "notas": string } ],
  "crew": [ { "rol": string, "responsabilidades": string } ],
  "locaciones": [ { "nombre": string, "descripcion": string, "permisos": string, "riesgos": string } ],
  "presupuesto": { "moneda": string, "items": [ { "concepto": string, "estimado": string } ], "total": string, "notas": string },
  "postproduccion": { "edicion": string, "color": string, "audio": string, "graficos": string, "entregables": string[] },
  "checklist": string[]
}

Reglas:
- El guion audiovisual va por escenas con VIDEO y AUDIO. La suma de duraciones debe cuadrar con la duración pedida.
- "vozEnOff" es el texto EXACTO que se dice en esa escena o plano (locución, diálogo o testimonial a cuadro, indicando quién habla, p. ej. "VO: ..." o "Testimonial (Alumna A): ..."), escrito completo y listo para grabar, con extensión acorde a la duración (unas 2.5 palabras por segundo). Cadena vacía si no se habla. "audio" es solo música, efectos y sonido directo. "textoPantalla" son supers, subtítulos o logos (cadena vacía si no hay).
- En el guion técnico, "vozEnOff" de cada plano es el fragmento de la locución que suena sobre ese plano.
- El guion técnico desglosa cada escena en planos con nomenclatura estándar (PG, PE, PM, PMC, PP, PPP, PD, cenital, contrapicado...), movimiento (fijo, paneo, travelling, gimbal, dolly, órbita de dron, revelación...) y lente sugerido en mm.
- "operador" es el rol EXACTO del equipo de rodaje que filma ese plano (uno de los roles de cámara o dron de la lista que se te da). Reparte para que las cámaras trabajen en paralelo: la Cámara A lleva el plano principal y la B coberturas, detalles y contraplanos (o la otra mitad de las tomas si son independientes); todo lo aéreo va al piloto de dron. Usa el mismo nombre en "camara".
- Si un operador indica su cámara y lentes (o su dron), diseña sus planos SOLO con ese equipo: el "lente" de cada plano debe ser uno de sus lentes (o una focal dentro de su zoom) y "camara" el cuerpo que trae; aprovecha sus fortalezas (p. ej. tele para detalles y compresión, gran angular para espacios, cámara lenta si el cuerpo la permite) y asigna cada plano al operador cuyo equipo lo resuelve mejor. Respeta los límites de la aeronave indicada (altura, viento, sensor). En "equipo" lista primero lo que trae cada operador (con su rol en notas) y después solo lo que falte, marcado como "rentar" o "conseguir".
- Un panel de storyboard por cada plano del guion técnico, con el mismo id.
- El storyboard aquí solo lleva la descripción de cada cuadro; los dibujos se hacen aparte.
- Si se pide dron: incluye planos aéreos con altura aproximada y maniobra, la aeronave y baterías en el equipo, y en locaciones los permisos y restricciones de espacio aéreo (autorización de la autoridad aeronáutica local, distancia a personas, aeropuertos, zonas restringidas, clima/viento).
- Si hay fecha de rodaje, cada jornada del plan lleva su fecha real (p. ej. "mar 4 nov 2026") y el horario considera la hora de amanecer y atardecer aproximada de esa fecha y lugar. Usa el número de días indicado.
- El plan de rodaje agrupa planos por locación y luz (hora dorada, etc.) para minimizar traslados, y aprovecha que los operadores filman en paralelo. Cada plano del guion técnico debe aparecer en algún "planos" del plan.
- El crew incluye a todo el equipo de rodaje que se te da, más los roles extra que el proyecto necesite.
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
Fecha de rodaje: ${fechaLarga(b.fechaRodaje) ? `${fechaLarga(b.fechaRodaje)}${b.diasRodaje && b.diasRodaje > 1 ? `, ${b.diasRodaje} días seguidos` : ""}` : "a definir"}
Notas adicionales: ${b.notas || "ninguna"}
Equipo de rodaje:
${equipoDe(b)
  .map((o) => `- ${o.rol}${o.nombre ? ` (${o.nombre})` : ""}${o.tipo !== "director" ? `: ${o.equipo?.trim() || "equipo a definir"}` : ""}`)
  .join("\n")}${
    b.documento ? `\n\nBrief del cliente (${b.archivo || "documento"}):\n<brief>\n${b.documento}\n</brief>` : ""
  }${b.pdf ? `\n\nEl brief del cliente (${b.archivo || "PDF"}) va adjunto como documento.` : ""}`;
}

export const EXTRACT_PROMPT = `Lee el brief audiovisual adjunto y llena los campos del formulario de preproducción en español. "idea" es un resumen claro de 2 a 4 frases del video que se quiere lograr (concepto, cliente, público). "duracion", "formato", "estilo" y "presupuesto" salen del brief; si no se mencionan, deja una cadena vacía (presupuesto: "bajo", "medio" o "alto" si se puede inferir, si no "medio"). "fechaRodaje" es la fecha del primer día de grabación en formato AAAA-MM-DD si el brief la menciona (cadena vacía si no); "diasRodaje" es cuántos días de grabación (0 si no se sabe). "incluirDron" es true si el brief menciona dron o tomas aéreas. "camaras" es cuántos operadores de cámara (sin contar el dron) pide o implica el brief; 0 si no se puede saber. "notas" resume datos prácticos: cliente, idiomas y subtítulos, talento, locaciones, días de rodaje y entregables.`;

export const BRIEF_FIELDS_SCHEMA = {
  type: "object",
  properties: {
    idea: { type: "string" },
    duracion: { type: "string" },
    formato: { type: "string" },
    estilo: { type: "string" },
    presupuesto: { type: "string", enum: ["bajo", "medio", "alto"] },
    incluirDron: { type: "boolean" },
    camaras: { type: "integer" },
    fechaRodaje: { type: "string" },
    diasRodaje: { type: "integer" },
    notas: { type: "string" },
  },
  required: ["idea", "duracion", "formato", "estilo", "presupuesto", "incluirDron", "camaras", "fechaRodaje", "diasRodaje", "notas"],
  additionalProperties: false,
};

export const STORYBOARD_PROMPT = `Eres dibujante de storyboards. Para cada plano de la lista dibuja un boceto de storyboard como SVG.
Cada "svg" es un elemento <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg"> en blanco y negro con trazos de lápiz (stroke="#222", fill="none" o grises claros) que muestre el encuadre real del plano según su tipo, ángulo y lente: horizonte o líneas de fuga, personas como siluetas simples con proporción y pose, objetos y arquitectura clave, y flechas para el movimiento de cámara. Sin texto, sin <script>, sin imágenes externas, máximo unas 30 formas.
Devuelve un panel por plano, con el mismo planoId.`;

export const STORYBOARD_SCHEMA = {
  type: "object",
  properties: {
    paneles: {
      type: "array",
      items: {
        type: "object",
        properties: { planoId: { type: "string" }, svg: { type: "string" } },
        required: ["planoId", "svg"],
        additionalProperties: false,
      },
    },
  },
  required: ["paneles"],
  additionalProperties: false,
};

// Extrae el objeto JSON aunque el modelo agregue texto alrededor.
// Si viene mal formado (comillas sin escapar, saltos de línea, comas de más), intenta repararlo.
export function parsePaquete(text: string): unknown {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("La respuesta no contiene JSON");
  const end = text.lastIndexOf("}");
  const body = end > start ? text.slice(start, end + 1) : text.slice(start);
  try {
    return JSON.parse(body);
  } catch {
    return JSON.parse(repararJson(text.slice(start)));
  }
}

export function repararJson(src: string): string {
  let out = "";
  const pila: string[] = [];
  let enCadena = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (enCadena) {
      if (c === "\\") {
        out += c + (src[i + 1] ?? "");
        i++;
      } else if (c === '"') {
        // Una comilla solo cierra la cadena si lo que sigue es estructura JSON.
        const sig = src.slice(i + 1).match(/^\s*(.)/)?.[1];
        if (sig === undefined || ",:}]".includes(sig)) {
          out += c;
          enCadena = false;
        } else out += '\\"';
      } else if (c === "\n") out += "\\n";
      else if (c === "\r") out += "";
      else if (c === "\t") out += "\\t";
      else out += c;
      continue;
    }
    if (c === '"') enCadena = true;
    else if (c === "{" || c === "[") pila.push(c === "{" ? "}" : "]");
    else if (c === "}" || c === "]") {
      out = out.replace(/,\s*$/, ""); // coma antes de cerrar
      pila.pop();
      out += c;
      if (!pila.length) return out;
      continue;
    }
    out += c;
  }
  // Respuesta cortada: cerrar lo que quedó abierto.
  if (enCadena) out += '"';
  out = out.replace(/,\s*$/, "").replace(/,\s*"[^"]*"\s*:?\s*$/, "").replace(/:\s*$/, ": null");
  while (pila.length) out += pila.pop();
  return out;
}

// Rellena secciones faltantes para que la interfaz nunca truene con un paquete incompleto.
export function completarPaquete(p: Partial<Paquete>): Paquete {
  if (!p.resumen || !Array.isArray(p.guionAudiovisual)) throw new Error("Paquete incompleto");
  const arr = <T,>(x: T[] | undefined) => (Array.isArray(x) ? x : []);
  return {
    ...p,
    resumen: p.resumen,
    guionAudiovisual: p.guionAudiovisual,
    guionTecnico: arr(p.guionTecnico),
    storyboard: arr(p.storyboard),
    planRodaje: arr(p.planRodaje),
    equipo: arr(p.equipo),
    crew: arr(p.crew),
    locaciones: arr(p.locaciones),
    presupuesto: { moneda: "MXN", total: "", notas: "", ...p.presupuesto, items: arr(p.presupuesto?.items) },
    postproduccion: { edicion: "", color: "", audio: "", graficos: "", ...p.postproduccion, entregables: arr(p.postproduccion?.entregables) },
    checklist: arr(p.checklist),
  };
}

// "2026-11-04" → "miércoles 4 de noviembre de 2026"; "" si no es fecha válida.
export function fechaLarga(iso?: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const d = new Date(`${iso}T12:00:00`);
  return isNaN(+d) ? "" : d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
