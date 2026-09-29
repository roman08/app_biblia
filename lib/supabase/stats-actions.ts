"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserToday } from "@/lib/timezone";
import { addDays, daysBetween } from "@/lib/dates";

export interface ReadingStats {
  currentStreak: number;
  longestStreak: number;
  totalDaysRead: number;
  last30DaysCount: number;
  todayRead: boolean;
}

/**
 * Registra que el usuario leyó un capítulo hoy.
 * Se llama automáticamente desde ReadingTracker.
 */
export async function recordReadingActivity() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Fecha local del usuario (no UTC): leer a las 9 pm en México cuenta para hoy
  const today = await getUserToday();

  // Upsert: si ya existe el registro de hoy, incrementa chapters_read
  const { data: existing } = await supabase
    .from("reading_activity")
    .select("id, chapters_read")
    .eq("user_id", user.id)
    .eq("activity_date", today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("reading_activity")
      .update({ chapters_read: (existing.chapters_read ?? 0) + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("reading_activity").insert({
      user_id: user.id,
      activity_date: today,
      chapters_read: 1,
    });
  }
}

export async function getReadingStats(): Promise<ReadingStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: ReadingStats = {
    currentStreak: 0,
    longestStreak: 0,
    totalDaysRead: 0,
    last30DaysCount: 0,
    todayRead: false,
  };

  if (!user) return empty;

  // Obtener todas las fechas de actividad (YYYY-MM-DD)
  const { data: activities } = await supabase
    .from("reading_activity")
    .select("activity_date")
    .eq("user_id", user.id)
    .order("activity_date", { ascending: false });

  if (!activities || activities.length === 0) return empty;

  const dates = new Set<string>(activities.map((a) => a.activity_date));

  // Todas las fechas se comparan como strings en la hora local del usuario
  const today = await getUserToday();
  const todayRead = dates.has(today);

  // Racha actual: días consecutivos desde hoy (o desde ayer si hoy aún no lee)
  let currentStreak = 0;
  let cursor = todayRead ? today : addDays(today, -1);
  while (dates.has(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  // Racha máxima: recorrer las fechas en orden ascendente
  let longestStreak = 0;
  let tempStreak = 0;
  let prev: string | null = null;
  for (const date of [...dates].sort()) {
    tempStreak = prev !== null && daysBetween(prev, date) === 1 ? tempStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, tempStreak);
    prev = date;
  }

  // Últimos 30 días
  const thirtyDaysAgo = addDays(today, -30);
  const last30DaysCount = [...dates].filter((d) => d >= thirtyDaysAgo).length;

  return {
    currentStreak,
    longestStreak,
    totalDaysRead: dates.size,
    last30DaysCount,
    todayRead,
  };
}
