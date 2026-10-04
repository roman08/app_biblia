// Lógica pura de los recordatorios: cuándo enviar y qué decir.
// Sin dependencias (ni Deno ni Supabase) para poder probarla con Node.

/** Fecha (YYYY-MM-DD) y hora (0–23) locales de `now` en la zona `timeZone`. */
export function localParts(now: Date, timeZone: string): { date: string; hour: number } {
  let tz = timeZone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    tz = "America/Mexico_City";
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) % 24 };
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export interface DueCheck {
  now: Date;
  timeZone: string;
  reminderHour: number;
  /** Último envío a esta suscripción (ISO) o null */
  lastNotifiedAt: string | null;
}

/**
 * ¿Toca enviar ahora? Es la hora elegida en la zona del usuario y aún no se le
 * envió nada hoy (en su fecha local). El cron corre cada hora en punto.
 */
export function isDue({ now, timeZone, reminderHour, lastNotifiedAt }: DueCheck): boolean {
  const local = localParts(now, timeZone);
  if (local.hour !== reminderHour) return false;
  if (!lastNotifiedAt) return true;
  return localParts(new Date(lastNotifiedAt), timeZone).date !== local.date;
}

/**
 * Racha actual sin contar hoy (el recordatorio solo se envía si hoy no ha
 * leído): días consecutivos con lectura que terminan ayer.
 */
export function streakUntilYesterday(readDates: Set<string>, today: string): number {
  let streak = 0;
  for (let d = addDays(today, -1); readDates.has(d); d = addDays(d, -1)) streak++;
  return streak;
}

// Nombres en español (mismos que BOOKS en lib/bible-api.ts)
export const BOOK_NAMES: Record<string, string> = {
  genesis: "Génesis", exodo: "Éxodo", levitico: "Levítico", numeros: "Números",
  deuteronomio: "Deuteronomio", josue: "Josué", jueces: "Jueces", rut: "Rut",
  "1-samuel": "1 Samuel", "2-samuel": "2 Samuel", "1-reyes": "1 Reyes", "2-reyes": "2 Reyes",
  "1-cronicas": "1 Crónicas", "2-cronicas": "2 Crónicas", esdras: "Esdras", nehemias: "Nehemías",
  ester: "Ester", job: "Job", salmos: "Salmos", proverbios: "Proverbios",
  eclesiastes: "Eclesiastés", cantares: "Cantares", isaias: "Isaías", jeremias: "Jeremías",
  lamentaciones: "Lamentaciones", ezequiel: "Ezequiel", daniel: "Daniel", oseas: "Oseas",
  joel: "Joel", amos: "Amós", abdias: "Obadías", jonas: "Jonás", miqueas: "Miqueas",
  nahum: "Nahúm", habacuc: "Habacuc", sofonias: "Sofonías", hageo: "Hageo",
  zacarias: "Zacarías", malaquias: "Malaquías", mateo: "Mateo", marcos: "Marcos",
  lucas: "Lucas", juan: "Juan", hechos: "Hechos", romanos: "Romanos",
  "1-corintios": "1 Corintios", "2-corintios": "2 Corintios", galatas: "Gálatas",
  efesios: "Efesios", filipenses: "Filipenses", colosenses: "Colosenses",
  "1-tesalonicenses": "1 Tesalonicenses", "2-tesalonicenses": "2 Tesalonicenses",
  "1-timoteo": "1 Timoteo", "2-timoteo": "2 Timoteo", tito: "Tito", filemon: "Filemón",
  hebreos: "Hebreos", santiago: "Santiago", "1-pedro": "1 Pedro", "2-pedro": "2 Pedro",
  "1-juan": "1 Juan", "2-juan": "2 Juan", "3-juan": "3 Juan", judas: "Judas",
  apocalipsis: "Apocalipsis",
};

export interface Passage {
  book: string;
  chapter: number;
}

/** "Génesis 23–24, Job 12 y Salmos 12" (capítulos seguidos del mismo libro se unen) */
export function formatPassages(passages: Passage[]): string {
  const groups: { book: string; from: number; to: number }[] = [];
  for (const p of passages) {
    const last = groups[groups.length - 1];
    if (last && last.book === p.book && p.chapter === last.to + 1) last.to = p.chapter;
    else groups.push({ book: p.book, from: p.chapter, to: p.chapter });
  }
  const labels = groups.map(
    (g) => `${BOOK_NAMES[g.book] ?? g.book} ${g.from === g.to ? g.from : `${g.from}–${g.to}`}`
  );
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
}

export interface MessageInput {
  streak: number;
  plan?: { slug: string; name: string; day: number; passages: Passage[] } | null;
}

export interface ReminderMessage {
  title: string;
  body: string;
  url: string;
  tag: string;
}

/** Texto del recordatorio según el plan activo y la racha. */
export function buildMessage({ streak, plan }: MessageInput): ReminderMessage {
  const title =
    streak >= 2 ? `🔥 No pierdas tu racha de ${streak} días` : "📖 Es hora de leer";

  if (plan && plan.passages.length > 0) {
    return {
      title,
      body: `Día ${plan.day} de tu plan: ${formatPassages(plan.passages)}`,
      url: `/plan/${plan.slug}`,
      tag: "daily-reminder",
    };
  }

  return {
    title,
    body:
      streak >= 2
        ? "Un capítulo hoy mantiene tu racha."
        : "Dedica unos minutos a la Palabra hoy.",
    url: "/",
    tag: "daily-reminder",
  };
}
