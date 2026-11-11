-- =====================================================================
-- Mi Entreno · Etapa 1: esquema inicial con Row Level Security estricta
-- Reglas (skill datos-y-privacidad):
--   * RLS activada en TODAS las tablas; cada persona solo ve y edita lo suyo.
--   * Permisos explícitos (el proyecto no expone tablas nuevas solo):
--     anon no recibe nada; authenticated recibe select/insert/update.
--   * Nadie borra filas desde la app: se marcan con deleted_at (para sincronizar).
--     El borrado real ocurre al eliminar la cuenta (on delete cascade).
--   * Gana la última edición por registro (updated_at); synced_at lo pone el servidor.
-- =====================================================================

-- Esquema privado para funciones internas: la API (PostgREST) no lo publica.
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Gana la última edición + marca de sincronización
-- ---------------------------------------------------------------------
create or replace function privado.ultima_edicion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Un teléfono con la hora adelantada no puede "ganar para siempre"
  if new.updated_at > now() + interval '5 minutes' then
    new.updated_at := now();
  end if;
  if tg_op = 'UPDATE' then
    if new.updated_at < old.updated_at then
      return old;  -- llegó una versión más vieja: se ignora
    end if;
    if new.user_id is distinct from old.user_id then
      raise exception 'No se puede cambiar el dueño de un registro';
    end if;
    new.created_at := old.created_at;
  end if;
  new.synced_at := now();
  return new;
end;
$$;
revoke all on function privado.ultima_edicion() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Perfil (uno por persona; se crea solo al crear el usuario)
-- ---------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users (id) on delete cascade,
  display_name  text check (char_length(display_name) <= 60),
  level         text check (level in ('pausa', 'principiante', 'intermedio')),
  goal          text check (goal in ('recuperarme', 'fuerza', 'salud', 'bajar_peso')),
  days_per_week smallint check (days_per_week between 1 and 7),
  coach         text not null default 'coach' check (coach in ('coach', 'tiron', 'empuje', 'patas', 'nucleo')),
  phase         smallint not null default 1 check (phase between 1 and 3),
  plan_start    date,
  phase_since   date,
  settings      jsonb not null default '{}'::jsonb
                check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) < 20000),
  consent_at    timestamptz,
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  synced_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Molestias y lesiones
-- ---------------------------------------------------------------------
create table public.conditions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  zone        text not null check (zone in ('hombro', 'codo', 'muneca', 'cuello', 'espalda_alta', 'espalda_baja', 'cadera', 'rodilla', 'tobillo', 'otra')),
  zone_other  text check (char_length(zone_other) <= 60),
  side        text not null default 'na' check (side in ('izq', 'der', 'ambos', 'na')),
  status      text not null default 'activa' check (status in ('activa', 'recuperacion', 'antigua')),
  since       date,
  notes       text check (char_length(notes) <= 2000),
  bothers     text[] not null default '{}' check (cardinality(bothers) <= 20),
  threshold   smallint not null default 4 check (threshold between 1 and 10),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now(),
  unique (id, user_id)
);

-- ---------------------------------------------------------------------
-- Equipo disponible
-- ---------------------------------------------------------------------
create table public.equipment (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('ninguno', 'barra_dominadas', 'mancuernas', 'kettlebell', 'bandas', 'banco', 'barra_discos', 'maquinas', 'otro')),
  weights     numeric(6, 2)[] not null default '{}' check (cardinality(weights) <= 40),
  notes       text check (char_length(notes) <= 200),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Ejercicios: globales (user_id vacío, solo lectura) y propios
-- ---------------------------------------------------------------------
create table public.exercises (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete cascade,
  slug        text not null check (slug ~ '^[a-z0-9_]{1,40}$'),
  name        text not null check (char_length(name) between 1 and 80),
  grp         text check (char_length(grp) <= 40),
  type        text not null default 'r' check (type in ('wr', 'bw', 'r', 't')),
  goal        text check (char_length(goal) <= 20),
  tip         text check (char_length(tip) <= 500),
  tags        jsonb not null default '{}'::jsonb
              check (jsonb_typeof(tags) = 'object' and pg_column_size(tags) < 10000),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now()
);
create unique index exercises_global_slug on public.exercises (slug) where user_id is null;
create unique index exercises_propio_slug on public.exercises (user_id, slug) where user_id is not null;

-- ---------------------------------------------------------------------
-- Plantillas (los ejercicios con sus series y descanso van en items)
-- ---------------------------------------------------------------------
create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  description text check (char_length(description) <= 300),
  items       jsonb not null default '[]'::jsonb
              check (jsonb_typeof(items) = 'array' and pg_column_size(items) < 50000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Sesiones de entreno
-- ---------------------------------------------------------------------
create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  started_at    timestamptz not null,
  ended_at      timestamptz,
  template_ref  text check (char_length(template_ref) <= 60),
  template_name text check (char_length(template_name) <= 60),
  phase         smallint check (phase between 1 and 3),
  with_rehab    boolean not null default false,
  energy        smallint check (energy between 1 and 5),
  sleep_h       numeric(3, 1) check (sleep_h between 0 and 14),
  warmup        jsonb not null default '[]'::jsonb check (jsonb_typeof(warmup) = 'array'),
  plan          jsonb not null default '[]'::jsonb
                check (jsonb_typeof(plan) = 'array' and pg_column_size(plan) < 50000),
  notes         text check (char_length(notes) <= 2000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  synced_at     timestamptz not null default now(),
  unique (id, user_id)
);

-- ---------------------------------------------------------------------
-- Series registradas (siempre del mismo dueño que su sesión)
-- ---------------------------------------------------------------------
create table public.sets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  session_id    uuid not null,
  exercise_slug text not null check (exercise_slug ~ '^[a-z0-9_]{1,40}$'),
  position      smallint not null check (position between 0 and 100),
  set_index     smallint not null check (set_index between 0 and 100),
  weight_kg     numeric(6, 2) check (weight_kg between 0 and 500),
  reps          smallint check (reps between 0 and 500),
  seconds       smallint check (seconds between 0 and 7200),
  pain          smallint check (pain between 0 and 10),
  condition_id  uuid,
  done_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  synced_at     timestamptz not null default now(),
  foreign key (session_id, user_id) references public.sessions (id, user_id) on delete cascade,
  foreign key (condition_id, user_id) references public.conditions (id, user_id) on delete set null (condition_id)
);

-- ---------------------------------------------------------------------
-- Dolor por zona: al empezar (checkin), al terminar (end) y al día siguiente (next_day)
-- ---------------------------------------------------------------------
create table public.pain_readings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  session_id    uuid,
  condition_id  uuid,
  moment        text not null check (moment in ('checkin', 'end', 'next_day')),
  value         smallint not null check (value between 0 and 10),
  at            timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  synced_at     timestamptz not null default now(),
  foreign key (session_id, user_id) references public.sessions (id, user_id) on delete cascade,
  foreign key (condition_id, user_id) references public.conditions (id, user_id) on delete set null (condition_id)
);

-- ---------------------------------------------------------------------
-- Para todas las tablas: trigger de última edición, índice de sincronización,
-- RLS activada, permisos explícitos y políticas del dueño.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'conditions', 'equipment', 'exercises', 'templates', 'sessions', 'sets', 'pain_readings'] loop
    execute format('create trigger ultima_edicion before insert or update on public.%I for each row execute function privado.ultima_edicion()', t);
    execute format('create index %I on public.%I (user_id, synced_at)', t || '_sync', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update on table public.%I to authenticated', t);
  end loop;

  -- Tablas solo del dueño
  foreach t in array array['profiles', 'conditions', 'equipment', 'templates', 'sessions', 'sets', 'pain_readings'] loop
    execute format('create policy "dueño lee" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "dueño crea" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "dueño edita" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end
$$;

-- Ejercicios: se leen los globales y los propios; solo se crean o editan los propios.
create policy "lee globales y propios" on public.exercises for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));
create policy "dueño crea" on public.exercises for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "dueño edita" on public.exercises for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Perfil automático al crear un usuario (función privada, no llamable desde la API)
-- ---------------------------------------------------------------------
create or replace function privado.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function privado.crear_perfil() from public, anon, authenticated;

create trigger crear_perfil after insert on auth.users
  for each row execute function privado.crear_perfil();
