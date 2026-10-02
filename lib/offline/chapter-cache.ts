// Capítulos guardados para leer sin conexión.
//
// Se usa la misma caché ("bible-chapters") que la regla de runtimeCaching de
// next.config.ts: el service worker guarda ahí cada capítulo visitado y sirve
// desde ahí cuando no hay red. Las descargas de /descargas escriben en ella
// directamente con la Cache API.

import { BOOKS } from "@/lib/bible-api";

export const CHAPTER_CACHE = "bible-chapters";

const CHAPTER_PATH = /^\/leer\/([^/]+)\/(\d+)\/?$/;
const DOWNLOAD_CONCURRENCY = 3;

/** Peso aproximado de un capítulo guardado (HTML renderizado), para estimar */
export const APPROX_CHAPTER_KB = 85;

export function isOfflineSupported() {
  return typeof window !== "undefined" && "caches" in window;
}

export function chapterPath(book: string, chapter: number) {
  return `/leer/${book}/${chapter}`;
}

/**
 * Capítulos guardados en la versión por defecto (URL sin `?v=`), agrupados por libro:
 * `{ juan: Set{1, 3}, ... }`.
 */
export async function getCachedChapters(): Promise<Map<string, Set<number>>> {
  const result = new Map<string, Set<number>>();
  if (!isOfflineSupported()) return result;

  const cache = await caches.open(CHAPTER_CACHE);
  for (const request of await cache.keys()) {
    const url = new URL(request.url);
    if (url.search) continue; // otras versiones (?v=ntv)
    const match = url.pathname.match(CHAPTER_PATH);
    if (!match) continue;
    const [, book, chapter] = match;
    if (!result.has(book)) result.set(book, new Set());
    result.get(book)!.add(Number(chapter));
  }
  return result;
}

export interface DownloadProgress {
  done: number;
  total: number;
  failed: number;
}

/**
 * Descarga los capítulos que faltan de un libro. Reporta el avance y se puede
 * cancelar con `signal`. Devuelve el resultado final.
 */
export async function downloadBook(
  bookSlug: string,
  onProgress: (p: DownloadProgress) => void,
  signal?: AbortSignal
): Promise<DownloadProgress> {
  const book = BOOKS.find((b) => b.slug === bookSlug);
  if (!book) throw new Error(`Libro desconocido: ${bookSlug}`);

  const cache = await caches.open(CHAPTER_CACHE);
  const already = (await getCachedChapters()).get(bookSlug) ?? new Set<number>();
  const pending = Array.from({ length: book.chapters }, (_, i) => i + 1).filter(
    (c) => !already.has(c)
  );

  const progress: DownloadProgress = {
    done: book.chapters - pending.length,
    total: book.chapters,
    failed: 0,
  };
  onProgress({ ...progress });

  const worker = async () => {
    while (pending.length > 0) {
      if (signal?.aborted) return;
      const chapter = pending.shift()!;
      const url = chapterPath(bookSlug, chapter);
      try {
        const res = await fetch(url, { signal, credentials: "same-origin" });
        // Una redirección (p. ej. a /login) no es un capítulo válido
        if (!res.ok || res.redirected) throw new Error(String(res.status));
        await cache.put(url, res);
        progress.done++;
      } catch {
        if (signal?.aborted) return;
        progress.failed++;
      }
      onProgress({ ...progress });
    }
  };

  await Promise.all(Array.from({ length: DOWNLOAD_CONCURRENCY }, worker));
  return progress;
}

/** Borra todos los capítulos guardados de un libro (todas las versiones). */
export async function removeBook(bookSlug: string) {
  const cache = await caches.open(CHAPTER_CACHE);
  const prefix = `/leer/${bookSlug}/`;
  const keys = await cache.keys();
  await Promise.all(
    keys
      .filter((r) => new URL(r.url).pathname.startsWith(prefix))
      .map((r) => cache.delete(r))
  );
}

/** Espacio usado por la app en el dispositivo, si el navegador lo informa. */
export async function getStorageUsage(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const { usage, quota } = await navigator.storage.estimate();
  if (usage === undefined || quota === undefined) return null;
  return { usage, quota };
}

/** Pide al navegador que no borre la caché si se queda sin espacio. */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // no disponible: la caché sigue funcionando, solo que no es persistente
  }
}
