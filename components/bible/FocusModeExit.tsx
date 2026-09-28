"use client";

import { Minimize2, Type, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusMode } from "@/lib/hooks/use-focus-mode";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useEffect, useState } from "react";

export function FocusModeExit() {
  const { setFocusMode } = useFocusMode();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-1 rounded-full border bg-background/95 px-2 py-1.5 shadow-lg backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => setFocusMode(false)}
          aria-label="Salir del modo lectura"
          title="Salir del modo lectura"
        >
          <Minimize2 className="h-4 w-4" />
        </Button>

        <div className="h-5 w-px bg-border" />

        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Cambiar tema"
            title="Cambiar tema"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}