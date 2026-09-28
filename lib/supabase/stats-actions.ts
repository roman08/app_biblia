"use server";

import { createClient } from "@/lib/supabase/server";

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

  const today = new Date().toISOString().split("T")[0];

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

  // Obtener todas las fechas de actividad, ordenadas descendente
  const { data: activities } = await supabase
    .from("reading_activity")
    .select("activity_date")
    .eq("user_id", user.id)
    .order("activity_date", { ascending: false });

  if (!activities || activities.length === 0) return empty;

  const dates = activities.map((a) => a.activity_date);

  // Racha actual: contar días consecutivos desde hoy o ayer
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const todayRead = dates.includes(todayStr);
  const startFrom = todayRead ? todayStr : yesterdayStr;

  let currentStreak = 0;
  if (dates.includes(startFrom)) {
    const checkDate = new Date(startFrom);
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dates.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Racha máxima: recorrer todas las fechas ordenadas
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  const sortedAsc = [...dates].sort();
  for (const dateStr of sortedAsc) {
    const date = new Date(dateStr);
    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round(
        (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    prevDate = date;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Últimos 30 días
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
  const last30DaysCount = dates.filter((d) => d >= thirtyDaysAgoStr).length;

  return {
    currentStreak,
    longestStreak,
    totalDaysRead: dates.length,
    last30DaysCount,
    todayRead,
  };
}