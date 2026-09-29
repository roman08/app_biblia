"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TZ_COOKIE } from "@/lib/dates";

// Guarda la zona horaria del navegador en una cookie para que el servidor
// calcule "hoy" (racha, versículo del día) en la hora local del usuario.
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;

    const current = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${TZ_COOKIE}=`))
      ?.split("=")[1];

    if (current && decodeURIComponent(current) === tz) return;

    document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;

    // Primera visita (o cambio de zona): volver a renderizar con la hora correcta
    router.refresh();
  }, [router]);

  return null;
}
