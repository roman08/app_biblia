import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserToday } from "@/lib/timezone";
import { BOOKS } from "@/lib/bible-api";
import { getJournalEntry, getJournalMonth, type JournalPassage } from "@/lib/supabase/journal-actions";
import { getTodayReading } from "@/lib/supabase/plans-actions";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { JournalCalendar } from "@/components/journal/JournalCalendar";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Diario" };

// Pregunta guía: cambia cada día
const PROMPTS = [
  "¿Qué te habló Dios hoy?",
  "¿Qué versículo te llamó la atención y por qué?",
  "¿Qué aprendiste hoy sobre el carácter de Dios?",
  "¿Hay algo de la lectura que quieras poner en práctica?",
  "¿Por qué das gracias hoy?",
  "¿Qué promesa encontraste en la Palabra?",
  "¿Cómo puedes convertir lo que leíste en oración?",
];

const utc = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const longDate = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const longDateYear = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

interface PageProps {
  searchParams: Promise<{ fecha?: string; mes?: string; libro?: string; cap?: string }>;
}

export default async function DiarioPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/diario");

  const params = await searchParams;
  const today = await getUserToday();
  const selected =
    params.fecha && /^\d{4}-\d{2}-\d{2}$/.test(params.fecha) && params.fecha <= today ? params.fecha : today;
  const month = params.mes && /^\d{4}-\d{2}$/.test(params.mes) && params.mes <= today.slice(0, 7) ? params.mes : selected.slice(0, 7);
  const isToday = selected === today;

  const [entry, monthEntries, reading] = await Promise.all([
    getJournalEntry(selected),
    getJournalMonth(month),
    isToday ? getTodayReading() : Promise.resolve(null),
  ]);

  // Pasaje que viene del lector ("Escribir una reflexión" → ?libro=juan&cap=3)
  const passages: JournalPassage[] = [...(entry?.passages ?? [])];
  const fromReader = BOOKS.find((b) => b.slug === params.libro);
  const cap = Number(params.cap);
  if (fromReader && Number.isInteger(cap) && cap >= 1 && cap <= fromReader.chapters) {
    if (!passages.some((p) => p.book === fromReader.slug && p.chapter === cap)) {
      passages.push({ book: fromReader.slug, chapter: cap });
    }
  }

  const dayNumber = Math.floor(utc(selected).getTime() / 86_400_000);
  const dateLabel = isToday
    ? `Hoy, ${longDate.format(utc(selected))}`
    : selected.slice(0, 4) === today.slice(0, 4)
      ? longDate.format(utc(selected))
      : longDateYear.format(utc(selected));

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Diario</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lo que Dios te habla, día a día. Solo tú puedes verlo.
        </p>
      </div>

      <JournalEditor
        key={selected}
        date={selected}
        dateLabel={dateLabel}
        prompt={PROMPTS[dayNumber % PROMPTS.length]}
        initialContent={entry?.content ?? ""}
        initialPassages={passages}
        suggestedPassages={reading?.passages ?? []}
      />

      <Card>
        <CardContent className="p-4">
          <JournalCalendar month={month} selected={selected} today={today} entries={monthEntries} />
        </CardContent>
      </Card>
    </div>
  );
}
