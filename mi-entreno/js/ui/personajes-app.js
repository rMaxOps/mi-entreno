/* Cómo la app usa a los personajes (escenario, check-in y reacciones). */
import { INTRO_RUTINA, decir } from '../dialogos.js';
import { S } from '../estado.js';
import { getEx } from '../logica/ejercicios.js';
import { charOf, pjBubble, pjExercise, pjFrase, pjReduced, pjStill } from '../personajes.js';
import { esc } from '../util.js';
/* ---------- Personajes (js/personajes.js) ---------- */
/* Escenario del ejercicio: el personaje de su grupo haciéndolo y su globo.
   Si el Coach da un aviso de dolor, aparece él serio en vez de la animación. */
export function pjStage(ex, say) {
  if (typeof pjExercise !== 'function') return '';
  const rm = pjReduced(), who = charOf(ex), serio = !!(say && say.mood === 'serio');
  const fig = serio ? pjStill(say.who, 'serio')
    : pjExercise(ex, rm) + (say && say.who !== who ? `<span class="pj-side">${pjStill(say.who, say.mood)}</span>` : '');
  const bub = say ? pjBubble(say.who, esc(say.text)) : pjBubble(who, esc(pjFrase(ex)));
  return `<div class="pj-stage"><div class="pj-fig ${rm && !serio ? 'rm' : ''}">${fig}</div>${bub}</div>`;
}
/* Quién presenta una rutina: el personaje del grupo que más se repite */
export function leadOf(t, items) {
  if (INTRO_RUTINA[t.id]) return INTRO_RUTINA[t.id].who;
  const n = {}; (items || []).forEach(i => { const w = charOf(getEx(i.ex)); n[w] = (n[w] || 0) + 1; });
  return Object.keys(n).sort((a, b) => n[b] - n[a])[0] || 'coach';
}
/* El Coach en el check-in: serio con dolor alto. La frase se guarda para que no cambie en cada toque. */
export function checkinCoach(c, lv) {
  if (typeof pjStill !== 'function') return '';
  if (!c.say || c.say.lv !== lv) c.say = { lv, text: decir('coach', 'checkin_' + lv) };
  return `<div class="pj-row">${pjStill('coach', lv === 'r' ? 'serio' : '')}${pjBubble('coach', esc(c.say.text))}</div>`;
}
/* Lo que dicen los personajes después de registrar una serie */
export function reactToSet(it, ex, p, record, alert) {
  if (typeof decir !== 'function') return;
  const d = S.draft, total = d.items.reduce((n, i) => n + i.sets, 0), done = d.items.reduce((n, i) => n + Math.min(i.done.length, i.sets), 0);
  const open = d.items.find(i => i.open) || it, wo = charOf(getEx(open.ex)), we = charOf(ex);
  let say = null;
  if (p >= 5) say = { uid: it.uid, who: 'coach', mood: 'serio', text: decir('coach', 'dolor_alto') };
  else if (record && !alert && p <= 2) say = { uid: it.uid, who: we, text: decir(we, 'record') };
  else if (total - done === 1) say = { uid: open.uid, who: wo, text: decir(wo, 'ultima') };
  else if (total > 3 && done === Math.ceil(total / 2)) say = { uid: open.uid, who: wo, text: decir(wo, 'mitad') };
  if (say) d.say = say;
}

