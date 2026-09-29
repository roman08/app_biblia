"use client";

import { useState, useTransition } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, X, Share2, Copy, Image as ImageIcon } from "lucide-react";
import { upsertHighlight, upsertNote } from "@/lib/supabase/notes-actions";
import { ShareImageDialog } from "./ShareImageDialog";
import { HIGHLIGHT_COLORS } from "@/lib/highlight-colors";

interface VerseActionsProps {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  verseText: string;
  currentColor: string | null;
  currentNote: string | null;
  isAuthenticated: boolean;
  children: React.ReactNode;
}

export function VerseActions({
  book,
  bookName,
  chapter,
  verse,
  verseText,
  currentColor,
  currentNote,
  isAuthenticated,
  children,
}: VerseActionsProps) {
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState(currentNote ?? "");
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"menu" | "note">("menu");
  const [copied, setCopied] = useState(false);
  const [shareImageOpen, setShareImageOpen] = useState(false);

  const reference = `${bookName} ${chapter}:${verse}`;

  const handleHighlight = (color: string | null) => {
    startTransition(async () => {
      await upsertHighlight(book, chapter, verse, color);
      setOpen(false);
    });
  };

  const handleSaveNote = () => {
    startTransition(async () => {
      await upsertNote(book, chapter, verse, noteText);
      setOpen(false);
      setMode("menu");
    });
  };

  const buildShareText = () => {
    return `"${verseText}"\n\n— ${reference} (RVR1960)`;
  };

  const buildShareUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/v/${book}/${chapter}/${verse}`;
  };

  const handleNativeShare = async () => {
    const url = buildShareUrl();
    const text = buildShareText();

    if (navigator.share) {
      try {
        await navigator.share({ title: reference, text, url });
        setOpen(false);
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
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copiando:", err);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          nativeButton={false}
          render={
            <span
              role="button"
              tabIndex={0}
              className="cursor-pointer hover:bg-muted/60 rounded transition-colors block w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          }
        >
          {children}
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-2rem)] max-w-xs sm:w-72 max-h-[70vh] overflow-y-auto p-3"
          align="center"
          side="bottom"
          sideOffset={8}
          alignOffset={0}
          collisionPadding={16}
        >
          {mode === "menu" ? (
            <div className="space-y-3">
              {isAuthenticated && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Resaltar
                  </p>
                  <div className="flex gap-2">
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => handleHighlight(c.value)}
                        disabled={isPending}
                        className={`h-8 w-8 rounded-full border-2 ${c.swatch} ${
                          currentColor === c.value
                            ? "border-foreground"
                            : "border-transparent"
                        } transition-all hover:scale-110`}
                        title={c.name}
                      />
                    ))}
                    {currentColor && (
                      <button
                        onClick={() => handleHighlight(null)}
                        disabled={isPending}
                        className="h-8 w-8 rounded-full border border-dashed flex items-center justify-center hover:bg-muted"
                        title="Quitar resaltado"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isAuthenticated && (
                <div className="border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => setMode("note")}
                  >
                    <StickyNote className="h-4 w-4" />
                    {currentNote ? "Editar nota" : "Agregar nota"}
                  </Button>
                </div>
              )}

              <div className="border-t pt-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Compartir
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleNativeShare}
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
                  <Copy className="h-4 w-4" />
                  {copied ? "¡Copiado!" : "Copiar link"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShareImageOpen(true);
                    setOpen(false);
                  }}
                >
                  <ImageIcon className="h-4 w-4" />
                  Crear imagen
                </Button>
              </div>

              {currentNote && (
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Nota actual:
                  </p>
                  <p className="text-sm italic line-clamp-3">{currentNote}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escribe tu nota..."
                rows={4}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMode("menu");
                    setNoteText(currentNote ?? "");
                  }}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveNote} disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <ShareImageDialog
        open={shareImageOpen}
        onOpenChange={setShareImageOpen}
        reference={reference}
        verseText={verseText}
      />
    </>
  );
}
