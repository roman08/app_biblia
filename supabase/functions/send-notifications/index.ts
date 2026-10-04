import { createClient } from "npm:@supabase/supabase-js@2";
import {
  addDays,
  buildMessage,
  isDue,
  localParts,
  streakUntilYesterday,
  type MessageInput,
  type Passage,
} from "./reminder.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ============================================
// HELPERS BASE64
// ============================================

function base64UrlToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(b64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ============================================
// HKDF
// ============================================

async function hkdfExtract(
  salt: Uint8Array,
  ikm: Uint8Array
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    salt.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const prk = await crypto.subtle.sign(
    "HMAC",
    key,
    ikm.buffer as ArrayBuffer
  );
  return new Uint8Array(prk);
}

async function hkdfExpand(
  prk: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    prk.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const infoWithCounter = new Uint8Array(info.length + 1);
  infoWithCounter.set(info, 0);
  infoWithCounter[info.length] = 1;
  const output = await crypto.subtle.sign(
    "HMAC",
    key,
    infoWithCounter.buffer as ArrayBuffer
  );
  return new Uint8Array(output).slice(0, length);
}

// ============================================
// VAPID
// ============================================

async function generateVapidAuthHeader(audience: string): Promise<string> {
  const subject = Deno.env.get("VAPID_SUBJECT")!;
  const publicKeyB64 = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const privateKeyB64 = Deno.env.get("VAPID_PRIVATE_KEY")!;

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const privateKeyUint8 = base64UrlToUint8Array(privateKeyB64);
  const publicKeyUint8 = base64UrlToUint8Array(publicKeyB64);

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(publicKeyUint8.slice(1, 33)),
    y: base64UrlEncode(publicKeyUint8.slice(33, 65)),
    d: base64UrlEncode(privateKeyUint8),
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  const jwt = `${signingInput}.${encodedSignature}`;

  return `vapid t=${jwt}, k=${publicKeyB64}`;
}

// ============================================
// CIFRADO AES128GCM (RFC 8291)
// ============================================

async function encryptPayload(
  payload: Uint8Array,
  p256dh: Uint8Array,
  authSecret: Uint8Array
): Promise<Uint8Array> {
  // 1. Generar par ECDH del servidor
  const serverKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // 2. Importar clave pública del cliente
  const clientKey = await crypto.subtle.importKey(
    "raw",
    p256dh.buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // 3. Derivar secreto compartido
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientKey },
    serverKeys.privateKey,
    256
  );

  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeys.publicKey)
  );

  // 4. Salt aleatorio
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 5. HKDF: derivar IKM (RFC 8291)
  // Nota: usamos p256dh directamente (ya son los bytes crudos del cliente)
  const clientKeyRaw = p256dh;

  const authInfo = new Uint8Array([
    ...new TextEncoder().encode("WebPush: info\0"),
    ...clientKeyRaw,
    ...serverPublicKeyRaw,
  ]);

  const prk = await hkdfExtract(authSecret, new Uint8Array(sharedSecret));
  const ikm = await hkdfExpand(prk, authInfo, 32);

  // 6. Derivar CEK y Nonce (RFC 8188): extract con el salt antes del expand
  const contentPrk = await hkdfExtract(salt, ikm);

  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");

  const cek = await hkdfExpand(contentPrk, cekInfo, 16);
  const nonce = await hkdfExpand(contentPrk, nonceInfo, 12);

  // 7. Header aes128gcm: salt(16) + rs(4) + idlen(1) + key(65)
  const recordSize = 4096;
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, recordSize);
  header[20] = 65; // idlen
  header.set(serverPublicKeyRaw, 21);

  // 8. Padding: payload + 0x02 (delimitador)
  const padded = new Uint8Array(payload.length + 1);
  padded.set(payload, 0);
  padded[payload.length] = 0x02;

  // 9. Cifrar con AES-128-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    cek.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce.buffer as ArrayBuffer, tagLength: 128 },
      aesKey,
      padded.buffer as ArrayBuffer
    )
  );

  // 10. Concatenar header + ciphertext
  const result = new Uint8Array(header.length + ciphertext.length);
  result.set(header, 0);
  result.set(ciphertext, header.length);

  return result;
}

async function sendPushNotification(
  subscription: any,
  payload: string
): Promise<Response> {
  const endpoint = subscription.endpoint;
  const p256dh = base64UrlToUint8Array(subscription.keys.p256dh);
  const auth = base64UrlToUint8Array(subscription.keys.auth);

  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const vapidAuth = await generateVapidAuthHeader(audience);

  const payloadBytes = new TextEncoder().encode(payload);
  const encryptedBody = await encryptPayload(payloadBytes, p256dh, auth);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: vapidAuth,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
    },
    body: encryptedBody.buffer as ArrayBuffer,
  });

  return response;
}

// ============================================
// SERVIDOR
// ============================================

// El cron (pg_cron) llama a esta función cada hora en punto. A cada
// suscripción se le envía el recordatorio solo si:
//   1. es la hora que eligió el usuario, en su zona horaria;
//   2. hoy (su fecha local) todavía no se le envió nada;
//   3. hoy todavía no ha leído.
// El mensaje dice qué le toca de su plan y cuántos días lleva de racha.
//
// Prueba manual: POST ?force=1 envía ya a todas las suscripciones, sin mirar
// la hora ni si ya leyó, y sin marcar el envío del día.

interface UserContext {
  readToday: boolean;
  streak: number;
  plan: MessageInput["plan"];
}

async function loadUserContext(userId: string, today: string): Promise<UserContext> {
  // Días con lectura (para "ya leyó hoy" y la racha)
  const { data: activity } = await supabase
    .from("reading_activity")
    .select("activity_date")
    .eq("user_id", userId)
    .gte("activity_date", addDays(today, -400));
  const readDates = new Set((activity ?? []).map((a) => a.activity_date as string));

  // Plan activo: el último que empezó
  let plan: MessageInput["plan"] = null;
  const { data: userPlan } = await supabase
    .from("user_plans")
    .select("completed_days, reading_plans(id, slug, name, total_days)")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // deno-lint-ignore no-explicit-any
  const info = (userPlan as any)?.reading_plans;
  if (info) {
    const completed: number[] = userPlan?.completed_days ?? [];
    const day = Math.min(completed.length ? Math.max(...completed) + 1 : 1, info.total_days);
    const { data: planDay } = await supabase
      .from("plan_days")
      .select("passages")
      .eq("plan_id", info.id)
      .eq("day_number", day)
      .maybeSingle();
    if (planDay?.passages?.length && completed.length < info.total_days) {
      plan = { slug: info.slug, name: info.name, day, passages: planDay.passages as Passage[] };
    }
  }

  return {
    readToday: readDates.has(today),
    streak: streakUntilYesterday(readDates, today),
    plan,
  };
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const force = new URL(req.url).searchParams.get("force") === "1";
  const now = new Date();

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, subscription, reminder_hour, timezone, last_notified_at");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Suscripciones a las que toca enviar ahora
  const due = (subs ?? []).filter(
    (s) =>
      force ||
      isDue({
        now,
        timeZone: s.timezone,
        reminderHour: s.reminder_hour,
        lastNotifiedAt: s.last_notified_at,
      })
  );

  // Contexto por usuario (un usuario puede tener varios dispositivos)
  const contexts = new Map<string, Promise<UserContext>>();
  const contextFor = (userId: string, today: string) => {
    const key = `${userId}:${today}`;
    if (!contexts.has(key)) contexts.set(key, loadUserContext(userId, today));
    return contexts.get(key)!;
  };

  const results = await Promise.allSettled(
    due.map(async (sub) => {
      try {
        const today = localParts(now, sub.timezone).date;
        const ctx = await contextFor(sub.user_id, today);
        if (ctx.readToday && !force) return { id: sub.id, status: "skipped", reason: "ya leyó hoy" };

        const message = buildMessage({ streak: ctx.streak, plan: ctx.plan });
        const response = await sendPushNotification(sub.subscription, JSON.stringify(message));

        if (!response.ok) {
          if (response.status === 410 || response.status === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          const errorText = await response.text();
          throw new Error(`Push failed: ${response.status} - ${errorText}`);
        }

        if (!force) {
          await supabase
            .from("push_subscriptions")
            .update({ last_notified_at: now.toISOString() })
            .eq("id", sub.id);
        }
        return { id: sub.id, status: "sent", title: message.title, body: message.body };
      } catch (err) {
        return { id: sub.id, status: "failed", error: (err as Error).message };
      }
    })
  );

  const values = results.map((r) => (r.status === "fulfilled" ? r.value : { status: "failed" }));
  return new Response(
    JSON.stringify({
      total: subs?.length ?? 0,
      due: due.length,
      sent: values.filter((v) => v.status === "sent").length,
      skipped: values.filter((v) => v.status === "skipped").length,
      force,
      results: values,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});