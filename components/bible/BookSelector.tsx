"use client";

import { useRouter } from "next/navigation";
import { BOOKS } from "@/lib/bible-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface BookSelectorProps {
  currentSlug: string;
  currentChapter: number;
}

export function BookSelector({
  currentSlug,
  currentChapter,
}: BookSelectorProps) {
  const router = useRouter();
  const oldTestament = BOOKS.filter((b) => b.testament === "OT");
  const newTestament = BOOKS.filter((b) => b.testament === "NT");
  const current = BOOKS.find((b) => b.slug === currentSlug);

  const handleSelect = (slug: string) => {
    const chapter = slug === currentSlug ? currentChapter : 1;
    router.push(`/leer/${slug}/${chapter}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 px-3 text-sm flex-1 sm:flex-initial justify-between sm:justify-start"
          >
            <span className="truncate">
              {current?.name ?? "Seleccionar libro"}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </Button>
        }
      />
      <DropdownMenuContent
        align="start"
        className="max-h-[70vh] w-56 overflow-y-auto"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Antiguo Testamento</DropdownMenuLabel>
          {oldTestament.map((book) => (
            <DropdownMenuItem
              key={book.slug}
              onClick={() => handleSelect(book.slug)}
              className={`py-2.5 ${book.slug === currentSlug ? "font-semibold" : ""}`}
            >
              {book.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Nuevo Testamento</DropdownMenuLabel>
          {newTestament.map((book) => (
            <DropdownMenuItem
              key={book.slug}
              onClick={() => handleSelect(book.slug)}
              className={book.slug === currentSlug ? "font-semibold" : ""}
            >
              {book.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
