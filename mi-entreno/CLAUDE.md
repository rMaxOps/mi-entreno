# Mi Entreno — contexto del proyecto

App web personal para registrar mis entrenos. La uso en el celular antes y durante cada sesión.
Responde y escribe la interfaz siempre en **español de Chile**.

## Quién soy y cómo entreno
- Entreno en casa con **una barra de dominadas y mancuernas de distintos pesos** (por defecto 2, 3, 4, 5, 6, 8, 10 y 12 kg).
- Estoy **volviendo al ejercicio de a poco después de una lesión de hombro**. El seguimiento del dolor (0-10) es central en toda la app.
- La app no reemplaza a mi kinesiólogo: si él indica algo, manda eso.

## Estado actual
- `index.html` es la versión 1: una sola página con HTML, CSS y JS vanilla, sin build.
  Ya tiene: check-in de dolor/energía/sueño con semáforo, plantillas, registro de series con +/-,
  sugerencias de progresión, alertas de dolor, temporizador de descanso, historial, gráficos SVG y ajustes.
- Los datos van en `localStorage` (clave `mientreno.v1`). El código de `claude.use("db")` solo sirve
  dentro de claude.ai; fuera de ahí se ignora y la app sigue funcionando.
- `docs/especificacion.md` tiene la especificación completa: ejercicios, rutinas, calentamiento,
  plan por fases, reglas de progresión y de dolor. **Es la fuente de verdad del contenido.**

## Lo que quiero ahora (versión 2)
1. **Mejor diseño** → usa la skill `diseno-mi-entreno`.
2. **Subir una foto o un PDF de una rutina y que la app la cree de una** → usa la skill `rutina-desde-archivo`.
3. **Personajes animados que expliquen cada ejercicio y cada rutina** → usa la skill `personajes-animados`.
4. Además, lo que falta de la especificación: series y descanso por ejercicio en las plantillas,
   plan por fases, check-in del día siguiente y PWA instalable.

## Reglas de trabajo
- Mobile first (viewport de 390 px), botones grandes y pensado para usarse con una mano y sudado.
- Sin frameworks pesados. Si el archivo crece mucho, se puede separar en `index.html`, `css/` y `js/`
  (módulos ES), pero sin paso de build: tiene que poder publicarse tal cual en GitHub Pages.
- No uses `alert`, `confirm` ni `prompt`: haz los diálogos dentro de la app.
- Nunca pierdas datos del usuario: si cambias el formato, migra desde `mientreno.v1`.
- Antes de dar algo por terminado, pruébalo en un viewport de celular haciendo el flujo completo
  (check-in → sesión → guardar → historial → progreso) y revisa que no haya errores en la consola.
- Trabaja en ramas `feat/...`, haz commits pequeños y abre un PR al terminar cada función.
- Publicación: GitHub Pages desde la carpeta del proyecto.
