import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookMarked, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface ActivePlanData {
  planSlug: string;
  planName: string;
  completed: number;
  total: number;
}

async function getActivePlan(): Promise<ActivePlanData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userPlan } = await supabase
    .from("user_plans")
    .select("plan_id, completed_days, reading_plans(slug, name, total_days)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!userPlan) return null;

  const plan = (userPlan as any).reading_plans;
  if (!plan) return null;

  return {
    planSlug: plan.slug,
    planName: plan.name,
    completed: (userPlan.completed_days as number[] | null)?.length ?? 0,
    total: plan.total_days,
  };
}

export async function ActivePlanCard() {
  const active = await getActivePlan();
  if (!active) return null;

  const percent = Math.round((active.completed / active.total) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookMarked className="h-4 w-4 text-primary" />
          Plan activo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-semibold">{active.planName}</p>
          <p className="text-sm text-muted-foreground">
            {active.completed} de {active.total} días · {percent}%
          </p>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <Link href={`/plan/${active.planSlug}`}>
          <Button variant="outline" size="sm" className="w-full gap-2">
            Continuar plan
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}