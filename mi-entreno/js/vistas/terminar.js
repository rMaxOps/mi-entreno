/* Terminar y guardar un entreno. */
import { t } from '../i18n.js';
import { zonaDolor } from '../logica/perfil.js';
import { decir } from '../dialogos.js';
import { S, UI, save } from '../estado.js';
import { getTpl, preOf, setsOf, volumeOf } from '../logica/ejercicios.js';
import { pjBubble, pjStill } from '../personajes.js';
import { painSlider } from '../ui/componentes.js';
import { openModal } from '../ui/modales.js';
import { leadOf } from '../ui/personajes-app.js';
import { confetti, render } from '../ui/render.js';
import { stopRest, updateWakeLock, vibrate } from '../ui/temporizador.js';
import { durTxt, esc, kg, pLevel, plural } from '../util.js';
/* Terminar */
export function vFinish() {
  const d = S.draft, f = UI.finishing;
  const nsets = d.items.reduce((n, i) => n + i.done.length, 0);
  return `<div class="card"><h2>Terminar entreno</h2><p class="muted small">${esc(d.tplName)} · ${durTxt(Date.now() - d.start)} · ${plural(nsets, 'serie', 'series')}</p>
    <h3>${esc((zonaDolor() ? t('perfil.dolor_terminar', { zona: zonaDolor() }) : t('perfil.dolor_terminar_general')))}</h3>${painSlider('fin-pain', f.pain, (zonaDolor() ? t('perfil.dolor_terminar', { zona: zonaDolor() }) : t('perfil.dolor_terminar_general')))}
    <p class="small muted">Antes de entrenar: ${d.checkin.pain}/10</p>
    <div class="field"><label for="fin-notes">Notas (opcional)</label><textarea class="inp" id="fin-notes" data-in="fin-notes" placeholder="¿Cómo te sentiste? ¿Algo que molestó?">${esc(f.notes)}</textarea></div>
    ${nsets ? '' : '<div class="note warn small">No registraste series. Se guardará igual con el check-in y el dolor.</div>'}
    <button class="btn pri big" data-act="fin-save">Guardar entreno</button>
    <button class="btn block ghost mt" data-act="fin-back">← Volver a la sesión</button></div>`;
}
export function finishSave() {
  const d = S.draft, f = UI.finishing;
  const lead = typeof decir === 'function' ? (d.intro ? d.intro.who : leadOf(getTpl(d.tplId) || {}, d.items)) : null;
  const sess = { id: d.id, start: d.start, end: Date.now(), tplId: d.tplId, tplName: d.tplName, phase: d.phase, withRehab: d.withRehab,
    checkin: d.checkin, warmup: d.warmup.slice(), painEnd: f.pain, notes: (f.notes || '').trim(), nextDay: null,
    items: d.items.filter(i => i.done.length).map(i => ({ ex: i.ex, sets: i.sets, goal: i.goal, rest: i.rest, done: i.done })) };
  S.sessions.push(sess); S.draft = null; UI.finishing = null; save();
  stopRest(); updateWakeLock(); UI.tab = 'historial'; UI.histOpen = { [sess.id]: true }; render(); window.scrollTo(0, 0);
  const up = sess.painEnd - preOf(sess);
  confetti(); vibrate([40, 60, 40]);
  openModal(`<h2>¡Entreno guardado! 💪</h2>${lead ? `<div class="pj-row">${pjStill(lead)}${pjBubble(lead, esc(decir(lead, 'final')))}</div>` : ''}
    <div class="grid2 mt">
      <div class="stat"><b>${Math.max(1, Math.round((sess.end - sess.start) / 60000))}</b><span>minutos</span></div>
      <div class="stat"><b>${setsOf(sess)}</b><span>series</span></div>
      <div class="stat"><b>${kg(Math.round(volumeOf(sess)))}</b><span>kg de volumen</span></div>
      <div class="stat"><b><span class="p-${pLevel(preOf(sess))}">${preOf(sess)}</span><span class="muted" style="font-size:24px"> → </span><span class="p-${pLevel(sess.painEnd)}">${sess.painEnd}</span></b><span>dolor antes → después</span></div>
    </div>
    ${up > 0 ? `<div class="note warn small">Tu dolor subió ${up} ${up === 1 ? 'punto' : 'puntos'}. Mañana revisa cómo amaneces${zonaDolor() ? ` (tu ${esc(zonaDolor())})` : ''}: la app te lo preguntará al abrirla.</div>` : '<div class="note up small">El dolor no subió. ¡Bien hecho!</div>'}
    <button class="btn pri big mt" data-act="modal-close">Listo</button>`);
}

