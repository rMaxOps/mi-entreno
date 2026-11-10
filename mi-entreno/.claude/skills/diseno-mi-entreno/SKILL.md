---
name: diseno-mi-entreno
description: Sistema de diseño de la app Mi Entreno. Úsala siempre que crees o cambies cualquier pantalla, componente, color, tipografía o animación de la interfaz.
---

# Diseño de Mi Entreno

Objetivo: que se sienta como una app de entrenamiento premium y motivadora, no como un formulario.
Se usa en el celular, a veces con las manos sudadas y entre series: **todo tiene que ser legible de un vistazo y fácil de tocar**.

## Dirección visual
- **Personalidad:** energética pero tranquila; es una app de recuperación, no de "no pain no gain".
- **Tema:** oscuro por defecto, con un tema claro opcional (respetar `prefers-color-scheme`).
- **Fondo:** casi negro con un leve tono azul (`#0d0f14`). Las tarjetas van una capa más arriba (`#161a22`) con bordes muy sutiles.
- **Color de acento:** uno solo y potente, por ejemplo lima `#c8f53a`, y se usa con moderación: acción principal, progreso y logros.
- **Colores de dolor (siempre los mismos en toda la app):** 0-2 verde `#3fd08f`, 3-4 ámbar `#f6b93e`, 5+ rojo `#ff5f5f`.
- **Tipografía (Google Fonts):** una condensada y fuerte para números y títulos (Barlow Condensed, Oswald o Archivo Narrow) y una legible para el texto (Inter o Barlow). Los números grandes son protagonistas: peso, reps y temporizador.

## Tokens (definir como variables CSS en `:root`)
- Espaciado: 4, 8, 12, 16, 24, 32.
- Radios: 10 (controles), 16 (tarjetas), 24 (hojas inferiores).
- Áreas táctiles de mínimo 48 × 48 px; el botón principal mide 56 px de alto.
- Sombras suaves solo en elementos flotantes (temporizador y hojas).

## Componentes clave
- **Pantalla de sesión:** una tarjeta por ejercicio, y el ejercicio actual se destaca y se expande mientras los terminados se colapsan con ✓. Arriba de la tarjeta va el personaje animado (skill `personajes-animados`). Los steppers de peso, reps y dolor llevan números grandes.
- **Temporizador de descanso:** un anillo circular animado (SVG `stroke-dashoffset`) en una barra flotante o a pantalla completa, a elección.
- **Check-in:** el slider de dolor cambia de color en vivo y muestra una carita que pasa de 😊 a 😣.
- **Logros:** microcelebración al terminar una sesión o romper un récord (confeti CSS ligero y un mensaje). Respetar `prefers-reduced-motion`.
- **Gráficos:** SVG hechos a mano, con líneas suaves, área con degradado sutil y el último punto destacado.
- **Navegación:** barra inferior con 5 pestañas e íconos SVG propios (no emojis), con un indicador animado en la pestaña activa.

## Movimiento
- Transiciones de 150-250 ms con `ease-out`. Las tarjetas entran con un fade y un desplazamiento de 8 px.
- Al registrar una serie hay una vibración corta y el número hace un "pop".
- Todo se desactiva o se reduce con `prefers-reduced-motion: reduce`.

## Accesibilidad
- Contraste AA como mínimo. El color nunca es la única señal: los niveles de dolor también llevan número y texto.
- `aria-label` en todos los botones de íconos.

## Proceso
1. Antes de programar, propone 2 o 3 direcciones visuales en una página HTML de muestra y deja que yo elija.
2. Aplica la elegida de forma consistente en todas las pantallas.
3. Toma capturas a 390 px de cada pestaña y revísalas antes de terminar.
