/* Hojas y diálogos dentro de la app (sin alert/confirm). */
import { t } from '../i18n.js';
import { zonaDolor } from '../logica/perfil.js';
import { GROUPS, TYPES } from '../datos/catalogo.js';
import { S, UI, save } from '../estado.js';
import { allEx, getEx, preOf } from '../logica/ejercicios.js';
import { pjObserve } from '../personajes.js';
import { HOOKS } from '../registro.js';
import { $, cap, esc, fmtDate, plural, uid } from '../util.js';
import { painSlider, shoulderBadge } from './componentes.js';
import { render } from './render.js';
import { toast } from './toast.js';
/* ---------- Modales (sin alert/confirm del navegador) ---------- */
export function openModal(html) {
  $('#modal-root').innerHTML = `<div class="modal" data-act="modal-bg"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  if (typeof pjObserve === 'function') pjObserve();
}
/* Antes de cerrar, avisa a quien lo pidió (por ejemplo, para cancelar una lectura en curso) */
export function closeModal() { HOOKS.closeModal.forEach(f => f()); $('#modal-root').innerHTML = ''; UI.confirmFn = null; }
export function ask(title, text, okLabel, fn, danger = true) {
  openModal(`<h2>${esc(title)}</h2><p class="muted">${esc(text)}</p><div class="row mt2"><button class="btn grow" data-act="modal-close">Cancelar</button><button class="btn grow ${danger ? 'danger' : 'pri'}" data-act="confirm-ok">${esc(okLabel)}</button></div>`);
  UI.confirmFn = fn;
}
export function libModal() {
  const q = UI.lib.q.trim().toLowerCase();
  const exs = allEx().filter(e => !q || e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q));
  const groups = [...new Set([...GROUPS, ...exs.map(e => e.group)])];
  let list = '';
  groups.forEach(g => {
    const es = exs.filter(e => e.group === g); if (!es.length) return;
    list += `<h3>${esc(g)}</h3>` + es.map(e => `<div class="lib-row"><button class="lib-item" data-act="lib-pick" data-id="${esc(e.id)}"><span class="grow"><b>${esc(e.name)}</b><div class="tiny muted">${esc(TYPES[e.type])} · meta ${esc(e.goal)}</div></span>${shoulderBadge(e)}</button><button class="btn icon q" data-act="guide-open" data-id="${esc(e.id)}" data-from="lib" aria-label="Cómo se hace ${esc(e.name)}">?</button></div>`).join('');
  });
  return list || '<p class="muted">Nada coincide.</p>';
}
export function openLib(target) {
  UI.lib = { q: '', target };
  openModal(`<div class="row between"><h2 class="mb0">Biblioteca</h2><button class="btn sm ghost" data-act="${target === 'tpl' ? 'tpl-reopen' : 'modal-close'}">Cerrar</button></div>
    <div class="field"><input class="inp" type="search" data-in="lib-q" placeholder="Buscar ejercicio…" aria-label="Buscar ejercicio"></div>
    <div id="lib-list">${libModal()}</div>
    <button class="btn block mt" data-act="ex-new">+ Crear ejercicio propio</button>`);
}
export function ndModal(id) {
  const s = S.sessions.find(x => x.id === id); if (!s) return;
  UI.nd = { id, pain: preOf(s) };
  openModal(`<h2>${esc((zonaDolor() ? t('perfil.como_amanecio', { zona: zonaDolor() }) : t('perfil.como_amanecio_general')))}</h2><p class="muted small">${esc(cap(fmtDate(s.start)))} hiciste ${esc(s.tplName)}. Antes de entrenar: ${preOf(s)}/10${s.painEnd != null ? `, al terminar: ${s.painEnd}/10` : ''}.</p>
    ${painSlider('nd-pain', UI.nd.pain, (zonaDolor() ? t('perfil.como_amanecio', { zona: zonaDolor() }) : t('perfil.como_amanecio_general')))}
    <button class="btn pri big mt" data-act="nd-save">Guardar</button><button class="btn block ghost mt" data-act="nd-skip">Ahora no</button>`);
}
export function tplEditor() {
  const t = UI.tplEdit;
  openModal(`<h2>${t.id ? 'Editar plantilla' : 'Nueva plantilla'}</h2>
    <div class="field"><label for="tpl-name">Nombre</label><input class="inp" id="tpl-name" data-in="tpl-name" value="${esc(t.name)}" placeholder="Ej: Tirón suave"></div>
    ${t.items.length ? t.items.map((i, k) => { const ex = getEx(i.ex); return `<div class="card" style="background:var(--s2);margin-bottom:8px">
      <div class="row"><b class="grow">${k + 1}. ${esc(ex.name)}</b>${shoulderBadge(ex)}</div>
      <div class="row mt"><div class="stp-c grow"><button class="stp-b" data-act="tpl-it" data-k="${k}" data-f="sets" data-d="-1" aria-label="Menos series">−</button><div class="stp-v" style="font-size:16px">${i.sets} series</div><button class="stp-b" data-act="tpl-it" data-k="${k}" data-f="sets" data-d="1" aria-label="Más series">+</button></div></div>
      <div class="row mt"><input class="inp" style="flex:1" data-in="tpl-goal" data-k="${k}" value="${esc(i.goal)}" aria-label="Meta"><input class="inp" style="flex:1" type="number" inputmode="numeric" data-in="tpl-rest" data-k="${k}" value="${i.rest || ''}" placeholder="Desc. ${S.settings.rest}" aria-label="Descanso en segundos"></div>
      <div class="tiny muted">Meta (reps o segundos) · descanso en segundos</div>
      <div class="tools"><button class="btn sm" data-act="tpl-it" data-k="${k}" data-f="move" data-d="-1" ${k === 0 ? 'disabled' : ''}>↑</button><button class="btn sm" data-act="tpl-it" data-k="${k}" data-f="move" data-d="1" ${k === t.items.length - 1 ? 'disabled' : ''}>↓</button><button class="btn sm danger" data-act="tpl-it" data-k="${k}" data-f="rm">Quitar</button></div></div>`; }).join('') : '<p class="muted small">Sin ejercicios todavía.</p>'}
    <button class="btn block" data-act="lib-open" data-target="tpl">+ Agregar ejercicio</button>
    <div class="row mt2"><button class="btn grow" data-act="modal-close">Cancelar</button><button class="btn pri grow" data-act="tpl-save">Guardar</button></div>`);
}
export function exEditor() {
  const e = UI.exEdit;
  const sel = (id, opts, v) => `<select class="inp" id="${id}" data-in="${id}">${opts.map(([k, l]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  openModal(`<h2>${e.id ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h2>
    <div class="field"><label for="exf-name">Nombre</label><input class="inp" id="exf-name" data-in="exf-name" value="${esc(e.name)}" placeholder="Ej: Face pull con banda"></div>
    <div class="field"><label for="exf-group">Grupo</label>${sel('exf-group', GROUPS.map(g => [g, g]), e.group)}</div>
    <div class="field"><label for="exf-type">Tipo</label>${sel('exf-type', Object.entries(TYPES), e.type)}</div>
    <div class="field"><label for="exf-shoulder">Hombro</label>${sel('exf-shoulder', [['ok', 'Amigable'], ['care', '⚠ Cuidado']], e.shoulder)}</div>
    <div class="field"><label for="exf-goal">Meta (ej: 8-12)</label><input class="inp" id="exf-goal" data-in="exf-goal" value="${esc(e.goal)}"></div>
    <div class="field"><label for="exf-tip">Tip de técnica</label><textarea class="inp" id="exf-tip" data-in="exf-tip">${esc(e.tip)}</textarea></div>
    <div class="row mt2">${e.id ? '<button class="btn danger" data-act="ex-del">Borrar</button>' : ''}<button class="btn grow" data-act="${e.back === 'lib' ? 'lib-back' : 'modal-close'}">Cancelar</button><button class="btn pri grow" data-act="ex-save">Guardar</button></div>`);
}
export function saveAsTemplate(items, defName) {
  UI.newTplName = defName;
  openModal(`<h2>Guardar como plantilla</h2><div class="field"><label for="ntpl">Nombre</label><input class="inp" id="ntpl" data-in="ntpl" value="${esc(defName)}"></div>
    <p class="muted small">${plural(items.length, 'ejercicio', 'ejercicios')}, con sus series y descansos.</p>
    <div class="row mt2"><button class="btn grow" data-act="modal-close">Cancelar</button><button class="btn pri grow" data-act="confirm-ok">Guardar</button></div>`);
  UI.confirmFn = () => {
    const name = (UI.newTplName || '').trim() || defName;
    S.templates.push({ id: 'u_' + uid(), name, desc: 'Plantilla propia', items: items.map(i => ({ ex: i.ex, sets: Math.max(1, i.sets || 1), goal: i.goal, rest: i.rest || null, note: '' })) });
    save(); toast(`Plantilla “${name}” guardada.`, 'ok'); if (UI.tab === 'mas') render();
  };
}

