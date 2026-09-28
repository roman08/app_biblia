"use client";

import { useEffect, useState } from "react";
import type { Verse } from "@/lib/bible-api";
import type { Note } from "@/lib/supabase/notes-actions";
import { VerseActions } from "./VerseActions";
import { useFontSize } from "@/lib/hooks/use-font-size";

const COLOR_CLASSES: Record<string, string> = {
  yellow: "bg-yellow-200/60 dark:bg-yellow-900/30",
  green: "bg-green-200/60 dark:bg-green-900/30",
  blue: "bg-blue-200/60 dark:bg-blue-900/30",
  pink: "bg-pink-200/60 dark:bg-pink-900/30",
};

interface VerseListProps {
  verses: Verse[];
  book: string;
  bookName: string;
  chapter: number;
  notes: Note[];
  isAuthenticated: boolean;
}

export function VerseList({
  verses,
  book,
  bookName,
  chapter,
  notes,
  isAuthenticated,
}: VerseListProps) {
  const { fontSizeClass, mounted } = useFontSize();

  const notesByVerse = new Map<number, Note>();
  for (const n of notes) {
    if (n.verse !== null) notesByVerse.set(n.verse, n);
  }

  // Usar clase por defecto si aún no montó (evita hydration mismatch)
  const textClass = mounted
    ? fontSizeClass
    : "text-base sm:text-lg leading-[1.8] sm:leading-[1.9]";

  return (
    <div className="space-y-3">
      {verses.map((v) => {
        const note = notesByVerse.get(v.verse);
        const colorClass = note?.color ? COLOR_CLASSES[note.color] ?? "" : "";

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
            isAuthenticated={isAuthenticated}
          >
            <p
              id={`v${v.verse}`}
              className={`${textClass} tracking-[0.01em] text-foreground/90 rounded px-2 py-1 -mx-2 ${colorClass}`}
            >
              <sup className="mr-2 text-xs font-semibold text-primary align-super select-none">
                {v.verse}
              </sup>
              {v.text}
              {note?.content && (
                <span className="ml-2 inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground align-middle">
                  nota
                </span>
              )}
            </p>
          </VerseActions>
        );
      })}
    </div>
  );
}