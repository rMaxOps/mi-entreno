/* Dibuja la pantalla actual, el tema y el confeti. */
import { t } from '../i18n.js';
import { S, UI } from '../estado.js';
import { pjObserve } from '../personajes.js';
import { $, hms } from '../util.js';
import { vEntreno } from '../vistas/entreno.js';
import { vHistorial } from '../vistas/historial.js';
import { vInicio } from '../vistas/inicio.js';
import { vMas } from '../vistas/mas.js';
import { vProgreso } from '../vistas/progreso.js';
import { tickChrono } from './temporizador.js';
/* ---------- Vistas ---------- */
export const TAB_ORDER = ['inicio', 'entreno', 'historial', 'progreso', 'mas'];
export function applyTheme() {
  const t = S.settings.theme, root = document.documentElement;
  if (t === 'light' || t === 'dark') root.dataset.theme = t; else delete root.dataset.theme;
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  if (bg) $('meta[name="theme-color"]').setAttribute('content', bg);
}
export function render() {
  document.querySelectorAll('#tabs button').forEach(b => {
    const on = b.dataset.tab === UI.tab; b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  $('#tab-ind').style.setProperty('--i', TAB_ORDER.indexOf(UI.tab));
  $('#live').hidden = !S.draft;
  $('#title').textContent = UI.tab === 'entreno' && S.draft ? S.draft.tplName : t('tabs.' + UI.tab);
  $('#top-extra').innerHTML = UI.tab !== 'entreno' && S.draft ? `<button class="btn pri top-live" data-act="tab" data-tab="entreno" aria-label="Volver al entreno en curso">● <span data-chrono>${hms(Date.now() - S.draft.start)}</span></button>` : '';
  const v = { inicio: vInicio, entreno: vEntreno, historial: vHistorial, progreso: vProgreso, mas: vMas }[UI.tab];
  const view = $('#view');
  view.innerHTML = v();
  /* las tarjetas entran con un fade solo al cambiar de pantalla, no en cada toque */
  view.classList.remove('enter');
  if (UI.enter) { void view.offsetWidth; view.classList.add('enter'); UI.enter = false; }
  UI.pop = null;
  if (typeof pjObserve === 'function') pjObserve();
  document.documentElement.style.setProperty('--toph', $('.top').offsetHeight + 'px');
  tickChrono();
}
/* Microcelebración: confeti liviano (se omite si el teléfono pide menos movimiento) */
export function confetti() {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
  const colors = ['var(--ac)', 'var(--ok)', 'var(--warn)', 'var(--c1)', '#ffffff'];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
    p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    p.style.animationDelay = Math.random() * 0.25 + 's';
    box.appendChild(p);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2000);
}

