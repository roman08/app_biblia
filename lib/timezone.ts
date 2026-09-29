import { cookies } from "next/headers";
import {
  DEFAULT_TIMEZONE,
  TZ_COOKIE,
  isValidTimeZone,
  toLocalDateString,
} from "@/lib/dates";

/** Zona horaria del usuario, guardada por <TimezoneSync /> en una cookie. */
export async function getUserTimeZone(): Promise<string> {
  const tz = (await cookies()).get(TZ_COOKIE)?.value;
  return isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
}

/** "Hoy" (YYYY-MM-DD) en la zona horaria del usuario. */
export async function getUserToday(): Promise<string> {
  return toLocalDateString(await getUserTimeZone());
}
