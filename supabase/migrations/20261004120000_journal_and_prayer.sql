-- Diario devocional y lista de oración.
-- Idempotente: se puede ejecutar más de una vez.

-- ════════════════════════════════════════════════════════════════════════
-- 1. Diario: una entrada por usuario y día (fecha local del usuario)
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  content text not null default '' check (char_length(content) <= 20000),
  -- Pasajes sobre los que escribió: [{ "book": "juan", "chapter": 3 }]
  passages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.journal_entries enable row level security;

drop policy if exists "journal_entries: dueño" on public.journal_entries;
create policy "journal_entries: dueño" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════
-- 2. Lista de oración
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  details text check (char_length(details) <= 5000),
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  answer_note text check (char_length(answer_note) <= 5000)
);

create index if not exists prayer_requests_user_idx
  on public.prayer_requests (user_id, answered_at, created_at desc);

alter table public.prayer_requests enable row level security;

drop policy if exists "prayer_requests: dueño" on public.prayer_requests;
create policy "prayer_requests: dueño" on public.prayer_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
