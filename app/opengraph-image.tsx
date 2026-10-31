import { ImageResponse } from "next/og";

// Vista previa al compartir un link (WhatsApp, correo, redes).
export const alt = "Toma uno · Estudio de preproducción";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, backgroundColor: "#07080a", backgroundImage: "radial-gradient(circle at 15% 0%, rgba(255,176,0,0.25), rgba(7,8,10,0) 55%)", color: "#f3f4f6", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: "#ffb000", color: "#1a1200", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800 }}>T1</div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
            Toma <span style={{ color: "#ffb000", marginLeft: 12 }}>uno</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, letterSpacing: 6, color: "#ffc53d" }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: "#ff453a" }} />
            ESTUDIO DE PREPRODUCCIÓN
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>De la idea al guion, storyboard y plan de rodaje.</div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 24, color: "#a1a6b1" }}>
          {["Guion audiovisual", "Storyboard", "Guion técnico", "Plan de rodaje", "Dron"].map((t) => (
            <div key={t} style={{ display: "flex", padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)" }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
