---
name: rutina-desde-archivo
description: Cómo implementar en Mi Entreno la función de subir una foto o un PDF de una rutina (de un kinesiólogo, una revista o una captura) y convertirla automáticamente en una plantilla. Úsala al trabajar en importar rutinas, leer imágenes/PDF o llamar a la API de Claude desde la app.
---

# Crear una rutina desde una foto o un PDF

## Flujo para el usuario
1. En "Entreno", el botón **"📷 Crear rutina desde foto o PDF"** abre `<input type="file" accept="image/*,application/pdf" capture="environment">`, para sacar la foto con la cámara o elegir un archivo.
2. Se ve una vista previa del archivo y un indicador de "Leyendo tu rutina…".
3. La app muestra la **rutina interpretada y editable**: nombre, ejercicios, series, reps o segundos, descanso y notas. Cada ejercicio indica si coincide con uno de la biblioteca o si es nuevo.
4. Revisión de hombro: si algún ejercicio está marcado `care` o carga por encima de la cabeza, sale un aviso amable.
5. Botón **"Guardar como plantilla"**. Nada se guarda sin que yo lo confirme.

## Cómo leer el archivo
La app es estática (GitHub Pages), así que la lectura se hace con la **API de Claude directamente desde el navegador**:
- Endpoint: `POST https://api.anthropic.com/v1/messages`
- Headers: `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json` y `anthropic-dangerous-direct-browser-access: true`.
- Modelo: configurable en Ajustes, por defecto `claude-sonnet-5-5`.
- **Imagen:** bloque `{"type":"image","source":{"type":"base64","media_type":"image/jpeg","data":...}}`. Antes de enviarla, achícala con un `<canvas>` a un máximo de 1568 px por lado y comprímela en JPEG 0,85.
- **PDF:** bloque `{"type":"document","source":{"type":"base64","media_type":"application/pdf","data":...}}`. Limita el tamaño a unos 10 MB y avisa si es más grande.
- La API key la pego yo una vez en **Ajustes → "Lectura de rutinas con IA"** y se guarda solo en `localStorage` de mi celular. Muestra una nota clara: la key queda en este dispositivo, es una app personal y no se debe compartir el enlace con la key cargada. Incluye un botón para borrarla.
- Sin key o sin internet, ofrece la alternativa de **pegar el texto de la rutina**, que pasa por el mismo prompt o por un parser simple de líneas como "3x10 remo 6 kg".

## Prompt para la API
Pide **solo JSON** con este esquema, pasando en el mensaje la lista de ejercicios de la biblioteca (`id` y `nombre`) para que los empareje:
```json
{
  "nombre": "string",
  "notas": "string",
  "ejercicios": [
    {"match_id": "id de la biblioteca o null", "nombre": "string",
     "tipo": "wr|bw|r|t", "series": 3, "reps_min": 8, "reps_max": 12,
     "segundos": null, "peso_kg": null, "descanso_s": 90,
     "hombro": "ok|care", "nota": "string"}
  ],
  "dudas": ["cosas que no se pudieron leer bien"]
}
```
Reglas del prompt:
- Usa solo lo que dice el archivo; no inventes ejercicios.
- Si un dato no aparece, déjalo en `null` y anótalo en `dudas`.
- Marca `hombro: "care"` en los movimientos por encima de la cabeza, dominadas, fondos y flexiones.
- Las equivalencias que puede hacer: "10-12" → min 10 y max 12; "30''" → 30 segundos; "c/lado" → nota "por lado".

## Validación y guardado
- Parsea el JSON de forma defensiva: quita los bloques ``` si vienen y valida tipos y rangos.
- Si `match_id` es null, crea un ejercicio propio (prefijo `c_`) con los datos.
- Pide confirmación antes de guardar y muestra las `dudas` arriba en ámbar.
- Maneja los errores: key inválida (401), límite de uso (429), archivo muy grande y sin conexión, siempre con mensajes en español y una opción de reintentar.

## Prueba
Crea `docs/ejemplos/` con 2 o 3 rutinas de ejemplo (una foto de texto escrito a mano y un PDF) y prueba el parser con respuestas JSON de ejemplo, sin gastar API, mediante un modo `?mock=1`.
