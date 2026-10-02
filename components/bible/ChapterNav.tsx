import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOOKS, chapterHref, type VersionKey } from "@/lib/bible-api";

interface ChapterNavProps {
  bookSlug: string;
  currentChapter: number;
  totalChapters: number;
  version: VersionKey;
}

export function ChapterNav({
  bookSlug,
  currentChapter,
  totalChapters,
  version,
}: ChapterNavProps) {
  const book = BOOKS.find((b) => b.slug === bookSlug);
  if (!book) return null;

  const prevChapter = currentChapter > 1 ? currentChapter - 1 : null;
  const prevBookIndex = BOOKS.findIndex((b) => b.slug === bookSlug) - 1;
  const prevBook = prevBookIndex >= 0 ? BOOKS[prevBookIndex] : null;

  const nextChapter = currentChapter < totalChapters ? currentChapter + 1 : null;
  const nextBookIndex = BOOKS.findIndex((b) => b.slug === bookSlug) + 1;
  const nextBook = nextBookIndex < BOOKS.length ? BOOKS[nextBookIndex] : null;

  return (
    <div className="flex items-center justify-between gap-2">
      {/* Anterior */}
      <div className="flex-1">
        {prevChapter && (
          <Link href={chapterHref(bookSlug, prevChapter, version)}>
            <Button
              variant="outline"
              className="h-auto w-full flex-col items-start gap-0.5 py-2 text-left"
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                ← Anterior
              </span>
              <span className="text-xs font-medium truncate">
                {book.name} {prevChapter}
              </span>
            </Button>
          </Link>
        )}
        {!prevChapter && prevBook && (
          <Link href={chapterHref(prevBook.slug, prevBook.chapters, version)}>
            <Button
              variant="outline"
              className="h-auto w-full flex-col items-start gap-0.5 py-2 text-left"
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                ← Anterior
              </span>
              <span className="text-xs font-medium truncate">
                {prevBook.name} {prevBook.chapters}
              </span>
            </Button>
          </Link>
        )}
      </div>

      {/* Siguiente */}
      <div className="flex-1">
        {nextChapter && (
          <Link href={chapterHref(bookSlug, nextChapter, version)}>
            <Button
              variant="outline"
              className="h-auto w-full flex-col items-end gap-0.5 py-2 text-right"
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Siguiente →
              </span>
              <span className="text-xs font-medium truncate">
                {book.name} {nextChapter}
              </span>
            </Button>
          </Link>
        )}
        {!nextChapter && nextBook && (
          <Link href={chapterHref(nextBook.slug, 1, version)}>
            <Button
              variant="outline"
              className="h-auto w-full flex-col items-end gap-0.5 py-2 text-right"
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Siguiente →
              </span>
              <span className="text-xs font-medium truncate">
                {nextBook.name} 1
              </span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}