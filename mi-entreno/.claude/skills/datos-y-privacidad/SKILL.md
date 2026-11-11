---
name: datos-y-privacidad
description: Reglas de datos de Mi Entreno - Supabase (Auth, Postgres, Row Level Security, Storage, Edge Functions), migraciones, sincronización offline y manejo de datos de salud. Úsala siempre que crees o cambies tablas, políticas, cuentas, sincronización, importación o exportación de datos, Edge Functions o cualquier cosa que guarde información de una persona.
---

# Datos y privacidad en Mi Entreno

La app guarda **datos de salud** (dolor, lesiones, notas de un profesional): son datos sensibles.
La usan 5 personas de una familia, y cada una solo debe ver lo suyo.

## Principios
1. **Mínimo necesario:** guarda solo lo que la app usa. Nada de ubicación, contactos ni datos del dispositivo.
2. **Cada persona es dueña de sus datos:** puede verlos, exportarlos (JSON y CSV) y borrarlos de verdad.
3. **Nunca se comparte ni se vende.** Sin analytics ni rastreadores de terceros.
4. **Consentimiento explícito** en el onboarding (una casilla que la persona marca, no solo un aviso),
   con fecha guardada en `profiles.consent_at`.
5. **Aviso médico visible** en el onboarding y en Ajustes (texto en `i18n/es.json` → `app.aviso_medico`).

## Supabase
- Dos proyectos: `mi-entreno` (real) y `mi-entreno-pruebas` (tests y usuarios de prueba). Nunca pruebes con datos reales.
- **Registro cerrado:** "Allow new users to sign up" desactivado. Las cuentas se crean por invitación
  desde el panel. Login con magic link y con Google.
- En el frontend solo va la **Project URL** y la **clave pública** (anon/publishable). La `service_role`
  y la API key de Anthropic viven **solo** como secretos de las Edge Functions. Nunca en el repo ni en el chat.
- `supabase-js` se carga desde CDN con versión fija (sin paso de build).

## Esquema y migraciones
- Todo cambio de base va en un archivo nuevo de `supabase/migrations/AAAAMMDDHHMMSS_descripcion.sql`.
  Nunca edites una migración ya aplicada: crea otra.
- Cada tabla de datos personales tiene:
  - `id uuid primary key` (generado en el teléfono con `crypto.randomUUID()`, para funcionar sin internet)
  - `user_id uuid not null references auth.users on delete cascade`
  - `created_at`, `updated_at timestamptz` y `deleted_at timestamptz` (borrado suave para sincronizar)
- `exercises` tiene filas globales (`user_id is null`, de solo lectura) y propias del usuario.
- Los datos de dolor van en `pain_readings` (zona/condición + momento: `checkin`, `set`, `end`, `next_day` + valor 0-10).

## Row Level Security (obligatoria)
- `alter table ... enable row level security;` en **todas** las tablas, sin excepción.
- Políticas por operación, siempre con el dueño:
  ```sql
  create policy "dueño lee" on public.sessions for select to authenticated
    using (user_id = (select auth.uid()));
  create policy "dueño crea" on public.sessions for insert to authenticated
    with check (user_id = (select auth.uid()));
  create policy "dueño edita" on public.sessions for update to authenticated
    using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  ```
  (`(select auth.uid())` en vez de `auth.uid()` hace que Postgres lo calcule una vez por consulta.)
- Ejercicios globales: `select` para todos los autenticados donde `user_id is null`; sin insert/update/delete.
- Tablas hijas (por ejemplo `sets` de una sesión) también llevan `user_id` propio y su política: no confíes solo en el padre.
- Storage: buckets **privados**, rutas `user_id/archivo`, y políticas en `storage.objects` que comparen
  `(storage.foldername(name))[1] = (select auth.uid())::text`.
- **Tests de políticas** (en `mi-entreno-pruebas`) con dos usuarios A y B. Para cada tabla:
  A lee, crea, edita y borra lo suyo; A **no** ve ni toca nada de B; sin sesión no se ve nada;
  nadie edita ejercicios globales. Corre los tests antes de cada PR que toque la base.

## Offline primero y sincronización
- El teléfono guarda todo localmente (IndexedDB) y la app nunca espera a la red para mostrar algo.
- Cada cambio se marca con `updated_at` (hora del teléfono) y queda en una cola de pendientes.
- Al volver la conexión: se suben los pendientes y se bajan los cambios desde la última sincronización.
- **Conflictos: gana la última edición, por registro** (el `updated_at` más nuevo). El servidor solo
  acepta una fila si su `updated_at` es más nuevo que el guardado.
- Los borrados son suaves (`deleted_at`) para que se sincronicen; se limpian en el servidor después.

## Modo invitado y migración
- Sin cuenta, los datos viven solo en el teléfono. Al crear la cuenta se suben sin perder nada.
- Al iniciar sesión por primera vez, si existe `localStorage['mientreno.v1']`, se ofrece importarlo.
  La importación no borra la copia local hasta confirmar que todo subió bien.

## Borrar y exportar
- **Exportar:** JSON completo y CSV por tabla, generados en el teléfono con los datos de la persona.
- **Borrar la cuenta:** Edge Function que, con la sesión de la persona, borra sus archivos de Storage
  y su usuario de Auth; las tablas se borran solas por `on delete cascade`. Después se limpia el teléfono.
  Pide confirmación dentro de la app escribiendo una palabra (no un simple botón).

## Edge Functions
- Verifican el JWT de la persona y usan su `user_id` del token, nunca uno que venga en el cuerpo.
- Validan y limitan lo que reciben (tamaño, tipo de archivo, cantidad por mes).
- **No registran datos de salud en los logs** (ni notas, ni dolor, ni el contenido de fotos o PDF).
- Los archivos subidos para procesar se borran al terminar, salvo que la persona pida guardarlos.
