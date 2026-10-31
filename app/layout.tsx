import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const text = Inter({ subsets: ["latin"], variable: "--font-text", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://toma1.com.mx"),
  title: "Toma uno · Preproducción de video",
  description: "De la idea al guion, storyboard y plan de rodaje.",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Toma uno", statusBarStyle: "black-translucent" },
  openGraph: { title: "Toma uno", description: "De la idea al guion, storyboard y plan de rodaje.", siteName: "Toma uno", locale: "es_MX", type: "website" },
};

export const viewport: Viewport = { themeColor: "#07080a", width: "device-width", initialScale: 1 };

// Modo sol (claro) para leer en locación; se recuerda por dispositivo.
const TEMA = `try{if(localStorage.getItem("toma-uno:tema")==="sol")document.documentElement.dataset.theme="sol"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${text.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
