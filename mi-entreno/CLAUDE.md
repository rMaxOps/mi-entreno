# Mi Entreno — contexto del proyecto

App web para registrar entrenos en casa o en el gimnasio, con seguimiento del dolor por zona del cuerpo.
Se usa en el celular antes y durante cada sesión.
Responde y escribe la interfaz siempre en **español de Chile**.

## Quién la usa
- **Es multiusuario, pero privada:** la usan solo 5 personas de la misma familia (yo, mi novia, sus
  hermanas y mi mamá). El registro abierto está cerrado: solo entra quien yo invito.
- Cada persona tiene su perfil: molestias o lesiones (zona, lado, estado, umbral de dolor,
  movimientos que molestan), equipo disponible, nivel, objetivo y días por semana.
  La app se adapta a eso: ejercicios, avisos, check-in y rutinas.
- **Yo soy el primer usuario y el de prueba:** hombro derecho en recuperación (umbral 4, me molesta lo
  que va sobre la cabeza), barra de dominadas y mancuernas de 2, 3, 4, 5, 6, 8, 10 y 12 kg, objetivo
  recuperarme, nivel "vuelvo después de una pausa", 3 días por semana.
- La app no reemplaza a un kinesiólogo ni a un médico: si el profesional indica algo, manda eso.

## Cómo está hecha
- **Frontend estático** en GitHub Pages (`https://rmaxops.github.io/mi-entreno/mi-entreno/`):
  HTML, CSS y JS vanilla en **módulos ES**, sin paso de build. Se publica tal cual.
  - `index.html`: estructura y estilos. Entra por `js/main.js`.
  - `js/`: `util.js`, `estado.js`, `i18n.js`, `registro.js` (acciones `ACT`, entradas `INP` y `HOOKS`),
    `datos/` (catálogo), `logica/` (ejercicios, progresión, fases, respaldo), `ui/` (render, componentes,
    modales, temporizador, gráficos, PWA, acciones) y `vistas/` (una por pestaña), más `personajes.js`,
    `animaciones.js`, `dialogos.js` y `rutina.js`.
  - `i18n/es.json`: todos los textos nuevos de la interfaz.
  - `sw.js`: service worker. **Cada archivo nuevo va en su lista `ASSETS`** y hay que subir la versión de `CACHE`.
- **Backend:** Supabase (Auth + Postgres + Row Level Security + Storage + Edge Functions).
  Dos proyectos: `mi-entreno` (real) y `mi-entreno-pruebas` (solo para tests y usuarios de prueba).
- `docs/especificacion.md` es la **fuente de verdad del contenido**: ejercicios, etiquetas, reglas
  de dolor y progresión por zona, plan por fases y modelo de datos.

## Skills del proyecto
- `diseno-mi-entreno`: cualquier pantalla, componente o estilo.
- `personajes-animados`: personajes, animaciones y diálogos.
- `rutina-desde-archivo`: leer rutinas desde foto, PDF o texto.
- `datos-y-privacidad`: Supabase, RLS, migraciones, sincronización y manejo de datos de salud.
  **Úsala siempre que toques datos, cuentas o la base.**

## Reglas de trabajo
- Mobile first (viewport de 390 px), botones grandes, usable con una mano y sudado.
- Sin frameworks pesados ni paso de build.
- No uses `alert`, `confirm` ni `prompt`: haz los diálogos dentro de la app.
- **Nunca pierdas datos del usuario.** Si cambias un formato, migra. Los datos antiguos están en
  `localStorage` con la clave `mientreno.v1`.
- **Privacidad:** son datos de salud (datos sensibles). RLS estricta en todas las tablas, nada de
  analytics de terceros, pedir consentimiento explícito y permitir exportar y borrar todo.
  Nunca pongas la `service_role` ni otros secretos en el frontend ni en el repo.
- **Offline primero:** la app funciona sin internet y sincroniza al volver la conexión.
  Ante conflictos gana la última edición, por registro.
- **Idioma:** todo texto nuevo de la interfaz va en `i18n/es.json` y se usa con `t('clave')`.
  Fechas y números con `Intl` (locale `es-CL`).
- Antes de dar algo por terminado:
  - corre la revisión de módulos (nombres sin importar o imports reasignados) y
  - prueba a 390 px el flujo completo (check-in → sesión → guardar → historial → progreso) sin errores
    en la consola y, desde que hay cuentas, **con dos usuarios distintos** para confirmar que ninguno
    ve los datos del otro.
- **Secretos fuera del repo (el repo es público):** solo pueden ir la Project URL y la clave pública
  de Supabase. El resto (clave secreta/service_role, contraseña de la base, API key de Anthropic,
  secretos de Google) vive en el panel de Supabase o en el gestor de contraseñas. El `.gitignore` excluye
  `.env` y archivos de la CLI, y `.githooks/revisar-secretos.js` detiene cualquier commit con algo
  que parezca un secreto. En cada computador nuevo actívalo con `git config core.hooksPath .githooks`.
  GitHub además tiene activos el escaneo de secretos y el bloqueo al subir.
- Trabaja en ramas `feat/...` (una por etapa), con commits pequeños y un PR por etapa.
  **Haz merge de cada etapa antes de empezar la siguiente** para evitar conflictos.
- Antes de cada etapa, dime qué tengo que hacer yo (crear cosas en Supabase, secretos, etc.) con pasos simples.
- Publicación: GitHub Pages desde `main`.
