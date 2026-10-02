"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Download, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { BOOKS } from "@/lib/bible-api";
import {
  APPROX_CHAPTER_KB,
  downloadBook,
  getCachedChapters,
  getStorageUsage,
  isOfflineSupported,
  removeBook,
  requestPersistentStorage,
  type DownloadProgress,
} from "@/lib/offline/chapter-cache";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatMB(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function estimateMB(chapters: number) {
  return Math.max(1, Math.round((chapters * APPROX_CHAPTER_KB) / 1024));
}

const noopSubscribe = () => () => {};

export function BookDownloads() {
  const online = useOnlineStatus();
  // null en el servidor; en el cliente, si el navegador tiene Cache API
  const supported = useSyncExternalStore(noopSubscribe, isOfflineSupported, () => null);
  const [saved, setSaved] = useState<Map<string, Set<number>>>(new Map());
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const [active, setActive] = useState<{ book: string; progress: DownloadProgress } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadState = () => Promise.all([getCachedChapters(), getStorageUsage()]);

  const refresh = useCallback(async () => {
    const [map, storage] = await loadState();
    setSaved(map);
    setUsage(storage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (isOfflineSupported()) {
      loadState()
        .then(([map, storage]) => {
          if (cancelled) return;
          setSaved(map);
          setUsage(storage);
        })
        .catch(() => {});
    }
    // Si el usuario sale de la página, cancelar la descarga en curso
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  const handleDownload = async (slug: string, name: string) => {
    const controller = new AbortController();
    abortRef.current = controller;
    await requestPersistentStorage();
    try {
      const result = await downloadBook(
        slug,
        (progress) => setActive({ book: slug, progress }),
        controller.signal
      );
      if (controller.signal.aborted) {
        toast(`Descarga de ${name} cancelada`);
      } else if (result.failed > 0) {
        toast.error(
          `${name}: ${result.failed} capítulos no se descargaron. Vuelve a intentarlo para completar.`
        );
      } else {
        toast.success(`${name} disponible sin conexión`);
      }
    } catch {
      toast.error(`No se pudo descargar ${name}. Revisa tu conexión.`);
    } finally {
      abortRef.current = null;
      setActive(null);
      refresh().catch(() => {});
    }
  };

  const handleRemove = async (slug: string, name: string) => {
    await removeBook(slug);
    toast.success(`${name} eliminado del dispositivo`);
    refresh().catch(() => {});
  };

  if (supported === null) return null;

  if (!supported) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Tu navegador no permite guardar capítulos para leer sin conexión.
      </p>
    );
  }

  const savedChapters = [...saved.values()].reduce((n, s) => n + s.size, 0);

  const renderBook = (book: (typeof BOOKS)[number]) => {
    const count = saved.get(book.slug)?.size ?? 0;
    const complete = count >= book.chapters;
    const isActive = active?.book === book.slug;
    const busy = active !== null;

    return (
      <li key={book.slug} className="flex items-center gap-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{book.name}</p>
          {isActive ? (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{
                    width: `${(active.progress.done / active.progress.total) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">
                {active.progress.done}/{active.progress.total}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {complete
                ? `Guardado · ${book.chapters} capítulos`
                : count > 0
                  ? `${count} de ${book.chapters} capítulos · faltan ~${estimateMB(book.chapters - count)} MB`
                  : `${book.chapters} capítulos · ~${estimateMB(book.chapters)} MB`}
            </p>
          )}
        </div>

        {isActive ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => abortRef.current?.abort()}
            aria-label={`Cancelar descarga de ${book.name}`}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            {complete ? (
              <Check className="h-4 w-4 text-success" aria-label="Guardado" />
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => handleDownload(book.slug, book.name)}
                disabled={busy || !online}
                aria-label={`Descargar ${book.name}`}
                title={online ? "Descargar" : "Necesitas conexión para descargar"}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {count > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => handleRemove(book.slug, book.name)}
                disabled={busy}
                aria-label={`Eliminar ${book.name} del dispositivo`}
                title="Eliminar del dispositivo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 text-sm">
        <p>
          <span className="font-semibold tabular-nums">{savedChapters}</span>{" "}
          {savedChapters === 1 ? "capítulo guardado" : "capítulos guardados"}
          {usage && (
            <span className="text-muted-foreground">
              {" "}· la app usa {formatMB(usage.usage)} en este dispositivo
            </span>
          )}
        </p>
        {!online && (
          <p className="mt-1 text-muted-foreground">
            Sin conexión: puedes eliminar libros, pero para descargar necesitas internet.
          </p>
        )}
      </div>

      {(["OT", "NT"] as const).map((testament) => (
        <Card key={testament}>
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">
              {testament === "OT" ? "Antiguo Testamento" : "Nuevo Testamento"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {BOOKS.filter((b) => b.testament === testament).map(renderBook)}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
