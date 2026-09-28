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

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar soporte
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (supported) {
      // Verificar si ya está suscrito
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

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

      // ✅ FIX: Borrar suscripciones previas del usuario antes de insertar
      // Esto evita filas duplicadas y zombies
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      // ✅ FIX: Insertar la nueva suscripción (sin upsert)
      const { error: dbError } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id: user.id,
          subscription: subscription.toJSON(),
        });

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
        await subscription.unsubscribe();

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // ✅ FIX: Borrar TODAS las suscripciones del usuario
          // (ya no filtramos por subscription que no funciona con jsonb)
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id);
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
  };
}