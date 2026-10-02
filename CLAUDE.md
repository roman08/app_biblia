# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📖 Descripción del Proyecto

**Biblia App**: webapp (PWA) para leer y estudiar la Biblia. Lector con Reina-Valera Gómez 2010 (RVG) por defecto, planes de lectura, notas/resaltados, favoritos, racha de lectura, compartir versículos como imagen y recordatorios push.

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
npx tsx scripts/validate-books.ts  # valida BOOKS, géneros y cada lectura de los planes en Supabase
```

No hay suite de tests. Para verificar cambios usa `npm run lint` y `npm run build`.

Reglas:

1. **NUNCA uses Turbopack.** `@ducanh2912/next-pwa` requiere webpack; los scripts ya pasan `--webpack`.
2. La PWA/service worker está desactivada en dev (`disable` en `next.config.ts`). Para probarla hay que usar `build` + `start`.
3. Reinicia el servidor después de cambiar `next.config.ts`.
4. Usa siempre `localhost:3000`. Con túneles u otros orígenes falla con "Invalid Server Actions request".

Variables de entorno (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (esta última solo para `scripts/` y la edge function) y, opcional, `NEXT_PUBLIC_SITE_URL` (dominio público para Open Graph).

## 🏗️ Arquitectura

### Texto bíblico ([lib/bible-api.ts](lib/bible-api.ts))

- Midvash API: `GET https://api.midvash.com/v1/{version}/{book}/{chapter}`. Se cachea con `next: { revalidate: 86400 }`.
- La respuesta `data.verses` es un **array de strings**; el número de versículo es índice + 1. `getChapter()` lo normaliza a `{ verse, text }[]`.
- **Etiquetas de libro:** el testamento y el género ("AT · Poéticos") salen siempre del libro, con `getBookTag()` de [lib/book-categories.ts](lib/book-categories.ts). **Nunca** de la posición de la lectura en el día: antes eso etiquetaba mal el 37% de las lecturas del plan anual. Después de tocar `BOOKS`, los géneros o un plan, corre `scripts/validate-books.ts`.
- `BOOKS` es la fuente de verdad de los slugs en español (`genesis`, `1-samuel`, `cantares`…) y del número de capítulos. Rutas, planes y scripts deben usar estos slugs.
- **Versiones:** `VERSIONS` usa los slugs de Midvash: `rvg` (por defecto, `DEFAULT_VERSION`), `rvr1909`, `pdt` y `onbv-es`. `GET /v1/versions` lista todas.
- **No escribas `"rvg"` a mano:** usa `DEFAULT_VERSION`, y para leer `?v=` usa `parseVersion()`. Un valor desconocido, como el antiguo `rvr1960`, cae en la versión por defecto.
- **Versiones retiradas:** desde oct. 2026 Midvash ya no tiene la RVR1960, la NTV ni la NVI. Si se piden, responde con otra versión sin avisar (`rvr1960` → `rvr1909`, `ntv` → `onbv-es`, `nvies` → `pdt`). Para mostrar la versión, usa siempre la que devolvió la API (`ChapterData.version` con `versionLabel()`), no la que pediste. Se eligió la RVG como la más cercana a la RVR1960.
- **Aviso de derechos:** `ChapterData.copyright` (de `meta.copyright`) se muestra al final del capítulo y en `/v`. Es obligatorio: la RVG solo permite uso gratuito, sin fines de lucro y sin cambiar palabras, y la ONBV es CC BY-SA y exige atribución. Si la app cobra o tiene anuncios, la RVG requiere permiso de su autor.
- Midvash devuelve `book` y `bookName` en inglés ("john", "John"). Muestra siempre `getBook(slug).name`; `getChapter()` ya lo hace.
- Para varios versículos sueltos usa `getPassages()` (`/v1/passages`, 50 referencias por llamada), no un `getChapter` por versículo. Midvash no tiene búsqueda por texto.

### Auth y sesión (Supabase SSR)

- `lib/supabase/server.ts` y `client.ts` crean los clientes de servidor y navegador.
- [proxy.ts](proxy.ts) llama a `updateSession` ([lib/supabase/middleware.ts](lib/supabase/middleware.ts)) en cada request y redirige las rutas de `PROTECTED_ROUTES` (`/perfil`, `/notas`, `/favoritos`) a `/login?next=…` si no hay usuario. Agrega aquí las rutas protegidas nuevas.
- Login OAuth: el login usa enlaces `<a href="/auth/signin/{google|github}">` hacia un **route handler GET** ([app/auth/signin/[provider]/route.ts](app/auth/signin/[provider]/route.ts)), que arma `redirectTo` a partir del header `host`. Después, `/auth/callback` intercambia el código por la sesión. La server action `lib/supabase/auth-actions.ts` existe, pero el login no la usa.

### Mutaciones

Las escrituras pasan por Server Actions en `lib/supabase/*-actions.ts` (`"use server"`): notes, favorites, plans, stats. Al terminar llaman a `revalidatePath` de la ruta afectada, por ejemplo `/leer/{book}/{chapter}` o `/notas`.

### Estado solo del cliente

- Último capítulo leído: `localStorage` (`biblia:last-read`) en [lib/reading-history.ts](lib/reading-history.ts), usado por "Continuar leyendo".
- Tamaño de fuente, modo enfocado y atajos: hooks en `lib/hooks/`.
- Tema: `components/providers/ThemeProvider` propio. **No agregues next-themes.**
- Lectura en voz alta: store a nivel de módulo en [lib/speech/reader-speech.ts](lib/speech/reader-speech.ts), que se lee con `useReaderSpeech()`. `VerseList` registra el capítulo con `registerSpeechChapter`. Se lee un versículo por utterance, y pausar es en realidad cancelar y recordar el índice.

### Fechas y zona horaria

"Hoy" siempre es la fecha **local del usuario**. **Nunca uses `toISOString()` para calcular un día**, porque da la fecha en UTC.

- `components/providers/TimezoneSync.tsx` guarda la zona del navegador en la cookie `tz`.
- En el servidor, `getUserToday()` y `getUserTimeZone()` de [lib/timezone.ts](lib/timezone.ts) la leen (por defecto `America/Mexico_City`).
- Para operar con fechas `YYYY-MM-DD` usa `addDays` y `daysBetween` de [lib/dates.ts](lib/dates.ts).

### Modo sin conexión

- **Caché de capítulos:** en `next.config.ts`, `workboxOptions.runtimeCaching` tiene reglas propias que van antes de las de next-pwa (`extendDefaultRuntimeCaching`). Los capítulos (`/leer/{book}/{n}`, solo el documento, no el RSC) se guardan en la caché `bible-chapters`: NetworkFirst, 5 s de timeout, 1 año. La regla `pages` (solo `mode === "navigate"`) reemplaza a la de next-pwa y amplía su caché a 64 entradas por 30 días.
- **Las funciones de `urlPattern` se serializan dentro de `sw.js`,** así que no pueden usar variables de fuera de la función.
- **Página de respaldo:** `app/~offline/page.tsx` la detecta next-pwa sola, se precachea y se muestra si no hay red ni caché.
- **Descargas:** `/descargas` guarda libros completos con la Cache API ([lib/offline/chapter-cache.ts](lib/offline/chapter-cache.ts)), en la misma caché `bible-chapters`.
- **URLs de capítulo:** genéralas con `chapterHref()`. La versión por defecto va sin `?v=`, para que cada capítulo tenga una sola URL en la caché.
- **Server actions:** sin red fallan. Envuélvelas en `try/catch` con un toast; un error dentro de `startTransition` llega al error boundary y rompe la página.
- **Probar:** solo funciona con `npm run build && npm start` (en dev la PWA está desactivada). En DevTools → Network → Offline.

### Open Graph (vista previa al compartir)

- **URL base:** `metadataBase` sale de `getSiteUrl()` en [lib/site.ts](lib/site.ts): primero `NEXT_PUBLIC_SITE_URL`, si no, las variables `URL`/`DEPLOY_PRIME_URL` de Netlify.
- **Metadatos de páginas públicas:** usa `pageMetadata()` de `lib/site.ts`. Incluye título, descripción, canonical, `openGraph` (con `siteName` y `locale`, porque el `openGraph` de una página reemplaza por completo al del layout) y la tarjeta grande de X.
- **Imágenes (1200×630):** las generan los `opengraph-image.tsx` de `app/`, `v/[book]/[chapter]/[verse]`, `leer/[book]/[chapter]` y `plan/[slug]`, con `renderOgCard()` de [lib/og/og-card.tsx](lib/og/og-card.tsx). Las fuentes, Gelasio (métricas de Georgia) y Geist, están en `assets/fonts/` en `.woff`, porque Satori no lee woff2. Las fuentes propias reemplazan a las de `next/og`.
- **Sin `fs` en tiempo de ejecución:** las fuentes y el logo van incrustados en base64 en `lib/og/og-assets.ts`. Ese archivo es generado: si cambias algo en `assets/fonts/` o el ícono, corre `npx tsx scripts/generate-og-assets.ts`. En Netlify, la función serverless no incluye `assets/` ni `public/`, así que leerlos con `readFile` daba HTTP 500 en las imágenes dinámicas. La de `app/` funcionaba porque se genera en el build.
- **`ownImage`:** si el segmento tiene su propio `opengraph-image.tsx`, pasa `ownImage: true`. La clave `images` tiene que faltar del todo: tanto `images: [...]` como `images: undefined` le ganan al archivo.
- **Proxy:** `proxy.ts` excluye `opengraph-image` de su `matcher`, así que esas peticiones no pasan por la sesión de Supabase.

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
- Los cambios de esquema van en `supabase/migrations/<timestamp>_<nombre>.sql`, con sus políticas RLS, y escritos de forma idempotente (`if not exists`). Se aplican con `npx supabase db push`.
- `favorite_verses` tiene un índice único `(user_id, book, chapter, verse)`.

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
