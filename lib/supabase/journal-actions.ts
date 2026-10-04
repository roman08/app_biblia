"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserToday } from "@/lib/timezone";
import { BOOKS } from "@/lib/bible-api";

export interface JournalPassage {
  book: string;
  chapter: number;
}

export interface JournalEntry {
  entry_date: string;
  content: string;
  passages: JournalPassage[];
  updated_at: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_CONTENT = 20000;

/** Entrada del diario de un día, o null si no hay. */
export async function getJournalEntry(date: string): Promise<JournalEntry | null> {
  if (!DATE.test(date)) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("journal_entries")
    .select("entry_date, content, passages, updated_at")
    .eq("user_id", user.id)
    .eq("entry_date", date)
    .maybeSingle();
  return (data as JournalEntry | null) ?? null;
}

/** Fechas con entrada en un mes ("YYYY-MM") y el inicio de cada texto. */
export async function getJournalMonth(
  month: string
): Promise<Array<{ entry_date: string; preview: string }>> {
  if (!/^\d{4}-\d{2}$/.test(month)) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const { data } = await supabase
    .from("journal_entries")
    .select("entry_date, content")
    .eq("user_id", user.id)
    .gte("entry_date", `${month}-01`)
    .lt("entry_date", `${next}-01`)
    .order("entry_date");

  return (data ?? []).map((e) => ({
    entry_date: e.entry_date,
    preview: (e.content as string).replace(/\s+/g, " ").trim().slice(0, 80),
  }));
}

export type SaveResult =
  | { ok: true; status: "saved" | "deleted" | "unchanged"; updatedAt?: string }
  | { ok: false; error: string };

/**
 * Guarda (o borra, si el texto quedó vacío) la entrada de un día. Lo llama el
 * guardado automático del editor. No revalida la página: el editor ya tiene el
 * texto y el calendario se refresca en el cliente cuando aparece/desaparece.
 */
export async function saveJournalEntry(
  date: string,
  content: string,
  passages: JournalPassage[] = []
): Promise<SaveResult> {
  if (!DATE.test(date)) return { ok: false, error: "Fecha inválida" };
  if (content.length > MAX_CONTENT) return { ok: false, error: "El texto es demasiado largo" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sesión para guardar tu diario" };

  // No se escribe en días futuros (según la fecha local del usuario)
  if (date > (await getUserToday())) return { ok: false, error: "No se puede escribir en un día futuro" };

  if (!content.trim()) {
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("user_id", user.id)
      .eq("entry_date", date);
    return error ? { ok: false, error: error.message } : { ok: true, status: "deleted" };
  }

  const validPassages = passages
    .filter((p) => {
      const book = BOOKS.find((b) => b.slug === p.book);
      return book && Number.isInteger(p.chapter) && p.chapter >= 1 && p.chapter <= book.chapters;
    })
    .slice(0, 10);

  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("journal_entries").upsert(
    {
      user_id: user.id,
      entry_date: date,
      content,
      passages: validPassages,
      updated_at: updatedAt,
    },
    { onConflict: "user_id,entry_date" }
  );
  return error ? { ok: false, error: error.message } : { ok: true, status: "saved", updatedAt };
}
