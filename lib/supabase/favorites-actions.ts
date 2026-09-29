"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FavoriteVerse {
  id: string;
  user_id: string;
  book: string;
  chapter: number;
  verse: number;
  created_at: string;
}

export async function isFavorite(
  book: string,
  chapter: number,
  verse: number
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("favorite_verses")
    .select("id")
    .eq("user_id", user.id)
    .eq("book", book)
    .eq("chapter", chapter)
    .eq("verse", verse)
    .maybeSingle();

  return !!data;
}

function revalidateFavoritePaths(book: string, chapter: number) {
  revalidatePath("/");
  revalidatePath("/favoritos");
  revalidatePath(`/leer/${book}/${chapter}`);
}

/** Números de versículo marcados como favoritos en un capítulo. */
export async function getFavoritesForChapter(
  book: string,
  chapter: number
): Promise<number[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("favorite_verses")
    .select("verse")
    .eq("user_id", user.id)
    .eq("book", book)
    .eq("chapter", chapter);

  return (data ?? []).map((f) => f.verse as number);
}

export async function toggleFavorite(
  book: string,
  chapter: number,
  verse: number
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: existing } = await supabase
    .from("favorite_verses")
    .select("id")
    .eq("user_id", user.id)
    .eq("book", book)
    .eq("chapter", chapter)
    .eq("verse", verse)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorite_verses").delete().eq("id", existing.id);
    revalidateFavoritePaths(book, chapter);
    return false;
  } else {
    await supabase.from("favorite_verses").insert({
      user_id: user.id,
      book,
      chapter,
      verse,
    });
    revalidateFavoritePaths(book, chapter);
    return true;
  }
}

export async function getAllFavorites(): Promise<FavoriteVerse[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("favorite_verses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as FavoriteVerse[];
}