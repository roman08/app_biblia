"use server";

import { BOOKS, DEFAULT_VERSION, getChapter, versionLabel } from "@/lib/bible-api";

export interface ReferencePreview {
  verses: { verse: number; text: string }[];
  /** Versículos que tiene el capítulo (para avisar si el pedido no existe) */
  verseCount: number;
  versionShortName: string;
}

const MAX_PREVIEW_VERSES = 5;

/**
 * Texto de una referencia para la vista previa de /buscar. Sin versículo,
 * devuelve el primero del capítulo. `null` si la API no responde.
 */
export async function getReferencePreview(
  book: string,
  chapter: number,
  verse?: number,
  verseEnd?: number
): Promise<ReferencePreview | null> {
  const info = BOOKS.find((b) => b.slug === book);
  if (!info || chapter < 1 || chapter > info.chapters) return null;

  try {
    const data = await getChapter(DEFAULT_VERSION, book, chapter);
    const from = verse ?? 1;
    const to = Math.min(verseEnd ?? from, from + MAX_PREVIEW_VERSES - 1);
    return {
      verses: data.verses.filter((v) => v.verse >= from && v.verse <= to),
      verseCount: data.verses.length,
      versionShortName: versionLabel(data.version).shortName,
    };
  } catch {
    return null;
  }
}
