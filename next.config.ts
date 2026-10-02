import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const ONE_DAY = 24 * 60 * 60;

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  // No recargar de golpe al volver la conexión (interrumpe la lectura);
  // OfflineBanner hace router.refresh() en su lugar.
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === "development",
  // Sin conexión y sin caché, las páginas muestran app/~offline (se detecta sola)
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    // Estas reglas van antes de las de next-pwa; la primera que coincide gana.
    // Las funciones se serializan dentro de sw.js: no pueden usar variables de
    // este archivo.
    runtimeCaching: [
      {
        // Capítulos del lector (documento HTML, no el payload RSC). Aquí también
        // se guardan las descargas de /descargas (lib/offline/chapter-cache.ts).
        urlPattern: ({ request, url, sameOrigin }) =>
          sameOrigin &&
          request.headers.get("RSC") !== "1" &&
          /^\/leer\/[^/]+\/\d+\/?$/.test(url.pathname),
        handler: "NetworkFirst",
        options: {
          cacheName: "bible-chapters",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 1500, maxAgeSeconds: 365 * ONE_DAY },
          cacheableResponse: { statuses: [200] },
        },
      },
      {
        // Reemplaza la regla "pages" por defecto (32 entradas, 1 día) para que
        // el inicio, notas, favoritos, etc. sigan disponibles sin conexión.
        // Solo navegaciones de página: JS, CSS e imágenes siguen con sus reglas.
        urlPattern: ({ request, url, sameOrigin }) =>
          sameOrigin &&
          request.mode === "navigate" &&
          !url.pathname.startsWith("/api/") &&
          !url.pathname.startsWith("/auth/"),
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * ONE_DAY },
          cacheableResponse: { statuses: [200] },
        },
      },
    ],
  },
  customWorkerSrc: "worker",
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
