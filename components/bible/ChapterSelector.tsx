"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ChapterSelectorProps {
  bookSlug: string;
  currentChapter: number;
  totalChapters: number;
}

export function ChapterSelector({
  bookSlug,
  currentChapter,
  totalChapters,
}: ChapterSelectorProps) {
  const router = useRouter();
  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

  const handleSelect = (chapter: number) => {
    router.push(`/leer/${bookSlug}/${chapter}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 px-3 text-sm"
          >
            Cap. {currentChapter}
            <ChevronDown className="h-4 w-4 shrink-0" />
          </Button>
        }
      />
      <DropdownMenuContent
        align="start"
        className="max-h-[70vh] w-32 overflow-y-auto"
      >
        {chapters.map((n) => (
          <DropdownMenuItem
            key={n}
            onClick={() => handleSelect(n)}
            className={`py-2.5 ${n === currentChapter ? "font-semibold" : ""}`}
          >
            Capítulo {n}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
