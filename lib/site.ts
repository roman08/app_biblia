// Datos del sitio para metadatos y Open Graph.

import type { Metadata } from "next";

export const SITE_NAME = "Biblia App";
export const SITE_DESCRIPTION =
  "Lee, medita y estudia la Palabra de Dios: la Biblia Reina-Valera, planes de lectura, notas y versículos para compartir.";

/**
 * URL pública del sitio, necesaria para que las imágenes de Open Graph tengan
 * URL absoluta. Orden: variable propia → URL de Netlify (producción o deploy
 * preview) → localhost.
 */
export function getSiteUrl(): URL {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.CONTEXT === "production" ? process.env.URL : process.env.DEPLOY_PRIME_URL) ||
    process.env.URL;
  return new URL(fromEnv || "http://localhost:3000");
}

/**
 * Campos comunes de `openGraph`. En Next, el `openGraph` de una página
 * reemplaza por completo al del layout, así que cada página los repite.
 */
export const OG_DEFAULTS = {
  siteName: SITE_NAME,
  locale: "es_MX",
  type: "website",
} as const;

/**
 * Metadatos completos de una página para compartir: título, descripción,
 * URL canónica, Open Graph y tarjeta grande de X/Twitter. La imagen la pone el
 * `opengraph-image.tsx` del segmento (o el de app/ si no tiene uno propio).
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  ownImage = false,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  /**
   * `true` si el segmento tiene su propio opengraph-image.tsx. Si no, se pone
   * la imagen general: al definir `openGraph`, la página deja de heredar la de
   * app/. (Una imagen explícita aquí le ganaría al archivo, por eso la opción.)
   */
  ownImage?: boolean;
}): Metadata {
  // Ojo: la clave `images` debe faltar (no valer undefined) para que Next use
  // el opengraph-image.tsx del segmento.
  const images = ownImage ? {} : { images: [DEFAULT_OG_IMAGE] };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...OG_DEFAULTS, type, title, description, url: path, ...images },
    twitter: { card: "summary_large_image", title, description, ...images },
  };
}

/** Imagen general (app/opengraph-image.tsx) */
const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME}: lee, medita y estudia la Palabra de Dios`,
};

/** Recorta un texto a `max` caracteres sin cortar palabras. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "") + "…";
}
