const BASE = "https://api.midvash.com/v1";

// Las claves son los slugs de Midvash. Ojo: en Midvash `nvi` es la NVI en
// portugués; la NVI en español es `nvies`.
export const VERSIONS = {
  rvr1960: { name: "Reina Valera 1960", shortName: "RVR1960" },
  nvies:   { name: "Nueva Versión Internacional", shortName: "NVI" },
  ntv:     { name: "Nueva Traducción Viviente", shortName: "NTV" },
  rvr1909: { name: "Reina Valera 1909", shortName: "RVR1909" },
} as const;

export type VersionKey = keyof typeof VERSIONS;

export interface Verse {
  verse: number;
  text: string;
}

export interface ChapterData {
  version: string;
  book: string;
  bookName: string;
  chapter: number;
  reference: string;
  verses: Verse[];
}

export const BOOKS = [
  // Antiguo Testamento
  { slug: "genesis", name: "Génesis", testament: "OT", chapters: 50 },
  { slug: "exodo", name: "Éxodo", testament: "OT", chapters: 40 },
  { slug: "levitico", name: "Levítico", testament: "OT", chapters: 27 },
  { slug: "numeros", name: "Números", testament: "OT", chapters: 36 },
  { slug: "deuteronomio", name: "Deuteronomio", testament: "OT", chapters: 34 },
  { slug: "josue", name: "Josué", testament: "OT", chapters: 24 },
  { slug: "jueces", name: "Jueces", testament: "OT", chapters: 21 },
  { slug: "rut", name: "Rut", testament: "OT", chapters: 4 },
  { slug: "1-samuel", name: "1 Samuel", testament: "OT", chapters: 31 },
  { slug: "2-samuel", name: "2 Samuel", testament: "OT", chapters: 24 },
  { slug: "1-reyes", name: "1 Reyes", testament: "OT", chapters: 22 },
  { slug: "2-reyes", name: "2 Reyes", testament: "OT", chapters: 25 },
  { slug: "1-cronicas", name: "1 Crónicas", testament: "OT", chapters: 29 },
  { slug: "2-cronicas", name: "2 Crónicas", testament: "OT", chapters: 36 },
  { slug: "esdras", name: "Esdras", testament: "OT", chapters: 10 },
  { slug: "nehemias", name: "Nehemías", testament: "OT", chapters: 13 },
  { slug: "ester", name: "Ester", testament: "OT", chapters: 10 },
  { slug: "job", name: "Job", testament: "OT", chapters: 42 },
  { slug: "salmos", name: "Salmos", testament: "OT", chapters: 150 },
  { slug: "proverbios", name: "Proverbios", testament: "OT", chapters: 31 },
  { slug: "eclesiastes", name: "Eclesiastés", testament: "OT", chapters: 12 },
  { slug: "cantares", name: "Cantares", testament: "OT", chapters: 8 },
  { slug: "isaias", name: "Isaías", testament: "OT", chapters: 66 },
  { slug: "jeremias", name: "Jeremías", testament: "OT", chapters: 52 },
  { slug: "lamentaciones", name: "Lamentaciones", testament: "OT", chapters: 5 },
  { slug: "ezequiel", name: "Ezequiel", testament: "OT", chapters: 48 },
  { slug: "daniel", name: "Daniel", testament: "OT", chapters: 12 },
  { slug: "oseas", name: "Oseas", testament: "OT", chapters: 14 },
  { slug: "joel", name: "Joel", testament: "OT", chapters: 3 },
  { slug: "amos", name: "Amós", testament: "OT", chapters: 9 },
  { slug: "abdias", name: "Obadías", testament: "OT", chapters: 1 },
  { slug: "jonas", name: "Jonás", testament: "OT", chapters: 4 },
  { slug: "miqueas", name: "Miqueas", testament: "OT", chapters: 7 },
  { slug: "nahum", name: "Nahúm", testament: "OT", chapters: 3 },
  { slug: "habacuc", name: "Habacuc", testament: "OT", chapters: 3 },
  { slug: "sofonias", name: "Sofonías", testament: "OT", chapters: 3 },
  { slug: "hageo", name: "Hageo", testament: "OT", chapters: 2 },
  { slug: "zacarias", name: "Zacarías", testament: "OT", chapters: 14 },
  { slug: "malaquias", name: "Malaquías", testament: "OT", chapters: 4 },
  // Nuevo Testamento
  { slug: "mateo", name: "Mateo", testament: "NT", chapters: 28 },
  { slug: "marcos", name: "Marcos", testament: "NT", chapters: 16 },
  { slug: "lucas", name: "Lucas", testament: "NT", chapters: 24 },
  { slug: "juan", name: "Juan", testament: "NT", chapters: 21 },
  { slug: "hechos", name: "Hechos", testament: "NT", chapters: 28 },
  { slug: "romanos", name: "Romanos", testament: "NT", chapters: 16 },
  { slug: "1-corintios", name: "1 Corintios", testament: "NT", chapters: 16 },
  { slug: "2-corintios", name: "2 Corintios", testament: "NT", chapters: 13 },
  { slug: "galatas", name: "Gálatas", testament: "NT", chapters: 6 },
  { slug: "efesios", name: "Efesios", testament: "NT", chapters: 6 },
  { slug: "filipenses", name: "Filipenses", testament: "NT", chapters: 4 },
  { slug: "colosenses", name: "Colosenses", testament: "NT", chapters: 4 },
  { slug: "1-tesalonicenses", name: "1 Tesalonicenses", testament: "NT", chapters: 5 },
  { slug: "2-tesalonicenses", name: "2 Tesalonicenses", testament: "NT", chapters: 3 },
  { slug: "1-timoteo", name: "1 Timoteo", testament: "NT", chapters: 6 },
  { slug: "2-timoteo", name: "2 Timoteo", testament: "NT", chapters: 4 },
  { slug: "tito", name: "Tito", testament: "NT", chapters: 3 },
  { slug: "filemon", name: "Filemón", testament: "NT", chapters: 1 },
  { slug: "hebreos", name: "Hebreos", testament: "NT", chapters: 13 },
  { slug: "santiago", name: "Santiago", testament: "NT", chapters: 5 },
  { slug: "1-pedro", name: "1 Pedro", testament: "NT", chapters: 5 },
  { slug: "2-pedro", name: "2 Pedro", testament: "NT", chapters: 3 },
  { slug: "1-juan", name: "1 Juan", testament: "NT", chapters: 5 },
  { slug: "2-juan", name: "2 Juan", testament: "NT", chapters: 1 },
  { slug: "3-juan", name: "3 Juan", testament: "NT", chapters: 1 },
  { slug: "judas", name: "Judas", testament: "NT", chapters: 1 },
  { slug: "apocalipsis", name: "Apocalipsis", testament: "NT", chapters: 22 },
] as const;

export type BookSlug = (typeof BOOKS)[number]["slug"];

export function getBook(slug: string) {
  return BOOKS.find((b) => b.slug === slug);
}

export async function getChapter(
  version: VersionKey,
  book: string,
  chapter: number
): Promise<ChapterData> {
  const url = `${BASE}/${version}/${book}/${chapter}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`No se pudo cargar ${book} ${chapter}`);

  const json = await res.json();
  const raw = json.data;

  // Midvash devuelve `verses` como array de strings (una por versículo)
  const verses: Verse[] = (raw.verses as string[]).map((text, i) => ({
    verse: i + 1,
    text,
  }));

  // Midvash devuelve el slug y el nombre del libro en inglés ("john", "John");
  // usamos siempre nuestro slug y nombre en español.
  const bookName = getBook(book)?.name ?? raw.bookName;

  return {
    version: raw.version,
    book,
    bookName,
    chapter: raw.chapter,
    reference: `${bookName} ${raw.chapter}`,
    verses,
  };
}
export interface VerseRef {
  book: string;
  chapter: number;
  verse: number;
}

const PASSAGES_BATCH = 50; // límite de Midvash por llamada

/**
 * Trae el texto de varios versículos sueltos en pocas llamadas
 * (GET /v1/passages, hasta 50 referencias cada una).
 * Devuelve los textos en el mismo orden que `refs`; `null` si alguno falla.
 */
export async function getPassages(
  refs: VerseRef[],
  version: VersionKey = "rvr1960"
): Promise<(string | null)[]> {
  const batches: VerseRef[][] = [];
  for (let i = 0; i < refs.length; i += PASSAGES_BATCH) {
    batches.push(refs.slice(i, i + PASSAGES_BATCH));
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const q = batch.map((r) => `${r.book} ${r.chapter}:${r.verse}`).join(",");
      const url = `${BASE}/passages?refs=${encodeURIComponent(q)}&version=${version}`;
      try {
        const res = await fetch(url, { next: { revalidate: 86400 } });
        if (!res.ok) return batch.map(() => null);
        const json = (await res.json()) as {
          data: Array<{ text?: string; error?: string }>;
        };
        return batch.map((_, i) => json.data[i]?.text ?? null);
      } catch {
        return batch.map(() => null);
      }
    })
  );

  return results.flat();
}
