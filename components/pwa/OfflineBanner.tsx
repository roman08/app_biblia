"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";

// Aviso fijo bajo el header mientras no hay conexión. Al volver la red,
// refresca los datos de la página (en lugar de recargarla de golpe).
export function OfflineBanner() {
  const online = useOnlineStatus();
  const router = useRouter();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      router.refresh();
    }
  }, [online, router]);

  if (online) return null;

  return (
    <div
      role="status"
      className="border-b bg-muted px-4 py-2 text-sm text-muted-foreground"
    >
      <div className="container mx-auto flex max-w-3xl items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1">
          Sin conexión. Puedes leer los capítulos guardados; las notas y
          favoritos se podrán editar al volver la conexión.
        </p>
        <Link
          href="/~offline"
          className="shrink-0 font-medium text-foreground underline underline-offset-2"
        >
          Ver guardados
        </Link>
      </div>
    </div>
  );
}
