/* Pantalla Entreno: check-in, elegir rutina y sesión. */
import { t } from '../i18n.js';
import { zonaDolor } from '../logica/perfil.js';
import { ENERGY, ENERGY_TXT, WARMUP } from '../datos/catalogo.js';
import { INTRO_RUTINA, decir } from '../dialogos.js';
import { S, UI, save } from '../estado.js';
import { allTpl, careCount, fmtSet, fmtSetLong, getEx, getTpl, lastFor, preOf, prevW, sessions } from '../logica/ejercicios.js';
import { neutralPressOk, recommend } from '../logica/fases.js';
import { suggest } from '../logica/progresion.js';
import { charOf, pjBubble, pjStill } from '../personajes.js';
import { importButton } from '../rutina.js';
import { guideHtml, painSlider, shoulderBadge, sideTxt, stepper } from '../ui/componentes.js';
import { checkinCoach, leadOf, pjStage, reactToSet } from '../ui/personajes-app.js';
import { confetti, render } from '../ui/render.js';
import { startRest, updateWakeLock, vibrate } from '../ui/temporizador.js';
import { toast } from '../ui/toast.js';
import { esc, hms, kg, n1, pColor, pDot, pLevel, plural, relDay, uid } from '../util.js';
import { vFinish } from './terminar.js';
/* Entreno */
export function vEntreno() {
  if (S.draft) return UI.finishing ? vFinish() : vSession();
  if (!UI.ci) initCheckin();
  return UI.ci.step === 'pick' ? vPick() : vCheckin();
}
export function initCheckin() {
  const last = sessions().slice(-1)[0];
  UI.ci = { step: 'form', pain: last ? (last.nextDay ? last.nextDay.pain : (last.painEnd ?? preOf(last))) : 0, energy: 3,
    sleep: last && last.checkin && last.checkin.sleep != null ? last.checkin.sleep : 7, withRehab: null };
}
export function vCheckin() {
  const c = UI.ci;
  return `<div class="card"><h2>Check-in antes de entrenar</h2>
    <h3>${esc((zonaDolor() ? t('perfil.dolor_ahora', { zona: zonaDolor() }) : t('perfil.dolor_general')))}</h3>${painSlider('ci-pain', c.pain, (zonaDolor() ? t('perfil.dolor_ahora', { zona: zonaDolor() }) : t('perfil.dolor_general')))}
    <h3>Energía</h3><div class="emojis">${ENERGY.map((e, i) => `<button data-act="ci-energy" data-v="${i + 1}" class="${c.energy === i + 1 ? 'on' : ''}" aria-label="${ENERGY_TXT[i]}">${e}</button>`).join('')}</div>
    <p class="center muted small">${ENERGY_TXT[c.energy - 1]}</p>
    <h3>Horas de sueño anoche</h3><div class="steps">${stepper('Horas', `${n1(c.sleep)}<small>h</small>`, 'ci-sleep', '')}</div>
    <button class="btn pri big mt" data-act="ci-next">Ver qué entrenar hoy</button></div>`;
}
export function vPick() {
  const c = UI.ci, p = c.pain, lv = pLevel(p), rec = recommend(p), ph = S.settings.phase;
  const L = { g: ['Verde', 'Dolor bajo: entrena normal y sigue la progresión.'],
    y: ['Amarillo', 'Dolor moderado: baja la carga (la app te propondrá un peso menos), acorta el rango y prefiere variantes suaves. Ojo con los ejercicios ⚠.'],
    r: ['Rojo', 'Dolor alto: hoy solo Rehab de hombro suave, o descanso. Si el dolor es punzante, hay hormigueo o pérdida de fuerza, consulta a tu kinesiólogo.'] }[lv];
  if (c.withRehab == null) c.withRehab = !!rec.withRehab;
  const list = allTpl().slice().sort((a, b) => (b.id === rec.id) - (a.id === rec.id));
  let h = `<div class="card ${lv}"><div class="light"><div class="lamp bg-${lv}" style="color:${pColor(p)}"></div><div><b>Semáforo ${L[0]} · dolor ${p}/10</b><div class="small">${L[1]}</div></div></div>
    ${checkinCoach(c, lv)}
    <div class="row mt"><button class="link" data-act="ci-back">← Cambiar check-in</button></div></div>`;
  h += `<div class="note ${lv === 'r' ? 'bad' : 'info'}"><b>Recomendada hoy:</b> ${esc(getTpl(rec.id).name)}<div class="small">${esc(rec.why)}</div></div>`;
  h += `<button class="tog ${c.withRehab ? 'on' : ''}" data-act="ci-rehab"><span><b>Incluir Rehab al inicio</b><div class="muted small">Agrega los 5 ejercicios de Rehab antes de la rutina.</div></span><span class="sw"></span></button>`;
  if (typeof importButton === 'function') h += importButton();
  list.forEach(t => {
    const items = sessionItemsFor(t, false);
    const cc = careCount(items), isRec = t.id === rec.id, no = lv === 'r' && t.id !== 'rehab';
    h += `<button class="tpl ${isRec ? 'rec' : ''} ${no ? 'no' : ''}" data-act="start" data-tpl="${esc(t.id)}">
      <div class="row between"><b>${esc(t.name)}</b>${isRec ? '<span class="badge ac">Recomendada</span>' : no ? '<span class="badge bad">No recomendado hoy</span>' : ''}</div>
      <div class="muted small">${esc(t.desc || '')}</div>
      <div class="row wrap mt" style="gap:6px"><span class="badge">${plural(items.length, 'ejercicio', 'ejercicios')}</span>
        ${cc ? `<span class="badge ${lv === 'g' ? 'care' : 'warn'}" ${lv === 'y' ? 'style="font-size:13.5px"' : ''}>⚠ ${plural(cc, 'ejercicio con cuidado', 'ejercicios con cuidado')}</span>` : '<span class="badge ok">Amigable con el hombro</span>'}
        ${ph === 1 && t.id === 'full' ? '<span class="badge">2 series · Fase 1</span>' : ''}</div>
      ${t.extra ? `<div class="tiny muted mt">${esc(t.extra)}${t.id === 'b' && neutralPressOk() ? ' <b class="p-g">Tu dolor estuvo en 0-1 estas 2 semanas: ya se agregó a la rutina.</b>' : ''}</div>` : ''}
    </button>`;
  });
  return h;
}
/* Arma la lista de ejercicios de una sesión según la plantilla y la fase */
export function sessionItemsFor(t, withRehab) {
  const ph = S.settings.phase;
  let items = [];
  if (withRehab && t.id !== 'rehab') items = getTpl('rehab').items.map(i => ({ ...i }));
  t.items.forEach(i0 => {
    const i = { ...i0 };
    if (ph === 1 && ['pullup', 'chinup', 'negative', 'knee_raise'].includes(i.ex)) {
      if (items.some(x => x.ex === 'dead_hang') || t.items.some(x => x.ex === 'dead_hang')) return;
      Object.assign(i, { ex: 'dead_hang', sets: 2, goal: '15-30', rest: 60, note: 'Fase 1: colgado con pies apoyados en vez de dominadas.' });
    }
    /* Fase 2: las negativas entran solo si el colgado no duele; las dominadas completas, desde la Fase 3 */
    if (ph === 2 && ['pullup', 'chinup', 'negative'].includes(i.ex)) {
      if (hangOk()) {
        if (i.ex !== 'negative') Object.assign(i, { ex: 'negative', goal: '3-6', rest: 120, note: 'Fase 2: negativas. Las dominadas completas se prueban en la Fase 3.' });
      } else {
        if (items.some(x => x.ex === 'dead_hang') || t.items.some(x => x.ex === 'dead_hang')) return;
        Object.assign(i, { ex: 'dead_hang', sets: 2, goal: '15-30', rest: 60, note: 'Fase 2: las negativas se agregan cuando el colgado no duela.' });
      }
    }
    /* Elevación de rodillas colgado: solo si el colgado no duele; si no, dead bug */
    if (ph === 2 && i.ex === 'knee_raise' && !hangOk()) Object.assign(i, { ex: 'dead_bug', goal: '8-12', rest: 45, note: 'En vez de colgarte: dead bug, hasta que el colgado no duela.' });
    if (ph === 1 && t.id === 'full') i.sets = Math.min(i.sets, 2);
    items.push(i);
  });
  /* B · Empuje: el press de hombro neutro se agrega cuando el dolor lleva 2 semanas en 0-1 */
  if (t.id === 'b' && neutralPressOk() && !items.some(x => x.ex === 'neutral_press'))
    items.push({ ex: 'neutral_press', sets: 2, goal: '8-12', rest: 90, note: 'Se agrega porque tu dolor estuvo en 0-1 por 2 semanas. Solo si subir el brazo no duele.' });
  return items;
}
/* ¿El colgado en barra no duele? Mira la última vez que lo hiciste (dolor ≤2 en todas las series). */
export function hangOk() {
  const l = lastFor('dead_hang');
  return !!l && l.sets.every(x => (x.pain || 0) <= 2);
}
export function startSession(tplId) {
  const t = getTpl(tplId); if (!t) return;
  const c = UI.ci, ph = S.settings.phase, yellow = pLevel(c.pain) === 'y';
  const items = sessionItemsFor(t, c.withRehab);
  const banner = [];
  if (ph === 1) banner.push('Fase 1: pesos livianos, sin llegar al fallo (deja 3 reps en reserva).');
  if (yellow) banner.push('Semáforo amarillo: hoy un peso menos y rango más corto.');
  if (pLevel(c.pain) === 'r' && tplId !== 'rehab') banner.push('Dolor alto: esta rutina no está recomendada hoy. Ve con mucho cuidado y detente si sube.');
  S.draft = { id: uid(), start: Date.now(), tplId: t.id, tplName: t.name, phase: ph, withRehab: !!(c.withRehab && tplId !== 'rehab'),
    checkin: { pain: c.pain, energy: c.energy, sleep: c.sleep }, warmup: WARMUP.map(() => false), warmOpen: true,
    banner: banner.join(' '), notes: '', rest: null, items: [] };
  items.forEach(i => S.draft.items.push(newItem(i, yellow)));
  if (S.draft.items[0]) S.draft.items[0].open = true;
  if (typeof decir === 'function') {
    const lead = leadOf(t, S.draft.items);
    S.draft.intro = INTRO_RUTINA[t.id] || { who: lead, text: decir(lead, 'presentar') };
    const f0 = S.draft.items[0];
    if (f0) { const w0 = charOf(getEx(f0.ex)); S.draft.say = { uid: f0.uid, who: w0, text: decir(w0, 'primero') }; }
  }
  UI.ci = null; save(); updateWakeLock(); render(); window.scrollTo(0, 0);
  toast('¡Entreno iniciado! Parte con el calentamiento.', 'ok');
}
export function newItem(i, yellow) {
  const ex = getEx(i.ex);
  const it = { uid: uid(), ex: i.ex, sets: i.sets || 3, goal: i.goal || ex.goal, rest: i.rest || null, note: i.note || '', done: [], open: false, tip: false, alert: null };
  const sg = suggest(ex, it);
  let w = sg.w;
  if (yellow && ex.type === 'wr') { const p = prevW(ex, w); if (p != null) w = p; }
  it.inp = { w, reps: sg.reps, secs: sg.secs, pain: S.draft ? S.draft.checkin.pain : 0 };
  return it;
}
export function vSession() {
  const d = S.draft, wd = d.warmup.filter(Boolean).length;
  const doneSets = d.items.reduce((n, i) => n + Math.min(i.done.length, i.sets), 0), totalSets = d.items.reduce((n, i) => n + i.sets, 0);
  let h = `<div class="sesbar"><div class="grow"><div class="row" style="align-items:baseline"><span class="chrono" data-chrono>${hms(Date.now() - d.start)}</span>
      <span class="tiny muted">${doneSets}/${totalSets} series · dolor inicial ${d.checkin.pain}</span></div>
      <div class="sesprog" role="progressbar" aria-label="Series hechas" aria-valuemin="0" aria-valuemax="${totalSets}" aria-valuenow="${doneSets}"><i style="width:${totalSets ? doneSets / totalSets * 100 : 0}%"></i></div></div>
    <button class="btn okb sm" data-act="finish">Terminar</button></div>`;
  if (d.banner) h += `<div class="note warn small">${esc(d.banner)}</div>`;
  if (d.intro && !doneSets && typeof pjStill === 'function') h += `<div class="card"><div class="pj-row" style="margin:0">${pjStill(d.intro.who)}${pjBubble(d.intro.who, esc(d.intro.text))}</div></div>`;
  h += `<div class="card"><button class="row between" style="width:100%;background:none;border:0;padding:0;cursor:pointer" data-act="wu-open">
      <h2 class="mb0">Calentamiento</h2><span class="badge ${wd === WARMUP.length ? 'ok' : ''}">${wd}/${WARMUP.length} ${d.warmOpen ? '▴' : '▾'}</span></button>
    ${d.warmOpen ? `<div class="mt">${WARMUP.map((w, i) => `<button class="chk ${d.warmup[i] ? 'on' : ''}" data-act="wu" data-i="${i}"><span class="box">${d.warmup[i] ? '✓' : ''}</span><span>${esc(w)}</span></button>`).join('')}</div>` : ''}</div>`;
  if (!d.items.length) h += `<div class="empty"><div class="e">🏋️</div><p>Sesión vacía. Agrega ejercicios desde la biblioteca.</p></div>`;
  d.items.forEach((it, idx) => { h += vItem(it, idx); });
  h += `<button class="btn block mt" data-act="lib-open" data-target="draft">+ Agregar ejercicio</button>
    <div class="row mt"><button class="btn grow" data-act="tpl-from-draft">Guardar como plantilla</button><button class="btn danger" data-act="discard">Descartar</button></div>
    <button class="btn okb big mt2" data-act="finish">Terminar entreno</button>`;
  return h;
}
export function vItem(it, idx) {
  const ex = getEx(it.ex), n = it.done.length, full = n >= it.sets, d = S.draft;
  const rest = it.rest || S.settings.rest;
  const head = `<button class="ex-h" data-act="it-open" data-uid="${it.uid}"><span class="n">${full ? '✓' : idx + 1}</span>
    <span class="grow"><b>${esc(ex.name)} ${shoulderBadge(ex)}</b><span class="muted small">${full ? `Series completas (${n}/${it.sets})` : `Serie ${n + 1} de ${it.sets}`} · meta ${esc(it.goal)}${ex.type === 't' ? ' s' : ''} · ${rest} s</span></span>
    <span class="muted">${it.open ? '▴' : '▾'}</span></button>`;
  if (!it.open) return `<div class="ex ${full ? 'done' : ''}">${head}</div>`;
  const last = lastFor(ex.id), sg = suggest(ex, it);
  let b = '';
  b += pjStage(ex, d.say && d.say.uid === it.uid ? d.say : null);
  if (it.note) b += `<p class="small muted"><i>${esc(it.note)}</i></p>`;
  b += `<p class="small"><span class="muted">Última vez:</span> ${last ? `<b>${last.sets.map(s => fmtSet(ex, s)).join(' · ')}</b> <span class="muted tiny">(${relDay(last.s.start)}${ex.type === 'bw' ? ', reps' : ex.type === 'wr' ? ', kg×reps' : ''})</span>` : '<span class="muted">sin registros</span>'}</p>`;
  b += `<div class="note ${sg.tone} small">💡 ${esc(sg.text)}</div>`;
  b += `<button class="link" data-act="it-tip" data-uid="${it.uid}">${it.tip ? 'Ocultar cómo se hace ▴' : '📖 Cómo se hace ▾'}</button>${it.tip ? guideHtml(ex) : ''}`;
  const A = `data-uid="${it.uid}"`, pop = f => UI.pop === it.uid + ':' + f;
  b += '<div class="steps">';
  if (ex.type === 'wr') b += stepper('Kg', kg(it.inp.w), 'step', `${A} data-f="w"`, pop('w'));
  if (ex.type === 'bw') b += stepper('Lastre', it.inp.w ? `+${kg(it.inp.w)}<small>kg</small>` : '<span style="font:600 17px var(--f-txt)">Corporal</span>', 'step', `${A} data-f="w"`, pop('w'));
  if (ex.type === 't') b += stepper('Segundos', `${it.inp.secs}`, 'step', `${A} data-f="secs"`, pop('secs'));
  else b += stepper('Reps', `${it.inp.reps}`, 'step', `${A} data-f="reps"`, pop('reps'));
  b += stepper('Dolor', `<span class="${'p-' + pLevel(it.inp.pain)}">${it.inp.pain}</span>`, 'step', `${A} data-f="pain"`, pop('pain')) + '</div>';
  b += `<button class="btn pri big" data-act="log" ${A}>Registrar serie ${n + 1}${n + 1 <= it.sets ? ` de ${it.sets}` : ''}</button>`;
  if (it.alert) b += `<div class="note ${it.alert.tone}">${it.alert.html}</div>`;
  if (n) b += `<ul class="clean sets">${it.done.map((s, i) => `<li><span class="muted">S${i + 1}</span><b>${fmtSetLong(ex, s)}</b>${pDot(s.pain)}<button class="btn sm icon ghost del" data-act="del-set" ${A} data-i="${i}" aria-label="Borrar serie ${i + 1}">✕</button></li>`).join('')}</ul>`;
  b += `<div class="tools"><button class="btn sm" data-act="it-move" ${A} data-d="-1" ${idx === 0 ? 'disabled' : ''} aria-label="Subir">↑</button><button class="btn sm" data-act="it-move" ${A} data-d="1" ${idx === d.items.length - 1 ? 'disabled' : ''} aria-label="Bajar">↓</button>
    <button class="btn sm" data-act="it-sets" ${A} data-d="-1">− serie</button><button class="btn sm" data-act="it-sets" ${A} data-d="1">+ serie</button>
    <button class="btn sm danger" data-act="it-rm" ${A}>Quitar</button></div>`;
  return `<div class="ex open ${full ? 'done' : ''}">${head}<div class="ex-b">${b}</div></div>`;
}
export const findItem = u => S.draft && S.draft.items.find(i => i.uid === u);
/* ¿Esta serie supera lo mejor que habías hecho? (peso, tiempo o reps según el tipo). Necesita historial previo. */
export function isRecord(ex, s, it) {
  const score = x => ex.type === 'wr' ? (x.w || 0) : ex.type === 't' ? (x.secs || 0) : ex.type === 'bw' ? (x.w || 0) * 1000 + (x.reps || 0) : (x.reps || 0);
  const past = S.sessions.flatMap(ss => ss.items.filter(i => i.ex === ex.id).flatMap(i => i.done));
  if (!past.length) return false;
  const best = Math.max(...past.map(score), ...it.done.map(score));
  return score(s) > best;
}
export function logSet(u) {
  const it = findItem(u); if (!it) return;
  const ex = getEx(it.ex), th = S.settings.threshold, pre = S.draft.checkin.pain, p = it.inp.pain;
  const s = { pain: p, at: Date.now() };
  if (ex.type === 'wr' || ex.type === 'bw') s.w = it.inp.w;
  if (ex.type === 't') s.secs = it.inp.secs; else s.reps = it.inp.reps;
  const record = isRecord(ex, s, it);
  it.done.push(s);
  vibrate(30);
  const msgs = []; let tone = 'up';
  if (p >= 5) { tone = 'bad'; msgs.push('<b>Dolor 5+: detén este ejercicio por hoy.</b> Pasa al siguiente o termina con Rehab suave.'); }
  else if (p >= th) { tone = 'warn'; msgs.push(`<b>Dolor ${p}/10 (umbral ${th}):</b> baja la carga o pasa al siguiente ejercicio.`); }
  if (p - pre >= 3) { if (tone === 'up') tone = 'warn'; msgs.push(`Ojo: tu dolor subió ${p - pre} puntos desde el inicio (${pre} → ${p}).`); }
  it.alert = msgs.length ? { tone, html: msgs.join('<br>') } : null;
  if (msgs.length) { vibrate([120, 80, 120]); toast(p >= 5 ? 'Detén este ejercicio por hoy.' : 'Atención con el dolor.', p >= 5 ? 'bad' : ''); }
  if (record && !msgs.length && p <= 2) { confetti(); toast(`🏆 ¡Nuevo récord en ${ex.name}: ${fmtSetLong(ex, s)}!`, 'ok'); }
  const idx = S.draft.items.indexOf(it);
  if (it.done.length >= it.sets && !msgs.length && S.draft.items[idx + 1]) {
    it.open = false; S.draft.items[idx + 1].open = true;
    toast(`¡${getEx(it.ex).name} listo! Sigue: ${getEx(S.draft.items[idx + 1].ex).name}`, 'ok');
  }
  reactToSet(it, ex, p, record, msgs.length > 0);
  startRest(it.rest || S.settings.rest, ex.name);
  save(); render();
}

