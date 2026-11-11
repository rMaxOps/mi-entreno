/* Sugerencias de progresión (reglas de docs/especificacion.md). */
import { S } from '../estado.js';
import { cap, clamp, kg, parseGoal } from '../util.js';
import { getEx, lastFor, nextW, preOf, prevW, weightsFor } from './ejercicios.js';
/* ---------- Progresión ---------- */
export function suggest(ex, item) {
  const g = parseGoal(item.goal || ex.goal), th = S.settings.threshold;
  const W = weightsFor(ex);
  const base = { w: ex.type === 'bw' ? 0 : (W[0] || 0), reps: g.min, secs: g.min };
  const last = lastFor(ex.id);
  if (!last) return { ...base, tone: 'info', text: ex.type === 'wr' ? 'Primera vez: parte con un peso liviano y técnica limpia.' : 'Primera vez: parte suave y con buena técnica.' };
  const sets = last.sets;
  const maxP = Math.max(0, ...sets.map(x => x.pain || 0));
  const painOk = sets.every(x => (x.pain || 0) <= 2);
  const nd = last.s.nextDay;
  const worse = !!(nd && nd.pain >= preOf(last.s) + 2);
  const hurt = maxP >= th || worse;
  const why = maxP >= th ? `la última vez el dolor llegó a ${maxP}/10` : 'el hombro amaneció peor al día siguiente';
  const target = item.sets || sets.length;

  if (ex.type === 't') {
    const best = Math.max(0, ...sets.map(x => x.secs || 0));
    if (hurt) { const v = Math.max(5, best - 5); return { ...base, secs: v, tone: 'warn', text: `Baja a ${v} s: ${why}.` }; }
    if (maxP > 2) return { ...base, secs: best, tone: 'info', text: `Mantén ${best} s hasta que no moleste.` };
    return { ...base, secs: best + 5, tone: 'up', text: `Suma 5 s: intenta ${best + 5} s.` };
  }
  const reps = sets.map(x => x.reps || 0);
  const minR = Math.min(...reps);
  const allMax = sets.length >= target && reps.every(r => r >= g.max);
  const lw = Math.max(0, ...sets.map(x => x.w || 0));
  const plus1 = clamp(minR + 1, g.min, g.max);

  if (ex.type === 'wr') {
    if (hurt) {
      const p = prevW(ex, lw);
      return p != null
        ? { ...base, w: p, reps: plus1, tone: 'warn', text: `Baja a ${kg(p)} kg: ${why}.` }
        : { ...base, w: lw, reps: g.min, tone: 'warn', text: `Mantén ${kg(lw)} kg y haz menos reps (${g.min}): ${why}.` };
    }
    if (allMax && painOk) {
      const n = nextW(ex, lw);
      return n != null
        ? { ...base, w: n, reps: g.min, tone: 'up', text: `¡Completaste ${g.max} reps en todas las series sin dolor! Sube a ${kg(n)} kg y vuelve a ${g.min} reps.` }
        : { ...base, w: lw, reps: g.max, tone: 'up', text: `Dominaste ${kg(lw)} kg, tu mancuerna más pesada: baja más lento (3 s) o suma una serie.` };
    }
    return { ...base, w: lw, reps: plus1, tone: 'info', text: `Mantén ${kg(lw)} kg y busca 1 rep más por serie.` + (allMax ? ' Subes cuando completes el rango con dolor ≤2.' : '') };
  }
  if (ex.type === 'bw') {
    const easier = { pullup: 'cambia a dominadas supinas', chinup: 'cambia a negativas', negative: 'vuelve a retracciones y colgado con pies apoyados',
      pushup: 'hazlas inclinado con las manos en una mesa', knee_raise: 'cámbialo por dead bug' }[ex.id];
    if (hurt) return { ...base, w: lw > 0 ? (prevW(ex, lw) || 0) : 0, reps: Math.max(1, minR - 2), tone: 'warn', text: `Haz menos reps${easier ? ' o ' + easier : ''}: ${why}.` };
    if (allMax && painOk) {
      const harder = { negative: 'chinup', chinup: 'pullup' }[ex.id];
      const n = nextW(ex, lw); const parts = [];
      if (harder) parts.push(`prueba ${getEx(harder).name.toLowerCase()}`);
      if (n != null) parts.push(`agrega lastre (${kg(n)} kg)`);
      return { ...base, w: lw, reps: g.max, tone: 'up', text: `¡Dominaste el rango! ${cap(parts.join(' o ')) || 'Hazlo más lento'}.` };
    }
    return { ...base, w: lw, reps: plus1, tone: 'info', text: 'Busca 1 rep más por serie.' };
  }
  if (hurt) return { ...base, reps: Math.max(1, minR - 2), tone: 'warn', text: `Menos reps y un rango más corto: ${why}.` };
  if (allMax && painOk) return { ...base, reps: g.max, tone: 'up', text: '¡Dominaste el rango! Hazlo más lento o con pausas más largas.' };
  return { ...base, reps: plus1, tone: 'info', text: 'Busca 1 rep más por serie.' };
}

