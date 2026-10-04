"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserToday } from "@/lib/timezone";
import { addDays, daysBetween } from "@/lib/dates";
import { BOOKS } from "@/lib/bible-api";

export interface ReadingStats {
  currentStreak: number;
  longestStreak: number;
  totalDaysRead: number;
  last30DaysCount: number;
  todayRead: boolean;
}

/**
 * Registra que el usuario leyó un capítulo (ReadingTracker lo llama al llegar
 * al final del capítulo o tras 30 s). Usa la función SQL record_chapter_read:
 * guarda el capítulo para el progreso de la Biblia y suma a la racha solo la
 * primera vez que se lee ese capítulo en el día.
 */
export async function recordChapterRead(book: string, chapter: number) {
  const info = BOOKS.find((b) => b.slug === book);
  if (!info || !Number.isInteger(chapter) || chapter < 1 || chapter > info.chapters) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Fecha local del usuario (no UTC): leer a las 9 pm en México cuenta para hoy
  const today = await getUserToday();

  const { error } = await supabase.rpc("record_chapter_read", {
    p_book: book,
    p_chapter: chapter,
    p_date: today,
  });

  // Si la migración aún no se aplicó (no existe la función), al menos la racha
  if (error) {
    console.error("record_chapter_read:", error.message);
    if (error.code === "PGRST202" || error.code === "42883" || error.code === "42P01") {
      await recordActivityLegacy(user.id, today);
    }
  }
}

/** Racha sin progreso por capítulo (antes de la migración de chapter_reads) */
async function recordActivityLegacy(userId: string, today: string) {
  const supabase = await createClient();
  const user = { id: userId };

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

export interface BibleProgress {
  /** Capítulos leídos por libro: { juan: [1, 3, 4], … } */
  readByBook: Record<string, number[]>;
  totalRead: number;
  /** false si la tabla chapter_reads aún no existe (migración sin aplicar) */
  available: boolean;
}

/** Qué capítulos de la Biblia ha leído el usuario (al menos una vez). */
export async function getBibleProgress(): Promise<BibleProgress> {
  const empty: BibleProgress = { readByBook: {}, totalRead: 0, available: true };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  // Supabase devuelve como máximo 1000 filas por consulta; la Biblia tiene 1189
  const rows: { book: string; chapter: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("chapter_reads")
      .select("book, chapter")
      .eq("user_id", user.id)
      .order("book")
      .order("chapter")
      .range(from, from + 999);
    if (error) {
      console.error("getBibleProgress:", error.message);
      return { ...empty, available: false };
    }
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const readByBook: Record<string, number[]> = {};
  for (const { book, chapter } of rows) (readByBook[book] ??= []).push(chapter);
  return { readByBook, totalRead: rows.length, available: true };
}

export interface ActivityCalendar {
  /** Hoy en la hora local del usuario (YYYY-MM-DD) */
  today: string;
  /** Capítulos leídos por fecha: { "2026-10-03": 4, … } */
  byDate: Record<string, number>;
}

/** Capítulos leídos por día en las últimas `weeks` semanas (mapa de calor). */
export async function getActivityCalendar(weeks = 26): Promise<ActivityCalendar> {
  const today = await getUserToday();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { today, byDate: {} };

  const { data } = await supabase
    .from("reading_activity")
    .select("activity_date, chapters_read")
    .eq("user_id", user.id)
    .gte("activity_date", addDays(today, -weeks * 7))
    .lte("activity_date", today);

  const byDate: Record<string, number> = {};
  for (const r of data ?? []) byDate[r.activity_date] = Math.max(1, r.chapters_read ?? 1);
  return { today, byDate };
}
