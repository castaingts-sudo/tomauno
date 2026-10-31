import estaciones from "@/lib/stations-mx.json";

export const runtime = "nodejs";

// Clima para el plan de rodaje: las mismas fuentes públicas que la app de clima de Drone Solutions.
// Open-Meteo (geocodificación y pronóstico de 16 días) y el METAR/TAF del aeropuerto más cercano (aviationweather.gov).

interface Estacion { icao: string; name: string; lat: number; lon: number; taf?: boolean }

async function getJSON(url: string, segundos: number) {
  const r = await fetch(url, { headers: { "User-Agent": "TomaUno/1.0" }, next: { revalidate: segundos }, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`${new URL(url).host} respondió ${r.status}`);
  const t = await r.text();
  return t.trim() ? JSON.parse(t) : null;
}

async function geocodificar(q: string) {
  const j = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=es&countryCode=MX&format=json`, 86400);
  const g = j?.results?.[0];
  return g ? { nombre: [g.name, g.admin1].filter((x: string, i: number, a: string[]) => x && a.indexOf(x) === i).join(", "), lat: g.latitude as number, lon: g.longitude as number } : null;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") || "").trim().slice(0, 80);
  let lat = Number(u.searchParams.get("lat")), lon = Number(u.searchParams.get("lon"));
  let nombre = u.searchParams.get("nombre") || "";

  try {
    if (q) {
      const g = await geocodificar(q);
      if (!g) return Response.json({ error: `No encontré "${q}" en México.` }, { status: 404 });
      ({ lat, lon, nombre } = g);
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Response.json({ error: "Falta el lugar." }, { status: 400 });

    const [pron, metar] = await Promise.allSettled([
      getJSON(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,cloud_cover_mean,sunrise,sunset&forecast_days=16&wind_speed_unit=kmh&timezone=auto`,
        1800,
      ),
      aeropuerto(lat, lon),
    ]);

    const dias: Record<string, unknown> = {};
    let offset = -360;
    if (pron.status === "fulfilled" && pron.value?.daily) {
      const d = pron.value.daily;
      offset = Math.round((pron.value.utc_offset_seconds ?? -21600) / 60);
      (d.time as string[]).forEach((f, i) => {
        dias[f] = {
          codigo: d.weather_code?.[i],
          max: d.temperature_2m_max?.[i],
          min: d.temperature_2m_min?.[i],
          lluvia: d.precipitation_probability_max?.[i],
          viento: d.wind_speed_10m_max?.[i],
          rafagas: d.wind_gusts_10m_max?.[i],
          nubes: d.cloud_cover_mean?.[i],
          sale: d.sunrise?.[i],
          pone: d.sunset?.[i],
        };
      });
    }
    return Response.json({ lugar: { nombre, lat, lon }, offset, dias, metar: metar.status === "fulfilled" ? metar.value : null });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "No se pudo consultar el clima." }, { status: 502 });
  }
}

// METAR y TAF del aeropuerto más cercano (hasta 120 km).
async function aeropuerto(lat: number, lon: number) {
  const cerca = (estaciones as Estacion[])
    .map((s) => ({ s, km: Math.hypot(s.lat - lat, (s.lon - lon) * Math.cos((lat * Math.PI) / 180)) * 111 }))
    .sort((a, b) => a.km - b.km)[0];
  if (!cerca || cerca.km > 120) return null;
  const rows = await getJSON(`https://aviationweather.gov/api/data/metar?ids=${cerca.s.icao}&format=json&taf=true`, 600);
  const m = Array.isArray(rows) ? rows[0] : null;
  if (!m) return null;
  return {
    icao: cerca.s.icao,
    nombre: cerca.s.name,
    km: Math.round(cerca.km),
    raw: m.rawOb as string,
    taf: (m.rawTaf as string) || "",
    hora: m.obsTime as number,
    temp: m.temp,
    wdir: m.wdir,
    wspd: m.wspd,
    wgst: m.wgst,
    visib: m.visib,
    cat: m.fltCat as string,
  };
}
