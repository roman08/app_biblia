# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📖 Descripción del Proyecto

**Biblia App**: webapp (PWA) para leer y estudiar la Biblia. Lector RVR1960, planes de lectura, notas/resaltados, favoritos, racha de lectura, compartir versículos como imagen y recordatorios push.

Pendiente: deploy a Vercel (prioridad alta), buscador de versículos (aún no existe `app/buscar/` ni un parser de referencias), onboarding.

## ⚠️ Next.js 16 — leer antes de escribir código

Esta versión de Next.js tiene cambios incompatibles con lo que conoces (ver [AGENTS.md](AGENTS.md)). Antes de usar una API de Next, consulta la guía en `node_modules/next/dist/docs/`. Ejemplos ya presentes en el repo:

- El middleware se llama **`proxy.ts`** (exporta `function proxy`), no `middleware.ts`.
- `params` en páginas y route handlers es una `Promise` y hay que hacer `await`.

`next dev` vuelve a escribir el bloque de AGENTS.md; es normal que aparezca como modificado.

## 🚀 Comandos

```bash
npm run dev      # next dev --webpack  (localhost:3000)
npm run build    # next build --webpack
npm start
npm run lint     # eslint (flat config en eslint.config.mjs)
npx tsx scripts/generate-plan.ts   # genera un plan de lectura
npx tsx scripts/import-plan.ts     # importa un plan (mapea nombres de libros en inglés a slugs)
```

No hay suite de tests. Para verificar cambios usa `npm run lint` y `npm run build`.

Reglas:

1. **NUNCA uses Turbopack.** `@ducanh2912/next-pwa` requiere webpack; los scripts ya pasan `--webpack`.
2. La PWA/service worker está desactivada en dev (`disable` en `next.config.ts`). Para probarla hay que usar `build` + `start`.
3. Reinicia el servidor después de cambiar `next.config.ts`.
4. Usa siempre `localhost:3000`. Con túneles u otros orígenes falla con "Invalid Server Actions request".

Variables de entorno (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (esta última solo para `scripts/` y la edge function).

## 🏗️ Arquitectura

### Texto bíblico ([lib/bible-api.ts](lib/bible-api.ts))

- Midvash API: `GET https://api.midvash.com/v1/{version}/{book}/{chapter}`. Se cachea con `next: { revalidate: 86400 }`.
- La respuesta `data.verses` es un **array de strings**; el número de versículo es índice + 1. `getChapter()` lo normaliza a `{ verse, text }[]`.
- `BOOKS` es la fuente de verdad de los slugs en español (`genesis`, `1-samuel`, `cantares`…) y del número de capítulos. Rutas, planes y scripts deben usar estos slugs.
- `VERSIONS` define rvr1960, nvi y ntv, pero la UI usa RVR1960.

### Auth y sesión (Supabase SSR)

- `lib/supabase/server.ts` y `client.ts` crean los clientes de servidor y navegador.
- [proxy.ts](proxy.ts) llama a `updateSession` ([lib/supabase/middleware.ts](lib/supabase/middleware.ts)) en cada request y redirige `/perfil` y `/notas` a `/login?next=…` si no hay usuario. Agrega aquí las rutas protegidas nuevas.
- Login OAuth: el login usa enlaces `<a href="/auth/signin/{google|github}">` hacia un **route handler GET** ([app/auth/signin/[provider]/route.ts](app/auth/signin/[provider]/route.ts)), que arma `redirectTo` a partir del header `host`. Después, `/auth/callback` intercambia el código por la sesión. La server action `lib/supabase/auth-actions.ts` existe, pero el login no la usa.

### Mutaciones

Las escrituras pasan por Server Actions en `lib/supabase/*-actions.ts` (`"use server"`): notes, favorites, plans, stats. Al terminar llaman a `revalidatePath` de la ruta afectada, por ejemplo `/leer/{book}/{chapter}` o `/notas`.

### Estado solo del cliente

- Último capítulo leído: `localStorage` (`biblia:last-read`) en [lib/reading-history.ts](lib/reading-history.ts), usado por "Continuar leyendo".
- Tamaño de fuente, modo enfocado y atajos: hooks en `lib/hooks/`.
- Tema: `components/providers/ThemeProvider` propio. **No agregues next-themes.**

### Push notifications (tres piezas)

1. Cliente: `lib/hooks/use-push-notifications.ts` suscribe con la VAPID key y guarda en `push_subscriptions`. La UI está en `components/profile/PushNotificationToggle.tsx`.
2. Service worker: [worker/index.js](worker/index.js) se inyecta en el `sw.js` generado por next-pwa (`customWorkerSrc: "worker"`) y maneja `push` y `notificationclick`.
3. Envío: la edge function de Supabase `supabase/functions/send-notifications/` (Deno) implementa Web Push con cifrado manual y usa la service role.

En localhost no llegan notificaciones; hace falta HTTPS real.

## 🗄️ Base de Datos (Supabase, RLS siempre activo)

Tablas: `profiles`, `reading_plans` y `plan_days` (catálogo público), `user_plans`, `notes`, `favorite_verses`, `reading_activity`, `push_subscriptions`.

- `notes`: en los resaltados, `verse` no puede ser null.
- `reading_activity`: una fila por usuario/día; se incrementa `chapters_read` y de ahí sale la racha.
- `user_plans.completed_days`: jsonb con un array de números de día.
- La service role nunca se usa en código que llegue al cliente.

## 🎨 Reglas de UI

- Server Components por defecto. `"use client"` solo si hay hooks, eventos o `window`. **No uses `dynamic(..., { ssr: false })`.**
- Tailwind v4: los tokens se definen con `@theme inline` en `app/globals.css`, dentro de `:root` y `.dark`. Usa siempre variables semánticas (`bg-card`, `bg-popover`, `text-muted-foreground`) y nunca colores hardcodeados. Si un popover sale transparente, falta la variable en `:root` o `.dark`.
- Diseño mobile-first, con área táctil mínima de 44px.
- Tokens propios además de los de shadcn: `success`, `streak`, `highlight-{yellow,green,blue,pink}` y `tag-{amber,purple,blue,green}` (se usan como `text-tag-x` + `bg-tag-x/10`). Los colores de resaltado se definen una sola vez en `lib/highlight-colors.ts`.
- `hover:bg-accent` es dorado y no contrasta bien en modo oscuro; para hover usa `hover:bg-muted`.
- `components/layout/BottomNav.tsx` (solo en móvil) se oculta en el lector `/leer/[book]/[chapter]`, que tiene su propia barra fija de capítulos. Si agregas otra pantalla con barra inferior fija, agrégala a `isHidden`.
- `lucide-react` se queda en 0.468.x; no actualices a 1.x.
- `components/ui/` son componentes shadcn generados; no los edites sin una razón.
- **Base UI, no Radix:**
  - Los triggers usan la prop `render`, no `asChild`.
  - Si `render` es un `<button>`, usa `nativeButton={true}`; si es `<span>` o `<div>`, `nativeButton={false}`.
  - Los items usan `onClick`, no `onSelect`.

Design system:

- Light: primary `#1E3A8A`, accent `#D4A574`, bg `#F8FAFC`.
- Dark: primary `#3B82F6`, accent `#D4A574`, bg `#0F172A`.
- Fuentes: Geist y Geist Mono para la UI; Georgia para el texto del lector.

## 🐛 Problemas Conocidos

- **"Received a promise that resolves to: undefined"**: un paquete ESM no se transpiló. Ejecuta `rm -rf .next node_modules/.cache` y luego `npm run dev`. La recompilación tarda 30-60 s.
- **El scroll del lector no funciona**: no pongas `overflow: hidden` en `html`; usa solo `overflow-x: hidden` en `body`.
