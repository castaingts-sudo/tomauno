// Catálogo de planes de Toma uno. Los precios en centavos de MXN para Stripe; los textos para la landing.

export interface Plan {
  id: string;
  nombre: string;
  tipo: "proyecto" | "mensual" | "extra";
  centavos: number;
  tomas: number; // tomas que da el plan (por mes en los mensuales)
  tope: string; // texto corto del límite
  minutos?: number; // duración máxima de un proyecto con este plan
}

export const PLANES: Plan[] = [
  { id: "spot", nombre: "Spot / redes", tipo: "proyecto", centavos: 89100, tomas: 30, tope: "Hasta 3 min · 30 tomas", minutos: 3 },
  { id: "institucional", nombre: "Institucional", tipo: "proyecto", centavos: 249100, tomas: 60, tope: "Hasta 8 min · 60 tomas", minutos: 8 },
  { id: "corto", nombre: "Cortometraje", tipo: "proyecto", centavos: 999100, tomas: 120, tope: "Hasta 20 min · 120 tomas", minutos: 20 },
  { id: "pro", nombre: "Pro", tipo: "mensual", centavos: 599100, tomas: 250, tope: "250 tomas al mes · 1 usuario" },
  { id: "estudio", nombre: "Estudio", tipo: "mensual", centavos: 1499100, tomas: 800, tope: "800 tomas al mes · equipo" },
  { id: "extra", nombre: "Paquete extra", tipo: "extra", centavos: 79100, tomas: 25, tope: "25 tomas más" },
];

export const planDe = (id?: string | null) => PLANES.find((p) => p.id === id);
export const precioTexto = (p: Plan) => (p.centavos / 100).toLocaleString("en-US");

// Costo aproximado de IA en MXN para el panel (Claude Opus por proyecto completo, Gemini por dibujo).
export const COSTO_PROYECTO_MXN = 60;
export const COSTO_DIBUJO_MXN = 0.8;
