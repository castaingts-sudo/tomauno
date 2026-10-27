import { equipoDe } from "./equipo";
import type { Brief, Paquete } from "./types";

// Paquete de ejemplo para el modo demo (sin clave de API).
const svg = (body: string) =>
  `<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="318" height="178" fill="#fff" stroke="#222"/>${body}</svg>`;

const fig = (x: number, y: number, s = 1) =>
  `<circle cx="${x}" cy="${y}" r="${6 * s}" fill="none" stroke="#222"/><line x1="${x}" y1="${y + 6 * s}" x2="${x}" y2="${y + 30 * s}" stroke="#222"/><line x1="${x - 10 * s}" y1="${y + 14 * s}" x2="${x + 10 * s}" y2="${y + 14 * s}" stroke="#222"/><line x1="${x}" y1="${y + 30 * s}" x2="${x - 8 * s}" y2="${y + 46 * s}" stroke="#222"/><line x1="${x}" y1="${y + 30 * s}" x2="${x + 8 * s}" y2="${y + 46 * s}" stroke="#222"/>`;

export function samplePaquete(b: Brief): Paquete {
  const p = basePaquete(b);
  const camB = equipoDe(b).some((o) => o.id === "cam-b");
  p.guionTecnico = p.guionTecnico.map((s) => {
    const operador = s.camara === "Dron" ? "Piloto de dron" : camB && s.id.endsWith("B") ? "Cámara B" : s.camara;
    return { ...s, operador, camara: operador === "Piloto de dron" ? "Dron" : operador };
  });
  return p;
}

function basePaquete(b: Brief): Paquete {
  return {
    resumen: {
      titulo: "Toma uno (demo)",
      logline: `Ejemplo generado sin IA a partir de: "${b.idea.slice(0, 120)}"`,
      objetivo: "Mostrar cómo se ve el paquete de preproducción completo. Agrega tu ANTHROPIC_API_KEY para generar uno real.",
      publico: "Clientes potenciales en redes sociales",
      tono: "Inspirador, cinematográfico",
      duracion: b.duracion || "60 s",
      formato: b.formato || "16:9 YouTube + recorte 9:16",
      referencias: ["Comerciales de turismo con apertura aérea", "Documentales de naturaleza con hora dorada"],
    },
    guionAudiovisual: [
      { numero: 1, encabezado: "EXT. MIRADOR - AMANECER", video: "Revelación aérea: el dron sube detrás de una cresta y descubre el valle con niebla.", vozEnOff: "VO: \"Todo empieza con una idea.\"", audio: "Música ambiental crece.", textoPantalla: "", duracion: "10 s" },
      { numero: 2, encabezado: "EXT. SENDERO - MAÑANA", video: "La protagonista camina hacia cámara; detalles de sus botas y manos.", vozEnOff: "VO: \"Un lugar, una persona y las ganas de contarlo.\"", audio: "SFX pasos y viento. Música continúa.", textoPantalla: "", duracion: "20 s" },
      { numero: 3, encabezado: "EXT. CIMA - HORA DORADA", video: "Llega a la cima; órbita del dron alrededor de ella. Cierre con logo.", vozEnOff: "VO: \"Y termina con una toma.\"", audio: "Golpe musical final.", textoPantalla: "Logo + contacto", duracion: "30 s" },
    ],
    guionTecnico: [
      { id: "1A", escena: 1, tipoPlano: "Gran plano general", angulo: "Aéreo", movimiento: "Ascenso + tilt up (revelación)", lente: "24 mm eq.", camara: "Dron", descripcion: "Subida lenta desde detrás de la cresta a ~60 m AGL.", vozEnOff: "VO: \"Todo empieza con una idea.\"", audio: "Música", duracion: "10 s", notas: "Viento < 25 km/h. Modo cine." },
      { id: "2A", escena: 2, tipoPlano: "Plano medio", angulo: "Frontal, altura de ojos", movimiento: "Travelling hacia atrás en gimbal", lente: "35 mm", camara: "Cámara A", descripcion: "Protagonista camina hacia cámara.", vozEnOff: "VO: \"Un lugar, una persona y las ganas de contarlo.\"", audio: "Pasos + viento", duracion: "12 s", notas: "Contraluz suave." },
      { id: "2B", escena: 2, tipoPlano: "Plano detalle", angulo: "Picado", movimiento: "Fijo", lente: "85 mm", camara: "Cámara A", descripcion: "Botas pisando grava.", audio: "SFX pasos", duracion: "8 s", notas: "120 fps para cámara lenta." },
      { id: "3A", escena: 3, tipoPlano: "Plano general", angulo: "Aéreo", movimiento: "Órbita 180°", lente: "24 mm eq.", camara: "Dron", descripcion: "Órbita alrededor de la protagonista en la cima, ~30 m.", vozEnOff: "VO: \"Y termina con una toma.\"", audio: "Música", duracion: "20 s", notas: "Distancia de seguridad a personas según norma local." },
      { id: "3B", escena: 3, tipoPlano: "Plano general", angulo: "Frontal", movimiento: "Fijo", lente: "50 mm", camara: "Cámara A", descripcion: "Silueta contra el sol; entra logo.", audio: "Golpe musical", duracion: "10 s", notas: "Dejar aire para el logo." },
    ],
    storyboard: [
      { planoId: "1A", descripcion: "Revelación del valle desde detrás de la cresta.", dialogo: "VO: Todo empieza con una idea.", transicion: "Fundido desde negro", svg: svg(`<polyline points="0,130 70,90 130,120 200,70 320,110" fill="none" stroke="#222"/><path d="M0,150 Q160,120 320,150" fill="none" stroke="#999"/><line x1="160" y1="170" x2="160" y2="140" stroke="#222" stroke-width="2"/><polygon points="154,145 160,132 166,145" fill="#222"/>`) },
      { planoId: "2A", descripcion: "Caminata hacia cámara.", dialogo: "", transicion: "Corte", svg: svg(`<line x1="0" y1="120" x2="320" y2="120" stroke="#999"/>${fig(160, 50, 1.6)}<line x1="40" y1="160" x2="90" y2="160" stroke="#222"/><polygon points="40,155 30,160 40,165" fill="#222"/>`) },
      { planoId: "2B", descripcion: "Detalle de botas.", dialogo: "", transicion: "Corte", svg: svg(`<rect x="110" y="90" width="70" height="40" rx="10" fill="none" stroke="#222"/><rect x="170" y="70" width="20" height="40" fill="none" stroke="#222"/><path d="M20,150 L300,150" stroke="#999" stroke-dasharray="4 4"/>`) },
      { planoId: "3A", descripcion: "Órbita sobre la cima.", dialogo: "VO: Y termina con una toma.", transicion: "Corte", svg: svg(`<polyline points="40,170 160,80 280,170" fill="none" stroke="#222"/>${fig(160, 48, 0.7)}<ellipse cx="160" cy="80" rx="90" ry="25" fill="none" stroke="#222" stroke-dasharray="6 4"/><polygon points="246,74 256,82 244,88" fill="#222"/>`) },
      { planoId: "3B", descripcion: "Silueta y logo.", dialogo: "", transicion: "Fundido a negro", svg: svg(`<circle cx="230" cy="70" r="28" fill="#ddd" stroke="#222"/><line x1="0" y1="130" x2="320" y2="130" stroke="#222"/>${fig(120, 70, 1.2)}<rect x="40" y="145" width="80" height="20" fill="none" stroke="#999"/>`) },
    ],
    planRodaje: [
      {
        dia: 1,
        fecha: "Por definir",
        locacion: "Mirador y cima",
        llamado: "05:00",
        items: [
          { hora: "05:00", actividad: "Llamado, revisión de equipo y briefing de seguridad de vuelo", planos: [], locacion: "Base" },
          { hora: "06:15", actividad: "Vuelo de revelación al amanecer", planos: ["1A"], locacion: "Mirador" },
          { hora: "08:00", actividad: "Caminata en sendero", planos: ["2A", "2B"], locacion: "Sendero" },
          { hora: "17:30", actividad: "Hora dorada en la cima", planos: ["3A", "3B"], locacion: "Cima" },
        ],
      },
    ],
    equipo: [
      { categoria: "Cámara", item: "Cámara mirrorless 4K 10-bit", cantidad: 1, notas: "Perfil log" },
      { categoria: "Lentes", item: "35 mm, 50 mm, 85 mm", cantidad: 3, notas: "" },
      { categoria: "Estabilización", item: "Gimbal de mano", cantidad: 1, notas: "" },
      { categoria: "Dron", item: "Dron con cámara 4K y filtros ND", cantidad: 1, notas: "Registro y seguro vigentes" },
      { categoria: "Dron", item: "Baterías de vuelo", cantidad: 4, notas: "Cargadas la noche anterior" },
      { categoria: "Audio", item: "Grabadora + micrófono shotgun", cantidad: 1, notas: "Ambientes y SFX" },
    ],
    crew: [
      { rol: "Director / Productor", responsabilidades: "Visión creativa y coordinación" },
      { rol: "Piloto RPAS", responsabilidades: "Planeación y ejecución de vuelos, seguridad aérea" },
      { rol: "Observador visual", responsabilidades: "Mantener contacto visual con la aeronave" },
      { rol: "Camarógrafo", responsabilidades: "Planos en tierra" },
    ],
    locaciones: [
      { nombre: "Mirador / cima", descripcion: "Zona montañosa con vista al valle", permisos: "Verificar espacio aéreo y obtener autorización de la autoridad aeronáutica local si aplica; permiso del parque.", riesgos: "Viento, pérdida de señal tras la cresta, senderistas." },
    ],
    presupuesto: {
      moneda: "MXN",
      items: [
        { concepto: "Crew (1 día)", estimado: "$12,000" },
        { concepto: "Renta de equipo", estimado: "$6,000" },
        { concepto: "Transporte y alimentos", estimado: "$3,000" },
        { concepto: "Postproducción", estimado: "$8,000" },
      ],
      total: "$29,000",
      notas: "Estimado orientativo.",
    },
    postproduccion: {
      edicion: "Corte al ritmo de la música, 60 s + versión 15 s.",
      color: "Corrección desde log, look cálido de hora dorada.",
      audio: "Mezcla de VO, música licenciada y SFX.",
      graficos: "Logo animado de cierre y subtítulos.",
      entregables: ["Master 16:9 4K", "Vertical 9:16 1080p", "Corte 15 s"],
    },
    checklist: [
      "Confirmar locación y permisos",
      "Revisar espacio aéreo y meteorología",
      "Casting / confirmar talento",
      "Licenciar música",
      "Cargar baterías y formatear memorias",
    ],
  };
}
