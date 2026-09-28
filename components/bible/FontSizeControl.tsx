"use client";

import { Type, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useFontSize,
  FONT_SIZES,
  type FontSize,
} from "@/lib/hooks/use-font-size";

export function FontSizeControl() {
  const { fontSize, setFontSize, increase, decrease, mounted } = useFontSize();

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5">
        <Type className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        nativeButton={true}
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Aa</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-56 p-3">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Tamaño de texto
        </p>

        {/* Botones A- / A+ */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Button
            variant="outline"
            size="icon"
            onClick={decrease}
            disabled={fontSize === "sm"}
            className="h-10 w-10"
            aria-label="Reducir tamaño"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium flex-1 text-center">
            {FONT_SIZES[fontSize].label}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={increase}
            disabled={fontSize === "xl"}
            className="h-10 w-10"
            aria-label="Aumentar tamaño"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview */}
        <div className="rounded-md border bg-muted/30 p-2 text-center">
          <p className={FONT_SIZES[fontSize].class}>
            En el principio creó Dios…
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
