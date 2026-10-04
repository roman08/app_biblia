import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMetadata, truncate } from "@/lib/site";
import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { Suspense } from "react";
import {
  getChapter,
  getBook,
  chapterHref,
  parseVersion,
  versionLabel,
} from "@/lib/bible-api";
import { createClient } from "@/lib/supabase/server";
import { getNotesForChapter } from "@/lib/supabase/notes-actions";
import { getFavoritesForChapter } from "@/lib/supabase/favorites-actions";
import { VerseList } from "@/components/bible/VerseList";
import { BookSelector } from "@/components/bible/BookSelector";
import { ChapterSelector } from "@/components/bible/ChapterSelector";
import { VersionSelector } from "@/components/bible/VersionSelector";
import { ChapterNav } from "@/components/bible/ChapterNav";
import { Button } from "@/components/ui/button";
import { ReadingTracker } from "@/components/bible/ReadingTracker";
import { FontSizeControl } from "@/components/bible/FontSizeControl";
import { FocusModeLayout } from "@/components/bible/FocusModeLayout";
import { FocusModeToggle } from "@/components/bible/FocusModeToggle";
import { KeyboardShortcutsHandler } from "@/components/bible/KeyboardShortcutsHandler";
import { KeyboardShortcutsHelp } from "@/components/bible/KeyboardShortcutsHelp";
import { ScrollToVerse } from "@/components/bible/ScrollToVerse";
import { ListenButton } from "@/components/bible/ListenButton";
import { SpeechPlayerBar } from "@/components/bible/SpeechPlayerBar";

interface PageProps {
  params: Promise<{ book: string; chapter: string }>;
  searchParams: Promise<{ v?: string }>;
}

export default async function ChapterPage({ params, searchParams }: PageProps) {
  const { book: bookSlug, chapter: chapterStr } = await params;
  const { v } = await searchParams;
  const version = parseVersion(v);

  const book = getBook(bookSlug);
  if (!book) notFound();

  const chapter = parseInt(chapterStr, 10);
  if (isNaN(chapter) || chapter < 1 || chapter > book.chapters) notFound();

  // Cargar capítulo y notas en paralelo
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [data, notes, favoriteVerses] = await Promise.all([
    getChapter(version, bookSlug, chapter),
    user ? getNotesForChapter(bookSlug, chapter) : Promise.resolve([]),
    user ? getFavoritesForChapter(bookSlug, chapter) : Promise.resolve([]),
  ]);

  return (
    <FocusModeLayout
      header={
        <div className="container mx-auto max-w-prose px-4 py-6 sm:py-8">
          {/* Header con navegación compacta */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1 -ml-2">
                  ←<span className="hidden sm:inline"> Inicio</span>
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                <ListenButton />
                <KeyboardShortcutsHelp />
                <FocusModeToggle />
                <FontSizeControl />
                <Suspense fallback={null}>
                  <VersionSelector current={version} />
                </Suspense>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <BookSelector currentSlug={bookSlug} currentChapter={chapter} />
              <ChapterSelector
                bookSlug={bookSlug}
                currentChapter={chapter}
                totalChapters={book.chapters}
              />
            </div>

            {!user && (
              <p className="text-xs text-muted-foreground">
                <Link href="/login" className="underline hover:text-foreground">
                  Inicia sesión
                </Link>{" "}
                para guardar notas y resaltados
              </p>
            )}
          </div>
        </div>
      }
      footer={
        <div className="container mx-auto max-w-2xl px-4 pb-6 sm:pb-8">
          <SpeechPlayerBar />
          <ChapterNav
            bookSlug={bookSlug}
            currentChapter={chapter}
            totalChapters={book.chapters}
            version={version}
          />
        </div>
      }
    >
      <KeyboardShortcutsHandler
        bookSlug={bookSlug}
        chapter={chapter}
        totalChapters={book.chapters}
      />
      <ScrollToVerse />

      <div className="container mx-auto max-w-prose px-4 pt-2 pb-6 sm:pt-0">
        <article>
          <h1 className="mb-6 font-serif text-2xl font-bold sm:text-3xl">
            {book.name} {chapter}
          </h1>

          <ReadingTracker
            book={bookSlug}
            bookName={book.name}
            chapter={chapter}
            lastVerse={data.verses.length}
            isAuthenticated={!!user}
          />

          <VerseList
            verses={data.verses}
            book={bookSlug}
            bookName={book.name}
            chapter={chapter}
            notes={notes}
            favoriteVerses={favoriteVerses}
            versionShortName={versionLabel(data.version).shortName}
            isAuthenticated={!!user}
          />

          {/* Llevar el capítulo al diario */}
          {user && (
            <Link
              href={`/diario?libro=${bookSlug}&cap=${chapter}`}
              className="mt-8 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <NotebookPen className="h-4 w-4" aria-hidden="true" />
              Escribir una reflexión sobre {book.name} {chapter}
            </Link>
          )}

          {/* Aviso de derechos de la versión (lo exigen la RVG y la ONBV) */}
          {data.copyright && (
            <p className="mt-10 whitespace-pre-line border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              {data.copyright}
            </p>
          )}
        </article>
      </div>
    </FocusModeLayout>
  );
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { book: bookSlug, chapter } = await params;
  const { v } = await searchParams;
  const version = parseVersion(v);
  const book = getBook(bookSlug);
  if (!book) return { title: "No encontrado" };

  const chapterNumber = parseInt(chapter, 10);
  // Misma llamada que la página: fetch la deduplica y la cachea
  const data = await getChapter(version, bookSlug, chapterNumber).catch(() => undefined);
  const firstVerse = data?.verses[0]?.text;
  // La versión que devolvió la API (puede no ser la pedida)
  const label = versionLabel(data?.version ?? version);

  const title = `${book.name} ${chapter} · ${label.shortName}`;
  const description = firstVerse
    ? `${chapter}:1 ${truncate(firstVerse, 180)}`
    : `Lee ${book.name} ${chapter} en la ${label.name}.`;

  // La imagen la genera ./opengraph-image.tsx
  return pageMetadata({
    title,
    description,
    path: chapterHref(bookSlug, chapterNumber, version),
    type: "article",
    ownImage: true,
  });
}