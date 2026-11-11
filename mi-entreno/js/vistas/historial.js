/* Pantalla Historial. */
import { calentamientoDe } from '../logica/perfil.js';
import { ENERGY, ENERGY_TXT, WARMUP } from '../datos/catalogo.js';
import { UI } from '../estado.js';
import { fmtSetLong, getEx, preOf, sessions, setsOf, volumeOf } from '../logica/ejercicios.js';
import { shoulderBadge } from '../ui/componentes.js';
import { cap, durTxt, esc, fmtDate, kg, n1, pDot, plural } from '../util.js';
/* Historial */
export function vHistorial() {
  const ss = sessions().reverse();
  if (!ss.length) return `<div class="empty"><div class="e">📒</div><p>Aún no hay entrenos guardados.</p><button class="btn pri" data-act="go-checkin">Empezar el primero</button></div>`;
  let h = '', cur = '';
  ss.forEach(s => {
    const m = cap(fmtDate(s.start, { month: 'long', year: 'numeric' }));
    if (m !== cur) { cur = m; const n = ss.filter(x => cap(fmtDate(x.start, { month: 'long', year: 'numeric' })) === m).length; h += `<div class="month">${esc(m)} · ${n}</div>`; }
    const open = !!UI.histOpen[s.id];
    h += `<div class="hs"><button class="hs-h" data-act="hist-toggle" data-id="${s.id}"><span class="grow"><b>${esc(cap(fmtDate(s.start)))} · ${esc(s.tplName)}</b>
      <span class="muted small" style="display:block">${s.end ? durTxt(s.end - s.start) + ' · ' : ''}${plural(setsOf(s), 'serie', 'series')} · dolor ${preOf(s)}→${s.painEnd ?? '—'}${s.nextDay ? '→' + s.nextDay.pain : ''}</span></span><span class="muted">${open ? '▴' : '▾'}</span></button>
      ${open ? vHistDetail(s) : ''}</div>`;
  });
  return h;
}
export function vHistDetail(s) {
  const ci = s.checkin || {};
  let h = `<dl class="kv"><dt>Hora</dt><dd>${new Date(s.start).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}${s.phase ? ` · Fase ${s.phase}` : ''}</dd>
    <dt>Dolor</dt><dd>antes ${pDot(ci.pain)} · después ${pDot(s.painEnd)} · día sig. ${s.nextDay ? pDot(s.nextDay.pain) : '<span class="muted">—</span>'}</dd>
    <dt>Energía</dt><dd>${ci.energy ? `${ENERGY[ci.energy - 1]} ${ENERGY_TXT[ci.energy - 1]}` : '—'}</dd>
    <dt>Sueño</dt><dd>${ci.sleep != null ? n1(ci.sleep) + ' h' : '—'}</dd>
    <dt>Volumen</dt><dd>${kg(Math.round(volumeOf(s)))} kg</dd>
    <dt>Calentam.</dt><dd>${(s.warmup || []).filter(Boolean).length}/${calentamientoDe(s).length}${(s.warmup || []).some(Boolean) ? `<div class="tiny muted">${calentamientoDe(s).filter((w, i) => s.warmup[i]).map(esc).join(' · ')}</div>` : ''}</dd></dl>`;
  if (s.nextDay && s.nextDay.pain >= preOf(s) + 2) h += `<div class="note warn small">Al día siguiente amaneció ${s.nextDay.pain - preOf(s)} puntos peor: la próxima vez baja la carga.</div>`;
  s.items.forEach(i => {
    const ex = getEx(i.ex);
    h += `<h3>${esc(ex.name)} ${shoulderBadge(ex)}</h3><ul class="clean sets">${i.done.map((d, k) => `<li><span class="muted">S${k + 1}</span><span>${fmtSetLong(ex, d)}</span><span class="muted tiny" style="margin-left:auto">dolor</span>${pDot(d.pain)}</li>`).join('')}</ul>`;
  });
  if (!s.items.length) h += '<p class="muted small">Sin series registradas.</p>';
  if (s.notes) h += `<h3>Notas</h3><p class="small" style="white-space:pre-wrap">${esc(s.notes)}</p>`;
  h += `<div class="row wrap mt">${s.nextDay ? '' : `<button class="btn sm" data-act="nd-open" data-id="${s.id}">Registrar cómo amaneció</button>`}
    <button class="btn sm" data-act="tpl-from-hist" data-id="${s.id}">Guardar como plantilla</button>
    <button class="btn sm danger" data-act="hist-del" data-id="${s.id}">Borrar</button></div>`;
  return `<div class="hs-b">${h}</div>`;
}

