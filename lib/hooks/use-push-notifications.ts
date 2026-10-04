"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Hora por defecto del recordatorio diario (hora local) */
export const DEFAULT_REMINDER_HOUR = 8;

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderHour, setReminderHourState] = useState(DEFAULT_REMINDER_HOUR);

  useEffect(() => {
    // Verificar soporte
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (supported) {
      // Verificar si ya está suscrito y leer la hora guardada de este dispositivo
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then(async (sub) => {
          setIsSubscribed(!!sub);
          if (!sub) return;
          const supabase = createClient();
          const { data } = await supabase
            .from("push_subscriptions")
            .select("reminder_hour, timezone")
            .eq("subscription->>endpoint", sub.endpoint)
            .maybeSingle();
          if (typeof data?.reminder_hour === "number") setReminderHourState(data.reminder_hour);
          // Si el usuario cambió de zona horaria (viaje, mudanza), actualizarla
          const tz = browserTimeZone();
          if (data && data.timezone !== tz) {
            await supabase
              .from("push_subscriptions")
              .update({ timezone: tz })
              .eq("subscription->>endpoint", sub.endpoint);
          }
        });
      });
    }
  }, []);

  /** Cambia la hora del recordatorio de este dispositivo (0–23, hora local). */
  const setReminderHour = async (hour: number) => {
    const previous = reminderHour;
    setReminderHourState(hour);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (!sub) throw new Error("Activa las notificaciones primero");
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("push_subscriptions")
        .update({ reminder_hour: hour, timezone: browserTimeZone() })
        .eq("subscription->>endpoint", sub.endpoint);
      if (dbError) throw dbError;
      return true;
    } catch (err) {
      setReminderHourState(previous);
      setError(
        navigator.onLine
          ? "No se pudo guardar la hora. Intenta de nuevo."
          : "Sin conexión. Cambia la hora cuando vuelva la red."
      );
      console.error("Error guardando la hora:", err);
      return false;
    }
  };

  const subscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupported) {
        throw new Error("Tu navegador no soporta notificaciones push");
      }

      // 1. Pedir permiso (debe ser en un gesto del usuario)
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Permiso de notificaciones denegado");
      }

      // 2. Registrar el service worker
      const registration = await navigator.serviceWorker.ready;

      // 3. Suscribirse al push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      // 4. Guardar en Supabase
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Debes iniciar sesión para activar notificaciones");
      }

      // Borrar solo la suscripción previa de ESTE dispositivo (mismo endpoint)
      // para no duplicar filas sin eliminar las de otros dispositivos
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("subscription->>endpoint", subscription.endpoint);

      // Insertar la nueva suscripción con su hora y zona horaria
      let { error: dbError } = await supabase.from("push_subscriptions").insert({
        user_id: user.id,
        subscription: subscription.toJSON(),
        reminder_hour: reminderHour,
        timezone: browserTimeZone(),
      });
      // Si la migración de recordatorios aún no se aplicó, guardar sin esas columnas
      if (dbError?.code === "PGRST204") {
        ({ error: dbError } = await supabase.from("push_subscriptions").insert({
          user_id: user.id,
          subscription: subscription.toJSON(),
        }));
      }

      if (dbError) throw dbError;

      setIsSubscribed(true);
    } catch (err: any) {
      console.error("Error suscribiendo:", err);
      setError(err.message || "Error al activar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const { endpoint } = subscription;
        await subscription.unsubscribe();

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Borrar solo la suscripción de este dispositivo
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("subscription->>endpoint", endpoint);
        }
      }

      setIsSubscribed(false);
    } catch (err: any) {
      console.error("Error desuscribiendo:", err);
      setError(err.message || "Error al desactivar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    reminderHour,
    setReminderHour,
  };
}