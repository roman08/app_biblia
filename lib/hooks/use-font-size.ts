"use client";

import { useEffect, useState } from "react";

export type FontSize = "sm" | "base" | "lg" | "xl";

const STORAGE_KEY = "biblia:font-size";
const EVENT_KEY = "biblia:font-size-change";
const DEFAULT_SIZE: FontSize = "base";

export const FONT_SIZES: Record<FontSize, { label: string; class: string }> = {
  sm: {
    label: "Pequeño",
    class: "text-sm sm:text-base leading-[1.7] sm:leading-[1.8]",
  },
  base: {
    label: "Normal",
    class: "text-base sm:text-lg leading-[1.8] sm:leading-[1.9]",
  },
  lg: {
    label: "Grande",
    class: "text-lg sm:text-xl leading-[1.8] sm:leading-[1.9]",
  },
  xl: {
    label: "Muy grande",
    class: "text-xl sm:text-2xl leading-[1.8] sm:leading-[1.9]",
  },
};

function getStoredSize(): FontSize {
  if (typeof window === "undefined") return DEFAULT_SIZE;
  const stored = localStorage.getItem(STORAGE_KEY) as FontSize | null;
  if (stored && stored in FONT_SIZES) return stored;
  return DEFAULT_SIZE;
}

export function useFontSize() {
  const [fontSize, setFontSizeState] = useState<FontSize>(DEFAULT_SIZE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFontSizeState(getStoredSize());

    // Escuchar cambios desde otras instancias del hook
    const handleChange = (e: Event) => {
      const custom = e as CustomEvent<FontSize>;
      if (custom.detail && custom.detail in FONT_SIZES) {
        setFontSizeState(custom.detail);
      }
    };

    window.addEventListener(EVENT_KEY, handleChange);
    return () => window.removeEventListener(EVENT_KEY, handleChange);
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem(STORAGE_KEY, size);
    // Notificar a todos los componentes que usan el hook
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: size }));
  };

  const increase = () => {
    const order: FontSize[] = ["sm", "base", "lg", "xl"];
    const idx = order.indexOf(fontSize);
    if (idx < order.length - 1) setFontSize(order[idx + 1]);
  };

  const decrease = () => {
    const order: FontSize[] = ["sm", "base", "lg", "xl"];
    const idx = order.indexOf(fontSize);
    if (idx > 0) setFontSize(order[idx - 1]);
  };

  return {
    fontSize,
    fontSizeClass: FONT_SIZES[fontSize].class,
    setFontSize,
    increase,
    decrease,
    mounted,
  };
}