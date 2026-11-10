# mi-entreno

App web personal para registrar entrenos en casa (barra de dominadas + mancuernas), con seguimiento del dolor de hombro.

La app vive en la carpeta [`mi-entreno/`](mi-entreno/). Es una sola página (HTML + CSS + JS vanilla), sin build ni dependencias.

## Qué hace

- **Check-in** antes de entrenar (dolor 0-10, energía, sueño) con semáforo y plantilla recomendada según la fase.
- **Sesión en curso**: calentamiento, cronómetro, "Última vez", sugerencia de progresión, registro de series con dolor, alertas, temporizador de descanso con sonido y vibración, pantalla siempre encendida. El borrador se guarda solo.
- **Plan por fases** (Retomar → Construir base → Dividir) con reglas para avanzar o retroceder.
- **Check-in del día siguiente**: "¿Cómo amaneció el hombro?".
- **Guía de ejercicios**: pasos numerados, errores comunes, cuidados del hombro y un video para cada ejercicio.
- **Historial** por mes, **Progreso** por ejercicio (gráficos SVG, récords, dolor) y **Ajustes** (pesos, descanso, plantillas y ejercicios propios, respaldo JSON).
- Funciona **sin internet** y se puede instalar en la pantalla de inicio (PWA).

## Datos

Todo se guarda en `localStorage` del navegador del teléfono: nada se sube a internet. Usa **Más → Respaldo** para descargar o copiar un JSON de vez en cuando.

## Probar en el computador

```bash
npx serve .
# y abre http://localhost:3000/mi-entreno/
```

## Publicar cambios

Si cambias archivos de la app, sube el número de `CACHE` en `mi-entreno/sw.js` (por ejemplo `mi-entreno-v2`) para que el celular descargue la versión nueva.
