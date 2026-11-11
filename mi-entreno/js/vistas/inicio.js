/* Pantalla Inicio. */
import { t } from '../i18n.js';
import { onboardingPendiente, tieneDatos, zonaDolor } from '../logica/perfil.js';
import { PHASES, RULES } from '../datos/catalogo.js';
import { S } from '../estado.js';
import { getTpl, preOf, sessions, setsOf } from '../logica/ejercicios.js';
import { pendingNextDay, phaseCheck, planWeek, recommend, streak, weekCount } from '../logica/fases.js';
import { lineChart } from '../ui/graficos.js';
import { avg, esc, fmtDate, n1, pLevel, parseDay, sd, weekStart } from '../util.js';
/* Inicio */
export function vInicio() {
  const st = S.settings, P = PHASES[st.phase], ss = sessions(), pc = phaseCheck(), rec = recommend(null);
  let h = '';
  if (S.draft) h += `<div class="card hl"><div class="row"><div class="grow"><b>Entreno en curso</b><div class="muted small">${esc(S.draft.tplName)} · <span data-chrono></span></div></div><button class="btn pri" data-act="tab" data-tab="entreno">Continuar</button></div></div>`;
  const pend = pendingNextDay();
  if (onboardingPendiente() && tieneDatos()) h += `<div class="card hl"><h2>${t('perfil.completar')}</h2><p class="small muted">${t('perfil.completar_texto')}</p><button class="btn pri block" data-act="pf-abrir">${t('perfil.editar')}</button></div>`;
  if (pend) h += `<div class="card y"><h2>${(zonaDolor() ? t('perfil.como_amanecio', { zona: zonaDolor() }) : t('perfil.como_amanecio_general'))}</h2><p class="muted small">Ayer hiciste ${esc(pend.tplName)}. Antes de entrenar: ${preOf(pend)}/10.</p><button class="btn pri block" data-act="nd-open" data-id="${pend.id}">Responder</button></div>`;
  if ((pc.up || pc.down) && Date.now() > (S.ui.phaseSnooze || 0)) {
    h += pc.down
      ? `<div class="card r"><h2>Sugerencia: volver a la Fase ${st.phase - 1}</h2><p class="small">Tu dolor promedio antes de entrenar en la última semana es ${n1(pc.avg7)}/10 (4 o más). Conviene bajar un escalón por un tiempo.</p><div class="row"><button class="btn danger grow" data-act="phase-set" data-p="${st.phase - 1}">Volver a Fase ${st.phase - 1}</button><button class="btn ghost" data-act="phase-snooze">Ahora no</button></div></div>`
      : `<div class="card g"><h2>¡Puedes avanzar a la Fase ${st.phase + 1}!</h2><p class="small">Cumpliste las 3 reglas: 2 semanas con la meta, dolor previo ≤2 y sin subidas de más de 2 puntos.</p><div class="row"><button class="btn okb grow" data-act="phase-set" data-p="${st.phase + 1}">Avanzar a Fase ${st.phase + 1}</button><button class="btn ghost" data-act="phase-snooze">Ahora no</button></div></div>`;
  }
  const wk = planWeek();
  const calPhase = wk <= 2 ? 1 : wk <= 5 ? 2 : 3;
  h += `<div class="card"><div class="row between"><h2 class="mb0">Fase ${st.phase} · ${P.name}</h2><span class="badge ac">Semana ${wk}</span></div>
    <p class="muted small">${P.weeks} del plan · desde el ${fmtDate(parseDay(st.phaseSince || st.startDate), { day: 'numeric', month: 'long' })}</p>
    <ul class="dots small">${P.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    ${calPhase > st.phase ? `<p class="tiny muted">Por calendario tocaría la Fase ${calPhase}, pero avanzas solo cuando se cumplen las reglas.</p>` : ''}
    <div class="note ${rec.rest ? 'warn' : 'info'}"><b>Hoy toca:</b> ${esc(getTpl(rec.id).name)}${rec.withRehab && rec.id !== 'rehab' ? ' + Rehab' : ''}<div class="small muted">${esc(rec.why)}</div></div>
    ${S.draft ? '' : `<button class="btn pri big" data-act="go-checkin">Empezar entreno</button>`}
    ${st.phase < 3 ? `<h3>Para pasar a la Fase ${st.phase + 1}</h3><ul class="clean small">${pc.rules.map(r => `<li class="row" style="align-items:flex-start;margin:4px 0"><span class="pill ${r.ok ? 'bg-g' : 'na'}">${r.ok ? '✓' : '·'}</span><span>${esc(r.text)}</span></li>`).join('')}</ul>` : ''}
  </div>`;
  const wc = weekCount(weekStart(Date.now())), goal = st.perWeek;
  h += `<div class="card"><div class="row between"><h2 class="mb0">Meta semanal</h2><b>${wc} de ${goal}</b></div>
    <div class="bar mt"><i style="width:${Math.min(100, wc / goal * 100)}%"></i></div>
    <p class="muted small">${wc >= goal ? '¡Meta cumplida esta semana! 💪' : `Te ${goal - wc === 1 ? 'falta 1 entreno' : `faltan ${goal - wc} entrenos`} esta semana.`}</p></div>`;
  const last5 = ss.slice(-5), ap = avg(last5.map(preOf));
  h += `<div class="grid2" style="margin-bottom:12px">
    <div class="stat"><b>${ss.length}</b><span>entrenos totales</span></div>
    <div class="stat"><b>${ss.reduce((n, s) => n + setsOf(s), 0)}</b><span>series registradas</span></div>
    <div class="stat"><b class="${ap == null ? '' : 'p-' + pLevel(ap)}">${ap == null ? '—' : n1(ap)}</b><span>dolor promedio (últ. 5, antes)</span></div>
    <div class="stat"><b>${streak()}</b><span>semanas seguidas con la meta</span></div></div>`;
  const last = ss.slice(-10);
  h += `<div class="card"><h2>${(zonaDolor() ? t('perfil.dolor_grafico', { zona: zonaDolor() }) : t('perfil.dolor_grafico_general'))}</h2>${last.length ? lineChart({
      labels: last.map(s => sd(s.start)), yMin: 0, yMax: 10, label: 'Dolor antes, después y al día siguiente',
      series: [{ name: 'Antes', color: 'var(--c1)', values: last.map(preOf) }, { name: 'Después', color: 'var(--c2)', values: last.map(s => s.painEnd ?? null) }, { name: 'Día sig.', color: 'var(--c3)', dash: true, values: last.map(s => s.nextDay ? s.nextDay.pain : null) }] })
      + `<div class="legend"><span><i style="background:var(--c1)"></i>Antes</span><span><i style="background:var(--c2)"></i>Después</span><span style="color:var(--c3)"><i class="dash"></i><span style="color:var(--mu)">Día siguiente</span></span></div>`
    : '<p class="muted small">Aparecerá cuando registres tu primer entreno.</p>'}</div>`;
  h += rulesCard();
  return h;
}
export function rulesCard() {
  return `<div class="card"><h2>Reglas del hombro</h2><ul class="clean rules small">${RULES.map(([c, t]) =>
    `<li class="row" style="align-items:flex-start"><span class="pill ${c ? 'bg-' + c : 'na'}">${c === 'g' ? '✓' : c ? '!' : 'i'}</span><span>${esc(t)}</span></li>`).join('')}</ul>
    <p class="muted small"><i>Son pautas generales; si tu kinesiólogo te dio indicaciones, mandan esas.</i></p></div>`;
}

