import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  getChapter,
  getBook,
  type VersionKey,
  VERSIONS,
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
  const version = (v && v in VERSIONS ? v : "rvr1960") as VersionKey;

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
            isAuthenticated={!!user}
          />

          <VerseList
            verses={data.verses}
            book={bookSlug}
            bookName={book.name}
            chapter={chapter}
            notes={notes}
            favoriteVerses={favoriteVerses}
            isAuthenticated={!!user}
          />
        </article>
      </div>
    </FocusModeLayout>
  );
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { book: bookSlug, chapter } = await params;
  const { v } = await searchParams;
  const version = (v && v in VERSIONS ? v : "rvr1960") as VersionKey;
  const book = getBook(bookSlug);
  if (!book) return { title: "No encontrado" };
  return {
    title: `${book.name} ${chapter} · ${VERSIONS[version].shortName}`,
  };
}