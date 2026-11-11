-- Crea el perfil de los usuarios que ya existían antes del trigger crear_perfil
-- (por ejemplo, los invitados antes de aplicar el esquema). No toca perfiles existentes.
insert into public.profiles (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;
