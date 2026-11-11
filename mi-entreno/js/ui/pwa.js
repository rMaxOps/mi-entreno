/* Instalar la app (PWA). */
import { UI } from '../estado.js';
import { ACT } from '../registro.js';
import { render } from './render.js';
import { toast } from './toast.js';
/* ---------- Instalar la app (PWA) ---------- */
/* Chrome/Android avisa que se puede instalar; guardamos ese aviso para mostrarlo con un botón propio */
export let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (UI.tab === 'mas') render(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('¡App instalada! Ábrela desde la pantalla de inicio.', 'ok'); if (UI.tab === 'mas') render(); });
export const isInstalled = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
export const offlineReady = () => !!(navigator.serviceWorker && navigator.serviceWorker.controller);
export function installCard() {
  const ready = offlineReady() ? '<p class="small p-g">✓ Lista para usarse sin internet.</p>' : '';
  if (isInstalled()) return ready ? `<div class="card"><h2>App instalada</h2>${ready}</div>` : '';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const how = installEvt ? '<button class="btn pri big mt" data-act="install">Instalar Mi Entreno</button>'
    : ios ? '<div class="note info small">En iPhone, desde Safari: toca <b>Compartir</b> (el cuadrado con la flecha ⬆) y luego <b>“Agregar a pantalla de inicio”</b>.</div>'
    : '<div class="note info small">En Android con Chrome: toca el menú <b>⋮</b> y luego <b>“Instalar app”</b> o <b>“Agregar a la pantalla de inicio”</b>.</div>';
  return `<div class="card"><h2>Instalar la app</h2><p class="muted small">Ábrela como una app más del teléfono: a pantalla completa, sin la barra del navegador y sin internet.</p>${how}${ready}</div>`;
}

/* Botón "Instalar Mi Entreno": muestra el aviso que guardamos */
ACT['install'] = async () => {
  if (!installEvt) return;
  installEvt.prompt();
  try { await installEvt.userChoice; } catch (e) { /* el usuario cerró el aviso */ }
  installEvt = null; render();
};
