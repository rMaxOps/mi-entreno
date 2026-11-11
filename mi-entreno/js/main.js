/* Punto de entrada: arranca la app. */
/* Módulos que registran botones, entradas y eventos al cargarse */
import './ui/acciones.js';
import './ui/graficos.js';
import './ui/pwa.js';
import './rutina.js';
import { cuentaInicial, iniciarCuenta } from './nube/cuenta.js';
import { onboardingPendiente, tieneDatos } from './logica/perfil.js';
import { iniciarOnboarding } from './vistas/perfil.js';
import { S, UI } from './estado.js';
import { aplicarTextos, cargarTextos } from './i18n.js';
import { pendingNextDay } from './logica/fases.js';
import { ndModal } from './ui/modales.js';
import { applyTheme, render } from './ui/render.js';
import { runRest, updateWakeLock } from './ui/temporizador.js';
import { toast } from './ui/toast.js';
/* ---------- Inicio de la app ---------- */
function init() {
  aplicarTextos();
  cuentaInicial();          // si la última vez había una cuenta, abre su copia local (sirve sin internet)
  if (onboardingPendiente() && !tieneDatos()) iniciarOnboarding();   // persona nueva: asistente de bienvenida
  applyTheme();
  if (window.matchMedia) matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', applyTheme);
  UI.enter = true;
  if (S.draft) {
    UI.tab = 'entreno';
    if (S.draft.rest && S.draft.rest.end < Date.now() - 6000) S.draft.rest = null;
  }
  render();
  if (S.draft) { runRest(); updateWakeLock(); toast('Retomaste tu entreno en curso.', 'ok'); }
  const pend = pendingNextDay();
  if (pend) ndModal(pend.id);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* sin modo offline */ }); });
  }
}
/* Primero los textos (i18n/es.json) y después la app */
await cargarTextos();
init();
iniciarCuenta();            // después de dibujar: conecta con Supabase sin bloquear la app
