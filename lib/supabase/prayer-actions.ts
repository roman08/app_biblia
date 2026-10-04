"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PrayerRequest {
  id: string;
  title: string;
  details: string | null;
  created_at: string;
  answered_at: string | null;
  answer_note: string | null;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const clean = (text: string | null | undefined, max: number) => {
  const t = (text ?? "").trim();
  return t ? t.slice(0, max) : null;
};

/** Todas las peticiones del usuario (activas primero, luego respondidas). */
export async function getPrayers(): Promise<PrayerRequest[]> {
  const { supabase, user } = await currentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("prayer_requests")
    .select("id, title, details, created_at, answered_at, answer_note")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) console.error("getPrayers:", error.message);
  return (data ?? []) as PrayerRequest[];
}

export async function createPrayer(title: string, details?: string): Promise<ActionResult> {
  const t = clean(title, 200);
  if (!t) return { ok: false, error: "Escribe por qué quieres orar" };
  const { supabase, user } = await currentUser();
  if (!user) return { ok: false, error: "Inicia sesión para guardar tus peticiones" };

  const { error } = await supabase
    .from("prayer_requests")
    .insert({ user_id: user.id, title: t, details: clean(details, 5000) });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/oracion");
  return { ok: true };
}

export async function markPrayerAnswered(id: string, note?: string): Promise<ActionResult> {
  const { supabase, user } = await currentUser();
  if (!user) return { ok: false, error: "Inicia sesión" };
  const { error } = await supabase
    .from("prayer_requests")
    .update({ answered_at: new Date().toISOString(), answer_note: clean(note, 5000) })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/oracion");
  return { ok: true };
}

export async function reopenPrayer(id: string): Promise<ActionResult> {
  const { supabase, user } = await currentUser();
  if (!user) return { ok: false, error: "Inicia sesión" };
  const { error } = await supabase
    .from("prayer_requests")
    .update({ answered_at: null, answer_note: null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/oracion");
  return { ok: true };
}

export async function deletePrayer(id: string): Promise<ActionResult> {
  const { supabase, user } = await currentUser();
  if (!user) return { ok: false, error: "Inicia sesión" };
  const { error } = await supabase
    .from("prayer_requests")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/oracion");
  return { ok: true };
}
