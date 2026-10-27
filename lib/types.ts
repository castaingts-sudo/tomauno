// Estructura del paquete de preproducción que devuelve la IA.

export interface Brief {
  idea: string;
  duracion: string; // p. ej. "60 s", "3 min"
  formato: string; // plataforma / relación de aspecto
  estilo: string;
  presupuesto: string; // bajo | medio | alto o una cifra
  incluirDron: boolean;
  notas: string;
  archivo?: string; // nombre del brief subido
  documento?: string; // texto completo del brief (Word/TXT/MD)
  pdf?: string; // brief en PDF, base64 (no se guarda en el historial)
}

export interface Resumen {
  titulo: string;
  logline: string;
  objetivo: string;
  publico: string;
  tono: string;
  duracion: string;
  formato: string;
  referencias: string[];
}

export interface Escena {
  numero: number;
  encabezado: string; // INT./EXT. LUGAR - MOMENTO
  video: string; // lo que se ve
  vozEnOff?: string; // texto exacto de la locución (o testimonial a cuadro)
  audio: string; // música, SFX, sonido directo
  textoPantalla?: string; // supers, subtítulos, logos
  duracion: string;
}

export interface Plano {
  id: string; // "1A", "1B"...
  escena: number;
  tipoPlano: string; // PG, PM, PP, PD...
  angulo: string;
  movimiento: string;
  lente: string;
  camara: string; // cámara o dron
  descripcion: string;
  vozEnOff?: string;
  audio: string;
  duracion: string;
  notas: string;
}

export interface Panel {
  planoId: string;
  descripcion: string;
  dialogo: string;
  transicion: string;
  svg?: string; // boceto lineal 320x180 (se dibuja aparte, después del texto)
}

export interface JornadaItem {
  hora: string;
  actividad: string;
  planos: string[];
  locacion: string;
}

export interface Jornada {
  dia: number;
  fecha: string;
  locacion: string;
  llamado: string;
  items: JornadaItem[];
}

export interface EquipoItem {
  categoria: string; // Cámara, Lentes, Dron, Audio, Iluminación, Grip...
  item: string;
  cantidad: number;
  notas: string;
}

export interface CrewItem {
  rol: string;
  responsabilidades: string;
}

export interface Locacion {
  nombre: string;
  descripcion: string;
  permisos: string;
  riesgos: string;
}

export interface PresupuestoItem {
  concepto: string;
  estimado: string;
}

export interface Paquete {
  resumen: Resumen;
  guionAudiovisual: Escena[];
  guionTecnico: Plano[];
  storyboard: Panel[];
  planRodaje: Jornada[];
  equipo: EquipoItem[];
  crew: CrewItem[];
  locaciones: Locacion[];
  presupuesto: { moneda: string; items: PresupuestoItem[]; total: string; notas: string };
  postproduccion: { edicion: string; color: string; audio: string; graficos: string; entregables: string[] };
  checklist: string[];
}

export interface Proyecto {
  id: string;
  creado: string;
  brief: Brief;
  paquete: Paquete;
  share?: { id: string; ownerToken: string };
}
