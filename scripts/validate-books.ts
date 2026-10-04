// Valida los datos bíblicos de la app y los planes de lectura.
//
//   npx tsx scripts/validate-books.ts
//
// 1. BOOKS (lib/bible-api.ts) contra una tabla canónica independiente
//    (66 libros del canon protestante: orden, testamento y capítulos).
// 2. BOOKS contra Midvash GET /v1/books (segunda fuente).
// 3. BOOK_CATEGORY (lib/book-categories.ts): cada género en su testamento.
// 4. Cada lectura de cada día de cada plan en Supabase: libro válido,
//    capítulo dentro de rango, etiqueta correcta y cobertura de la Biblia.
//
// Termina con código 1 si encuentra cualquier error.

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { BOOKS } from "@/lib/bible-api";
import { BOOK_CATEGORY, CATEGORY_TESTAMENT, getBookTag } from "@/lib/book-categories";

let errors = 0;
const fail = (msg: string) => {
  errors++;
  console.log(`  ✗ ${msg}`);
};
const ok = (msg: string) => console.log(`  ✓ ${msg}`);

// ─── 1. Tabla canónica independiente ────────────────────────────────────
// [nombre en inglés, testamento, capítulos] en el orden del canon protestante
const CANON: Array<[string, "OT" | "NT", number]> = [
  ["Genesis", "OT", 50], ["Exodus", "OT", 40], ["Leviticus", "OT", 27],
  ["Numbers", "OT", 36], ["Deuteronomy", "OT", 34], ["Joshua", "OT", 24],
  ["Judges", "OT", 21], ["Ruth", "OT", 4], ["1 Samuel", "OT", 31],
  ["2 Samuel", "OT", 24], ["1 Kings", "OT", 22], ["2 Kings", "OT", 25],
  ["1 Chronicles", "OT", 29], ["2 Chronicles", "OT", 36], ["Ezra", "OT", 10],
  ["Nehemiah", "OT", 13], ["Esther", "OT", 10], ["Job", "OT", 42],
  ["Psalms", "OT", 150], ["Proverbs", "OT", 31], ["Ecclesiastes", "OT", 12],
  ["Song of Songs", "OT", 8], ["Isaiah", "OT", 66], ["Jeremiah", "OT", 52],
  ["Lamentations", "OT", 5], ["Ezekiel", "OT", 48], ["Daniel", "OT", 12],
  ["Hosea", "OT", 14], ["Joel", "OT", 3], ["Amos", "OT", 9],
  ["Obadiah", "OT", 1], ["Jonah", "OT", 4], ["Micah", "OT", 7],
  ["Nahum", "OT", 3], ["Habakkuk", "OT", 3], ["Zephaniah", "OT", 3],
  ["Haggai", "OT", 2], ["Zechariah", "OT", 14], ["Malachi", "OT", 4],
  ["Matthew", "NT", 28], ["Mark", "NT", 16], ["Luke", "NT", 24],
  ["John", "NT", 21], ["Acts", "NT", 28], ["Romans", "NT", 16],
  ["1 Corinthians", "NT", 16], ["2 Corinthians", "NT", 13], ["Galatians", "NT", 6],
  ["Ephesians", "NT", 6], ["Philippians", "NT", 4], ["Colossians", "NT", 4],
  ["1 Thessalonians", "NT", 5], ["2 Thessalonians", "NT", 3], ["1 Timothy", "NT", 6],
  ["2 Timothy", "NT", 4], ["Titus", "NT", 3], ["Philemon", "NT", 1],
  ["Hebrews", "NT", 13], ["James", "NT", 5], ["1 Peter", "NT", 5],
  ["2 Peter", "NT", 3], ["1 John", "NT", 5], ["2 John", "NT", 1],
  ["3 John", "NT", 1], ["Jude", "NT", 1], ["Revelation", "NT", 22],
];

function validateCanon() {
  console.log("\n1. BOOKS contra la tabla canónica");
  if (BOOKS.length !== 66) fail(`BOOKS tiene ${BOOKS.length} libros (deben ser 66)`);
  BOOKS.forEach((b, i) => {
    const [en, testament, chapters] = CANON[i] ?? [];
    if (b.testament !== testament)
      fail(`${b.name} (#${i + 1}, ${en}): testamento ${b.testament}, debe ser ${testament}`);
    if (b.chapters !== chapters)
      fail(`${b.name} (#${i + 1}, ${en}): ${b.chapters} capítulos, deben ser ${chapters}`);
  });
  const ot = BOOKS.filter((b) => b.testament === "OT");
  const nt = BOOKS.filter((b) => b.testament === "NT");
  const sum = (bs: readonly { chapters: number }[]) => bs.reduce((n, b) => n + b.chapters, 0);
  if (ot.length !== 39 || sum(ot) !== 929) fail(`AT: ${ot.length} libros / ${sum(ot)} caps (39 / 929)`);
  if (nt.length !== 27 || sum(nt) !== 260) fail(`NT: ${nt.length} libros / ${sum(nt)} caps (27 / 260)`);
  if (!errors) ok("66 libros: orden, testamento y capítulos correctos (AT 39/929, NT 27/260)");
}

// ─── 2. Midvash ─────────────────────────────────────────────────────────
async function validateMidvash() {
  console.log("\n2. BOOKS contra Midvash /v1/books");
  const before = errors;
  const res = await fetch("https://api.midvash.com/v1/books");
  const json = (await res.json()) as {
    data: Array<{ id: number; slug: { es: string }; chapters: number; testament: string; name: { es: string } }>;
  };
  const remote = [...json.data].sort((a, b) => a.id - b.id);
  BOOKS.forEach((b, i) => {
    const r = remote[i];
    if (!r) return fail(`${b.name}: no existe en Midvash`);
    const t = r.testament === "old" ? "OT" : r.testament === "new" ? "NT" : r.testament;
    if (r.slug.es !== b.slug) fail(`#${i + 1}: slug ${b.slug} ≠ Midvash ${r.slug.es}`);
    if (t !== b.testament) fail(`${b.name}: testamento ${b.testament} ≠ Midvash ${t}`);
    if (r.chapters !== b.chapters) fail(`${b.name}: ${b.chapters} caps ≠ Midvash ${r.chapters}`);
  });
  if (errors === before) ok("coinciden slug, testamento y capítulos de los 66 libros");
}

// ─── 3. Géneros ─────────────────────────────────────────────────────────
function validateCategories() {
  console.log("\n3. Géneros (lib/book-categories.ts)");
  const before = errors;
  for (const b of BOOKS) {
    const cat = BOOK_CATEGORY[b.slug];
    if (!cat) fail(`${b.name}: sin género`);
    else if (CATEGORY_TESTAMENT[cat] !== b.testament)
      fail(`${b.name}: género "${cat}" es del ${CATEGORY_TESTAMENT[cat]}, pero el libro es del ${b.testament}`);
    const tag = getBookTag(b.slug);
    if (tag?.testament !== b.testament) fail(`${b.name}: etiqueta con testamento ${tag?.testament}`);
  }
  if (errors === before) ok("los 66 libros tienen género del testamento correcto");
}

// ─── 4. Planes en Supabase ──────────────────────────────────────────────
interface Passage { book: string; chapter: number }

async function validatePlans() {
  console.log("\n4. Planes de lectura en Supabase");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fail("faltan NEXT_PUBLIC_SUPABASE_URL / ANON_KEY en .env.local");
  const supabase = createClient(url, key);

  const { data: plans, error } = await supabase.from("reading_plans").select("*").order("created_at");
  if (error || !plans) return fail(`no se pudieron leer los planes: ${error?.message}`);

  for (const plan of plans) {
    console.log(`\n  ▸ ${plan.name} (${plan.slug}) · total_days=${plan.total_days}`);
    const before = errors;

    // Traer todos los días (paginando por si hay más de 1000)
    const days: Array<{ day_number: number; passages: Passage[] }> = [];
    for (let from = 0; ; from += 1000) {
      const { data, error: e } = await supabase
        .from("plan_days")
        .select("day_number, passages")
        .eq("plan_id", plan.id)
        .order("day_number")
        .range(from, from + 999);
      if (e) return fail(`error leyendo días: ${e.message}`);
      days.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }

    // Días: cantidad y numeración continua
    if (days.length !== plan.total_days)
      fail(`tiene ${days.length} días, pero total_days=${plan.total_days}`);
    const numbers = days.map((d) => d.day_number);
    const missingDays = Array.from({ length: plan.total_days }, (_, i) => i + 1).filter((n) => !numbers.includes(n));
    if (missingDays.length) fail(`faltan los días: ${missingDays.slice(0, 20).join(", ")}${missingDays.length > 20 ? "…" : ""}`);
    const emptyDays = days.filter((d) => !d.passages?.length).map((d) => d.day_number);
    if (emptyDays.length) fail(`${emptyDays.length} días sin lecturas: ${emptyDays.slice(0, 15).join(", ")}…`);

    // Lecturas
    const count = new Map<string, number>();
    let passages = 0;
    const perDay = new Map<number, number>();
    for (const day of days) {
      perDay.set(day.passages.length, (perDay.get(day.passages.length) ?? 0) + 1);
      day.passages.forEach((p) => {
        passages++;
        const book = BOOKS.find((b) => b.slug === p.book);
        if (!book) return fail(`día ${day.day_number}: libro desconocido "${p.book}"`);
        if (!Number.isInteger(p.chapter) || p.chapter < 1 || p.chapter > book.chapters)
          return fail(`día ${day.day_number}: ${book.name} ${p.chapter} no existe (tiene ${book.chapters})`);
        const tag = getBookTag(p.book);
        if (tag?.testament !== book.testament)
          fail(`día ${day.day_number}: ${book.name} etiquetado ${tag?.testament}`);
        const k = `${p.book} ${p.chapter}`;
        count.set(k, (count.get(k) ?? 0) + 1);
      });
    }

    // Cobertura de la Biblia
    const missing: string[] = [];
    const repeated: string[] = [];
    for (const b of BOOKS) {
      for (let c = 1; c <= b.chapters; c++) {
        const n = count.get(`${b.slug} ${c}`) ?? 0;
        if (n === 0) missing.push(`${b.name} ${c}`);
        else if (n > 1 && b.slug !== "salmos") repeated.push(`${b.name} ${c} (×${n})`);
      }
    }

    const dist = [...perDay.entries()].sort((a, b) => a[0] - b[0]).map(([n, d]) => `${n} lecturas: ${d} días`).join(" · ");
    console.log(`    ${days.length} días · ${passages} lecturas · ${dist}`);
    if (errors === before) ok("todos los libros y capítulos existen y cada etiqueta coincide con el testamento del libro");
    console.log(
      missing.length
        ? `    ⚠ no cubre ${missing.length} capítulos: ${missing.slice(0, 12).join(", ")}${missing.length > 12 ? "…" : ""}`
        : "    ✓ cubre los 1189 capítulos de la Biblia"
    );
    if (repeated.length)
      console.log(`    ⚠ ${repeated.length} capítulos repetidos (sin contar Salmos): ${repeated.slice(0, 8).join(", ")}${repeated.length > 8 ? "…" : ""}`);
  }
}

(async () => {
  validateCanon();
  await validateMidvash();
  validateCategories();
  await validatePlans();
  console.log(errors ? `\n✗ ${errors} errores` : "\n✓ Validación completa sin errores");
  process.exit(errors ? 1 : 0);
})();
