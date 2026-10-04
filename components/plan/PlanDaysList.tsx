"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";
import { PlanDayCard } from "./PlanDayCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanDay } from "@/lib/supabase/plans-actions";

interface PlanDaysListProps {
  planId: string;
  days: PlanDay[];
  completedDays: number[];
  currentDayNumber: number;
  /** El usuario empezó el plan y puede marcar días */
  canToggle: boolean;
}

// Los días se agrupan en bloques de 31 (≈ un mes) para el mapa
const SEGMENT_SIZE = 31;

const segmentOf = (day: number) => Math.floor((day - 1) / SEGMENT_SIZE);

/**
 * Un día a la vez en grande (por defecto el de hoy) y, debajo, un mapa
 * compacto de todos los días agrupados por bloques, para no renderizar una
 * lista de 365 tarjetas.
 */
export function PlanDaysList({
  planId,
  days,
  completedDays,
  currentDayNumber,
  canToggle,
}: PlanDaysListProps) {
  const total = days.length;
  const completed = new Set(completedDays);
  const [selected, setSelected] = useState(currentDayNumber);
  const [segment, setSegment] = useState(segmentOf(currentDayNumber));
  const cardRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // Mantener visible el bloque activo en la fila (solo desplaza la fila, no la página)
  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!strip || !active) return;
    const left = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [segment]);

  // Al marcar como leído el día de hoy, "hoy" avanza: seguirlo si estaba seleccionado
  const [prevCurrent, setPrevCurrent] = useState(currentDayNumber);
  if (prevCurrent !== currentDayNumber) {
    setPrevCurrent(currentDayNumber);
    if (selected === prevCurrent) {
      setSelected(currentDayNumber);
      setSegment(segmentOf(currentDayNumber));
    }
  }

  const select = (day: number, scroll = false) => {
    const clamped = Math.min(Math.max(day, 1), total);
    setSelected(clamped);
    setSegment(segmentOf(clamped));
    if (scroll) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      cardRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  };

  const selectedDay = days.find((d) => d.day_number === selected);
  const segments = Math.ceil(total / SEGMENT_SIZE);
  const segStart = segment * SEGMENT_SIZE + 1;
  const segEnd = Math.min(segStart + SEGMENT_SIZE - 1, total);

  return (
    <div className="space-y-6">
      {/* Día seleccionado */}
      <section ref={cardRef} className="scroll-mt-20 space-y-3" aria-label="Lectura del día">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            onClick={() => select(selected - 1)}
            disabled={selected <= 1}
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <p className="text-sm font-medium tabular-nums">
              Día {selected} de {total}
            </p>
            {selected !== currentDayNumber && (
              <button
                type="button"
                onClick={() => select(currentDayNumber)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Volver a hoy (día {currentDayNumber})
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            onClick={() => select(selected + 1)}
            disabled={selected >= total}
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {selectedDay && (
          <PlanDayCard
            planId={planId}
            day={selectedDay}
            isCompleted={completed.has(selectedDay.day_number)}
            isToday={selectedDay.day_number === currentDayNumber}
            canToggle={canToggle}
          />
        )}
      </section>

      {/* Mapa de días */}
      <section className="space-y-3" aria-label="Todos los días del plan">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Todos los días</h2>
        </div>

        {/* Bloques de ~un mes, con su avance */}
        <div
          ref={stripRef}
          className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
          role="tablist"
          aria-label="Bloques de días"
        >
          {Array.from({ length: segments }, (_, i) => {
            const start = i * SEGMENT_SIZE + 1;
            const end = Math.min(start + SEGMENT_SIZE - 1, total);
            let done = 0;
            for (let d = start; d <= end; d++) if (completed.has(d)) done++;
            const active = i === segment;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSegment(i)}
                className={cn(
                  "flex min-h-11 shrink-0 flex-col items-center justify-center rounded-lg border px-3 py-1.5 text-xs transition-colors",
                  active ? "border-primary bg-primary/10 text-foreground" : "bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="font-semibold tabular-nums">
                  {start}–{end}
                </span>
                <span className={cn("tabular-nums", done === end - start + 1 && "text-success")}>
                  {done}/{end - start + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cuadrícula de días del bloque */}
        <div className="grid grid-cols-7 gap-1.5" role="tabpanel" aria-label={`Días ${segStart} a ${segEnd}`}>
          {Array.from({ length: segEnd - segStart + 1 }, (_, i) => {
            const day = segStart + i;
            const isDone = completed.has(day);
            const isCurrent = day === currentDayNumber;
            const isSelected = day === selected;
            return (
              <button
                key={day}
                type="button"
                onClick={() => select(day, true)}
                aria-pressed={isSelected}
                aria-label={`Día ${day}${isCurrent ? ", hoy" : ""}${isDone ? ", leído" : ", pendiente"}`}
                className={cn(
                  "flex h-11 items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-colors",
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : isDone
                      ? "border-success/30 bg-success/15 text-success"
                      : "bg-card hover:bg-muted",
                  isSelected && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-primary" aria-hidden="true" /> Hoy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-success/30 bg-success/15" aria-hidden="true" /> Leído
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border bg-card" aria-hidden="true" /> Pendiente
          </span>
        </div>
      </section>
    </div>
  );
}
