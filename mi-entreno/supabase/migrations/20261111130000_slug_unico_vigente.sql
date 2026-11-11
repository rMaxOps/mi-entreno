-- El identificador (slug) de un ejercicio solo debe ser único entre los ejercicios NO borrados.
-- Antes, un ejercicio borrado (deleted_at) impedía crear otro con el mismo slug y frenaba la sincronización.
drop index if exists public.exercises_propio_slug;
drop index if exists public.exercises_global_slug;
create unique index exercises_propio_slug on public.exercises (user_id, slug) where user_id is not null and deleted_at is null;
create unique index exercises_global_slug on public.exercises (slug) where user_id is null and deleted_at is null;
