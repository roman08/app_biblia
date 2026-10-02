import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { pageMetadata } from "@/lib/site";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getPlanBySlug,
  getUserPlan,
  startPlan,
} from "@/lib/supabase/plans-actions";
import { PlanDaysList } from "@/components/plan/PlanDaysList";
import { PlanProgress } from "@/components/plan/PlanProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPlanBySlug(slug).catch(() => null);
  if (!result) return { title: "Plan no encontrado" };

  const { plan } = result;

  // La imagen la genera ./opengraph-image.tsx
  return pageMetadata({
    title: `${plan.name} · Plan de lectura`,
    description:
      plan.description ?? `Plan de lectura de la Biblia en ${plan.total_days} días.`,
    path: `/plan/${slug}`,
    ownImage: true,
  });
}

export default async function PlanPage({ params }: PageProps) {
  const { slug } = await params;

  const result = await getPlanBySlug(slug);
  if (!result) notFound();

  const { plan, days } = result;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userPlan = user ? await getUserPlan(plan.id) : null;
  const completed = userPlan?.completed_days ?? [];

  const currentDayNumber =
    completed.length > 0 ? Math.max(...completed) + 1 : 1;

  async function handleStart() {
    "use server";
    await startPlan(plan.id);
    redirect(`/plan/${slug}`);
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <Link href="/planes" className="text-sm text-muted-foreground hover:underline">
          ← Todos los planes
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{plan.name}</h1>
        <p className="mt-2 text-muted-foreground">{plan.description}</p>
      </div>

      {user && !userPlan && (
        <Card className="mb-8">
          <CardContent className="py-6 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Aún no has empezado este plan
            </p>
            <form action={handleStart}>
              <Button type="submit">Empezar plan</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="mb-8">
          <CardContent className="py-6 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Inicia sesión para seguir tu progreso
            </p>
            <Link href={`/login?next=/plan/${slug}`}>
              <Button>Iniciar sesión</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {userPlan && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Tu progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanProgress
              completed={completed.length}
              total={plan.total_days}
            />
          </CardContent>
        </Card>
      )}

      {/* Lista de días */}
      <PlanDaysList
        planId={plan.id}
        days={days}
        completedDays={completed}
        currentDayNumber={currentDayNumber}
      />
    </div>
  );
}