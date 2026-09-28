# CLAUDE.md

Este archivo proporciona contexto a Claude Code cuando trabaja en este repositorio.

## 📖 Descripción del Proyecto

**Biblia App** es una webapp moderna para leer, meditar y estudiar la Biblia. Incluye lector bíblico con RVR1960, planes de lectura, notas personales, estadísticas de racha, y compartir versículos con imágenes generadas.

**Estado actual:** MVP completo y funcional en local. Pendiente: deploy a Vercel y buscador de versículos.

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Notas críticas |
|---|---|---|
| Next.js | 16.3.6 | App Router, --webpack obligatorio (no Turbopack) |
| React | 19.2.8 | Compatible con Server Components |
| TypeScript | 5.x | Modo estricto |
| Tailwind CSS | 4.x | Usa @theme inline en globals.css |
| shadcn/ui | 4.21.0 | Componentes en components/ui/ |
| Base UI | 1.8.0 | Primitivos headless (reemplazo de Radix) |
| Supabase | 2.117.1 | Auth + PostgreSQL |
| lucide-react | 0.468.0 | NO usar versiones 1.x |
| next-pwa | 10.2.9 | Requiere --webpack |
| Midvash API | — | Texto bíblico RVR1960 |

## 🚀 Comandos Esenciales

npm run dev          # Desarrollo (SIEMPRE usa --webpack)
npm run build        # Build de producción
npm start            # Servidor de producción
npm run lint         # Lint
npx tsx scripts/generate-plan.ts  # Generar plan de lectura

### Reglas críticas sobre comandos

1. NUNCA uses Turbopack - next-pwa no es compatible
2. Después de rm -rf .next, espera a que recompile (30-60s)
3. PWA solo funciona en producción, no en dev

## 📁 Estructura del Proyecto

app/ - App Router de Next.js
  auth/callback/ - Callback OAuth
  buscar/ - Buscador (pendiente)
  estadisticas/ - Estadísticas y racha
  leer/[book]/[chapter]/ - Lector bíblico
  login/ - Login OAuth
  notas/ - Notas personales
  perfil/ - Perfil de usuario
  plan/[slug]/ - Plan individual
  planes/ - Catálogo de planes
  v/[book]/[chapter]/[verse]/ - Vista de versículo
components/
  bible/ - VerseList, VerseActions, FocusModeLayout
  home/ - VerseOfDayCard, ContinueReadingCard
  layout/ - UserNav, ThemeToggle
  plan/ - PlanDayCard, PlanDaysList
  providers/ - ThemeProvider (custom)
  stats/ - StatsCard, StreakBadge
  ui/ - shadcn/ui (NO editar sin razón)
lib/
  hooks/ - use-font-size, use-focus-mode
  supabase/ - client, server, actions
  bible-api.ts - Cliente Midvash
  parse-reference.ts - Parser "Juan 3:16"
  utils.ts - cn() helper
  verse-of-day.ts - Versículo del día

## 🗄️ Base de Datos (Supabase)

Tablas:
- profiles - Datos extra del usuario
- reading_plans - Catálogo de planes (público)
- plan_days - Días de cada plan (público)
- user_plans - Planes del usuario
- notes - Notas y resaltados
- reading_activity - Actividad diaria (racha)

Reglas críticas:
1. service_role key solo en scripts server-side
2. RLS siempre activo
3. notes: verse no puede ser null para resaltados
4. reading_activity: upsert incrementando chapters_read
5. user_plans.completed_days: jsonb con array de números

## 🎨 Reglas de Estilo y Código

### TypeScript
- Modo estricto activado
- Evitar any
- Los componentes de Supabase devuelven tipos

### Componentes React
- Server Components por defecto
- "use client" solo para hooks, eventos, window
- NO usar dynamic con ssr: false

### Tailwind CSS
- Tailwind v4 - usa @theme inline en globals.css
- Variables semánticas: bg-popover, bg-card
- NO colores hardcodeados
- Responsive móvil-first
- Área táctil mínima 44px

### Base UI (no Radix)
- Triggers usan render prop, no asChild
- render es button → nativeButton={true}
- render es span o div → nativeButton={false}
- Items usan onClick, no onSelect

## 🐛 Problemas Conocidos

### 1. "Received a promise that resolves to: undefined"
Causa: Paquete ESM no se transpila
Solución:
  rm -rf .next node_modules/.cache
  npm run dev

### 2. "Invalid Server Actions request"
Causa: Origin no coincide (túneles)
Solución: Usar localhost:3000

### 3. Scroll no funciona en el lector
Causa: overflow: hidden en html
Solución: Solo overflow-x: hidden en body

### 4. Popovers transparentes
Causa: Faltan variables semánticas
Solución: Verificar :root y .dark

### 5. Notificaciones push no llegan en localhost
Causa: Requiere HTTPS real
Solución: Funcionarán en Vercel

## 🔐 Autenticación (Supabase)

Flujo:
1. Click "Continuar con Google/GitHub"
2. signInWithOAuth redirige al proveedor
3. Proveedor redirige a /auth/callback
4. Callback intercambia código por sesión
5. Redirige a / o next param

Archivos clave:
- lib/supabase/auth-actions.ts
- app/auth/callback/route.ts
- middleware.ts

Reglas:
1. Server Actions para login
2. redirectTo debe usar el origin correcto
3. Nunca exponer service_role

## 📖 Lector Bíblico (Midvash API)

Endpoint: GET https://api.midvash.com/v1/rvr1960/{book}/{chapter}

Estructura: { data: { verses: ["texto 1", "texto 2"] } }

Importante:
- verses es array de strings
- El número es índice + 1
- Slugs deben coincidir con BOOKS

## 🎯 Funcionalidades

Completadas:
- Lector RVR1960, Home estilo YouVersion
- Auth Google/GitHub, Planes de lectura
- Notas y resaltados, Compartir versículos
- Estadísticas y racha, PWA instalable
- Tema oscuro, Modo lectura enfocado
- Atajos de teclado, Ajuste de tamaño fuente

Pendientes:
- Deploy a Vercel (prioridad alta)
- Buscador de versículos
- Notificaciones push
- Onboarding para nuevos usuarios

## 🎨 Design System

Light: primary #1E3A8A, accent #D4A574, bg #F8FAFC
Dark: primary #3B82F6, accent #D4A574, bg #0F172A
Fuentes: Geist (sans), Geist Mono, Georgia (lector)

## ⚠️ Reglas Generales para Claude

1. NUNCA uses Turbopack - siempre --webpack
2. NUNCA agregues next-themes - usar ThemeProvider propio
3. NUNCA uses dynamic con ssr: false
4. SIEMPRE verifica que rm -rf .next no rompa compilación
5. SIEMPRE usa variables semánticas de Tailwind
6. SIEMPRE agrega "use client" cuando uses hooks
7. NUNCA edites components/ui/ sin razón
8. SIEMPRE respeta reglas de Base UI
9. SIEMPRE usa localhost:3000
10. SIEMPRE reinicia el server después de cambiar next.config.ts