import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserTimeZone, getUserToday } from "@/lib/timezone";
import { getPrayers } from "@/lib/supabase/prayer-actions";
import { PrayerList } from "@/components/prayer/PrayerList";

export const metadata: Metadata = { title: "Oración" };

export default async function OracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/oracion");

  const [prayers, timeZone, today] = await Promise.all([getPrayers(), getUserTimeZone(), getUserToday()]);

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Lista de oración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anota tus peticiones y recuerda cómo Dios las ha respondido. Solo tú puedes verlas.
        </p>
      </div>

      <PrayerList prayers={prayers} timeZone={timeZone} today={today} />
    </div>
  );
}
