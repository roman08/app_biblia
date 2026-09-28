"use client";

import { useState } from "react";
import { PlanDayCard } from "./PlanDayCard";
import { Button } from "@/components/ui/button";
import { CheckCircle2, List } from "lucide-react";
import type { PlanDay } from "@/lib/supabase/plans-actions";

interface PlanDaysListProps {
  planId: string;
  days: PlanDay[];
  completedDays: number[];
  currentDayNumber: number;
}

export function PlanDaysList({
  planId,
  days,
  completedDays,
  currentDayNumber,
}: PlanDaysListProps) {
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  const filtered = showOnlyPending
    ? days.filter((d) => !completedDays.includes(d.day_number))
    : days;

    const scrollToCurrentDay = () => {
  const el = document.getElementById(`day-${currentDayNumber}`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
};
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "día" : "días"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setShowOnlyPending((v) => !v)}
        >
            {currentDayNumber > 1 && (
  <Button
    variant="outline"
    size="sm"
    className="w-full gap-2"
    onClick={scrollToCurrentDay}
  >
    Ir al día {currentDayNumber}
  </Button>
)}
          {showOnlyPending ? (
            <>
              <List className="h-4 w-4" />
              Ver todos
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Solo pendientes
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {filtered.map((day) => (
          <PlanDayCard
            key={day.id}
            planId={planId}
            day={day}
            isCompleted={completedDays.includes(day.day_number)}
            isToday={day.day_number === currentDayNumber}
          />
        ))}
      </div>
    </div>
  );
}