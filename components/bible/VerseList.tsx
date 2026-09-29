"use client";

import { useEffect, useState } from "react";
import type { Verse } from "@/lib/bible-api";
import type { Note } from "@/lib/supabase/notes-actions";
import { VerseActions } from "./VerseActions";
import { useFontSize } from "@/lib/hooks/use-font-size";
import { getHighlight } from "@/lib/highlight-colors";
import { StickyNote } from "lucide-react";

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
        const colorClass = getHighlight(note?.color)?.text ?? "";

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
              className={`${textClass} font-serif text-foreground/90 rounded px-2 py-1 -mx-2 ${colorClass}`}
            >
              <sup className="mr-1.5 font-sans text-[0.65em] font-medium text-muted-foreground align-super select-none">
                {v.verse}
              </sup>
              {v.text}
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