import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { BOOKS, chapterHref } from "@/lib/bible-api";
import { BOOK_CATEGORY, type BookCategory } from "@/lib/book-categories";
import type { BibleProgress as Progress } from "@/lib/supabase/stats-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TOTAL_CHAPTERS = BOOKS.reduce((n, b) => n + b.chapters, 0); // 1189

const CATEGORY_ORDER: BookCategory[] = [
  "Pentateuco",
  "Históricos",
  "Poéticos",
  "Profetas mayores",
  "Profetas menores",
  "Evangelios",
  "Hechos",
  "Epístolas",
  "Apocalipsis",
];

const fmt = new Intl.NumberFormat("es-MX");

function percent(read: number, total: number) {
  if (read === 0) return 0;
  const p = (read / total) * 100;
  // Con poco avance mostrar un decimal ("0.3%") en lugar de "0%"
  return p < 10 ? Math.round(p * 10) / 10 : Math.round(p);
}

/** Barra de avance: pista gris y relleno del color primario */
function Meter({ value, total, className }: { value: number; total: number; className?: string }) {
  const width = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div
      // bg-border: en oscuro bg-muted es igual a la tarjeta y la pista no se ve
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-border", className)}
      role="presentation"
    >
      <div
        className={cn("h-full rounded-full", value >= total ? "bg-success" : "bg-primary")}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function BibleProgress({ progress }: { progress: Progress }) {
  type Book = (typeof BOOKS)[number];
  const read = (slug: string) => progress.readByBook[slug]?.length ?? 0;
  const sumRead = (books: readonly Book[]) => books.reduce((n, b) => n + read(b.slug), 0);
  const sumTotal = (books: readonly Book[]) => books.reduce((n, b) => n + b.chapters, 0);

  const ot = BOOKS.filter((b) => b.testament === "OT");
  const nt = BOOKS.filter((b) => b.testament === "NT");
  const total = progress.totalRead;
  const pct = percent(total, TOTAL_CHAPTERS);

  /** Primer capítulo sin leer (o el 1 si ya leyó todo el libro) */
  const nextChapter = (slug: string, chapters: number) => {
    const done = new Set(progress.readByBook[slug] ?? []);
    for (let c = 1; c <= chapters; c++) if (!done.has(c)) return c;
    return 1;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Tu avance en la Biblia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cifra principal */}
        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold tabular-nums">{pct}%</span>
            <span className="text-sm text-muted-foreground">
              {fmt.format(total)} de {fmt.format(TOTAL_CHAPTERS)} capítulos
            </span>
          </div>
          <Meter value={total} total={TOTAL_CHAPTERS} className="h-2.5" />

          <div className="grid grid-cols-2 gap-4 pt-1">
            {[
              { label: "Antiguo Testamento", books: ot },
              { label: "Nuevo Testamento", books: nt },
            ].map(({ label, books }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium tabular-nums">
                    {percent(sumRead(books), sumTotal(books))}%
                  </span>
                </div>
                <Meter value={sumRead(books)} total={sumTotal(books)} />
              </div>
            ))}
          </div>

          {!progress.available ? (
            <p className="text-xs text-muted-foreground">
              El avance por capítulo todavía no está disponible.
            </p>
          ) : total === 0 ? (
            <p className="text-xs text-muted-foreground">
              Cada capítulo que leas completo (hasta el último versículo o 30 segundos en la
              página) se suma aquí.
            </p>
          ) : null}
        </div>

        {/* Por libro, agrupado por género */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Por libro</h3>
          {CATEGORY_ORDER.map((category) => {
            const books = BOOKS.filter((b) => BOOK_CATEGORY[b.slug] === category);
            const groupRead = sumRead(books);
            const groupTotal = sumTotal(books);
            return (
              <details key={category} className="group rounded-lg border">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
                  <span className="flex-1 text-sm font-medium">{category}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {groupRead}/{groupTotal}
                  </span>
                  <Meter value={groupRead} total={groupTotal} className="w-16" />
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <ul className="divide-y border-t">
                  {books.map((b) => {
                    const r = read(b.slug);
                    const complete = r >= b.chapters;
                    return (
                      <li key={b.slug}>
                        <Link
                          href={chapterHref(b.slug, nextChapter(b.slug, b.chapters))}
                          className="flex min-h-11 items-center gap-3 px-3 py-2 transition-colors hover:bg-muted"
                          aria-label={`${b.name}: ${r} de ${b.chapters} capítulos leídos${complete ? ", completo" : ""}`}
                        >
                          <span className="w-32 shrink-0 truncate text-sm">{b.name}</span>
                          <Meter value={r} total={b.chapters} className="flex-1" />
                          <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                            {complete ? (
                              <span className="inline-flex items-center gap-1 text-success">
                                <Check className="h-3 w-3" aria-hidden="true" />
                                {b.chapters}
                              </span>
                            ) : (
                              `${r}/${b.chapters}`
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
