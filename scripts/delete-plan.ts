// Borra un plan de lectura y sus días.
//
//   npx tsx scripts/delete-plan.ts <slug>           # solo muestra qué se borraría
//   npx tsx scripts/delete-plan.ts <slug> --write   # borra
//   npx tsx scripts/delete-plan.ts <slug> --move-to <otro-slug> --write
//
// Se niega a borrar si algún usuario tiene el plan empezado (user_plans).
// Con --move-to pasa a esos usuarios al otro plan (conservando su fecha de
// inicio), pero solo si ninguno tiene días completados: el progreso se guarda
// por número de día y en otro plan cada día tiene otras lecturas.

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

async function main() {
  const slug = process.argv[2];
  const write = process.argv.includes("--write");
  if (!slug || slug.startsWith("--")) throw new Error("Uso: npx tsx scripts/delete-plan.ts <slug> [--write]");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, key);

  // Panorama de todos los planes
  const { data: plans, error } = await supabase.from("reading_plans").select("id, slug, name");
  if (error) throw new Error(error.message);
  console.log("Planes:");
  for (const p of plans ?? []) {
    const { count: users } = await supabase
      .from("user_plans")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", p.id);
    const { count: days } = await supabase
      .from("plan_days")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", p.id);
    console.log(`  ${p.slug === slug ? "→" : " "} ${p.slug.padEnd(20)} ${p.name} · ${days} días · ${users} usuario(s)`);
  }

  const plan = plans?.find((p) => p.slug === slug);
  if (!plan) throw new Error(`No existe un plan con slug "${slug}"`);

  const moveToSlug = process.argv[process.argv.indexOf("--move-to") + 1];
  const moveTo = process.argv.includes("--move-to") ? plans?.find((p) => p.slug === moveToSlug) : undefined;
  if (process.argv.includes("--move-to") && !moveTo) throw new Error(`No existe el plan destino "${moveToSlug}"`);
  if (moveTo?.id === plan.id) throw new Error("El plan destino es el mismo que se borra");

  const { data: enrolled, error: enrolledError } = await supabase
    .from("user_plans")
    .select("id, user_id, completed_days")
    .eq("plan_id", plan.id);
  if (enrolledError) throw new Error(enrolledError.message);
  const users = enrolled ?? [];

  if (users.length > 0) {
    if (!moveTo) {
      throw new Error(
        `"${slug}" tiene ${users.length} usuario(s) con el plan empezado; no se borra. Usa --move-to <slug> para pasarlos a otro plan.`
      );
    }
    const withProgress = users.filter((u) => ((u.completed_days as number[] | null) ?? []).length > 0);
    if (withProgress.length > 0) {
      throw new Error(`${withProgress.length} usuario(s) ya completaron días; no se mueven para no perder su progreso.`);
    }
    // ¿Alguno ya tiene el plan destino? Entonces solo se borra su inscripción vieja
    const { data: already } = await supabase
      .from("user_plans")
      .select("user_id")
      .eq("plan_id", moveTo.id)
      .in("user_id", users.map((u) => u.user_id));
    const alreadySet = new Set((already ?? []).map((a) => a.user_id));
    console.log(
      `\n${users.length} usuario(s) sin días completados pasarán a "${moveTo.name}"` +
        (alreadySet.size ? ` (${alreadySet.size} ya lo tenían)` : "")
    );

    if (write) {
      for (const u of users) {
        const { error: e } = alreadySet.has(u.user_id)
          ? await supabase.from("user_plans").delete().eq("id", u.id)
          : await supabase.from("user_plans").update({ plan_id: moveTo.id }).eq("id", u.id);
        if (e) throw new Error(`Error moviendo usuario: ${e.message}`);
      }
      console.log("✓ Usuarios movidos");
    }
  }

  if (!write) {
    console.log(`\n(Simulación: se borraría "${plan.name}" y sus días. Usa --write para borrar.)`);
    return;
  }

  const { error: daysError } = await supabase.from("plan_days").delete().eq("plan_id", plan.id);
  if (daysError) throw new Error(`Error borrando días: ${daysError.message}`);
  const { error: planError } = await supabase.from("reading_plans").delete().eq("id", plan.id);
  if (planError) throw new Error(`Error borrando el plan: ${planError.message}`);
  console.log(`\n✓ Plan "${plan.name}" (${slug}) borrado con sus días.`);
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
