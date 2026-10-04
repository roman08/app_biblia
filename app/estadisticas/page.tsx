import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getActivityCalendar,
  getBibleProgress,
  getReadingStats,
} from "@/lib/supabase/stats-actions";
import { StatsCard } from "@/components/stats/StatsCard";
import { BibleProgress } from "@/components/stats/BibleProgress";
import { ActivityHeatmap } from "@/components/stats/ActivityHeatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Mis estadísticas" };

export default async function EstadisticasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/estadisticas");

  const [stats, progress, calendar] = await Promise.all([
    getReadingStats(),
    getBibleProgress(),
    getActivityCalendar(26),
  ]);

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Mis estadísticas</h1>
        <p className="text-muted-foreground">Tu progreso leyendo la Palabra</p>
      </div>

      <StatsCard
        currentStreak={stats.currentStreak}
        longestStreak={stats.longestStreak}
        totalDaysRead={stats.totalDaysRead}
        last30DaysCount={stats.last30DaysCount}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Tu constancia</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap today={calendar.today} byDate={calendar.byDate} weeks={26} />
        </CardContent>
      </Card>

      <BibleProgress progress={progress} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consejo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {stats.currentStreak === 0
              ? "Empieza hoy a leer un capítulo. La disciplina es clave para crecer en la fe."
              : stats.currentStreak < 7
              ? "¡Vas bien! Intenta mantener la racha al menos una semana para formar el hábito."
              : stats.currentStreak < 30
              ? "¡Excelente constancia! Estás formando un hábito sólido."
              : "¡Increíble! Tu disciplina es admirable. Sigue así."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
