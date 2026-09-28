import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Faltan variables de entorno");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Capítulos por libro (AT1 - Pentateuco e históricos)
const OT1: Array<{ book: string; chapters: number }> = [
  { book: "genesis", chapters: 50 },
  { book: "exodo", chapters: 40 },
  { book: "levitico", chapters: 27 },
  { book: "numeros", chapters: 36 },
  { book: "deuteronomio", chapters: 34 },
  { book: "josue", chapters: 24 },
  { book: "jueces", chapters: 21 },
  { book: "rut", chapters: 4 },
  { book: "1-samuel", chapters: 31 },
  { book: "2-samuel", chapters: 24 },
  { book: "1-reyes", chapters: 22 },
  { book: "2-reyes", chapters: 25 },
  { book: "1-cronicas", chapters: 29 },
  { book: "2-cronicas", chapters: 36 },
  { book: "esdras", chapters: 10 },
  { book: "nehemias", chapters: 13 },
  { book: "ester", chapters: 10 },
];

// AT2 - Poéticos y profetas
const OT2: Array<{ book: string; chapters: number }> = [
  { book: "job", chapters: 42 },
  { book: "proverbios", chapters: 31 },
  { book: "eclesiastes", chapters: 12 },
  { book: "cantares", chapters: 8 },
  { book: "isaias", chapters: 66 },
  { book: "jeremias", chapters: 52 },
  { book: "lamentaciones", chapters: 5 },
  { book: "ezequiel", chapters: 48 },
  { book: "daniel", chapters: 12 },
  { book: "oseas", chapters: 14 },
  { book: "joel", chapters: 3 },
  { book: "amos", chapters: 9 },
  { book: "abdias", chapters: 1 },
  { book: "jonas", chapters: 4 },
  { book: "miqueas", chapters: 7 },
  { book: "nahum", chapters: 3 },
  { book: "habacuc", chapters: 3 },
  { book: "sofonias", chapters: 3 },
  { book: "hageo", chapters: 2 },
  { book: "zacarias", chapters: 14 },
  { book: "malaquias", chapters: 4 },
];

// NT
const NT: Array<{ book: string; chapters: number }> = [
  { book: "mateo", chapters: 28 },
  { book: "marcos", chapters: 16 },
  { book: "lucas", chapters: 24 },
  { book: "juan", chapters: 21 },
  { book: "hechos", chapters: 28 },
  { book: "romanos", chapters: 16 },
  { book: "1-corintios", chapters: 16 },
  { book: "2-corintios", chapters: 13 },
  { book: "galatas", chapters: 6 },
  { book: "efesios", chapters: 6 },
  { book: "filipenses", chapters: 4 },
  { book: "colosenses", chapters: 4 },
  { book: "1-tesalonicenses", chapters: 5 },
  { book: "2-tesalonicenses", chapters: 3 },
  { book: "1-timoteo", chapters: 6 },
  { book: "2-timoteo", chapters: 4 },
  { book: "tito", chapters: 3 },
  { book: "filemon", chapters: 1 },
  { book: "hebreos", chapters: 13 },
  { book: "santiago", chapters: 5 },
  { book: "1-pedro", chapters: 5 },
  { book: "2-pedro", chapters: 3 },
  { book: "1-juan", chapters: 5 },
  { book: "2-juan", chapters: 1 },
  { book: "3-juan", chapters: 1 },
  { book: "judas", chapters: 1 },
  { book: "apocalipsis", chapters: 22 },
];

// Salmos - 150 capítulos para leer 2x al año
const SALMOS = { book: "salmos", chapters: 150 };

interface Passage {
  book: string;
  chapter: number;
}

/**
 * Convierte una lista de {book, chapters} en un array plano de capítulos.
 */
function expandChapters(
  books: Array<{ book: string; chapters: number }>
): Passage[] {
  const result: Passage[] = [];
  for (const b of books) {
    for (let c = 1; c <= b.chapters; c++) {
      result.push({ book: b.book, chapter: c });
    }
  }
  return result;
}

async function generatePlan() {
  const totalDays = 365;

  // Expandir todos los capítulos
  const ot1Chapters = expandChapters(OT1);
  const ot2Chapters = expandChapters(OT2);
  const ntChapters = expandChapters(NT);
  const salmosChapters = expandChapters([SALMOS]);

  console.log("📊 Capítulos totales:");
  console.log("   AT1:", ot1Chapters.length);
  console.log("   AT2:", ot2Chapters.length);
  console.log("   NT:", ntChapters.length);
  console.log("   Salmos:", salmosChapters.length);

  // Calcular cuántos capítulos por día para cada track
  const ot1PerDay = Math.ceil(ot1Chapters.length / totalDays);
  const ot2PerDay = Math.ceil(ot2Chapters.length / totalDays);
  const ntPerDay = Math.ceil(ntChapters.length / totalDays);
  // Salmos: leer 2x al año → 300 capítulos / 365 días
  const salmosPerDay = Math.ceil((salmosChapters.length * 2) / totalDays);

  console.log(`\n📅 Distribución diaria:`);
  console.log(`   AT1: ${ot1PerDay} cap/día`);
  console.log(`   AT2: ${ot2PerDay} cap/día`);
  console.log(`   NT: ${ntPerDay} cap/día`);
  console.log(`   Salmos: ${salmosPerDay} cap/día`);

  console.log("\n📚 Creando plan en Supabase...");
  const { data: plan, error: planError } = await supabase
    .from("reading_plans")
    .upsert(
      {
        name: "Biblia en un Año (4 lecturas diarias)",
        slug: "un-ano-4-lecturas",
        description:
          "Lee toda la Biblia en 365 días con 4 lecturas diarias: Antiguo Testamento histórico, poéticos y profetas, Nuevo Testamento y Salmos. Inspirado en el plan clásico de M'Cheyne.",
        total_days: totalDays,
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (planError) {
    console.error("❌ Error creando plan:", planError);
    process.exit(1);
  }

  console.log(`   ✅ Plan creado: ${plan.id}`);

  // Limpiar días previos
  await supabase.from("plan_days").delete().eq("plan_id", plan.id);

  console.log("\n📥 Generando días...");
  const days: Array<{
    plan_id: string;
    day_number: number;
    passages: Passage[];
  }> = [];

  for (let day = 1; day <= totalDays; day++) {
    const passages: Passage[] = [];

    // AT1
    const ot1Start = (day - 1) * ot1PerDay;
    for (let i = 0; i < ot1PerDay; i++) {
      const idx = ot1Start + i;
      if (idx < ot1Chapters.length) passages.push(ot1Chapters[idx]);
    }

    // AT2
    const ot2Start = (day - 1) * ot2PerDay;
    for (let i = 0; i < ot2PerDay; i++) {
      const idx = ot2Start + i;
      if (idx < ot2Chapters.length) passages.push(ot2Chapters[idx]);
    }

    // NT
    const ntStart = (day - 1) * ntPerDay;
    for (let i = 0; i < ntPerDay; i++) {
      const idx = ntStart + i;
      if (idx < ntChapters.length) passages.push(ntChapters[idx]);
    }

    // Salmos (2x al año → usar módulo)
    for (let i = 0; i < salmosPerDay; i++) {
      const idx = ((day - 1) * salmosPerDay + i) % salmosChapters.length;
      passages.push(salmosChapters[idx]);
    }

    if (passages.length > 0) {
      days.push({
        plan_id: plan.id,
        day_number: day,
        passages,
      });
    }
  }

  console.log(`   ${days.length} días generados`);

  // Insertar en lotes de 100
  for (let i = 0; i < days.length; i += 100) {
    const batch = days.slice(i, i + 100);
    const { error } = await supabase.from("plan_days").insert(batch);
    if (error) {
      console.error(`❌ Error en lote ${i / 100 + 1}:`, error);
      process.exit(1);
    }
    console.log(`   ✅ Lote ${i / 100 + 1}: ${batch.length} días`);
  }

  console.log("\n🎉 Plan generado correctamente");
}

generatePlan()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });