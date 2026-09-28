import { getChapter, type VersionKey } from "@/lib/bible-api";

// Lista curada de versículos icónicos para el "versículo del día"
const VERSE_POOL = [
  { book: "juan", chapter: 3, verse: 16 },
  { book: "salmos", chapter: 23, verse: 1 },
  { book: "proverbios", chapter: 3, verse: 5 },
  { book: "romanos", chapter: 8, verse: 28 },
  { book: "filipenses", chapter: 4, verse: 13 },
  { book: "jeremias", chapter: 29, verse: 11 },
  { book: "isaias", chapter: 40, verse: 31 },
  { book: "mateo", chapter: 11, verse: 28 },
  { book: "salmos", chapter: 46, verse: 10 },
  { book: "1-corintios", chapter: 13, verse: 4 },
  { book: "josue", chapter: 1, verse: 9 },
  { book: "salmos", chapter: 119, verse: 105 },
  { book: "proverbios", chapter: 16, verse: 3 },
  { book: "1-pedro", chapter: 5, verse: 7 },
  { book: "mateo", chapter: 6, verse: 33 },
  { book: "romanos", chapter: 12, verse: 2 },
  { book: "galatas", chapter: 5, verse: 22 },
  { book: "efesios", chapter: 2, verse: 8 },
  { book: "hebreos", chapter: 11, verse: 1 },
  { book: "santiago", chapter: 1, verse: 5 },
  { book: "salmos", chapter: 27, verse: 1 },
  { book: "isaias", chapter: 41, verse: 10 },
  { book: "mateo", chapter: 28, verse: 19 },
  { book: "juan", chapter: 14, verse: 6 },
  { book: "hechos", chapter: 1, verse: 8 },
  { book: "romanos", chapter: 5, verse: 8 },
  { book: "2-timoteo", chapter: 3, verse: 16 },
  { book: "salmos", chapter: 34, verse: 8 },
  { book: "miqueas", chapter: 6, verse: 8 },
  { book: "sofonias", chapter: 3, verse: 17 },
  { book: "lamentaciones", chapter: 3, verse: 22 },
];

export interface VerseOfDay {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

/**
 * Genera un índice determinístico basado en la fecha actual.
 * El mismo día siempre devuelve el mismo versículo.
 */
function getDailyIndex(total: number): number {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  return seed % total;
}

export async function getVerseOfDay(
  version: VersionKey = "rvr1960"
): Promise<VerseOfDay | null> {
  const index = getDailyIndex(VERSE_POOL.length);
  const ref = VERSE_POOL[index];

  try {
    const chapter = await getChapter(version, ref.book, ref.chapter);
    const verse = chapter.verses.find((v) => v.verse === ref.verse);
    if (!verse) return null;

    return {
      book: ref.book,
      bookName: chapter.bookName,
      chapter: ref.chapter,
      verse: ref.verse,
      text: verse.text,
    };
  } catch {
    return null;
  }
}