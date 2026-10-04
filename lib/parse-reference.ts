// Convierte lo que escribe el usuario ("jn 3:16", "1 co 13:4-7", "sal 23",
// "Primera de Juan 4,8") en una referencia bíblica.
//
// Se usa en /buscar. No depende de la red: los nombres y abreviaturas viven
// aquí y los capítulos en BOOKS. (El /v1/parse de Midvash no entiende
// abreviaturas como "sal", por eso no se usa.)

import { BOOKS, chapterHref, type BookSlug } from "@/lib/bible-api";

export interface BibleRef {
  book: BookSlug;
  chapter: number;
  verse?: number;
  verseEnd?: number;
}

export type ParseResult =
  | { ok: true; ref: BibleRef; label: string; href: string }
  | {
      ok: false;
      reason: "empty" | "unknown-book" | "ambiguous" | "chapter-out-of-range" | "invalid";
      message: string;
      /** Libros posibles cuando el nombre es ambiguo ("corintios", "jo") */
      candidates?: BookSlug[];
      chapter?: number;
      verse?: number;
      verseEnd?: number;
    };

/** minúsculas, sin acentos ni puntos, espacios simples */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Abreviaturas por nombre base (sin número). Las de una sola letra solo
// valen con número delante ("1 s", "2 r", "1 p").
const ALIASES: Record<string, string[]> = {
  genesis: ["gn", "gen", "ge"],
  exodo: ["ex", "exo", "exod"],
  levitico: ["lv", "lev"],
  numeros: ["nm", "num", "nu"],
  deuteronomio: ["dt", "deut", "deu"],
  josue: ["jos", "josu"],
  jueces: ["jue", "jc", "juec"],
  rut: ["rt", "ru"],
  samuel: ["s", "sm", "sam"],
  reyes: ["r", "re", "rey", "rs"],
  cronicas: ["cr", "cro", "cron"],
  esdras: ["esd", "esdr"],
  nehemias: ["neh", "ne"],
  ester: ["est"],
  job: ["jb"],
  salmos: ["sal", "sl", "slm", "sa", "salmo", "ps"],
  proverbios: ["pr", "pro", "prov", "prv"],
  eclesiastes: ["ec", "ecl", "ecles", "qo"],
  cantares: ["cnt", "cant", "ct", "cantar", "cantardeloscantares", "cantardecantares", "cantico", "canticos"],
  isaias: ["is", "isa"],
  jeremias: ["jr", "jer", "jere"],
  lamentaciones: ["lm", "lam"],
  ezequiel: ["ez", "eze", "ezeq"],
  daniel: ["dn", "dan", "da"],
  oseas: ["os", "ose"],
  joel: ["jl", "joe"],
  amos: ["am"],
  abdias: ["abd", "ab", "obadias", "obd"],
  jonas: ["jon", "jns"],
  miqueas: ["mi", "miq"],
  nahum: ["nah", "na"],
  habacuc: ["hab", "ha"],
  sofonias: ["sof", "so"],
  hageo: ["hag", "ag", "ageo"],
  zacarias: ["zac", "za"],
  malaquias: ["mal", "ml"],
  mateo: ["mt", "mat"],
  marcos: ["mc", "mr", "mar", "marc"],
  lucas: ["lc", "lu", "luc"],
  juan: ["jn"],
  hechos: ["hch", "hech", "hc"],
  romanos: ["ro", "rom", "rm"],
  corintios: ["co", "cor"],
  galatas: ["ga", "gal", "gl"],
  efesios: ["ef", "efe"],
  filipenses: ["fil", "flp", "fp", "filip"],
  colosenses: ["col", "cl"],
  tesalonicenses: ["ts", "tes", "tesa"],
  timoteo: ["ti", "tim", "tm"],
  tito: ["tit", "tt"],
  filemon: ["flm", "filem", "fm"],
  hebreos: ["heb", "hb"],
  santiago: ["stg", "sant", "st", "sgo"],
  pedro: ["p", "pe", "ped", "pd"],
  judas: ["jud", "jds"],
  apocalipsis: ["ap", "apoc", "apo"],
};

interface BookEntry {
  slug: BookSlug;
  num: number | null; // 1, 2, 3 o null
  base: string; // "corintios", "juan", "cantares"
  keys: string[]; // nombre base y abreviaturas, sin espacios
}

const ENTRIES: BookEntry[] = BOOKS.map((b) => {
  const match = b.slug.match(/^(\d)-(.+)$/);
  const num = match ? Number(match[1]) : null;
  const base = match ? match[2] : b.slug;
  // El nombre visible también cuenta ("Obadías" → "obadias")
  const visible = normalize(b.name).replace(/^\d\s*/, "").replace(/\s/g, "");
  const keys = [...new Set([base, visible, ...(ALIASES[base] ?? [])])];
  return { slug: b.slug, num, base, keys };
});

// Número delante del libro: "1", "1ra", "primera de", "I", "II"…
const NUMBER_PREFIX =
  /^(?:(1|2|3)\s*(?:ra|a|era|ro|o|da|do|er)?|(i{1,3})\s|(primera|primer|primero|segunda|segundo|tercera|tercer|tercero))\s*(?:de\s+)?/;
const ORDINALS: Record<string, number> = {
  primera: 1, primer: 1, primero: 1,
  segunda: 2, segundo: 2,
  tercera: 3, tercer: 3, tercero: 3,
};

// Resto: libro + capítulo + versículo(s). Acepta ":", "." o "," entre
// capítulo y versículo, y "-", "–" o "—" en los rangos.
const REST = /^([a-zñ ]+?)\s*(\d+)?(?:\s*[:,]\s*|\s+)?(\d+)?(?:\s*[-–—]\s*(\d+))?\s*$/;

function findBooks(num: number | null, token: string): { exact: BookEntry[]; prefix: BookEntry[] } {
  const pool = ENTRIES.filter((e) => e.num === num);
  const usable = (key: string) => key.length > 1 || num !== null;
  const exact = pool.filter((e) => e.keys.some((k) => usable(k) && k === token));
  const prefix =
    token.length >= 2 ? pool.filter((e) => e.keys.some((k) => k.length >= token.length && k.startsWith(token))) : [];
  return { exact, prefix };
}

function bookLabel(slug: BookSlug) {
  return BOOKS.find((b) => b.slug === slug)!.name;
}

export function formatRef(ref: BibleRef): string {
  const name = bookLabel(ref.book);
  if (!ref.verse) return `${name} ${ref.chapter}`;
  const range = ref.verseEnd && ref.verseEnd !== ref.verse ? `-${ref.verseEnd}` : "";
  return `${name} ${ref.chapter}:${ref.verse}${range}`;
}

export function refHref(ref: BibleRef): string {
  return chapterHref(ref.book, ref.chapter) + (ref.verse ? `#v${ref.verse}` : "");
}

/** Arma la referencia validando capítulos (y libros de un solo capítulo). */
export function buildRef(
  book: BookSlug,
  first?: number,
  second?: number,
  third?: number
): ParseResult {
  const info = BOOKS.find((b) => b.slug === book)!;
  let chapter = first ?? 1;
  let verse = second;
  let verseEnd = third;

  // "Judas 3" o "Filemón 4-6": en libros de un capítulo, el número es el versículo
  if (info.chapters === 1 && first !== undefined && second === undefined && first > 1) {
    chapter = 1;
    verse = first;
    verseEnd = third;
  }

  if (chapter < 1 || chapter > info.chapters) {
    return {
      ok: false,
      reason: "chapter-out-of-range",
      message: `${info.name} tiene ${info.chapters} ${info.chapters === 1 ? "capítulo" : "capítulos"}.`,
    };
  }
  if (verse !== undefined && verse < 1) {
    return { ok: false, reason: "invalid", message: "El versículo debe ser 1 o mayor." };
  }
  if (verse !== undefined && verseEnd !== undefined && verseEnd < verse) verseEnd = undefined;

  const ref: BibleRef = { book, chapter, ...(verse ? { verse } : {}), ...(verseEnd ? { verseEnd } : {}) };
  return { ok: true, ref, label: formatRef(ref), href: refHref(ref) };
}

export function parseReference(input: string): ParseResult {
  let text = normalize(input);
  if (!text) return { ok: false, reason: "empty", message: "Escribe una cita, por ejemplo Juan 3:16." };

  // Número del libro (1, 2, 3)
  let num: number | null = null;
  const prefix = text.match(NUMBER_PREFIX);
  if (prefix && /[a-z]/.test(text.slice(prefix[0].length, prefix[0].length + 1))) {
    num = prefix[1] ? Number(prefix[1]) : prefix[2] ? prefix[2].length : ORDINALS[prefix[3]];
    text = text.slice(prefix[0].length);
  }

  // "juan3:16" → "juan 3:16"
  text = text.replace(/([a-z])(\d)/g, "$1 $2");
  const m = text.match(REST);
  if (!m) return { ok: false, reason: "invalid", message: "No entendí la cita. Prueba con «Juan 3:16»." };

  const token = m[1].replace(/\s/g, "");
  const nums = [m[2], m[3], m[4]].map((n) => (n ? Number(n) : undefined));

  let { exact, prefix: byPrefix } = findBooks(num, token);
  let matches = exact.length ? exact : byPrefix;

  // "corintios 13" sin número: ¿1 o 2 Corintios?
  if (!matches.length && num === null) {
    const numbered = ENTRIES.filter((e) => e.num !== null);
    exact = numbered.filter((e) => e.keys.some((k) => k.length > 1 && k === token));
    byPrefix = token.length >= 3 ? numbered.filter((e) => e.keys.some((k) => k.startsWith(token))) : [];
    const candidates = exact.length ? exact : byPrefix;
    if (candidates.length) {
      return {
        ok: false,
        reason: "ambiguous",
        message: "¿Cuál de estos libros?",
        candidates: candidates.map((c) => c.slug),
        chapter: nums[0],
        verse: nums[1],
        verseEnd: nums[2],
      };
    }
  }

  if (!matches.length) {
    return {
      ok: false,
      reason: "unknown-book",
      message: `No encontramos un libro llamado «${m[1].trim()}».`,
    };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      reason: "ambiguous",
      message: "¿Cuál de estos libros?",
      candidates: matches.map((c) => c.slug),
      chapter: nums[0],
      verse: nums[1],
      verseEnd: nums[2],
    };
  }

  matches = matches.slice(0, 1);
  return buildRef(matches[0].slug, nums[0], nums[1], nums[2]);
}

/**
 * Libros cuyo nombre empieza con lo escrito, para sugerir mientras se teclea
 * el libro. Si ya se escribió un capítulo ("juan 3"), no sugiere nada.
 */
export function suggestBooks(input: string, limit = 6): BookSlug[] {
  const text = normalize(input);
  if (!text || /[a-z]\s*\d/.test(text)) return [];
  const compact = text.replace(/\s/g, "");
  return BOOKS.filter((b) => {
    const name = normalize(b.name).replace(/\s/g, ""); // "1corintios"
    const withoutNumber = name.replace(/^\d/, ""); // "corintios"
    return name.startsWith(compact) || (compact.length >= 2 && withoutNumber.startsWith(compact));
  })
    .slice(0, limit)
    .map((b) => b.slug);
}
