import Link from "next/link";
import { Suspense } from "react";
import { getVerseOfDay } from "@/lib/verse-of-day";
import { getReadingStats } from "@/lib/supabase/stats-actions";
import { VerseOfDayCard } from "@/components/home/VerseOfDayCard";
import { ContinueReadingCard } from "@/components/home/ContinueReadingCard";
import { ActivePlanCard } from "@/components/home/ActivePlanCard";
import { StreakBadge } from "@/components/stats/StreakBadge";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function HomePage() {
  const verseOfDay = await getVerseOfDay("rvr1960");
  const stats = await getReadingStats();
  const greeting = getGreeting();

  // Obtener el usuario
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{greeting}</h1>
        <p className="mt-1 text-muted-foreground">
          Un momento con la Palabra
        </p>
      </div>

      <StreakBadge
        currentStreak={stats.currentStreak}
        todayRead={stats.todayRead}
      />

      {verseOfDay && (
        <VerseOfDayCard
          verse={verseOfDay}
          isAuthenticated={!!user}
        />
      )}
      
      <ContinueReadingCard />

      <Suspense fallback={null}>
        <ActivePlanCard />
      </Suspense>

      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Explorar la Biblia</p>
              <p className="text-sm text-muted-foreground">
                66 libros · Antiguo y Nuevo Testamento
              </p>
            </div>
          </div>
          <Link href="/leer">
            <Button className="gap-2">
              Abrir
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link href="/planes">
          <div className="rounded-lg border p-4 hover:bg-accent transition-colors">
            <p className="font-semibold text-sm">Planes</p>
            <p className="text-xs text-muted-foreground">Lecturas guiadas</p>
          </div>
        </Link>
        <Link href="/notas">
          <div className="rounded-lg border p-4 hover:bg-accent transition-colors">
            <p className="font-semibold text-sm">Notas</p>
            <p className="text-xs text-muted-foreground">Resaltados</p>
          </div>
        </Link>
        <Link href="/estadisticas">
          <div className="rounded-lg border p-4 hover:bg-accent transition-colors">
            <p className="font-semibold text-sm">Stats</p>
            <p className="text-xs text-muted-foreground">Tu progreso</p>
          </div>
        </Link>
      </div>
    </div>
  );
}