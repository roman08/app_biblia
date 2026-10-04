// Genera el plan "Biblia en un año" con las lecturas repartidas de forma pareja.
//
//   npx tsx scripts/generate-balanced-plan.ts            # solo simula y valida
//   npx tsx scripts/generate-balanced-plan.ts --write    # escribe en Supabase
//
// Reemplaza al reparto de scripts/generate-plan.ts, que redondeaba hacia arriba
// los capítulos por día de cada sección: unas secciones terminaban meses antes
// y quedaban días con 5 lecturas y días con 1.
//
// Cómo reparte: 4 secciones (historia del AT, poéticos y profetas, NT y
// Salmos dos veces) suman 1339 lecturas → 3 o 4 por día. Cada día se reparten
// sus lecturas entre las secciones más atrasadas respecto a su ritmo ideal, así
// todas avanzan parejo y terminan el día 365.
//
// No toca planes existentes: crea (o actualiza) el plan con slug PLAN_SLUG y se
// niega a sobrescribirlo si algún usuario ya lo empezó.

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { BOOKS } from "@/lib/bible-api";
import { BOOK_CATEGORY } from "@/lib/book-categories";

const TOTAL_DAYS = 365;
const PLAN_SLUG = "biblia-en-un-ano";
const PLAN = {
  name: "Biblia en un año",
  slug: PLAN_SLUG,
  description:
    "Lee toda la Biblia en 365 días con 3 o 4 lecturas diarias repartidas de forma pareja: historia del Antiguo Testamento, poéticos y profetas, Nuevo Testamento y Salmos (dos veces al año).",
  total_days: TOTAL_DAYS,
};

interface Passage {
  book: string;
  chapter: number;
}

function chaptersOf(filter: (slug: string) => boolean): Passage[] {
  return BOOKS.filter((b) => filter(b.slug)).flatMap((b) =>
    Array.from({ length: b.chapters }, (_, i) => ({ book: b.slug, chapter: i + 1 }))
  );
}

// Secciones en el orden en que aparecen cada día
const TRACKS: Array<{ name: string; passages: Passage[] }> = [
  {
    name: "AT historia",
    passages: chaptersOf((s) => ["Pentateuco", "Históricos"].includes(BOOK_CATEGORY[s as keyof typeof BOOK_CATEGORY])),
  },
  {
    name: "AT poéticos y profetas",
    passages: chaptersOf(
      (s) =>
        s !== "salmos" &&
        ["Poéticos", "Profetas mayores", "Profetas menores"].includes(BOOK_CATEGORY[s as keyof typeof BOOK_CATEGORY])
    ),
  },
  {
    name: "Nuevo Testamento",
    passages: chaptersOf((s) => BOOKS.find((b) => b.slug === s)?.testament === "NT"),
  },
  {
    name: "Salmos ×2",
    passages: [...chaptersOf((s) => s === "salmos"), ...chaptersOf((s) => s === "salmos")],
  },
];

function buildDays(): Passage[][] {
  const total = TRACKS.reduce((n, t) => n + t.passages.length, 0);
  const done = TRACKS.map(() => 0);
  const days: Passage[][] = [];

  for (let day = 1; day <= TOTAL_DAYS; day++) {
    // Lecturas de hoy: reparto entero del total (3 o 4)
    const slots = Math.floor((day * total) / TOTAL_DAYS) - Math.floor(((day - 1) * total) / TOTAL_DAYS);
    const picked = TRACKS.map(() => 0);

    for (let s = 0; s < slots; s++) {
      // La sección más atrasada respecto a su ritmo ideal al final de hoy
      let best = -1;
      let bestDeficit = -Infinity;
      TRACKS.forEach((t, i) => {
        if (done[i] + picked[i] >= t.passages.length) return;
        const expected = (day * t.passages.length) / TOTAL_DAYS;
        const deficit = expected - (done[i] + picked[i]);
        if (deficit > bestDeficit + 1e-9) {
          best = i;
          bestDeficit = deficit;
        }
      });
      if (best === -1) throw new Error(`día ${day}: no quedan lecturas`);
      picked[best]++;
    }

    const passages: Passage[] = [];
    TRACKS.forEach((t, i) => {
      passages.push(...t.passages.slice(done[i], done[i] + picked[i]));
      done[i] += picked[i];
    });
    days.push(passages);
  }

  TRACKS.forEach((t, i) => {
    if (done[i] !== t.passages.length)
      throw new Error(`${t.name}: ${done[i]} de ${t.passages.length} lecturas asignadas`);
  });
  return days;
}

function report(days: Passage[][]) {
  console.log("Secciones:");
  TRACKS.forEach((t) => console.log(`  ${t.name.padEnd(24)} ${t.passages.length} lecturas`));

  const perDay = new Map<number, number>();
  for (const d of days) perDay.set(d.length, (perDay.get(d.length) ?? 0) + 1);
  console.log(
    "\nLecturas por día:",
    [...perDay.entries()].sort((a, b) => a[0] - b[0]).map(([n, c]) => `${n} lecturas: ${c} días`).join(" · ")
  );

  // Día en que termina cada sección (todas deben terminar el día 365)
  TRACKS.forEach((t) => {
    const last = t.passages[t.passages.length - 1];
    const lastDay = days.findIndex((d) => d.some((p) => p === last)) + 1;
    console.log(`  ${t.name.padEnd(24)} termina el día ${lastDay}`);
  });

  for (const n of [1, 2, 100, 228, 300, 365]) {
    const d = days[n - 1];
    const label = d.map((p) => `${BOOKS.find((b) => b.slug === p.book)?.name} ${p.chapter}`).join(", ");
    console.log(`  Día ${String(n).padStart(3)}: ${label}`);
  }
}

async function main() {
  const days = buildDays();
  report(days);

  if (!process.argv.includes("--write")) {
    console.log("\n(Simulación: no se escribió nada. Usa --write para guardar en Supabase.)");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, key);

  // No sobrescribir un plan que alguien ya empezó: su progreso son números de día
  const { data: existing } = await supabase.from("reading_plans").select("id").eq("slug", PLAN_SLUG).maybeSingle();
  if (existing) {
    const { count } = await supabase
      .from("user_plans")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", existing.id);
    if (count && count > 0) {
      throw new Error(`El plan ${PLAN_SLUG} ya tiene ${count} usuario(s); no se sobrescribe.`);
    }
  }

  const { data: plan, error } = await supabase
    .from("reading_plans")
    .upsert(PLAN, { onConflict: "slug" })
    .select()
    .single();
  if (error || !plan) throw new Error(`Error creando el plan: ${error?.message}`);

  await supabase.from("plan_days").delete().eq("plan_id", plan.id);

  const rows = days.map((passages, i) => ({ plan_id: plan.id, day_number: i + 1, passages }));
  for (let i = 0; i < rows.length; i += 100) {
    const { error: e } = await supabase.from("plan_days").insert(rows.slice(i, i + 100));
    if (e) throw new Error(`Error en el lote ${i / 100 + 1}: ${e.message}`);
  }
  console.log(`\n✓ Plan "${PLAN.name}" guardado (${rows.length} días, id ${plan.id})`);
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
