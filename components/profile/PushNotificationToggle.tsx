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
      <CardContent className="flex items-center justify-between gap-3 p-4">
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
            <p className="text-xs text-muted-foreground truncate">
              {isSubscribed
                ? "Recibirás recordatorios diarios de lectura"
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
      </CardContent>
    </Card>
  );
}