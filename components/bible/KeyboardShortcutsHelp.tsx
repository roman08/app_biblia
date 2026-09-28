"use client";

import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SHORTCUTS = [
  { keys: ["←"], desc: "Capítulo anterior" },
  { keys: ["→"], desc: "Capítulo siguiente" },
  { keys: ["+"], desc: "Aumentar tamaño" },
  { keys: ["-"], desc: "Disminuir tamaño" },
  { keys: ["Esc"], desc: "Salir del modo lectura" },
  { keys: ["⌘", "K"], desc: "Buscar" },
  { keys: ["⌘", "B"], desc: "Modo lectura" },
  { keys: ["⌘", "⇧", "L"], desc: "Cambiar tema" },
];

export function KeyboardShortcutsHelp() {
  return (
    <Popover>
      <PopoverTrigger
        nativeButton={true}
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 hidden sm:inline-flex"
            aria-label="Atajos de teclado"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-72">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Atajos de teclado
        </p>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.desc}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-muted-foreground">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}