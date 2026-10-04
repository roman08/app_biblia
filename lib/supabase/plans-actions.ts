"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ReadingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  total_days: number;
}

export interface PlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  passages: Array<{ book: string; chapter: number }>;
}

export interface UserPlan {
  id: string;
  user_id: string;
  plan_id: string;
  started_at: string;
  completed_days: number[];
}

export async function getAllPlans(): Promise<ReadingPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_plans")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return [];
  return data as ReadingPlan[];
}

export async function getPlanBySlug(slug: string) {
  const supabase = await createClient();
  const { data: plan, error: planError } = await supabase
    .from("reading_plans")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (planError) console.error("getPlanBySlug:", planError.message);
  if (!plan) return null;

  const { data: days, error: daysError } = await supabase
    .from("plan_days")
    .select("*")
    .eq("plan_id", plan.id)
    .order("day_number", { ascending: true });

  if (daysError) console.error("getPlanBySlug (días):", daysError.message);

  return {
    plan: plan as ReadingPlan,
    days: (days ?? []) as PlanDay[],
  };
}

export async function getUserPlan(planId: string): Promise<UserPlan | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("plan_id", planId)
    .maybeSingle();

  return data as UserPlan | null;
}

export interface TodayReading {
  planSlug: string;
  planName: string;
  day: number;
  passages: Array<{ book: string; chapter: number }>;
}

/**
 * Lo que le toca leer hoy al usuario en su plan activo (el último que empezó):
 * el día siguiente al último completado. null sin sesión, sin plan o si ya
 * terminó el plan.
 */
export async function getTodayReading(): Promise<TodayReading | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userPlan } = await supabase
    .from("user_plans")
    .select("completed_days, reading_plans(id, slug, name, total_days)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const plan = (userPlan as { reading_plans?: { id: string; slug: string; name: string; total_days: number } } | null)
    ?.reading_plans;
  if (!userPlan || !plan) return null;

  const completed = (userPlan.completed_days as number[] | null) ?? [];
  if (completed.length >= plan.total_days) return null;
  const day = Math.min(completed.length ? Math.max(...completed) + 1 : 1, plan.total_days);

  const { data: planDay } = await supabase
    .from("plan_days")
    .select("passages")
    .eq("plan_id", plan.id)
    .eq("day_number", day)
    .maybeSingle();
  if (!planDay?.passages?.length) return null;

  return { planSlug: plan.slug, planName: plan.name, day, passages: planDay.passages };
}

export async function startPlan(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: existing } = await supabase
    .from("user_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_id", planId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("user_plans").insert({
      user_id: user.id,
      plan_id: planId,
      completed_days: [],
    });
  }

  revalidatePath("/plan");
}

export async function toggleDayCompleted(planId: string, dayNumber: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: userPlan } = await supabase
    .from("user_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("plan_id", planId)
    .maybeSingle();

  if (!userPlan) throw new Error("Plan no iniciado");

  const completed: number[] = userPlan.completed_days ?? [];
  const isCompleted = completed.includes(dayNumber);
  const newCompleted = isCompleted
    ? completed.filter((d) => d !== dayNumber)
    : [...completed, dayNumber].sort((a, b) => a - b);

  await supabase
    .from("user_plans")
    .update({ completed_days: newCompleted })
    .eq("id", userPlan.id);

  // Páginas de planes (/plan/[slug]) y la tarjeta "Plan activo" del inicio
  revalidatePath("/plan", "layout");
  revalidatePath("/");
}