/* Plan por fases, metas semanales y recomendación del día. */
import { S } from '../estado.js';
import { DAY, addDays, avg, dayStr, n1, parseDay, weekStart } from '../util.js';
import { getTpl, maxPainOf, preOf, sessions } from './ejercicios.js';
/* ---------- Fases, metas y recomendaciones ---------- */
export function weekCount(ws) { const a = ws.getTime(), b = addDays(ws, 7).getTime(); return S.sessions.filter(s => s.start >= a && s.start < b).length; }
export function streak() {
  const goal = S.settings.perWeek; let ws = weekStart(Date.now()), n = 0;
  if (weekCount(ws) >= goal) n++;
  ws = addDays(ws, -7);
  while (weekCount(ws) >= goal && n < 600) { n++; ws = addDays(ws, -7); }
  return n;
}
export function planWeek() { return Math.max(1, Math.floor((parseDay(dayStr(Date.now())) - parseDay(S.settings.startDate)) / DAY / 7) + 1); }
export function phaseCheck() {
  const st = S.settings, ss = sessions(), w0 = weekStart(Date.now());
  const wA = addDays(w0, -14), wB = addDays(w0, -7);
  const inR = (a, b) => ss.filter(s => s.start >= a && s.start < b);
  const fullWeeks = weekStart(parseDay(st.phaseSince || st.startDate)).getTime() <= wA.getTime();
  const c1 = inR(wA.getTime(), wB.getTime()).length, c2 = inR(wB.getTime(), w0.getTime()).length;
  const r1 = fullWeeks && c1 >= st.perWeek && c2 >= st.perWeek;
  const rec = inR(wA.getTime(), Infinity);
  const avgPre = avg(rec.map(preOf));
  const spike = rec.some(s => maxPainOf(s) - preOf(s) > 2);
  const r2 = avgPre != null && avgPre <= 2, r3 = rec.length > 0 && !spike;
  const last7 = ss.filter(s => s.start >= Date.now() - 7 * DAY);
  const avg7 = avg(last7.map(preOf));
  return {
    up: st.phase < 3 && r1 && r2 && r3, down: st.phase > 1 && avg7 != null && avg7 >= 4, avg7,
    rules: [
      { ok: r1, text: `2 semanas seguidas con ${st.perWeek}+ entrenos` + (fullWeeks ? ` (${c1} y ${c2})` : ' (aún no hay 2 semanas completas en esta fase)') },
      { ok: r2, text: `Dolor promedio antes de entrenar ≤2 (${avgPre == null ? 'sin datos' : n1(avgPre)})` },
      { ok: r3, text: 'El dolor no sube más de 2 puntos en las sesiones' },
    ],
  };
}
export function recommend(pain) {
  const ph = S.settings.phase, ss = sessions();
  const today = dayStr(Date.now()), yest = dayStr(addDays(new Date(), -1));
  if (pain != null && pain >= 5) return { id: 'rehab', why: 'Dolor 5 o más: hoy solo Rehab de hombro suave, o descanso.' };
  if (ss.some(s => dayStr(s.start) === today && s.tplId !== 'rehab'))
    return { id: 'rehab', rest: true, why: 'Ya entrenaste hoy. Si quieres moverte, solo Rehab suave; si no, descansa.' };
  const lastMain = [...ss].reverse().find(s => s.tplId !== 'rehab');
  const ws = weekStart(Date.now()).getTime();
  const rehabWeek = ss.filter(s => s.start >= ws && (s.tplId === 'rehab' || s.withRehab)).length;
  if (ph < 3) {
    if (lastMain && dayStr(lastMain.start) === yest && lastMain.tplId === 'full')
      return { id: 'rehab', rest: true, why: 'Ayer hiciste Cuerpo completo: hoy toca descanso o Rehab suave. Mañana, Cuerpo completo.' };
    return { id: 'full', withRehab: ph === 1 || rehabWeek < 2,
      why: ph === 1 ? 'Fase 1: Cuerpo completo con 2 series por ejercicio + Rehab al inicio.'
        : 'Fase 2: Cuerpo completo con 3 series.' + (rehabWeek < 2 ? ' Parte con Rehab (2-3 veces por semana).' : '') };
  }
  const abc = [...ss].reverse().filter(s => ['a', 'b', 'c'].includes(s.tplId));
  let next = 'a';
  if (abc[0]) {
    const l = abc[0].tplId;
    if (l === 'a' || l === 'b') next = 'c';
    else next = abc[1] && abc[1].tplId === 'a' ? 'b' : (abc[1] && abc[1].tplId === 'b' ? 'a' : 'b');
  }
  return { id: next, withRehab: false, why: `Fase 3 (A · C · B · C): ${abc[0] ? `la última fue ${getTpl(abc[0].tplId).name}, ` : ''}hoy toca ${getTpl(next).name}.` };
}
export function pendingNextDay() {
  const yest = dayStr(addDays(new Date(), -1));
  return [...sessions()].reverse().find(s => dayStr(s.start) === yest && !s.nextDay && !S.ui.ndSkip[s.id]) || null;
}
/* Press neutro: 2 semanas con dolor 0-1. Pide al menos 3 entrenos en los últimos 14 días,
   que el primero de ellos sea de hace 10 días o más (que de verdad cubran 2 semanas) y todos con dolor ≤1. */
export function neutralPressOk() {
  const rec = S.sessions.filter(s => s.start >= Date.now() - 14 * DAY);
  if (rec.length < 3 || Math.min(...rec.map(s => s.start)) > Date.now() - 10 * DAY) return false;
  return rec.every(s => preOf(s) <= 1 && maxPainOf(s) <= 1);
}

