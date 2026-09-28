"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Note {
  id: string;
  user_id: string;
  book: string;
  chapter: number;
  verse: number | null;
  content: string | null;
  color: string | null;
  created_at: string;
}

export async function getNotesForChapter(
  book: string,
  chapter: number
): Promise<Note[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("book", book)
    .eq("chapter", chapter);

  if (error) {
    console.error("Error cargando notas:", error);
    return [];
  }
  return data as Note[];
}

export async function getAllNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Note[];
}

export async function upsertHighlight(
  book: string,
  chapter: number,
  verse: number,
  color: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // Buscar si ya existe un highlight para ese versículo
  const { data: existing } = await supabase
    .from("notes")
    .select("id")
    .eq("user_id", user.id)
    .eq("book", book)
    .eq("chapter", chapter)
    .eq("verse", verse)
    .maybeSingle();

  if (existing) {
    if (color === null) {
      // Quitar resaltado → eliminar la nota si no tiene contenido
      await supabase
        .from("notes")
        .delete()
        .eq("id", existing.id);
    } else {
      await supabase
        .from("notes")
        .update({ color })
        .eq("id", existing.id);
    }
  } else if (color !== null) {
    await supabase.from("notes").insert({
      user_id: user.id,
      book,
      chapter,
      verse,
      color,
    });
  }

  revalidatePath(`/leer/${book}/${chapter}`);
}

export async function upsertNote(
  book: string,
  chapter: number,
  verse: number,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: existing } = await supabase
    .from("notes")
    .select("id")
    .eq("user_id", user.id)
    .eq("book", book)
    .eq("chapter", chapter)
    .eq("verse", verse)
    .maybeSingle();

  if (existing) {
    if (content.trim() === "") {
      // Si no hay color ni contenido, borrar
      const { data: full } = await supabase
        .from("notes")
        .select("color")
        .eq("id", existing.id)
        .single();
      if (!full?.color) {
        await supabase.from("notes").delete().eq("id", existing.id);
      } else {
        await supabase
          .from("notes")
          .update({ content: null })
          .eq("id", existing.id);
      }
    } else {
      await supabase
        .from("notes")
        .update({ content })
        .eq("id", existing.id);
    }
  } else {
    if (content.trim() !== "") {
      await supabase.from("notes").insert({
        user_id: user.id,
        book,
        chapter,
        verse,
        content,
      });
    }
  }

  revalidatePath(`/leer/${book}/${chapter}`);
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await supabase.from("notes").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/notas");
}