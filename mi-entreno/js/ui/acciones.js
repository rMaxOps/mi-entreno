/* Acciones de los botones (data-act) y entradas (data-in). */
import { GROUPS, PHASES } from '../datos/catalogo.js';
import { S, UI, save } from '../estado.js';
import { getEx, nextW, preOf, prevW } from '../logica/ejercicios.js';
import { copyText, exportData, importData } from '../logica/respaldo.js';
import { ACT, INP } from '../registro.js';
import { $, DAY, clamp, dayStr, pLevel, uid } from '../util.js';
import { findItem, logSet, newItem, startSession } from '../vistas/entreno.js';
import { finishSave } from '../vistas/terminar.js';
import { guideModal, updPainSlider } from './componentes.js';
import { ask, closeModal, exEditor, libModal, ndModal, openLib, openModal, saveAsTemplate, tplEditor } from './modales.js';

import { applyTheme, render } from './render.js';
import { beep3, restTick, stopRest, unlockAudio, updateWakeLock, vibrate } from './temporizador.js';
import { toast } from './toast.js';
/* ---------- Acciones (clicks) ---------- */
Object.assign(ACT, {
  'tab': d => { UI.enter = UI.tab !== d.tab; UI.tab = d.tab; if (d.tab !== 'entreno') UI.finishing = null; render(); window.scrollTo(0, 0); },
  'go-checkin': () => { UI.enter = true; UI.tab = 'entreno'; UI.ci = null; render(); window.scrollTo(0, 0); },
  'set-theme': d => { S.settings.theme = d.v; save(); applyTheme(); render(); },
  'ci-energy': d => { UI.ci.energy = +d.v; render(); },
  'ci-sleep': d => { UI.ci.sleep = clamp(UI.ci.sleep + 0.5 * d.d, 0, 14); render(); },
  'ci-next': () => { UI.ci.step = 'pick'; UI.ci.withRehab = null; unlockAudio(); render(); window.scrollTo(0, 0); },
  'ci-back': () => { UI.ci.step = 'form'; render(); },
  'ci-rehab': () => { UI.ci.withRehab = !UI.ci.withRehab; render(); },
  'start': d => startSession(d.tpl),
  'wu': d => { S.draft.warmup[+d.i] = !S.draft.warmup[+d.i]; save(); render(); },
  'wu-open': () => { S.draft.warmOpen = !S.draft.warmOpen; save(); render(); },
  'it-open': d => { const it = findItem(d.uid); if (it) { it.open = !it.open; save(); render(); } },
  'it-tip': d => { const it = findItem(d.uid); if (it) { it.tip = !it.tip; save(); render(); } },
  'step': d => {
    const it = findItem(d.uid); if (!it) return; const ex = getEx(it.ex), dir = +d.d;
    if (d.f === 'w') { const v = dir > 0 ? nextW(ex, it.inp.w) : prevW(ex, it.inp.w); if (v != null) it.inp.w = v; }
    else if (d.f === 'reps') it.inp.reps = clamp(it.inp.reps + dir, 0, 200);
    else if (d.f === 'secs') it.inp.secs = clamp(it.inp.secs + 5 * dir, 0, 3600);
    else if (d.f === 'pain') it.inp.pain = clamp(it.inp.pain + dir, 0, 10);
    UI.pop = it.uid + ':' + d.f;
    save(); render();
  },
  'log': d => { unlockAudio(); updateWakeLock(); logSet(d.uid); },
  'del-set': d => { const it = findItem(d.uid); if (!it) return; ask('¿Borrar esta serie?', `Serie ${+d.i + 1} de ${getEx(it.ex).name}.`, 'Borrar', () => { it.done.splice(+d.i, 1); it.alert = null; save(); render(); }); },
  'it-move': d => { const a = S.draft.items, i = a.findIndex(x => x.uid === d.uid), j = i + +d.d; if (i < 0 || j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; save(); render(); },
  'it-sets': d => { const it = findItem(d.uid); if (it) { it.sets = clamp(it.sets + +d.d, 1, 10); save(); render(); } },
  'it-rm': d => {
    const it = findItem(d.uid); if (!it) return;
    const go = () => { S.draft.items = S.draft.items.filter(x => x.uid !== d.uid); save(); render(); };
    if (it.done.length) ask('¿Quitar este ejercicio?', `Se borrarán sus ${it.done.length} series registradas hoy.`, 'Quitar', go); else go();
  },
  'lib-open': d => { if (d.target === 'tpl') syncTplInputs(); openLib(d.target); },
  'lib-pick': d => {
    const ex = getEx(d.id);
    if (UI.lib.target === 'tpl') { UI.tplEdit.items.push({ ex: ex.id, sets: 3, goal: ex.goal, rest: null, note: '' }); tplEditor(); return; }
    const it = newItem({ ex: ex.id, sets: 3, goal: ex.goal }, pLevel(S.draft.checkin.pain) === 'y');
    S.draft.items.forEach(x => { x.open = false; }); it.open = true; S.draft.items.push(it);
    closeModal(); save(); render(); toast(`Agregado: ${ex.name}`, 'ok');
  },
  'tpl-reopen': () => tplEditor(),
  'finish': () => { UI.finishing = { pain: S.draft.checkin.pain, notes: '' }; stopRest(); save(); render(); window.scrollTo(0, 0); },
  'fin-back': () => { UI.finishing = null; render(); },
  'fin-save': () => finishSave(),
  'discard': () => ask('¿Descartar la sesión?', 'Se perderán las series registradas en este entreno.', 'Descartar', () => { stopRest(); S.draft = null; UI.ci = null; save(); updateWakeLock(); render(); toast('Sesión descartada.'); }),
  'tpl-from-draft': () => saveAsTemplate(S.draft.items, `${S.draft.tplName} (mía)`),
  'tpl-from-hist': d => { const s = S.sessions.find(x => x.id === d.id); if (s) saveAsTemplate(s.items, `${s.tplName} (mía)`); },
  'rest-add': d => { const r = S.draft && S.draft.rest; if (!r) return; const now = Date.now(); r.end = Math.max(now, r.end) + 1000 * +d.d; if (r.end < now) r.end = now; r.total = Math.max(1, r.total + +d.d); r.fired = r.end <= now; save(); restTick(); },
  'rest-skip': () => { stopRest(); save(); },
  'nd-open': d => ndModal(d.id),
  'nd-save': () => {
    const s = S.sessions.find(x => x.id === UI.nd.id); if (!s) return closeModal();
    s.nextDay = { pain: UI.nd.pain, at: Date.now() }; save(); render();
    if (s.nextDay.pain >= preOf(s) + 2) openModal(`<h2>Amaneció peor</h2><div class="note warn">El hombro está ${s.nextDay.pain - preOf(s)} puntos peor que antes de entrenar (${preOf(s)} → ${s.nextDay.pain}). <b>La próxima vez baja la carga</b>: la app ya lo considera en las sugerencias.</div><p class="small muted">Si es dolor punzante, con hormigueo o pérdida de fuerza, consulta a tu kinesiólogo.</p><button class="btn pri big mt" data-act="modal-close">Entendido</button>`);
    else { closeModal(); toast('Guardado. ¡Gracias!', 'ok'); }
  },
  'nd-skip': () => { S.ui.ndSkip[UI.nd.id] = true; save(); closeModal(); render(); },
  'phase-set': d => {
    const p = +d.p; if (p === S.settings.phase) return;
    const go = () => { S.settings.phase = p; S.settings.phaseSince = dayStr(Date.now()); S.ui.phaseSnooze = 0; if (p === 3 && S.settings.perWeek < 4) S.settings.perWeek = 4; save(); render(); toast(`Ahora estás en la Fase ${p} · ${PHASES[p].name}.`, 'ok'); };
    ask(`¿Cambiar a la Fase ${p}?`, `${PHASES[p].name}: ${PHASES[p].bullets[0]}`, 'Cambiar', go, false);
  },
  'phase-snooze': () => { S.ui.phaseSnooze = Date.now() + 3 * DAY; save(); render(); },
  'hist-toggle': d => { UI.histOpen[d.id] = !UI.histOpen[d.id]; render(); },
  'hist-del': d => ask('¿Borrar este entreno?', 'Esta acción no se puede deshacer.', 'Borrar', () => { S.sessions = S.sessions.filter(s => s.id !== d.id); save(); render(); toast('Entreno borrado.'); }),
  'set-side': d => { S.settings.side = d.v; save(); render(); },
  'w-del': d => { if (S.settings.weights.length <= 1) return toast('Deja al menos un peso.', 'bad'); S.settings.weights = S.settings.weights.filter(w => w !== +d.v); save(); render(); },
  'w-add': () => {
    const v = parseFloat(String($('#w-new').value).replace(',', '.'));
    if (!(v > 0 && v <= 100)) return toast('Escribe un peso válido (ej: 7,5).', 'bad');
    const r = Math.round(v * 100) / 100; if (S.settings.weights.includes(r)) return toast('Ese peso ya está.');
    S.settings.weights.push(r); S.settings.weights.sort((a, b) => a - b); save(); render();
  },
  'set-num': d => {
    const st = S.settings, dir = +d.d;
    if (d.k === 'rest') st.rest = clamp(st.rest + 15 * dir, 15, 600);
    if (d.k === 'perWeek') st.perWeek = clamp(st.perWeek + dir, 1, 7);
    if (d.k === 'threshold') st.threshold = clamp(st.threshold + dir, 1, 9);
    save(); render();
  },
  'set-tog': d => { S.settings[d.k] = !S.settings[d.k]; save(); render(); },
  'test-beep': () => { unlockAudio(); beep3(); vibrate([200, 100, 200]); },
  'tpl-new': () => { UI.tplEdit = { id: null, name: '', items: [] }; tplEditor(); },
  'tpl-edit': d => { const t = S.templates.find(x => x.id === d.id); if (!t) return; UI.tplEdit = JSON.parse(JSON.stringify(t)); tplEditor(); },
  'tpl-del': d => { const t = S.templates.find(x => x.id === d.id); ask('¿Borrar plantilla?', `“${t ? t.name : ''}” se eliminará. Tus entrenos guardados no cambian.`, 'Borrar', () => { S.templates = S.templates.filter(x => x.id !== d.id); save(); render(); }); },
  'tpl-it': d => {
    syncTplInputs();
    const a = UI.tplEdit.items, k = +d.k;
    if (d.f === 'sets') a[k].sets = clamp(a[k].sets + +d.d, 1, 10);
    if (d.f === 'move') { const j = k + +d.d; if (j >= 0 && j < a.length) [a[k], a[j]] = [a[j], a[k]]; }
    if (d.f === 'rm') a.splice(k, 1);
    tplEditor();
  },
  'tpl-save': () => {
    syncTplInputs(); const t = UI.tplEdit;
    if (!t.name.trim()) return toast('Ponle un nombre a la plantilla.', 'bad');
    const clean = { id: t.id || 'u_' + uid(), name: t.name.trim(), desc: t.desc || 'Plantilla propia', items: t.items };
    const i = S.templates.findIndex(x => x.id === clean.id);
    if (i >= 0) S.templates[i] = clean; else S.templates.push(clean);
    save(); closeModal(); render(); toast('Plantilla guardada.', 'ok');
  },
  'ex-new': () => { const fromLib = !!$('#lib-list'); if (fromLib && UI.lib.target === 'tpl') syncTplInputs(); UI.exEdit = { id: null, name: '', group: GROUPS[0], type: 'wr', shoulder: 'ok', goal: '8-12', tip: '', back: fromLib ? 'lib' : '' }; exEditor(); },
  'ex-edit': d => { const e = S.exercises.find(x => x.id === d.id); if (e) { UI.exEdit = { ...e, back: '' }; exEditor(); } },
  'lib-back': () => openLib(UI.lib.target),
  'ex-save': () => {
    const e = UI.exEdit;
    if (!e.name.trim()) return toast('Ponle un nombre al ejercicio.', 'bad');
    const clean = { id: e.id || 'u_' + uid(), name: e.name.trim(), group: e.group, type: e.type, shoulder: e.shoulder, goal: e.goal.trim() || '8-12', tip: e.tip.trim(), custom: true };
    const i = S.exercises.findIndex(x => x.id === clean.id);
    if (i >= 0) S.exercises[i] = clean; else S.exercises.push(clean);
    save(); toast('Ejercicio guardado.', 'ok');
    if (e.back === 'lib') openLib(UI.lib.target); else { closeModal(); render(); }
  },
  'ex-del': () => {
    const id = UI.exEdit.id;
    ask('¿Borrar ejercicio?', 'Dejará de aparecer en la biblioteca. Tu historial se mantiene.', 'Borrar', () => { const e = S.exercises.find(x => x.id === id); if (e) e.hidden = true; save(); render(); });
  },
  'exp-copy': async () => { toast(await copyText(exportData()) ? 'Respaldo copiado. Pégalo en tus notas o correo.' : 'No se pudo copiar; usa Descargar.', 'ok'); },
  'exp-dl': () => {
    const blob = new Blob([exportData()], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `mi-entreno-respaldo-${dayStr(Date.now())}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Respaldo descargado.', 'ok');
  },
  'imp-file': () => $('#imp-file').click(),
  'imp-paste': () => { const t = $('#imp-text').value.trim(); if (!t) return toast('Pega primero el JSON.', 'bad'); importData(t); },
  'guide-open': d => guideModal(d.id, d.from),
  'modal-close': () => closeModal(),
  /* tocar fuera de la hoja la cierra, salvo cuando hay una rutina importada sin guardar */
  'modal-bg': (d, el, e) => { if (e.target === el && !(UI.imp && ['review', 'confirm'].includes(UI.imp.step))) closeModal(); },
  'confirm-ok': () => { const fn = UI.confirmFn; closeModal(); if (fn) fn(); },
});
export function syncTplInputs() {
  if (!UI.tplEdit) return;
  const n = $('#tpl-name'); if (n) UI.tplEdit.name = n.value;
  document.querySelectorAll('[data-in="tpl-goal"]').forEach(e => { const it = UI.tplEdit.items[+e.dataset.k]; if (it) it.goal = e.value; });
  document.querySelectorAll('[data-in="tpl-rest"]').forEach(e => { const it = UI.tplEdit.items[+e.dataset.k]; if (it) it.rest = parseInt(e.value, 10) || null; });
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  if (el.dataset.act === 'modal-bg' && e.target !== el) return;
  fn(el.dataset, el, e);
});

/* ---------- Entradas (sliders, textos, selects) ---------- */
Object.assign(INP, {
  'ci-pain': v => { UI.ci.pain = +v; updPainSlider('ci-pain', +v); },
  'fin-pain': v => { UI.finishing.pain = +v; updPainSlider('fin-pain', +v); },
  'fin-notes': v => { UI.finishing.notes = v; },
  'nd-pain': v => { UI.nd.pain = +v; updPainSlider('nd-pain', +v); },
  'lib-q': v => { UI.lib.q = v; $('#lib-list').innerHTML = libModal(); },
  'prog-ex': v => { UI.prog.ex = v; UI.prog.metric = null; render(); },
  'start-date': v => { if (v) { S.settings.startDate = v; save(); } },
  'phase-since': v => { if (v) { S.settings.phaseSince = v; save(); } },
  'ntpl': v => { UI.newTplName = v; },
  'exf-name': v => { UI.exEdit.name = v; }, 'exf-group': v => { UI.exEdit.group = v; }, 'exf-type': v => { UI.exEdit.type = v; },
  'exf-shoulder': v => { UI.exEdit.shoulder = v; }, 'exf-goal': v => { UI.exEdit.goal = v; }, 'exf-tip': v => { UI.exEdit.tip = v; },
});
document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.in; if (k && INP[k] && e.target.tagName !== 'SELECT') INP[k](e.target.value, e.target); });
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.in; if (k && INP[k] && (e.target.tagName === 'SELECT' || e.target.type === 'date')) INP[k](e.target.value, e.target); });
ACT['prog-metric'] = d => { UI.prog.metric = d.m; render(); };
$('#imp-file').addEventListener('change', e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => importData(String(r.result)); r.readAsText(f); e.target.value = '';
});

