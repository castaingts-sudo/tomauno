import { PLANES, planDe, precioTexto } from "./planes";

// Contenido de la portada (lo comparten las propuestas de diseño).

// Dibujos reales hechos por el estudio (proyecto de muestra "Café de altura").
export const CUADROS = [
  { id: "1A", plano: "Gran plano general aéreo", lente: "24 mm · Dron", escena: "Ext. Sierra y cafetal · Amanecer", vo: "Antes del café, está la niebla.", img: "/api/img/storyboard/JhSnNbIg5snLyw-1A.png", alt: "Vista aérea de la sierra con niebla y un camino hacia la finca" },
  { id: "1B", plano: "Plano medio en gimbal", lente: "35 mm · Cámara A", escena: "Ext. Cafetal · Mañana", vo: "Y alguien que la camina todos los días.", img: "/api/img/storyboard/EQcJ7Ka9Yg-bbA-1B.png", alt: "Productora y su hijo caminan entre los cafetos" },
  { id: "2A", plano: "Primer plano", lente: "85 mm · Cámara B", escena: "Ext. Patio de secado · Mañana", vo: "Cada grano pasa por sus manos.", img: "/api/img/storyboard/d8YhmVaIyKatzQ-2A.png", alt: "Primer plano de la productora con granos de café en la mano" },
  { id: "3A", plano: "Órbita de dron", lente: "24 mm · Dron", escena: "Ext. Casa de la finca · Atardecer", vo: "Nace en la niebla. Llega a tu taza.", img: "/api/img/storyboard/HXPkpebjrtwN2w-3A.png", alt: "Órbita de dron sobre la casa de la finca y el patio de secado" },
];

export const ENTREGA = [
  ["¶", "Guion audiovisual", "A dos columnas, imagen y sonido, con voz en off, música y timecode por escena."],
  ["▦", "Storyboard dibujado", "Cada toma a lápiz, con flechas de movimiento de cámara y su óptica."],
  ["◫", "Guion técnico", "Tamaño de plano, ángulo, movimiento, lente y quién la filma: cámara A, B o dron."],
  ["▤", "Plan de rodaje", "Jornadas con fecha real, llamado y horario pensado en la hora dorada."],
  ["◉", "Hojas de llamado", "Un link para cada quien. El fotógrafo ve sus tomas y el piloto, sus vuelos."],
  ["⌖", "Locaciones y permisos", "Riesgos, permisos y normativa de dron (AFAC) por locación."],
  ["$", "Presupuesto", "Estimado por rubro en pesos, listo para ajustar y cotizar."],
  ["✓", "Post y entregables", "Edición, color, audio, gráficos y versiones 60/30/15 en vertical."],
];

export const PASOS = [
  ["I", "Sube el brief", "Word, PDF o una idea escrita. Eliges cámaras, dron y fecha de rodaje."],
  ["II", "Mira cómo se escribe", "Una sala de control muestra en vivo las escenas y tomas mientras se arma el proyecto."],
  ["III", "Compártelo y filma", "El cliente comenta y aprueba. Tu equipo recibe su hoja por WhatsApp."],
];

// Precios y topes salen del mismo catálogo que cobra Stripe.
export const DESTACADO = ["institucional", "pro"];
export const EXTRA_MES: Record<string, string> = { pro: "Para directores y fotógrafos que filman cada semana.", estudio: "Para casas productoras con varios directores." };
export const POR_PROYECTO = PLANES.filter((p) => p.tipo === "proyecto").map((p) => ({ id: p.id, n: p.nombre, tope: p.tope, precio: precioTexto(p), top: DESTACADO.includes(p.id) }));
export const MENSUAL = PLANES.filter((p) => p.tipo === "mensual").map((p) => ({ id: p.id, n: p.nombre, tope: p.tope, precio: precioTexto(p), top: DESTACADO.includes(p.id), extra: EXTRA_MES[p.id] }));
export const EXTRA = precioTexto(planDe("extra")!);

export const PREGUNTAS = [
  ["¿Qué cuenta como una toma?", "Cada plano del guion técnico con su cuadro de storyboard. Un spot de 30 segundos suele tener entre 12 y 25 tomas."],
  ["¿Puedo corregir lo que escribe?", "Sí. Todo el guion, las tomas y el plan se editan en sitio, y el storyboard se vuelve a dibujar cuando quieras."],
  ["¿Sirve para tomas aéreas?", "Está pensado con pilotos RPAS: alturas, tipos de toma, viento, baterías y normativa AFAC vienen en cada plan."],
  ["¿Mis clientes necesitan cuenta?", "No. Reciben un link para ver el guion y el storyboard, comentar y aprobar desde el celular."],
];
