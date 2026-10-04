-- Progreso de la Biblia completa y recordatorios inteligentes.
-- Idempotente: se puede ejecutar más de una vez.

-- ════════════════════════════════════════════════════════════════════════
-- 1. Capítulos leídos por usuario
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.chapter_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  book text not null,
  chapter int not null check (chapter > 0),
  first_read_on date not null,
  last_read_on date not null,
  read_count int not null default 1,
  primary key (user_id, book, chapter)
);

alter table public.chapter_reads enable row level security;

drop policy if exists "chapter_reads: leer los propios" on public.chapter_reads;
create policy "chapter_reads: leer los propios" on public.chapter_reads
  for select using (auth.uid() = user_id);

drop policy if exists "chapter_reads: crear los propios" on public.chapter_reads;
create policy "chapter_reads: crear los propios" on public.chapter_reads
  for insert with check (auth.uid() = user_id);

drop policy if exists "chapter_reads: actualizar los propios" on public.chapter_reads;
create policy "chapter_reads: actualizar los propios" on public.chapter_reads
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════
-- 2. Registrar la lectura de un capítulo
--    Guarda el capítulo y suma a la racha (reading_activity) solo la primera
--    vez que se lee ese capítulo ese día: recargar la página no infla nada.
--    p_date es la fecha LOCAL del usuario (puede diferir ±1 día de UTC).
--    Devuelve true si contó como lectura nueva de hoy.
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.record_chapter_read(p_book text, p_chapter int, p_date date)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_last date;
begin
  if v_user is null then
    raise exception 'No autenticado';
  end if;
  if p_date < current_date - 1 or p_date > current_date + 1 then
    raise exception 'Fecha fuera de rango: %', p_date;
  end if;

  select last_read_on into v_last
  from chapter_reads
  where user_id = v_user and book = p_book and chapter = p_chapter
  for update;

  if found and v_last >= p_date then
    return false; -- ya contado hoy
  end if;

  if found then
    update chapter_reads
    set last_read_on = p_date, read_count = read_count + 1
    where user_id = v_user and book = p_book and chapter = p_chapter;
  else
    insert into chapter_reads (user_id, book, chapter, first_read_on, last_read_on)
    values (v_user, p_book, p_chapter, p_date, p_date);
  end if;

  update reading_activity
  set chapters_read = coalesce(chapters_read, 0) + 1
  where user_id = v_user and activity_date = p_date;

  if not found then
    insert into reading_activity (user_id, activity_date, chapters_read)
    values (v_user, p_date, 1);
  end if;

  return true;
end;
$$;

grant execute on function public.record_chapter_read(text, int, date) to authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 3. Recordatorios: hora y zona horaria de cada suscripción
--    (last_notified_at ya existe: evita enviar dos veces el mismo día)
-- ════════════════════════════════════════════════════════════════════════
alter table public.push_subscriptions
  add column if not exists reminder_hour smallint not null default 8
    check (reminder_hour between 0 and 23);

alter table public.push_subscriptions
  add column if not exists timezone text not null default 'America/Mexico_City';

-- El usuario cambia su hora desde la app (cliente de Supabase con RLS)
drop policy if exists "push_subscriptions: actualizar las propias" on public.push_subscriptions;
create policy "push_subscriptions: actualizar las propias" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
