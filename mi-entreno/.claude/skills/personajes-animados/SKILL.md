---
name: personajes-animados
description: Cómo crear y usar los personajes animados de Mi Entreno que demuestran cada ejercicio y presentan cada rutina. Úsala al dibujar, animar o mostrar personajes, o al agregar un ejercicio nuevo que necesite su animación.
---

# Personajes animados

## Idea
Un elenco pequeño de **personajes originales**, dibujados en SVG y animados con CSS, que:
- **demuestran cada ejercicio** en un bucle corto (2-3 s) arriba de su tarjeta y en el detalle de la biblioteca;
- **presentan cada rutina** con una frase corta de qué se trabaja y en qué fijarse;
- **reaccionan** al check-in (el coach se pone serio si el dolor es alto), a las series registradas y a los récords.

Todos los personajes son inventados para esta app. No uses ni imites personajes, mascotas ni marcas existentes.

## El elenco (uno por grupo)
- **Coach Hombro** (Rehab hombro): una figura tranquila con banda en la frente; es el que da los avisos de dolor.
- **Tirón** (Tirón / barra): ágil, siempre cerca de la barra.
- **Empuje** (Empuje): fuerte y redondeado, con muñequeras.
- **Patas** (Piernas): de piernas largas y zapatillas grandes.
- **Núcleo** (Core): compacto, con una franja en el abdomen.
Todos comparten el estilo: formas geométricas simples, trazo grueso redondeado y los colores de la app con un acento propio por personaje. Se tienen que ver bien a 120 px de alto.

## Técnica
- **Un esqueleto SVG reutilizable** (rig) con grupos `<g>` por segmento: torso, cabeza, brazo superior e inferior (izq/der), muslo y pierna (izq/der). Cada grupo lleva su `transform-origin` en la articulación.
- Cada ejercicio es **una animación CSS `@keyframes`** sobre esos grupos (rotaciones de las articulaciones), guardada en `js/animaciones.js` como un objeto `{ [exerciseId]: { keyframes, duracion, props: ['barra'|'mancuerna'|'pared'|'suelo'] } }`.
- Los props (barra, mancuernas, pared, suelo) son SVG simples que se muestran según el ejercicio.
- Las animaciones tienen que mostrar la **técnica segura**: rango de movimiento controlado, codos a unos 45° en press, rotación externa con el codo pegado, colgado con hombros activos. Si la animación y el tip de técnica dicen cosas distintas, corrige la animación.
- Cada ejercicio sin animación propia usa una pose genérica de su grupo.
- `prefers-reduced-motion`: muestra solo la posición inicial y final, sin bucle.
- Rendimiento: anima solo `transform` y `opacity`, y pausa las animaciones fuera de pantalla con `IntersectionObserver`.

## Diálogos
- Un globo de texto junto al personaje, con frases cortas en español de Chile, cercanas y sin exagerar: "Codo pegado al cuerpo, lento y sin dolor 👌".
- Hay frases para: presentar la rutina, el primer ejercicio, la mitad de la sesión, la última serie, un récord, un dolor alto ("Hasta aquí por hoy con este. Pasemos al siguiente") y el final de la sesión.
- Guárdalas en `js/dialogos.js`, por personaje y situación, con varias opciones para que no se repitan.
- El coach nunca da diagnósticos ni consejos médicos; ante un dolor fuerte o raro sugiere consultar al kinesiólogo.

## Proceso
1. Primero diseña el elenco en una página de muestra (`docs/personajes.html`) con los 5 personajes quietos y 3 animaciones de prueba (rotación externa, remo a una mano y sentadilla goblet). Espera mi visto bueno.
2. Después anima todos los ejercicios de la biblioteca de `docs/especificacion.md`.
3. Revisa cada animación a 390 px y comprueba que la técnica coincida con el tip.
