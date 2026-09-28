"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "biblia:focus-mode";
const EVENT_KEY = "biblia:focus-mode-change";

export function useFocusMode() {
  const [focusMode, setFocusModeState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    setFocusModeState(stored === "true");

    const handleChange = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setFocusModeState(custom.detail);
    };

    window.addEventListener(EVENT_KEY, handleChange);
    return () => window.removeEventListener(EVENT_KEY, handleChange);
  }, []);

  const setFocusMode = (value: boolean) => {
    setFocusModeState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: value }));
  };

  const toggle = () => setFocusMode(!focusMode);

  return { focusMode, setFocusMode, toggle, mounted };
}