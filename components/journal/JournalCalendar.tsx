import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalCalendarProps {
  /** Mes mostrado, "YYYY-MM" */
  month: string;
  /** Día seleccionado, "YYYY-MM-DD" */
  selected: string;
  today: string;
  entries: Array<{ entry_date: string; preview: string }>;
}

const utc = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d ?? 1));
};
const monthTitle = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" });
const dayLabel = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Calendario del mes con los días que tienen entrada; cada día es un enlace. */
export function JournalCalendar({ month, selected, today, entries }: JournalCalendarProps) {
  const withEntry = new Set(entries.map((e) => e.entry_date));
  const first = utc(`${month}-01`);
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7; // lunes = 0
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const canGoNext = next <= today.slice(0, 7);
  const href = (params: Record<string, string>) => `/diario?${new URLSearchParams(params)}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={href({ fecha: selected, mes: prev })}
          className="flex h-11 w-11 items-center justify-center rounded-md border hover:bg-muted"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <p className="text-sm font-semibold first-letter:uppercase">{monthTitle.format(first)}</p>
        {canGoNext ? (
          <Link
            href={href({ fecha: selected, mes: next })}
            className="flex h-11 w-11 items-center justify-center rounded-md border hover:bg-muted"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <span className="h-11 w-11" aria-hidden="true" />
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground" aria-hidden="true">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leading }, (_, i) => (
          <span key={`e${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const has = withEntry.has(date);
          const isSelected = date === selected;
          const isToday = date === today;
          const label = `${dayLabel.format(utc(date))}${has ? ", con entrada" : ""}${isToday ? ", hoy" : ""}`;
          const classes = cn(
            "relative flex h-11 items-center justify-center rounded-md text-sm tabular-nums",
            has && "bg-primary/10 font-semibold text-primary",
            isToday && "border border-primary",
            isSelected && "ring-2 ring-ring ring-offset-2 ring-offset-background"
          );
          if (date > today) {
            return (
              <span key={date} className={cn(classes, "text-muted-foreground/40")} aria-label={label}>
                {i + 1}
              </span>
            );
          }
          return (
            <Link
              key={date}
              href={href({ fecha: date })}
              className={cn(classes, !has && "hover:bg-muted")}
              aria-label={label}
              aria-current={isSelected ? "date" : undefined}
            >
              {i + 1}
              {has && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>

      {entries.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {entries.map((e) => (
            <li key={e.entry_date}>
              <Link
                href={href({ fecha: e.entry_date })}
                className={cn(
                  "block px-3 py-2.5 transition-colors hover:bg-muted",
                  e.entry_date === selected && "bg-muted"
                )}
              >
                <p className="text-xs font-medium text-muted-foreground first-letter:uppercase">
                  {dayLabel.format(utc(e.entry_date))}
                </p>
                <p className="truncate font-serif text-sm">{e.preview}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
