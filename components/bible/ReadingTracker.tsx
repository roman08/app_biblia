"use client";

import { useEffect } from "react";
import { saveLastRead } from "@/lib/reading-history";
import { recordChapterRead } from "@/lib/supabase/stats-actions";

interface ReadingTrackerProps {
  book: string;
  bookName: string;
  chapter: number;
  /** Número del último versículo del capítulo */
  lastVerse: number;
  isAuthenticated: boolean;
}

/** Tiempo en la página que también cuenta como capítulo leído */
const READ_AFTER_MS = 30_000;

// Capítulos ya registrados en esta sesión (el componente se vuelve a montar,
// p. ej. al entrar al modo enfocado, y no hace falta llamar otra vez)
const recordedThisSession = new Set<string>();

/**
 * Guarda el último capítulo abierto ("Continuar leyendo") y, con sesión,
 * registra el capítulo como leído cuando el usuario llega al último
 * versículo o pasa 30 s en la página, lo que ocurra primero.
 */
export function ReadingTracker({
  book,
  bookName,
  chapter,
  lastVerse,
  isAuthenticated,
}: ReadingTrackerProps) {
  useEffect(() => {
    saveLastRead(book, bookName, chapter);
  }, [book, bookName, chapter]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const key = `${book}/${chapter}/${new Date().toDateString()}`;
    if (recordedThisSession.has(key)) return;

    let done = false;
    const record = () => {
      if (done) return;
      done = true;
      recordedThisSession.add(key);
      cleanup();
      recordChapterRead(book, chapter).catch((err) =>
        console.error("Error registrando la lectura:", err)
      );
    };

    const timer = setTimeout(record, READ_AFTER_MS);
    const last = document.getElementById(`v${lastVerse}`);
    const observer =
      last && "IntersectionObserver" in window
        ? new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) record();
          })
        : null;
    if (last && observer) observer.observe(last);

    function cleanup() {
      clearTimeout(timer);
      observer?.disconnect();
    }
    return cleanup;
  }, [book, chapter, lastVerse, isAuthenticated]);

  return null;
}
