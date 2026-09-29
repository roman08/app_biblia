"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, HeartOff, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShareImageDialog } from "@/components/bible/ShareImageDialog";
import { toggleFavorite } from "@/lib/supabase/favorites-actions";

interface FavoriteCardProps {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  /** null si Midvash no pudo devolver el texto */
  text: string | null;
}

export function FavoriteCard({ book, bookName, chapter, verse, text }: FavoriteCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const reference = `${bookName} ${chapter}:${verse}`;

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await toggleFavorite(book, chapter, verse);
        toast.success(`${reference} quitado de favoritos`);
      } catch {
        toast.error("No se pudo quitar el favorito. Intenta de nuevo.");
      }
    });
  };

  return (
    <Card className={isPending ? "opacity-50 transition-opacity" : "transition-opacity"}>
      <CardContent className="space-y-3 p-5">
        {text ? (
          <blockquote className="font-serif text-base leading-relaxed sm:text-lg">
            {text}
          </blockquote>
        ) : (
          <p className="text-sm text-muted-foreground">
            No se pudo cargar el texto. Ábrelo en el lector para leerlo.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/leer/${book}/${chapter}#v${verse}`}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {reference}
          </Link>

          <div className="flex items-center gap-1">
            <Link href={`/leer/${book}/${chapter}#v${verse}`}>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={`Leer ${reference} en contexto`} title="Leer en contexto">
                <BookOpen className="h-4 w-4" />
              </Button>
            </Link>
            {text && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setShareOpen(true)}
                aria-label={`Crear imagen de ${reference}`}
                title="Crear imagen"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleRemove}
              disabled={isPending}
              aria-label={`Quitar ${reference} de favoritos`}
              title="Quitar de favoritos"
            >
              <HeartOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {text && (
        <ShareImageDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          reference={reference}
          verseText={text}
        />
      )}
    </Card>
  );
}
