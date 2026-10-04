"use client";

import { useState } from "react";
import { addDays } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
  /** Hoy en la hora local del usuario (YYYY-MM-DD) */
  today: string;
  /** Capítulos leídos por fecha */
  byDate: Record<string, number>;
  /** Semanas a mostrar (26 caben en un celular) */
  weeks?: number;
}

// Niveles de la rampa (tokens --heat-0…4 de globals.css, validados con la
// skill de dataviz en claro y oscuro)
const LEVEL_CLASS = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];
const LEVEL_LABEL = ["Sin lectura", "1 capítulo", "2–3 capítulos", "4–5 capítulos", "6 o más"];

function level(chapters: number) {
  if (chapters <= 0) return 0;
  if (chapters === 1) return 1;
  if (chapters <= 3) return 2;
  if (chapters <= 5) return 3;
  return 4;
}

const utc = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const longDate = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const monthShort = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" });

/** Lunes = 0 … domingo = 6 */
const weekdayIndex = (date: string) => (utc(date).getUTCDay() + 6) % 7;

const chaptersLabel = (n: number) => (n === 0 ? "sin lectura" : n === 1 ? "1 capítulo" : `${n} capítulos`);

export function ActivityHeatmap({ today, byDate, weeks = 26 }: ActivityHeatmapProps) {
  const [active, setActive] = useState<string | null>(null);

  // Primera columna: el lunes de hace (weeks - 1) semanas
  const start = addDays(today, -weekdayIndex(today) - (weeks - 1) * 7);
  const columns = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d))
  );

  const daysWithReading = Object.entries(byDate).filter(([d, n]) => n > 0 && d >= start && d <= today);
  const totalChapters = daysWithReading.reduce((s, [, n]) => s + n, 0);

  const readout = active
    ? `${longDate.format(utc(active))} · ${chaptersLabel(byDate[active] ?? 0)}`
    : `${daysWithReading.length} ${daysWithReading.length === 1 ? "día" : "días"} con lectura y ${totalChapters} ${
        totalChapters === 1 ? "capítulo" : "capítulos"
      } en los últimos 6 meses`;

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {/* Días de la semana */}
        <div
          className="grid shrink-0 grid-rows-7 gap-[2px] pt-5 text-[10px] leading-none text-muted-foreground"
          aria-hidden="true"
        >
          {["L", "", "X", "", "V", "", ""].map((d, i) => (
            <span key={i} className="flex items-center">
              {d}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {/* Meses */}
          <div
            className="mb-1 grid h-4 gap-[2px] text-[10px] leading-none text-muted-foreground"
            style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
            aria-hidden="true"
          >
            {columns.map((col, i) => {
              const first = col[0];
              const prev = i > 0 ? columns[i - 1][0] : null;
              const newMonth = !prev || first.slice(0, 7) !== prev.slice(0, 7);
              return (
                <span key={i} className="overflow-visible whitespace-nowrap">
                  {newMonth && i < weeks - 1 ? monthShort.format(utc(first)).replace(".", "") : ""}
                </span>
              );
            })}
          </div>

          {/* Celdas: una columna por semana, de lunes a domingo */}
          <div
            className="grid grid-flow-col grid-rows-7 gap-[2px]"
            style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
            role="group"
            aria-label="Capítulos leídos por día"
            onPointerLeave={() => setActive(null)}
          >
            {columns.flat().map((date) => {
              if (date > today) return <span key={date} aria-hidden="true" />;
              const n = byDate[date] ?? 0;
              const lv = level(n);
              return (
                <button
                  key={date}
                  type="button"
                  aria-label={`${longDate.format(utc(date))}: ${chaptersLabel(n)}`}
                  onPointerEnter={() => setActive(date)}
                  onFocus={() => setActive(date)}
                  onClick={() => setActive(date)}
                  className={cn(
                    "aspect-square w-full rounded-[2px] outline-none transition-shadow",
                    LEVEL_CLASS[lv],
                    active === date && "ring-2 ring-foreground ring-offset-1 ring-offset-card",
                    date === today && active !== date && "ring-1 ring-foreground/40"
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Detalle del día (o resumen) y leyenda */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs text-muted-foreground first-letter:uppercase" aria-live="polite">
          {readout}
        </p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Menos</span>
          {LEVEL_CLASS.map((c, i) => (
            <span key={c} className={cn("h-2.5 w-2.5 rounded-[2px]", c)} title={LEVEL_LABEL[i]} />
          ))}
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}
