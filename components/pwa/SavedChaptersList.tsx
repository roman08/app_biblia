"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { BOOKS } from "@/lib/bible-api";
import { getLastRead, type LastRead } from "@/lib/reading-history";
import { chapterPath, getCachedChapters } from "@/lib/offline/chapter-cache";
import { Button } from "@/components/ui/button";

// Lista de capítulos que se pueden leer sin conexión, en orden bíblico.
// Usa <a> en lugar de <Link>: sin red la navegación del cliente falla y
// conviene ir directo al documento que sirve el service worker.
export function SavedChaptersList() {
  const [saved, setSaved] = useState<Map<string, Set<number>> | null>(null);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCachedChapters()
      .catch(() => new Map<string, Set<number>>())
      .then((map) => {
        if (cancelled) return;
        setSaved(map);
        setLastRead(getLastRead());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (saved === null) {
    return <p className="text-sm text-muted-foreground">Buscando capítulos guardados…</p>;
  }

  const books = BOOKS.filter((b) => saved.has(b.slug));
  const lastReadSaved = lastRead && saved.get(lastRead.book)?.has(lastRead.chapter);

  if (books.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Todavía no hay capítulos guardados en este dispositivo. Cuando tengas
        conexión, los capítulos que leas se guardarán solos, y en{" "}
        <a href="/descargas" className="font-medium text-foreground underline underline-offset-2">
          Lectura sin conexión
        </a>{" "}
        puedes descargar libros completos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {lastRead && lastReadSaved && (
        <a
          href={chapterPath(lastRead.book, lastRead.chapter)}
          className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Continuar leyendo
              </p>
              <p className="truncate font-semibold">
                {lastRead.bookName} {lastRead.chapter}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>
      )}

      <div className="space-y-4">
        {books.map((book) => {
          const chapters = [...saved.get(book.slug)!].sort((a, b) => a - b);
          return (
            <section key={book.slug}>
              <h2 className="mb-2 text-sm font-semibold">
                {book.name}{" "}
                <span className="font-normal text-muted-foreground">
                  · {chapters.length} de {book.chapters}
                </span>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {chapters.map((c) => (
                  <Button
                    key={c}
                    variant="outline"
                    size="sm"
                    className="h-10 min-w-10 px-2 tabular-nums"
                    nativeButton={false}
                    render={<a href={chapterPath(book.slug, c)} />}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
