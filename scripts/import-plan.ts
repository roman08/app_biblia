import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Faltan variables de entorno");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BOOK_MAP: Record<string, string> = {
  genesis: "genesis", exodus: "exodo", leviticus: "levitico",
  numbers: "numeros", deuteronomy: "deuteronomio", joshua: "josue",
  judges: "jueces", ruth: "rut", "1 samuel": "1-samuel",
  "2 samuel": "2-samuel", "1 kings": "1-reyes", "2 kings": "2-reyes",
  "1 chronicles": "1-cronicas", "2 chronicles": "2-cronicas",
  ezra: "esdras", nehemiah: "nehemias", esther: "ester", job: "job",
  psalms: "salmos", psalm: "salmos", proverbs: "proverbios",
  ecclesiastes: "eclesiastes", "song of solomon": "cantares",
  "song of songs": "cantares", isaiah: "isaias", jeremiah: "jeremias",
  lamentations: "lamentaciones", ezekiel: "ezequiel", daniel: "daniel",
  hosea: "oseas", joel: "joel", amos: "amos", obadiah: "abdias",
  jonah: "jonas", micah: "miqueas", nahum: "nahum", habakkuk: "habacuc",
  zephaniah: "sofonias", haggai: "hageo", zechariah: "zacarias",
  malachi: "malaquias", matthew: "mateo", mark: "marcos", luke: "lucas",
  john: "juan", acts: "hechos", romans: "romanos",
  "1 corinthians": "1-corintios", "2 corinthians": "2-corintios",
  galatians: "galatas", ephesians: "efesios", philippians: "filipenses",
  colossians: "colosenses", "1 thessalonians": "1-tesalonicenses",
  "2 thessalonians": "2-tesalonicenses", "1 timothy": "1-timoteo",
  "2 timothy": "2-timoteo", titus: "tito", philemon: "filemon",
  hebrews: "hebreos", james: "santiago", "1 peter": "1-pedro",
  "2 peter": "2-pedro", "1 john": "1-juan", "2 john": "2-juan",
  "3 john": "3-juan", jude: "judas", revelation: "apocalipsis",
};

function normalizeBook(name: string): string {
  const key = name.toLowerCase().trim();
  return BOOK_MAP[key] ?? key.replace(/\s+/g, "-");
}

interface Passage {
  book: string;
  chapter: number;
}

async function importPlan() {
  console.log("📖 Leyendo JSON...");
  const filePath = join(process.cwd(), "scripts", "mcheyne.json");
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  console.log("   Título:", data.title);
  console.log("   Autor:", data.author);
  console.log("   Tracks disponibles:", data.readingTracks.map((t: any) => t.name));

  // Usar el primer track (Family), o cambiar a "Secret" si prefieres
  const track = data.readingTracks.find((t: any) => t.name === "Family") 
    ?? data.readingTracks[0];
  
  console.log(`   Usando track: ${track.name}`);
  
  const readingDays = track.readingDays;
  console.log(`   Días: ${readingDays.length}`);

  // Ver muestra del primer día
  console.log("   Muestra día 1:", JSON.stringify(readingDays[0], null, 2).slice(0, 400));

  console.log("\n📚 Creando plan en Supabase...");
  const { data: plan, error: planError } = await supabase
    .from("reading_plans")
    .upsert(
      {
        name: "M'Cheyne (Un Año)",
        slug: "mcheyne",
        description:
          "Plan clásico de Robert Murray M'Cheyne (1842). 4 lecturas diarias: 2 del Antiguo Testamento, 1 del Nuevo Testamento y 1 de Salmos o Evangelios.",
        total_days: readingDays.length,
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

  console.log("\n🧹 Borrando días previos...");
  await supabase.from("plan_days").delete().eq("plan_id", plan.id);

  console.log("\n📥 Procesando días...");
  
  const days: Array<{ plan_id: string; day_number: number; passages: Passage[] }> = [];

  for (const day of readingDays) {
    const passages: Passage[] = [];

    // Cada día tiene readingTimes, cada uno con passages
    for (const time of day.readingTimes ?? []) {
      for (const p of time.passages ?? []) {
        if (p.begin?.book && p.begin?.chapter) {
          passages.push({
            book: normalizeBook(p.begin.book),
            chapter: p.begin.chapter,
          });
        }
      }
    }

    if (passages.length > 0) {
      days.push({
        plan_id: plan.id,
        day_number: day.num,
        passages,
      });
    }
  }

  console.log(`   ${days.length} días válidos procesados`);

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

  console.log("\n🎉 Importación completa");
}

importPlan()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });