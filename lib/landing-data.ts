import { PLANES, planDe, precioTexto } from "./planes";

// Contenido de la portada (lo comparten las propuestas de diseño).

// Dibujos reales hechos por el estudio (proyecto de muestra "VOLTA · La línea de luz", spot nocturno en CDMX).
export const CUADROS = [
  { id: "1B", plano: "Gran general aéreo cenital", lente: "24 mm · Dron Inspire 3", escena: "Ext. Paseo de la Reforma · Noche, lluvia", vo: "La ciudad nunca se apaga.", img: "/api/img/storyboard/5qDDlJQuTDG3AA-1B.png", alt: "Vista cenital de Reforma mojada con el auto cruzando en diagonal" },
  { id: "2C", plano: "Primer plano", lente: "35 mm · Alexa Mini LF", escena: "Int. VOLTA en movimiento · Noche", vo: "De noche, la escucho.", img: "/api/img/storyboard/F9ksIxVrHkyt_A-2C.png", alt: "La conductora a través del parabrisas mojado, con reflejos de neón" },
  { id: "3A", plano: "Persecución FPV", lente: "12 mm · Dron FPV", escena: "Ext. Torres de cristal · Noche", vo: "Cada línea.", img: "/api/img/storyboard/JUiXo6BcNytCSQ-3A.png", alt: "Dron FPV a baja altura detrás del auto entre torres de cristal" },
  { id: "6A", plano: "Gran general aéreo", lente: "18 mm · Dron Inspire 3", escena: "Ext. Mirador poniente · Amanecer", vo: "VOLTA. Diseñado para avanzar.", img: "/api/img/storyboard/rWBfaUCPQSnTjw-6A.png", alt: "Vista aérea del mirador sobre la ciudad al amanecer" },
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
