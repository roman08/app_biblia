"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ShortcutOptions {
  bookSlug?: string;
  chapter?: number;
  totalChapters?: number;
  prevChapter?: number;
  nextChapter?: number;
  onToggleFocus?: () => void;
  onToggleTheme?: () => void;
  onIncreaseFont?: () => void;
  onDecreaseFont?: () => void;
  onExitFocus?: () => void;
}

export function useKeyboardShortcuts(options: ShortcutOptions) {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Cmd/Ctrl + K → Buscar
      if (isMod && key === "k") {
        e.preventDefault();
        router.push("/buscar");
        return;
      }

      // Cmd/Ctrl + B → Toggle focus mode
      if (isMod && key === "b") {
        e.preventDefault();
        options.onToggleFocus?.();
        return;
      }

      // Cmd/Ctrl + Shift + L → Toggle theme
      if (isMod && e.shiftKey && key === "l") {
        e.preventDefault();
        options.onToggleTheme?.();
        return;
      }

      // Esc → Salir del focus mode
      if (key === "escape") {
        options.onExitFocus?.();
        return;
      }

      // ← → Capítulo anterior/siguiente
      if (!isMod && key === "arrowleft" && options.prevChapter) {
        if (options.bookSlug) {
          router.push(`/leer/${options.bookSlug}/${options.prevChapter}`);
        }
        return;
      }

      if (!isMod && key === "arrowright" && options.nextChapter) {
        if (options.bookSlug) {
          router.push(`/leer/${options.bookSlug}/${options.nextChapter}`);
        }
        return;
      }

      // + / - Tamaño de fuente
      if (!isMod && (key === "+" || key === "=")) {
        options.onIncreaseFont?.();
        return;
      }

      if (!isMod && key === "-") {
        options.onDecreaseFont?.();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [options, router]);
}