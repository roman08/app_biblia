-- Un versículo solo puede estar una vez en los favoritos de cada usuario.
-- Idempotente: se puede ejecutar aunque ya se haya aplicado.

-- 1. Quitar duplicados existentes (conserva el más antiguo)
delete from public.favorite_verses a
using public.favorite_verses b
where a.user_id = b.user_id
  and a.book = b.book
  and a.chapter = b.chapter
  and a.verse = b.verse
  and (a.created_at, a.id) > (b.created_at, b.id);

-- 2. Índice único (también acelera "¿es favorito?" y el listado por usuario)
create unique index if not exists favorite_verses_user_verse_key
  on public.favorite_verses (user_id, book, chapter, verse);
