"use client";

const KEY = "biblia:last-read";

export interface LastRead {
  book: string;
  bookName: string;
  chapter: number;
  timestamp: number;
}

export function saveLastRead(
  book: string,
  bookName: string,
  chapter: number
): void {
  if (typeof window === "undefined") return;
  const data: LastRead = {
    book,
    bookName,
    chapter,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // localStorage puede fallar en modo incógnito
  }
}

export function getLastRead(): LastRead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastRead;
  } catch {
    return null;
  }
}

export function clearLastRead(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}