/* Avisos cortos arriba de la pantalla. */
import { $ } from '../util.js';
/* ---------- Toast ---------- */
export let toastT = null;
export function toast(msg, kind = '') {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show ' + kind;
  clearTimeout(toastT); toastT = setTimeout(() => { t.className = 'toast ' + kind; }, 3200);
}

