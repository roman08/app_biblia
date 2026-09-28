"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { useFocusMode } from "@/lib/hooks/use-focus-mode";
import { useFontSize } from "@/lib/hooks/use-font-size";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { useEffect, useState } from "react";

interface KeyboardShortcutsHandlerProps {
  bookSlug: string;
  chapter: number;
  totalChapters: number;
}

export function KeyboardShortcutsHandler({
  bookSlug,
  chapter,
  totalChapters,
}: KeyboardShortcutsHandlerProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { setFocusMode, focusMode } = useFocusMode();
  const { increase, decrease } = useFontSize();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const prevChapter = chapter > 1 ? chapter - 1 : undefined;
  const nextChapter = chapter < totalChapters ? chapter + 1 : undefined;

  useKeyboardShortcuts({
    bookSlug,
    chapter,
    totalChapters,
    prevChapter,
    nextChapter,
    onToggleFocus: () => setFocusMode(!focusMode),
    onToggleTheme: () => {
      if (!mounted) return;
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    },
    onIncreaseFont: increase,
    onDecreaseFont: decrease,
    onExitFocus: () => setFocusMode(false),
  });

  return null;
}