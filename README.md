# Toma uno — preproducción de video con IA

Escribe la idea de tu video (o sube el brief del cliente en Word, PDF, TXT o MD: la IA llena el formulario sola) y la app genera el paquete completo de preproducción:

- Resumen creativo (logline, objetivo, público, tono, referencias)
- Guion audiovisual a dos columnas (VIDEO / AUDIO)
- Guion técnico / shot list (plano, ángulo, movimiento, lente, cámara o dron)
- Storyboard con bocetos dibujados por la IA (SVG, sin costo extra de imágenes)
- Plan de rodaje por día y hora
- Equipo, crew, locaciones y permisos (incluye espacio aéreo si hay dron)
- Presupuesto estimado, postproducción y checklist

Exporta a PDF (botón Imprimir → Guardar como PDF), Markdown y JSON. Los proyectos se guardan en el navegador.

## Correr en local

```bash
npm install
cp .env.example .env.local   # pega tu ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Sin clave, la app corre en **modo demo** con un proyecto de ejemplo para probar la interfaz.

## Stack

- Next.js 15 (App Router) + TypeScript, sin base de datos
- API de Claude (`@anthropic-ai/sdk`) con streaming, desde `app/api/generate/route.ts`
- Modelo por defecto `claude-opus-5-5`; cambia con `CLAUDE_MODEL` (p. ej. `claude-sonnet-5-5` para gastar menos)

## Desplegar

Vercel (plan gratuito): importa el repo, agrega `ANTHROPIC_API_KEY` en Environment Variables y despliega.
El único costo variable es el uso de la API de Claude por cada generación.

## Archivos clave

- `lib/prompt.ts` — instrucciones al modelo y formato del paquete (aquí se ajusta el estilo de guion)
- `lib/types.ts` — estructura de datos
- `app/page.tsx` — interfaz
- `lib/export.ts` — exportación a Markdown

## Instalar en el celular

Abre la URL de Vercel en el teléfono → Compartir → "Agregar a pantalla de inicio" (iPhone) o menú → "Instalar app" (Android).
