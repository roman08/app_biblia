"use client";

import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusMode } from "@/lib/hooks/use-focus-mode";

export function FocusModeToggle() {
  const { setFocusMode, mounted } = useFocusMode();

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5">
        <Maximize2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={() => setFocusMode(true)}
      aria-label="Modo lectura"
      title="Modo lectura"
    >
      <Maximize2 className="h-4 w-4" />
      <span className="hidden sm:inline">Enfocar</span>
    </Button>
  );
}