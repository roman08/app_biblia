"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, BookOpen, RotateCcw } from "lucide-react";
import { toggleDayCompleted } from "@/lib/supabase/plans-actions";
import { chapterHref, getBook } from "@/lib/bible-api";
import { getBookTag } from "@/lib/book-categories";
import type { PlanDay } from "@/lib/supabase/plans-actions";

interface PlanDayCardProps {
  planId: string;
  day: PlanDay;
  isCompleted: boolean;
  isToday: boolean;
  /** El usuario empezó el plan y puede marcar días */
  canToggle: boolean;
}

export function PlanDayCard({ planId, day, isCompleted, isToday, canToggle }: PlanDayCardProps) {
  const [isPending, startTransition] = useTransition();
  // Se ve marcado al instante; al revalidar llega el valor real
  const [completed, setCompleted] = useOptimistic(isCompleted);

  const handleToggle = () => {
    startTransition(async () => {
      setCompleted(!completed);
      try {
        await toggleDayCompleted(planId, day.day_number);
      } catch {
        // Un error dentro de la transición rompería la página
        toast.error(
          navigator.onLine
            ? "No se pudo guardar tu progreso. Intenta de nuevo."
            : "Sin conexión. Podrás marcarlo cuando vuelva la red."
        );
      }
    });
  };

  return (
    <Card
      id={`day-${day.day_number}`}
      className={`transition-colors ${isToday ? "border-primary ring-1 ring-primary/20" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Día {day.day_number}</CardTitle>
          {isToday && <Badge className="text-xs">Hoy</Badge>}
          {completed && (
            <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-xs text-success">
              <Check className="h-3 w-3" />
              Leído
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          {day.passages.map((p, i) => {
            const book = getBook(p.book);
            // La etiqueta sale del libro, nunca de la posición de la lectura:
            // el orden y la cantidad de lecturas por día cambian según el plan.
            const tag = getBookTag(p.book);

            return (
              <Link
                key={i}
                href={chapterHref(p.book, p.chapter)}
                className="group flex min-h-11 items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {book?.name ?? p.book} {p.chapter}
                  </span>
                  {tag && (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tag.className}`}
                      title={tag.testament === "OT" ? "Antiguo Testamento" : "Nuevo Testamento"}
                    >
                      {tag.testamentShort} · {tag.category}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {canToggle && (
          <Button
            variant={completed ? "outline" : "default"}
            className="h-11 w-full gap-2"
            onClick={handleToggle}
            disabled={isPending}
          >
            {completed ? (
              <>
                <RotateCcw className="h-4 w-4" />
                Marcar como pendiente
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Marcar como leído
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
