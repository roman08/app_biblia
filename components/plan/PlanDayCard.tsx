"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, BookOpen } from "lucide-react";
import { toggleDayCompleted } from "@/lib/supabase/plans-actions";
import { getBook } from "@/lib/bible-api";
import type { PlanDay } from "@/lib/supabase/plans-actions";

interface PlanDayCardProps {
  planId: string;
  day: PlanDay;
  isCompleted: boolean;
  isToday: boolean;
}

// Etiquetas por posición de la lectura
const TRACK_LABELS = [
  { label: "AT Histórico", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  { label: "Poéticos/Profetas", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  { label: "Nuevo Testamento", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  { label: "Salmos", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
];

export function PlanDayCard({
  planId,
  day,
  isCompleted,
  isToday,
}: PlanDayCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleDayCompleted(planId, day.day_number);
    });
  };

  return (
    <Card
      id={`day-${day.day_number}`}
      className={`transition-all ${
        isToday ? "border-primary shadow-md ring-1 ring-primary/20" : ""
      } ${isCompleted ? "bg-muted/40 opacity-75" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              Día {day.day_number}
            </CardTitle>
            {isToday && (
              <Badge variant="default" className="text-xs">
                Hoy
              </Badge>
            )}
            {isCompleted && (
              <Badge
                variant="outline"
                className="text-xs text-green-600 border-green-600/30 bg-green-500/10"
              >
                Completado
              </Badge>
            )}
          </div>
          <Button
            variant={isCompleted ? "default" : "outline"}
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleToggle}
            disabled={isPending}
            title={isCompleted ? "Marcar como pendiente" : "Marcar como leído"}
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {day.passages.map((p, i) => {
          const book = getBook(p.book);
          const track = TRACK_LABELS[i] ?? TRACK_LABELS[0];

          return (
            <Link
              key={i}
              href={`/leer/${p.book}/${p.chapter}`}
              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors group"
            >
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">
                  {book?.name ?? p.book} {p.chapter}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${track.color}`}
                >
                  {track.label}
                </span>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}