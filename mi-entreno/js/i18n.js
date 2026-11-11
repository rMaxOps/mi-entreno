/* Textos de la app (i18n). Están en i18n/es.json para poder agregar otros idiomas después.
   Uso: t('tabs.inicio') o t('saludo', { nombre: 'Max' }) con "Hola, {nombre}" en el JSON.
   Si una clave no existe, devuelve la clave misma (así se nota en pantalla que falta). */
export const LOCALE = 'es-CL';
let TEXTOS = {};

/* Carga el archivo de textos una vez, al arrancar */
export async function cargarTextos(idioma = 'es') {
  try {
    const r = await fetch(new URL(`../i18n/${idioma}.json`, import.meta.url));
    TEXTOS = await r.json();
  } catch (e) { TEXTOS = {}; }
}

export function t(clave, vars = {}) {
  const v = clave.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), TEXTOS);
  if (typeof v !== 'string') return clave;
  return v.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}

/* Traduce los textos fijos del HTML marcados con data-t="clave" */
export function aplicarTextos(raiz = document) {
  raiz.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
}
