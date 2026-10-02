import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DESCRIPTION, SITE_NAME, pageMetadata } from "@/lib/site";
import { Suspense } from "react";
import { getVerseOfDay } from "@/lib/verse-of-day";
import { getReadingStats } from "@/lib/supabase/stats-actions";
import { VerseOfDayCard } from "@/components/home/VerseOfDayCard";
import { ContinueReadingCard } from "@/components/home/ContinueReadingCard";
import { ActivePlanCard } from "@/components/home/ActivePlanCard";
import { Greeting } from "@/components/home/Greeting";
import { StreakBadge } from "@/components/stats/StreakBadge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ArrowRight,
  BookMarked,
  StickyNote,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  ...pageMetadata({ title: SITE_NAME, description: SITE_DESCRIPTION, path: "/", ownImage: true }),
  // Sin la plantilla "%s · Biblia App" (quedaría "Biblia App · Biblia App")
  title: { absolute: SITE_NAME },
};

const QUICK_LINKS = [
  { href: "/planes", label: "Planes", hint: "Lecturas guiadas", icon: BookMarked },
  { href: "/notas", label: "Notas", hint: "Resaltados", icon: StickyNote },
  { href: "/estadisticas", label: "Estadísticas", hint: "Tu progreso", icon: BarChart3 },
];

export default async function HomePage() {
  const verseOfDay = await getVerseOfDay();
  const stats = await getReadingStats();

  // Obtener el usuario
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <Greeting />
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

      <ContinueReadingCard fallback={<ExploreCard />} />

      <Suspense fallback={null}>
        <ActivePlanCard />
      </Suspense>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {QUICK_LINKS.map(({ href, label, hint, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-muted sm:p-4"
          >
            <Icon className="h-5 w-5 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{label}</p>
              <p className="truncate text-xs text-muted-foreground">{hint}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ExploreCard() {
  return (
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
  );
}
