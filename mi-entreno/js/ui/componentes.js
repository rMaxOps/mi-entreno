/* Componentes: stepper, slider de dolor y guía de ejercicios. */
import { GUIDE, TYPES } from '../datos/catalogo.js';
import { S } from '../estado.js';
import { getEx } from '../logica/ejercicios.js';
import { $, esc, pColor, painFace, painWord } from '../util.js';
import { openModal } from './modales.js';
import { pjStage } from './personajes-app.js';
/* ---------- Componentes ---------- */
/* Stepper: número grande arriba y botones − / + abajo. "pop" anima el número que acaba de cambiar. */
export function stepper(label, valHtml, act, attrs, pop = false) {
  return `<div class="stp"><div class="stp-l">${label}</div>
    <div class="stp-v ${pop ? 'pop' : ''}">${valHtml}</div>
    <div class="stp-bs"><button class="stp-b" data-act="${act}" ${attrs} data-d="-1" aria-label="Menos ${esc(label)}">−</button>
    <button class="stp-b" data-act="${act}" ${attrs} data-d="1" aria-label="Más ${esc(label)}">+</button></div></div>`;
}
/* Slider de dolor: el número, la carita y el botón cambian de color en vivo */
export function painSlider(id, v, label) {
  return `<div class="slider" id="${id}-wrap" style="--pc:${pColor(v)}">
    <div class="val"><span class="num" id="${id}-num">${v}</span><span class="of">/10</span><span class="face" id="${id}-f" aria-hidden="true">${painFace(v)}</span></div>
    <div class="pword" id="${id}-w">${painWord(v)}</div>
    <input type="range" min="0" max="10" step="1" value="${v}" data-in="${id}" aria-label="${esc(label)}" aria-valuetext="${v} de 10, ${painWord(v)}">
    <div class="scale"><span>0 sin dolor</span><span>5</span><span>10 máximo</span></div></div>`;
}
export function updPainSlider(id, v) {
  const wrap = $(`#${id}-wrap`); if (wrap) wrap.style.setProperty('--pc', pColor(v));
  const n = $(`#${id}-num`); if (n) n.textContent = v;
  const w = $(`#${id}-w`); if (w) w.textContent = painWord(v);
  const f = $(`#${id}-f`);
  if (f && f.textContent !== painFace(v)) { f.textContent = painFace(v); f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop'); }
  const r = $(`[data-in="${id}"]`); if (r) r.setAttribute('aria-valuetext', `${v} de 10, ${painWord(v)}`);
}
export const shoulderBadge = ex => ex.shoulder === 'care' ? '<span class="badge care">⚠ cuidado</span>' : '';
export function guideHtml(ex) {
  const g = GUIDE[ex.id];
  let h = '<div class="guide">';
  if (g) {
    h += `<h4>Cómo se hace</h4><ol class="howto">${g.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`;
    h += `<h4>Errores comunes</h4><ul class="dots small">${g.errors.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
  } else {
    h += `<h4>Cómo se hace</h4><p class="small">${esc(ex.tip || 'Sin descripción. Puedes agregar un tip editando el ejercicio en Más.')}</p>`;
  }
  const care = [g && g.shoulder, ex.shoulder === 'care' && g ? ex.tip : ''].filter(Boolean);
  if (care.length) h += `<div class="note ${ex.shoulder === 'care' ? 'warn' : 'info'} small"><b>${ex.shoulder === 'care' ? '⚠ ' : ''}Tu hombro:</b> ${care.map(esc).join(' ')}</div>`;
  if (g && g.video) {
    h += `<a class="btn block vid" href="${esc(g.video.url)}" target="_blank" rel="noopener">▶ Ver video</a>
      <p class="tiny muted center">“${esc(g.video.title)}” · ${esc(g.video.channel)}<br>Se abre en YouTube (necesita internet)</p>`;
  } else {
    h += `<a class="btn block vid" href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' técnica')}" target="_blank" rel="noopener">▶ Buscar videos</a>
      <p class="tiny muted center">Se abre en YouTube (necesita internet)</p>`;
  }
  return h + '</div>';
}
export function guideModal(id, from) {
  const ex = getEx(id);
  const back = from === 'lib' ? `<button class="btn grow" data-act="lib-back">← Biblioteca</button><button class="btn pri grow" data-act="lib-pick" data-id="${esc(ex.id)}">+ Agregar</button>`
    : '<button class="btn pri big" data-act="modal-close">Cerrar</button>';
  openModal(`<div class="row between"><h2 class="mb0">${esc(ex.name)}</h2>${shoulderBadge(ex)}</div>
    <p class="tiny muted">${esc(ex.group)} · ${esc(TYPES[ex.type] || '')} · meta ${esc(ex.goal)}${ex.type === 't' ? ' s' : ''}</p>
    ${pjStage(ex)}${guideHtml(ex)}<div class="row mt2">${back}</div>`);
}
export const sideTxt = () => ({ izq: 'izquierdo', der: 'derecho', ambos: '(ambos)' })[S.settings.side] || '';

