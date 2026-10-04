"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";

export function PushNotificationToggle() {
  const {
    isSupported,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    reminderHour,
    setReminderHour,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <BellOff className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium text-sm">Notificaciones no disponibles</p>
            <p className="text-xs text-muted-foreground">
              Tu navegador no soporta notificaciones push. En iOS, instala la app en la pantalla de inicio primero.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-primary shrink-0" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm">
              {isSubscribed ? "Notificaciones activadas" : "Notificaciones desactivadas"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? "Un recordatorio al día, solo si aún no has leído"
                : "Activa para recibir recordatorios diarios"}
            </p>
            {error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
          </div>
        </div>

        <Button
          variant={isSubscribed ? "outline" : "default"}
          size="sm"
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            "Desactivar"
          ) : (
            "Activar"
          )}
        </Button>
      </div>

      {isSubscribed && (
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div className="min-w-0">
            <label htmlFor="reminder-hour" className="text-sm font-medium">
              Hora del recordatorio
            </label>
            <p className="text-xs text-muted-foreground">
              Te avisamos qué te toca de tu plan y cuántos días llevas de racha.
            </p>
          </div>
          <select
            id="reminder-hour"
            value={reminderHour}
            onChange={(e) => setReminderHour(Number(e.target.value))}
            className="h-11 shrink-0 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>
      )}
      </CardContent>
    </Card>
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** 8 → "8:00 a. m." (formato de México) */
function formatHour(hour: number) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}