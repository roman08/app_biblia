import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReadingStats } from "@/lib/supabase/stats-actions";
import { StatsCard } from "@/components/stats/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EstadisticasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/estadisticas");

  const stats = await getReadingStats();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Mis estadísticas</h1>
      <p className="text-muted-foreground mb-8">
        Tu progreso leyendo la Palabra
      </p>

      <StatsCard
        currentStreak={stats.currentStreak}
        longestStreak={stats.longestStreak}
        totalDaysRead={stats.totalDaysRead}
        last30DaysCount={stats.last30DaysCount}
      />

      <Card className="mt-8">
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