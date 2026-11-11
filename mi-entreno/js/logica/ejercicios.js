/* Ejercicios, plantillas, sesiones y formato de series. */
import { BASE_EX, BASE_TPL } from '../datos/catalogo.js';
import { S } from '../estado.js';
import { kg } from '../util.js';
/* ---------- Ejercicios, plantillas y sesiones ---------- */
export const allEx = () => [...BASE_EX, ...S.exercises.filter(e => !e.hidden)];
export const getEx = id => BASE_EX.find(e => e.id === id) || S.exercises.find(e => e.id === id) ||
  { id, name: id, group: 'Otro', type: 'r', shoulder: 'ok', goal: '8-12', tip: '' };
export const allTpl = () => [...BASE_TPL, ...S.templates];
export const getTpl = id => allTpl().find(t => t.id === id);
export const sessions = () => S.sessions.slice().sort((a, b) => a.start - b.start);
export const preOf = s => (s.checkin && s.checkin.pain != null) ? s.checkin.pain : 0;
export const setsOf = s => (s.items || []).reduce((n, i) => n + (i.done || []).length, 0);
export function maxPainOf(s) {
  let m = s.painEnd != null ? s.painEnd : 0;
  (s.items || []).forEach(i => (i.done || []).forEach(d => { if ((d.pain || 0) > m) m = d.pain; }));
  return m;
}
export const volumeOf = s => (s.items || []).reduce((v, i) => v + (i.done || []).reduce((a, d) => a + (d.w || 0) * (d.reps || 0), 0), 0);
export const careCount = items => items.filter(i => getEx(i.ex).shoulder === 'care').length;

export function lastFor(exId) {
  const ss = sessions();
  for (let k = ss.length - 1; k >= 0; k--) {
    const sets = ss[k].items.filter(i => i.ex === exId).flatMap(i => i.done || []);
    if (sets.length) return { s: ss[k], sets };
  }
  return null;
}
export function weightsFor(ex, extra) {
  let w = [...new Set(S.settings.weights.map(Number).filter(x => x > 0))].sort((a, b) => a - b);
  if (ex.type === 'bw') w = [0, ...w];
  if (extra != null && !w.includes(extra)) { w.push(extra); w.sort((a, b) => a - b); }
  return w;
}
export const nextW = (ex, w) => { const l = weightsFor(ex).filter(x => x > w); return l.length ? l[0] : null; };
export const prevW = (ex, w) => { const l = weightsFor(ex).filter(x => x < w); return l.length ? l[l.length - 1] : null; };

export function fmtSet(ex, s) {
  if (ex.type === 't') return `${s.secs || 0} s`;
  if (ex.type === 'r') return `${s.reps || 0}`;
  if (ex.type === 'bw') return s.w ? `+${kg(s.w)}×${s.reps || 0}` : `${s.reps || 0}`;
  return `${kg(s.w || 0)}×${s.reps || 0}`;
}
export function fmtSetLong(ex, s) {
  if (ex.type === 't') return `${s.secs || 0} s`;
  if (ex.type === 'r') return `${s.reps || 0} reps`;
  if (ex.type === 'bw') return s.w ? `+${kg(s.w)} kg × ${s.reps || 0}` : `Corporal × ${s.reps || 0}`;
  return `${kg(s.w || 0)} kg × ${s.reps || 0}`;
}

