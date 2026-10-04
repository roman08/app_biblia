"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Check, CloudOff, Loader2, Plus, X } from "lucide-react";
import { BOOKS, chapterHref } from "@/lib/bible-api";
import { saveJournalEntry, type JournalPassage } from "@/lib/supabase/journal-actions";
import { Button } from "@/components/ui/button";

interface JournalEditorProps {
  date: string;
  /** "Hoy, sábado 4 de octubre" */
  dateLabel: string;
  prompt: string;
  initialContent: string;
  initialPassages: JournalPassage[];
  /** Lectura de hoy del plan, para sugerirla */
  suggestedPassages?: JournalPassage[];
}

type Status = "idle" | "saving" | "saved" | "error";

const SAVE_DELAY_MS = 1000;
const bookName = (slug: string) => BOOKS.find((b) => b.slug === slug)?.name ?? slug;
const same = (a: JournalPassage, b: JournalPassage) => a.book === b.book && a.chapter === b.chapter;
const timeFmt = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit" });

/**
 * Editor de una entrada del diario con guardado automático. Se monta con
 * key={date}: al cambiar de día se desmonta y guarda lo pendiente.
 */
export function JournalEditor({
  date,
  dateLabel,
  prompt,
  initialContent,
  initialPassages,
  suggestedPassages = [],
}: JournalEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [passages, setPassages] = useState<JournalPassage[]>(initialPassages);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Para guardar al desmontar y saber si la entrada ya existía
  const latest = useRef({ content, passages, dirty });
  const existed = useRef(initialContent.trim() !== "");

  // Va antes que los demás efectos: así ellos leen siempre los valores actuales
  useEffect(() => {
    latest.current = { content, passages, dirty };
  }, [content, passages, dirty]);

  const save = async () => {
    const { content: c, passages: p } = latest.current;
    setStatus("saving");
    try {
      const result = await saveJournalEntry(date, c, p);
      if (!result.ok) throw new Error(result.error);
      setDirty(false);
      setStatus("saved");
      setSavedAt(new Date());
      // Si la entrada aparece o desaparece, actualizar el calendario
      const exists = result.status === "saved";
      if (exists !== existed.current) {
        existed.current = exists;
        router.refresh();
      }
    } catch {
      setStatus("error");
    }
  };

  // Guardado automático un momento después de dejar de escribir
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(save, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save lee los valores de latest
  }, [content, passages, dirty]);

  // Reintentar al volver la conexión
  useEffect(() => {
    if (status !== "error") return;
    const retry = () => save();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save lee los valores de latest
  }, [status]);

  // Al salir (otro día u otra página) guardar lo pendiente
  useEffect(
    () => () => {
      const { content: c, passages: p, dirty: d } = latest.current;
      if (d) saveJournalEntry(date, c, p).catch(() => {});
    },
    [date]
  );

  const edit = (text: string) => {
    setContent(text);
    setDirty(true);
  };
  const setPassagesDirty = (next: JournalPassage[]) => {
    setPassages(next);
    // Sin texto no hay entrada que guardar: los pasajes se guardan con el texto
    if (latest.current.content.trim()) setDirty(true);
  };

  const missingSuggested = suggestedPassages.filter((s) => !passages.some((p) => same(p, s)));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground first-letter:uppercase">{dateLabel}</p>
        <h2 className="mt-1 font-serif text-xl font-semibold">{prompt}</h2>
      </div>

      {/* Pasajes de la entrada */}
      {(passages.length > 0 || missingSuggested.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {passages.map((p) => (
            <span
              key={`${p.book}-${p.chapter}`}
              className="inline-flex items-center gap-1 rounded-full border bg-card py-1 pl-3 pr-1 text-sm"
            >
              <Link href={chapterHref(p.book, p.chapter)} className="hover:underline">
                {bookName(p.book)} {p.chapter}
              </Link>
              <button
                type="button"
                onClick={() => setPassagesDirty(passages.filter((x) => !same(x, p)))}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Quitar ${bookName(p.book)} ${p.chapter}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {missingSuggested.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-full"
              onClick={() => setPassagesDirty([...passages, ...missingSuggested])}
            >
              <Plus className="h-3.5 w-3.5" />
              <BookOpen className="h-3.5 w-3.5" />
              Lectura de hoy: {missingSuggested.map((p) => `${bookName(p.book)} ${p.chapter}`).join(", ")}
            </Button>
          )}
        </div>
      )}

      <textarea
        id="journal-content"
        value={content}
        onChange={(e) => edit(e.target.value)}
        onBlur={() => latest.current.dirty && save()}
        placeholder="Escribe lo que Dios te mostró, una oración o lo que quieras recordar…"
        aria-label={`Entrada del diario: ${dateLabel}`}
        maxLength={20000}
        className="min-h-[45vh] w-full resize-y rounded-lg border bg-card p-4 font-serif text-base leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <p className="flex h-5 items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
        {status === "saving" && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…
          </>
        )}
        {status === "saved" && savedAt && (
          <>
            <Check className="h-3.5 w-3.5 text-success" />
            {content.trim() ? `Guardado · ${timeFmt.format(savedAt)}` : "Entrada vacía: se borró"}
          </>
        )}
        {status === "error" && (
          <>
            <CloudOff className="h-3.5 w-3.5 text-destructive" />
            No se pudo guardar. Se guardará al volver la conexión.
          </>
        )}
        {status === "idle" && !dirty && content.trim() && "Se guarda automáticamente"}
      </p>
    </div>
  );
}
