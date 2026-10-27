import type { Operador } from "./types";

// Catálogo para el menú de cámaras. La ficha va al prompt para que la IA elija ópticas y planos acordes.
export interface Camara {
  modelo: string;
  sensor: string;
  montura: string;
  max: string; // resolución y cuadros máximos
}

export const CAMARAS: Record<string, Camara[]> = {
  Sony: [
    { modelo: "Sony FX3", sensor: "Full frame", montura: "Sony E", max: "4K 120p, 10-bit S-Log3" },
    { modelo: "Sony FX30", sensor: "Super 35", montura: "Sony E", max: "4K 120p (recorte), S-Log3" },
    { modelo: "Sony FX6", sensor: "Full frame", montura: "Sony E", max: "4K 120p, ND variable" },
    { modelo: "Sony FX9", sensor: "Full frame 6K", montura: "Sony E", max: "4K 60p, ND variable" },
    { modelo: "Sony Burano", sensor: "Full frame 8.6K", montura: "PL / Sony E", max: "8K 30p, 4K 120p, ND variable" },
    { modelo: "Sony Venice 2", sensor: "Full frame 8.6K", montura: "PL / Sony E", max: "8K 60p, X-OCN RAW" },
    { modelo: "Sony A7S III", sensor: "Full frame", montura: "Sony E", max: "4K 120p" },
    { modelo: "Sony A7 IV", sensor: "Full frame", montura: "Sony E", max: "4K 60p (recorte)" },
    { modelo: "Sony A1 II", sensor: "Full frame", montura: "Sony E", max: "8K 30p, 4K 120p" },
  ],
  Blackmagic: [
    { modelo: "Blackmagic Pocket 4K", sensor: "Micro 4/3", montura: "MFT", max: "4K 60p, BRAW" },
    { modelo: "Blackmagic Pocket 6K Pro", sensor: "Super 35", montura: "Canon EF", max: "6K 50p, BRAW, ND" },
    { modelo: "Blackmagic Cinema Camera 6K", sensor: "Full frame", montura: "L-Mount", max: "6K 36p, BRAW" },
    { modelo: "Blackmagic PYXIS 6K", sensor: "Full frame", montura: "L / EF / PL", max: "6K 36p, BRAW" },
    { modelo: "Blackmagic URSA Mini Pro 12K", sensor: "Super 35 12K", montura: "PL (intercambiable)", max: "12K 60p, 4K 220p, BRAW" },
    { modelo: "Blackmagic URSA Cine 12K", sensor: "Full frame 12K", montura: "PL", max: "12K 100p, BRAW" },
    { modelo: "Blackmagic URSA Cine 17K 65", sensor: "65 mm 17K", montura: "PL", max: "17K 60p, BRAW" },
  ],
  RED: [
    { modelo: "RED Komodo 6K", sensor: "Super 35 global shutter", montura: "Canon RF", max: "6K 40p, 4K 120p, R3D" },
    { modelo: "RED Komodo-X", sensor: "Super 35 global shutter", montura: "Canon RF", max: "6K 80p, R3D" },
    { modelo: "RED V-Raptor 8K VV", sensor: "Vista Vision 8K", montura: "Canon RF / PL", max: "8K 120p, R3D" },
    { modelo: "RED V-Raptor X", sensor: "Vista Vision 8K global shutter", montura: "Canon RF / PL", max: "8K 120p, R3D" },
    { modelo: "RED Epic-W Helium 8K", sensor: "Super 35 8K", montura: "PL / EF", max: "8K 30p, 2K 300p, R3D" },
    { modelo: "RED Epic Dragon 6K", sensor: "Super 35 6K", montura: "PL / EF", max: "6K 100p, R3D" },
    { modelo: "RED Gemini 5K", sensor: "Super 35 5K, doble ISO", montura: "PL / EF", max: "5K 96p, R3D (baja luz)" },
  ],
  ARRI: [
    { modelo: "ARRI Alexa Mini LF", sensor: "Large format 4.5K", montura: "LPL", max: "4.5K 40p, ARRIRAW" },
    { modelo: "ARRI Alexa 35", sensor: "Super 35 4.6K", montura: "LPL / PL", max: "4.6K 75p, 17 stops" },
    { modelo: "ARRI Alexa Mini", sensor: "Super 35 3.4K", montura: "PL", max: "3.4K 30p, 2.8K 200p" },
    { modelo: "ARRI Amira", sensor: "Super 35", montura: "PL", max: "4K UHD 60p, 2K 200p" },
  ],
  Canon: [
    { modelo: "Canon C70", sensor: "Super 35 DGO", montura: "Canon RF", max: "4K 120p, ND" },
    { modelo: "Canon C300 Mark III", sensor: "Super 35 DGO", montura: "Canon EF / PL", max: "4K 120p, Cinema RAW Light" },
    { modelo: "Canon C400", sensor: "Full frame 6K", montura: "Canon RF", max: "6K 60p, 4K 120p, ND" },
    { modelo: "Canon C500 Mark II", sensor: "Full frame 5.9K", montura: "Canon EF / PL", max: "5.9K 60p, Cinema RAW" },
    { modelo: "Canon R5 C", sensor: "Full frame 8K", montura: "Canon RF", max: "8K 30p, 4K 120p" },
    { modelo: "Canon R5 Mark II", sensor: "Full frame 8K", montura: "Canon RF", max: "8K 60p, 4K 120p" },
  ],
  Panasonic: [
    { modelo: "Panasonic GH6", sensor: "Micro 4/3", montura: "MFT", max: "5.7K 60p, 4K 120p, ProRes" },
    { modelo: "Panasonic GH7", sensor: "Micro 4/3", montura: "MFT", max: "5.7K 30p ProRes RAW, 4K 120p" },
    { modelo: "Panasonic S5 II X", sensor: "Full frame", montura: "L-Mount", max: "6K 30p, 4K 60p, ProRes" },
    { modelo: "Panasonic S1H", sensor: "Full frame", montura: "L-Mount", max: "6K 24p, 4K 60p" },
    { modelo: "Panasonic EVA1", sensor: "Super 35 5.7K", montura: "Canon EF", max: "4K 60p, 2K 240p" },
  ],
  Nikon: [
    { modelo: "Nikon Z8", sensor: "Full frame 8K", montura: "Nikon Z", max: "8K 60p RAW, 4K 120p" },
    { modelo: "Nikon Z9", sensor: "Full frame 8K", montura: "Nikon Z", max: "8K 60p RAW, 4K 120p" },
    { modelo: "Nikon Z6 III", sensor: "Full frame", montura: "Nikon Z", max: "6K 60p RAW, 4K 120p" },
  ],
  "DJI cine": [
    { modelo: "DJI Ronin 4D 6K", sensor: "Full frame 6K", montura: "DL / E / L / M", max: "6K 60p, 4K 120p, gimbal de 4 ejes y LiDAR" },
    { modelo: "DJI Ronin 4D 8K", sensor: "Full frame 8K", montura: "DL / E / L / M", max: "8K 60p, gimbal de 4 ejes y LiDAR" },
    { modelo: "DJI Osmo Pocket 3", sensor: '1"', montura: "Lente fijo 20 mm eq.", max: "4K 120p, gimbal integrado" },
  ],
  GoPro: [{ modelo: "GoPro HERO13 Black", sensor: '1/1.9"', montura: "Lente fijo gran angular", max: "5.3K 60p, 4K 120p" }],
  iPhone: [{ modelo: "iPhone 16 Pro", sensor: "48 MP", montura: "Lentes fijos 13/24/120 mm eq.", max: "4K 120p, ProRes Log" }],
};

export const DRONES: Record<string, Camara[]> = {
  DJI: [
    { modelo: "DJI Mavic 3 Pro", sensor: "4/3 + 2 teles", montura: "24 / 70 / 166 mm eq.", max: "5.1K 50p, D-Log" },
    { modelo: "DJI Mavic 3 Cine", sensor: "4/3", montura: "24 mm eq. + tele 162 mm", max: "5.1K 50p, ProRes 422 HQ" },
    { modelo: "DJI Mavic 4 Pro", sensor: "4/3 + 2 teles", montura: "28 / 70 / 168 mm eq.", max: "6K 60p, 4K 120p" },
    { modelo: "DJI Air 3S", sensor: '1" + tele', montura: "24 / 70 mm eq.", max: "4K 120p, D-Log M" },
    { modelo: "DJI Mini 4 Pro", sensor: '1/1.3"', montura: "24 mm eq.", max: "4K 100p, menos de 250 g" },
    { modelo: "DJI Inspire 3", sensor: "Full frame 8K (Zenmuse X9)", montura: "DL (lentes intercambiables)", max: "8K 25p CinemaDNG / ProRes RAW" },
    { modelo: "DJI Inspire 2 + X7", sensor: "Super 35 6K", montura: "DL", max: "6K CinemaDNG" },
    { modelo: "DJI Avata 2 (FPV)", sensor: '1/1.3"', montura: "Gran angular 155°", max: "4K 60p, vuelo FPV" },
    { modelo: "DJI Matrice 4E", sensor: "4/3 + tele + láser", montura: "24 / 70 / 168 mm eq.", max: "Mapeo y cartografía" },
  ],
  Otros: [
    { modelo: "FPV cinewhoop con GoPro", sensor: "Según cámara", montura: "Gran angular", max: "Interiores y pasadas cercanas" },
    { modelo: "Freefly Alta X + cámara cine", sensor: "Según cámara", montura: "Según cámara", max: "Carga pesada (Alexa, RED)" },
  ],
};

const todas = (tipo: Operador["tipo"]) => Object.values(tipo === "dron" ? DRONES : CAMARAS).flat();
export const fichaCamara = (modelo: string | undefined, tipo: Operador["tipo"]) => todas(tipo).find((c) => c.modelo === modelo);

// Texto del equipo de un operador: cuerpo elegido (con su ficha) más lo que escribió.
export function gearDe(o: Operador, conFicha = false): string {
  const f = fichaCamara(o.camara, o.tipo);
  const cuerpo = o.camara ? (conFicha && f ? `${o.camara} (${f.sensor}, montura ${f.montura}, ${f.max})` : o.camara) : "";
  return [cuerpo, o.equipo?.trim()].filter(Boolean).join(" · ");
}
