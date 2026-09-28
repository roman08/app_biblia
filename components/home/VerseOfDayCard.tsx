"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  Heart,
  Share2,
  StickyNote,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { VerseOfDay } from "@/lib/verse-of-day";
import { isFavorite, toggleFavorite } from "@/lib/supabase/favorites-actions";
import { upsertNote } from "@/lib/supabase/notes-actions";
import { ShareImageDialog } from "@/components/bible/ShareImageDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

interface VerseOfDayCardProps {
  verse: VerseOfDay;
  isAuthenticated: boolean;
}

export function VerseOfDayCard({
  verse,
  isAuthenticated,
}: VerseOfDayCardProps) {
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareImageOpen, setShareImageOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isPending, startTransition] = useTransition();

  const reference = `${verse.bookName} ${verse.chapter}:${verse.verse}`;

  // Cargar el estado de favorito
  useEffect(() => {
    if (!isAuthenticated) return;
    isFavorite(verse.book, verse.chapter, verse.verse).then(setIsFav);
  }, [verse.book, verse.chapter, verse.verse, isAuthenticated]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Inicia sesión para guardar favoritos");
      return;
    }
    setFavLoading(true);
    try {
      const newState = await toggleFavorite(
        verse.book,
        verse.chapter,
        verse.verse,
      );
      setIsFav(newState);
      toast.success(
        newState ? "Agregado a favoritos ❤️" : "Removido de favoritos",
      );
    } catch (err) {
      toast.error("Error al guardar favorito");
    } finally {
      setFavLoading(false);
    }
  };

  const buildShareText = () => {
    return `"${verse.text}"\n\n— ${reference} (RVR1960)`;
  };

  const buildShareUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/v/${verse.book}/${verse.chapter}/${verse.verse}`;
  };

  const handleShare = async () => {
    const url = buildShareUrl();
    const text = buildShareText();

    if (navigator.share) {
      try {
        await navigator.share({ title: reference, text, url });
      } catch {
        // Usuario canceló
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const url = buildShareUrl();
    const text = `${buildShareText()}\n\n${url}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Error al copiar");
    }
  };

  const handleSaveNote = () => {
    if (!isAuthenticated) {
      toast.error("Inicia sesión para guardar notas");
      return;
    }
    startTransition(async () => {
      try {
        await upsertNote(verse.book, verse.chapter, verse.verse, noteText);
        toast.success("Nota guardada");
        setNoteOpen(false);
        setNoteText("");
      } catch (err) {
        toast.error("Error al guardar la nota");
      }
    });
  };

  return (
    <>
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardContent className="space-y-4 p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Versículo del día
          </div>

          <blockquote className="space-y-3">
            <p className="text-lg leading-relaxed font-medium md:text-xl">
              "{verse.text}"
            </p>
            <footer className="text-sm font-semibold text-primary">
              — {reference}
            </footer>
          </blockquote>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Link href={`/leer/${verse.book}/${verse.chapter}#v${verse.verse}`}>
              <Button variant="outline" size="sm" className="gap-2">
                Leer capítulo
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>

            {/* Me gusta */}
            <Button
              variant={isFav ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={handleToggleFavorite}
              disabled={favLoading}
              aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
              <span className="hidden sm:inline">
                {isFav ? "Guardado" : "Me gusta"}
              </span>
            </Button>

            {/* Compartir */}
            <Popover>
              <PopoverTrigger
                nativeButton={true}
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    aria-label="Compartir"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Compartir</span>
                  </Button>
                }
              />
              <PopoverContent align="end" className="w-56 p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  Compartir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "¡Copiado!" : "Copiar link"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => setShareImageOpen(true)}
                >
                  <Sparkles className="h-4 w-4" />
                  Crear imagen
                </Button>
              </PopoverContent>
            </Popover>

            {/* Nota */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error("Inicia sesión para guardar notas", {
                    action: {
                      label: "Iniciar sesión",
                      onClick: () => (window.location.href = "/login"),
                    },
                  });
                  return;
                }
                setNoteOpen(true);
              }}
              aria-label="Agregar nota"
            >
              <StickyNote className="h-4 w-4" />
              <span className="hidden sm:inline">Nota</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de nota */}
      {noteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setNoteOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Agregar nota</h3>
            <p className="text-sm text-muted-foreground mb-4">{reference}</p>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escribe tu nota..."
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNoteOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveNote}
                disabled={isPending || !noteText.trim()}
              >
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ShareImageDialog
        open={shareImageOpen}
        onOpenChange={setShareImageOpen}
        reference={reference}
        verseText={verse.text}
      />
    </>
  );
}
