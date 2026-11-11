/* Pantalla Progreso. */
import { UI } from '../estado.js';
import { fmtSet, getEx, sessions } from '../logica/ejercicios.js';
import { barChart, lineChart } from '../ui/graficos.js';
import { cap, esc, fmtDate, kg, pDot, plural, relDay, sd } from '../util.js';
/* Progreso */
export const METRICS = {
  wr: [['maxw', 'Peso máx (kg)'], ['vol', 'Volumen (kg)'], ['reps', 'Reps totales']],
  bw: [['reps', 'Reps totales'], ['maxr', 'Más reps en una serie'], ['maxw', 'Lastre máx (kg)']],
  r: [['reps', 'Reps totales'], ['maxr', 'Más reps en una serie']],
  t: [['maxs', 'Mejor tiempo (s)'], ['secs', 'Segundos totales']],
};
export function metricVal(m, sets) {
  switch (m) {
    case 'maxw': return Math.max(0, ...sets.map(s => s.w || 0));
    case 'vol': return sets.reduce((a, s) => a + (s.w || 0) * (s.reps || 0), 0);
    case 'reps': return sets.reduce((a, s) => a + (s.reps || 0), 0);
    case 'maxr': return Math.max(0, ...sets.map(s => s.reps || 0));
    case 'maxs': return Math.max(0, ...sets.map(s => s.secs || 0));
    case 'secs': return sets.reduce((a, s) => a + (s.secs || 0), 0);
  }
  return 0;
}
export function vProgreso() {
  const ss = sessions();
  const used = [...new Set(ss.flatMap(s => s.items.filter(i => i.done.length).map(i => i.ex)))];
  if (!used.length) return `<div class="empty"><div class="e">📈</div><p>Aún no hay datos. Registra tu primer entreno y aquí verás tu progreso.</p></div>`;
  used.sort((a, b) => getEx(a).name.localeCompare(getEx(b).name, 'es'));
  if (!used.includes(UI.prog.ex)) { const l = ss[ss.length - 1].items.find(i => i.done.length); UI.prog.ex = l ? l.ex : used[0]; UI.prog.metric = null; }
  const ex = getEx(UI.prog.ex), ms = METRICS[ex.type] || METRICS.r;
  if (!ms.some(m => m[0] === UI.prog.metric)) UI.prog.metric = ms[0][0];
  const hist = ss.map(s => ({ s, sets: s.items.filter(i => i.ex === ex.id).flatMap(i => i.done) })).filter(x => x.sets.length);
  const lab = hist.map(x => sd(x.s.start));
  let h = `<div class="card"><div class="field" style="margin-top:0"><label for="prog-ex">Ejercicio</label><select class="inp" id="prog-ex" data-in="prog-ex">${used.map(id => `<option value="${esc(id)}" ${id === ex.id ? 'selected' : ''}>${esc(getEx(id).name)}</option>`).join('')}</select></div>
    <button class="link" data-act="guide-open" data-id="${esc(ex.id)}">📖 Cómo se hace</button>
    <div class="seg" role="tablist">${ms.map(([k, l]) => `<button class="${k === UI.prog.metric ? 'on' : ''}" data-act="prog-metric" data-m="${k}">${esc(l.replace(/ \(.*\)/, ''))}</button>`).join('')}</div>
    <h3>${esc(ms.find(m => m[0] === UI.prog.metric)[1])}</h3>
    ${lineChart({ labels: lab, series: [{ name: '', color: 'var(--ac-tx)', values: hist.map(x => Math.round(metricVal(UI.prog.metric, x.sets) * 10) / 10) }], label: 'Progreso del ejercicio',
      unit: { maxw: ' kg', vol: ' kg', maxs: ' s', secs: ' s' }[UI.prog.metric] || '' })}
    <p class="tiny muted">${plural(hist.length, 'sesión', 'sesiones')} con este ejercicio.</p></div>`;
  const all = hist.flatMap(x => x.sets.map(s => ({ ...s, t: x.s.start })));
  let rec = '';
  const row = (k, v, t) => `<dt>${k}</dt><dd><b>${v}</b> <span class="muted tiny">${t ? relDay(t) : ''}</span></dd>`;
  if (ex.type === 'wr' || ex.type === 'bw') {
    const mw = Math.max(...all.map(s => s.w || 0));
    if (mw > 0 || ex.type === 'wr') { const best = all.filter(s => (s.w || 0) === mw).sort((a, b) => b.reps - a.reps)[0]; rec += row(ex.type === 'bw' ? 'Lastre máx' : 'Peso máx', `${kg(mw)} kg × ${best.reps}`, best.t); }
  }
  if (ex.type !== 't') { const b = all.slice().sort((a, b) => (b.reps || 0) - (a.reps || 0))[0]; rec += row('Más reps en una serie', `${b.reps}${ex.type === 'wr' ? ` (${kg(b.w || 0)} kg)` : ''}`, b.t); }
  if (ex.type === 't') { const b = all.slice().sort((a, b) => (b.secs || 0) - (a.secs || 0))[0]; rec += row('Mejor tiempo', `${b.secs} s`, b.t); }
  if (ex.type === 'wr') { const b = hist.slice().sort((a, b) => metricVal('vol', b.sets) - metricVal('vol', a.sets))[0]; rec += row('Más volumen en una sesión', `${kg(Math.round(metricVal('vol', b.sets)))} kg`, b.s.start); }
  h += `<div class="card"><h2>Récords 🏆</h2><dl class="kv">${rec}</dl></div>`;
  const ph = hist.slice(-12);
  h += `<div class="card"><h2>Dolor máximo por sesión</h2>${barChart({ labels: ph.map(x => sd(x.s.start)), values: ph.map(x => Math.max(0, ...x.sets.map(s => s.pain || 0))), label: 'Dolor máximo en este ejercicio por sesión' })}
    <p class="tiny muted">El dolor más alto que anotaste en este ejercicio cada día.</p></div>`;
  h += `<div class="card"><h2>Últimas sesiones</h2><ul class="clean">${hist.slice(-6).reverse().map(x => `<li class="list-row"><span class="grow"><b class="small">${esc(cap(fmtDate(x.s.start)))}</b><div class="small">${x.sets.map(s => fmtSet(ex, s)).join(' · ')}</div></span>${pDot(Math.max(0, ...x.sets.map(s => s.pain || 0)))}</li>`).join('')}</ul></div>`;
  return h;
}

