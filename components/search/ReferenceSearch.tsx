"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { BOOKS } from "@/lib/bible-api";
import { buildRef, parseReference, suggestBooks } from "@/lib/parse-reference";
import { getReferencePreview, type ReferencePreview } from "@/lib/search-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EXAMPLES = ["Juan 3:16", "Sal 23", "1 Co 13:4-7", "Ro 8:28", "Gn 1"];

const bookName = (slug: string) => BOOKS.find((b) => b.slug === slug)?.name ?? slug;

export function ReferenceSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [preview, setPreview] = useState<{ key: string; data: ReferencePreview | null } | null>(null);

  const result = useMemo(() => parseReference(query), [query]);
  const suggestions = useMemo(() => suggestBooks(query), [query]);
  const refKey = result.ok ? result.label : null;

  // Vista previa del texto (con una pequeña espera mientras se escribe)
  useEffect(() => {
    if (!result.ok) return;
    const { book, chapter, verse, verseEnd } = result.ref;
    const key = result.label;
    const timer = setTimeout(() => {
      getReferencePreview(book, chapter, verse, verseEnd)
        .then((data) => setPreview({ key, data }))
        .catch(() => setPreview({ key, data: null })); // sin conexión
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refKey identifica la referencia
  }, [refKey]);

  const go = (href: string) => router.push(href);

  const fillBook = (slug: string) => {
    setQuery(`${bookName(slug)} `);
    inputRef.current?.focus();
  };

  const currentPreview = preview && preview.key === refKey ? preview.data : null;
  const verseMissing =
    result.ok && result.ref.verse && currentPreview && result.ref.verse > currentPreview.verseCount;

  return (
    <div className="space-y-5">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (result.ok) go(result.href);
        }}
        className="relative"
      >
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          id="reference-search"
          type="search"
          inputMode="search"
          enterKeyHint="go"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Juan 3:16, Sal 23, 1 Co 13…"
          aria-label="Buscar libro, capítulo o versículo"
          className="h-12 pl-9 text-base"
        />
      </form>

      {/* Sin texto: ejemplos */}
      {result.ok === false && result.reason === "empty" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Escribe un libro con capítulo y versículo. Puedes usar abreviaturas.
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <Button key={ex} variant="outline" size="sm" className="h-9" onClick={() => setQuery(ex)}>
                {ex}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Referencia válida */}
      {result.ok && (
        <button
          type="button"
          onClick={() => go(result.href)}
          className="block w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{result.label}</p>
                <p className="text-xs text-muted-foreground">
                  {verseMissing
                    ? `${bookName(result.ref.book)} ${result.ref.chapter} tiene ${currentPreview!.verseCount} versículos · abrir el capítulo`
                    : "Toca o presiona Enter para abrir"}
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>

          {currentPreview && currentPreview.verses.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t pt-3 font-serif text-sm leading-relaxed text-foreground/90">
              {currentPreview.verses.map((v) => (
                <p key={v.verse}>
                  <sup className="mr-1 font-sans text-[0.7em] text-muted-foreground">{v.verse}</sup>
                  {v.text}
                </p>
              ))}
              {result.ref.verseEnd && result.ref.verseEnd - (result.ref.verse ?? 1) >= currentPreview.verses.length && (
                <p className="font-sans text-xs text-muted-foreground">…</p>
              )}
              <p className="font-sans text-xs text-muted-foreground">{currentPreview.versionShortName}</p>
            </div>
          )}
        </button>
      )}

      {/* Nombre ambiguo: elegir el libro */}
      {result.ok === false && result.reason === "ambiguous" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{result.message}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.candidates!.map((slug) => {
              const option = buildRef(slug, result.chapter, result.verse, result.verseEnd);
              return (
                <Button
                  key={slug}
                  variant="outline"
                  className="h-11 justify-between"
                  onClick={() => (option.ok ? go(option.href) : fillBook(slug))}
                >
                  {option.ok ? option.label : bookName(slug)}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Libro desconocido o capítulo que no existe */}
      {result.ok === false &&
        ["unknown-book", "chapter-out-of-range", "invalid"].includes(result.reason) &&
        suggestions.length === 0 && (
          <p role="status" className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {result.message}
          </p>
        )}

      {/* Sugerencias de libros mientras se escribe el nombre */}
      {/* (No se muestran si ya hay candidatos o si la única sugerencia es el resultado) */}
      {suggestions.length > 0 &&
        !(result.ok === false && result.reason === "ambiguous") &&
        !(result.ok && suggestions.length === 1 && suggestions[0] === result.ref.book) && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Libros</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((slug) => (
              <Button key={slug} variant="secondary" size="sm" className="h-9" onClick={() => fillBook(slug)}>
                {bookName(slug)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
