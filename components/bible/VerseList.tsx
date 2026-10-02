"use client";

import { useEffect } from "react";
import type { Verse } from "@/lib/bible-api";
import type { Note } from "@/lib/supabase/notes-actions";
import { VerseActions } from "./VerseActions";
import { useFontSize } from "@/lib/hooks/use-font-size";
import { useReaderSpeech } from "@/lib/hooks/use-reader-speech";
import { registerSpeechChapter } from "@/lib/speech/reader-speech";
import { getHighlight } from "@/lib/highlight-colors";
import { Heart, StickyNote } from "lucide-react";

interface VerseListProps {
  verses: Verse[];
  book: string;
  bookName: string;
  chapter: number;
  notes: Note[];
  favoriteVerses: number[];
  /** Versión que devolvió la API, p. ej. "RVG" (para el texto al compartir) */
  versionShortName: string;
  isAuthenticated: boolean;
}

export function VerseList({
  verses,
  book,
  bookName,
  chapter,
  notes,
  favoriteVerses,
  versionShortName,
  isAuthenticated,
}: VerseListProps) {
  const { fontSizeClass, mounted } = useFontSize();
  const speech = useReaderSpeech();
  const speakingVerse = speech.status === "idle" ? null : speech.index + 1;

  // Registrar el capítulo para la lectura en voz alta. La clave incluye el
  // inicio del texto para distinguir versiones del mismo capítulo.
  const speechKey = `${book}/${chapter}/${verses.length}/${verses[0]?.text.slice(0, 24)}`;
  useEffect(
    () => registerSpeechChapter(speechKey, verses.map((v) => v.text)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- speechKey identifica el texto
    [speechKey]
  );

  // Mantener visible el versículo que se está leyendo
  useEffect(() => {
    if (speakingVerse === null) return;
    const el = document.getElementById(`v${speakingVerse}`);
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
  }, [speakingVerse]);

  const notesByVerse = new Map<number, Note>();
  for (const n of notes) {
    if (n.verse !== null) notesByVerse.set(n.verse, n);
  }
  const favorites = new Set(favoriteVerses);

  // Usar clase por defecto si aún no montó (evita hydration mismatch)
  const textClass = mounted
    ? fontSizeClass
    : "text-base sm:text-lg leading-[1.8] sm:leading-[1.9]";

  return (
    <div className="space-y-3">
      {verses.map((v) => {
        const note = notesByVerse.get(v.verse);
        const colorClass = getHighlight(note?.color)?.text ?? "";
        const isFavorite = favorites.has(v.verse);
        const isSpeaking = speakingVerse === v.verse;

        return (
          <VerseActions
            key={v.verse}
            book={book}
            bookName={bookName}
            chapter={chapter}
            verse={v.verse}
            verseText={v.text}
            currentColor={note?.color ?? null}
            currentNote={note?.content ?? null}
            isFavorite={isFavorite}
            canListen={speech.supported}
            versionShortName={versionShortName}
            isAuthenticated={isAuthenticated}
          >
            <p
              id={`v${v.verse}`}
              aria-current={isSpeaking ? "true" : undefined}
              className={`${textClass} font-serif text-foreground/90 rounded px-2 py-1 -mx-2 transition-shadow ${colorClass} ${
                isSpeaking ? "ring-2 ring-primary/50" : ""
              }`}
            >
              <sup className="mr-1.5 font-sans text-[0.65em] font-medium text-muted-foreground align-super select-none">
                {v.verse}
              </sup>
              {v.text}
              {isFavorite && (
                <Heart
                  className="ml-1.5 inline-block h-3.5 w-3.5 align-baseline fill-current text-primary/70"
                  aria-label="Favorito"
                />
              )}
              {note?.content && (
                <StickyNote
                  className="ml-1.5 inline-block h-3.5 w-3.5 align-baseline text-primary/70"
                  aria-label="Tiene nota"
                />
              )}
            </p>
          </VerseActions>
        );
      })}
    </div>
  );
}
