import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";
import {
  GEIST_400,
  GEIST_600,
  GELASIO_400,
  GELASIO_600,
  ICON_PNG,
} from "@/lib/og/og-assets";

// Imagen para Open Graph (WhatsApp, Facebook, X, Telegram, iMessage…).
// Se dibuja con Satori: solo flexbox y un subconjunto de CSS; todo <div> con
// más de un hijo necesita display: "flex".

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Colores del design system (modo oscuro + dorado de acento)
const NAVY = "#0F172A";
const BLUE = "#1E3A8A";
const GOLD = "#D4A574";
const MUTED = "#94A3B8";

// Fuentes y logo incrustados en base64 (lib/og/og-assets.ts, generado por
// scripts/generate-og-assets.ts). No leer archivos con fs: en Netlify la
// función serverless no incluye assets/ ni public/ y la imagen daba HTTP 500.
// Gelasio (OFL) tiene las métricas de Georgia, la fuente del lector.
const fromBase64 = (b64: string) => {
  const buf = Buffer.from(b64, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
};
const fonts = {
  serif: fromBase64(GELASIO_400),
  serifBold: fromBase64(GELASIO_600),
  sans: fromBase64(GEIST_400),
  sansBold: fromBase64(GEIST_600),
};

interface OgCardProps {
  /** Texto pequeño en dorado arriba, p. ej. "Versículo del día" */
  eyebrow: string;
  /** Título grande en serif (capítulo, plan, nombre de la app) */
  title?: string;
  /** Cita bíblica: se muestra grande, en serif y entre comillas */
  quote?: string;
  /** Texto secundario bajo el título */
  body?: string;
  /** Texto a la derecha del pie, p. ej. "Reina-Valera Gómez 2010" */
  footer?: string;
}

/** Tamaño de letra de la cita según su largo, para que siempre quepa. */
function quoteFontSize(text: string) {
  if (text.length < 90) return 60;
  if (text.length < 160) return 50;
  if (text.length < 240) return 42;
  if (text.length < 330) return 36;
  return 31;
}

export async function renderOgCard({ eyebrow, title, quote, body, footer }: OgCardProps) {
  const { serif, serifBold, sans, sansBold } = fonts;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          backgroundColor: NAVY,
          backgroundImage: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY} 45%, ${BLUE} 100%)`,
          color: "white",
          fontFamily: "Geist",
        }}
      >
        {/* Encabezado */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ width: 72, height: 6, borderRadius: 3, backgroundColor: GOLD }} />
          <div
            style={{
              fontFamily: "GeistBold",
              fontSize: 26,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: GOLD,
            }}
          >
            {eyebrow}
          </div>
        </div>

        {/* Contenido */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {title && (
            <div
              style={{
                fontFamily: "GelasioBold",
                fontSize: title.length > 24 ? 72 : 96,
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>
          )}
          {quote && (
            <div
              style={{
                display: "flex",
                fontFamily: "Gelasio",
                fontSize: quoteFontSize(quote),
                lineHeight: 1.35,
              }}
            >
              {`“${quote}”`}
            </div>
          )}
          {body && (
            <div
              style={{
                fontFamily: "Gelasio",
                fontSize: 34,
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              {body}
            </div>
          )}
        </div>

        {/* Pie */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori solo acepta <img> */}
            <img
              src={`data:image/png;base64,${ICON_PNG}`}
              width={52}
              height={52}
              style={{ borderRadius: 12 }}
              alt=""
            />
            <div style={{ fontFamily: "GeistBold", fontSize: 30 }}>{SITE_NAME}</div>
          </div>
          {footer && <div style={{ fontSize: 26, color: MUTED }}>{footer}</div>}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Gelasio", data: serif, weight: 400, style: "normal" },
        { name: "GelasioBold", data: serifBold, weight: 600, style: "normal" },
        // Las fuentes propias reemplazan a la Geist que trae next/og
        { name: "Geist", data: sans, weight: 400, style: "normal" },
        { name: "GeistBold", data: sansBold, weight: 600, style: "normal" },
      ],
    }
  );
}
