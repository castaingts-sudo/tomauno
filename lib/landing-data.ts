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

// ───── Portada principal: contenido que explica qué hace y para quién ─────

// Todo lo que sale de un proyecto, en el orden en que se usa.
export const RECIBES = [
  { k: "01", t: "Guion audiovisual", d: "A dos columnas, imagen y sonido: voz en off, música, efectos y timecode por escena." },
  { k: "02", t: "Guion técnico", d: "Cada toma con tamaño de plano, ángulo, movimiento, lente y quién la filma: cámara A, B o dron." },
  { k: "03", t: "Storyboard dibujado", d: "Un dibujo a lápiz por toma, con flechas de cámara. Si uno no te convence, lo vuelves a dibujar." },
  { k: "04", t: "Animatic con voz", d: "El storyboard en movimiento, con la voz en off y el ritmo del corte, para ver el video antes de filmarlo." },
  { k: "05", t: "Plan de rodaje con clima", d: "Jornadas con fecha real, llamado y horarios. Amanecer, hora dorada, lluvia, viento y el METAR del aeropuerto más cercano." },
  { k: "06", t: "Hojas de llamado por rol", d: "Un link para cada quien: el fotógrafo ve sus tomas y el piloto sus vuelos. Se mandan por WhatsApp." },
  { k: "07", t: "Link de aprobación", d: "Tu cliente ve el guion y el storyboard en su celular, comenta por escena y aprueba. Sin crear cuenta." },
  { k: "08", t: "Locaciones y permisos", d: "Riesgos, permisos y normativa de dron AFAC por locación." },
  { k: "09", t: "Presupuesto", d: "Estimado por rubro en pesos mexicanos, listo para ajustar y cotizar." },
  { k: "10", t: "Post y entregables", d: "Edición, color, audio, gráficos y versiones para redes. Exporta todo a PDF, Markdown o JSON." },
];

export const PARA_QUIEN = [
  { t: "Directores", d: "Llega a la junta con el video ya visto: guion, storyboard y animatic que el cliente entiende a la primera.", k: "Menos rondas de cambios" },
  { t: "Fotógrafos y DP", d: "Tus tomas con lente, movimiento y horario de luz. El plan sabe a qué hora cae la hora dorada en tu locación.", k: "Cada toma con su óptica" },
  { t: "Casas productoras", d: "Del brief del cliente a una propuesta completa con plan y presupuesto, sin armarla a mano en Word y Excel.", k: "Propuestas en una tarde" },
  { t: "Pilotos de dron", d: "Vuelos separados por toma, viento y ráfagas del día, METAR/TAF y notas de normativa AFAC.", k: "Pensado con pilotos RPAS" },
];

export const METODO = [
  ["I", "Cuenta tu idea", "Escríbela en dos líneas o sube el brief del cliente en Word, PDF o texto. Toma uno lo lee y llena el formulario por ti."],
  ["II", "Elige cómo se filma", "Duración, formato (horizontal o vertical), las cámaras de tu equipo, si hay dron y la fecha de rodaje."],
  ["III", "Mira cómo se escribe", "Una sala de control muestra en vivo las escenas y tomas mientras se arma el proyecto. Luego se dibuja el storyboard."],
  ["IV", "Corrige, comparte y filma", "Edita lo que quieras, manda el link al cliente para que apruebe y a tu equipo sus hojas de llamado."],
];

// Muestra del paquete de VOLTA (spot de 30 s), con el mismo formato que entrega el estudio.
export const VOLTA_GUION = [
  { n: "01", esc: "EXT. PASEO DE LA REFORMA · NOCHE, LLUVIA", tc: "00:00 – 00:06", img: "Cenital desde el dron: el VOLTA corta en diagonal el asfalto mojado; los semáforos se reflejan en los charcos.", vo: "La ciudad nunca se apaga.", son: "Pulso grave de sintetizador · lluvia" },
  { n: "02", esc: "INT. VOLTA EN MOVIMIENTO · NOCHE", tc: "00:06 – 00:14", img: "La conductora a través del parabrisas; el neón resbala por el vidrio.", vo: "De noche, la escucho.", son: "Silencio del motor eléctrico · gotas" },
  { n: "03", esc: "EXT. TORRES DE CRISTAL · NOCHE", tc: "00:14 – 00:22", img: "FPV a ras de piso detrás del auto, entre las torres.", vo: "Cada línea.", son: "Entra la batería · whoosh" },
];
export const VOLTA_TECNICO = [
  ["1B", "Gran general cenital", "Ascenso vertical", "24 mm", "Dron Inspire 3"],
  ["2C", "Primer plano", "Car mount frontal", "35 mm", "Cámara A"],
  ["3A", "Persecución", "FPV a ras de piso", "12 mm", "Dron FPV"],
  ["6A", "Gran general aéreo", "Revelación ascendente", "18 mm", "Dron Inspire 3"],
];
export const VOLTA_PLAN = [
  ["19:00", "Llamado y briefing de vuelo", "Base Reforma", ""],
  ["20:30", "Cenital sobre Reforma mojada", "Dron Inspire 3", "1B"],
  ["22:00", "Car mount: la conductora", "Cámara A", "2C"],
  ["23:30", "Persecución entre torres", "Dron FPV", "3A"],
];

export const CONFIANZA = [
  { t: "Pago seguro con Stripe", d: "El cobro lo procesa Stripe, la plataforma de pagos que usan millones de negocios en el mundo. Tu tarjeta nunca pasa por nuestros servidores." },
  { t: "Precios claros en pesos", d: "Sabes cuánto pagas antes de empezar. Los planes por proyecto son un pago único, sin suscripción." },
  { t: "Tu proyecto es tuyo", d: "Todo se edita y se exporta a PDF, Markdown o JSON. Llévalo a tu cliente, a tu equipo o a otro programa." },
  { t: "En la nube y privado", d: "Entras con tu correo y contraseña desde cualquier equipo. Los links para el cliente y el equipo son privados y únicos." },
];

export const FAQ = [
  ["¿Qué es Toma uno?", "Una plataforma de preproducción de video con inteligencia artificial. Le das una idea o un brief y te entrega el paquete completo para filmar: guion audiovisual, guion técnico, storyboard dibujado, animatic, plan de rodaje con clima, hojas de llamado, locaciones, presupuesto y post."],
  ["¿Qué cuenta como una toma?", "Cada plano del guion técnico con su dibujo de storyboard. Un spot de 30 segundos suele tener entre 12 y 25 tomas; el plan Spot alcanza para 30."],
  ["¿Qué necesito para empezar?", "Solo la idea. Puedes escribirla en un par de líneas o subir el brief del cliente en Word, PDF o texto, y elegir duración, formato, cámaras y si habrá dron."],
  ["¿Cuánto tarda?", "Unos minutos. Mientras se escribe ves en vivo las escenas y las tomas; después se dibuja el storyboard cuadro por cuadro."],
  ["¿Puedo corregir lo que escribe?", "Sí. El guion, las tomas y el plan se editan en sitio, y cualquier dibujo del storyboard se vuelve a dibujar con tus indicaciones."],
  ["¿Mis clientes necesitan cuenta?", "No. Reciben un link para ver el guion y el storyboard en su celular, dejar comentarios por escena y aprobar."],
  ["¿Sirve para tomas aéreas?", "Está pensado con pilotos RPAS: tipos de toma aérea, alturas, viento y ráfagas del día, el METAR/TAF del aeropuerto más cercano y notas de normativa AFAC en cada plan."],
  ["¿Cómo pago?", "Con tarjeta de crédito o débito en la página segura de Stripe. Al terminar regresas al estudio con tus tomas activas y creas tu contraseña para entrar desde cualquier computadora."],
  ["¿Cómo funciona el plan mensual?", "Se cobra cada mes y tus tomas se recargan en cada renovación; las tomas extra que no hayas usado se conservan. Puedes cancelarlo cuando quieras y ya no se vuelve a cobrar."],
  ["¿Y si se me acaban las tomas?", "Compras un paquete de 25 tomas más por $" + EXTRA + " MXN desde el estudio, sin cambiar de plan."],
];

// Lo que incluye cada plan, para las tarjetas de precios.
export const INCLUYE: Record<string, string[]> = {
  spot: ["Un proyecto de hasta 3 minutos", "30 tomas dibujadas", "Los 10 entregables", "Link de aprobación para el cliente"],
  institucional: ["Un proyecto de hasta 8 minutos", "60 tomas dibujadas", "Los 10 entregables", "Link de aprobación y hojas de llamado"],
  corto: ["Un proyecto de hasta 20 minutos", "120 tomas dibujadas", "Los 10 entregables", "Varias jornadas de rodaje con clima"],
  pro: ["250 tomas cada mes", "Los proyectos que quieras, de cualquier duración", "Los 10 entregables en cada proyecto", "Paquetes extra cuando los necesites"],
  estudio: ["800 tomas cada mes", "Los proyectos que quieras, de cualquier duración", "Los 10 entregables en cada proyecto", "Más de 3 veces las tomas del plan Pro"],
};
