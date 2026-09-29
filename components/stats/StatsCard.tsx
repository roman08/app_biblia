import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy, Calendar, BookOpen } from "lucide-react";

interface StatsCardProps {
  currentStreak: number;
  longestStreak: number;
  totalDaysRead: number;
  last30DaysCount: number;
}

export function StatsCard({
  currentStreak,
  longestStreak,
  totalDaysRead,
  last30DaysCount,
}: StatsCardProps) {
  return (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-2 sm:text-xs">
          <Flame className="h-3.5 w-3.5 text-streak shrink-0" />
          <span className="truncate">Racha actual</span>
        </div>
        <p className="text-2xl font-bold sm:text-3xl">{currentStreak}</p>
        <p className="text-xs text-muted-foreground">
          {currentStreak === 1 ? "día" : "días"}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-2 sm:text-xs">
          <Trophy className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="truncate">Récord</span>
        </div>
        <p className="text-2xl font-bold sm:text-3xl">{longestStreak}</p>
        <p className="text-xs text-muted-foreground">
          {longestStreak === 1 ? "día" : "días"}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-2 sm:text-xs">
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">Últimos 30 días</span>
        </div>
        <p className="text-2xl font-bold sm:text-3xl">{last30DaysCount}</p>
        <p className="text-xs text-muted-foreground">
          {last30DaysCount === 1 ? "día" : "días"}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-2 sm:text-xs">
          <BookOpen className="h-3.5 w-3.5 text-success shrink-0" />
          <span className="truncate">Total</span>
        </div>
        <p className="text-2xl font-bold sm:text-3xl">{totalDaysRead}</p>
        <p className="text-xs text-muted-foreground">
          {totalDaysRead === 1 ? "día" : "días"}
        </p>
      </CardContent>
    </Card>
  </div>
);
}