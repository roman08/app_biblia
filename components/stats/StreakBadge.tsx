import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StreakBadgeProps {
  currentStreak: number;
  todayRead: boolean;
}

export function StreakBadge({ currentStreak, todayRead }: StreakBadgeProps) {
  if (currentStreak === 0 && !todayRead) return null;

  return (
    <Card className="border-streak/20 bg-linear-to-r from-streak/5 to-transparent">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-streak/10">
          <Flame className="h-6 w-6 text-streak" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">
            {currentStreak > 0
              ? `${currentStreak} ${currentStreak === 1 ? "día" : "días"} de racha`
              : "¡Empieza tu racha hoy!"}
          </p>
          <p className="text-xs text-muted-foreground">
            {todayRead
              ? "¡Ya leíste hoy! Sigue así 🔥"
              : "Aún no has leído hoy. ¡No pierdas tu racha!"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}