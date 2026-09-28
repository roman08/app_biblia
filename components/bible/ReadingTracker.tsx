"use client";

import { useEffect } from "react";
import { saveLastRead } from "@/lib/reading-history";
import { recordReadingActivity } from "@/lib/supabase/stats-actions";

interface ReadingTrackerProps {
  book: string;
  bookName: string;
  chapter: number;
  isAuthenticated: boolean;
}

export function ReadingTracker({
  book,
  bookName,
  chapter,
  isAuthenticated,
}: ReadingTrackerProps) {
  useEffect(() => {
    // Siempre guardar en localStorage (para "continuar leyendo")
    saveLastRead(book, bookName, chapter);

    // Si está logueado, registrar en Supabase
    if (isAuthenticated) {
      recordReadingActivity().catch((err) =>
        console.error("Error registrando actividad:", err)
      );
    }
  }, [book, bookName, chapter, isAuthenticated]);

  return null;
}