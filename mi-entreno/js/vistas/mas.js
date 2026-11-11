/* Pantalla Más (ajustes). */
import { GROUPS, PHASES, TYPES } from '../datos/catalogo.js';
import { APP_VERSION, S } from '../estado.js';
import { allEx } from '../logica/ejercicios.js';
import { aiSettingsCard, importButton } from '../rutina.js';
import { shoulderBadge } from '../ui/componentes.js';
import { installCard } from '../ui/pwa.js';
import { esc, kg, plural } from '../util.js';
import { rulesCard } from './inicio.js';
/* Más / Ajustes */
export function vMas() {
  const st = S.settings;
  const num = (key, label, val, help) => `<div class="list-row"><span class="grow"><b>${label}</b>${help ? `<div class="tiny muted">${help}</div>` : ''}</span>
    <div class="stp-c" style="width:170px"><button class="stp-b" data-act="set-num" data-k="${key}" data-d="-1" aria-label="Menos">−</button><div class="stp-v" style="font-size:18px">${val}</div><button class="stp-b" data-act="set-num" data-k="${key}" data-d="1" aria-label="Más">+</button></div></div>`;
  let h = installCard();
  h += `<div class="card"><h2>Apariencia</h2><div class="seg">${[['auto', 'Automático'], ['dark', 'Oscuro'], ['light', 'Claro']].map(([k, l]) => `<button class="${(st.theme || 'auto') === k ? 'on' : ''}" data-act="set-theme" data-v="${k}">${l}</button>`).join('')}</div>
    <p class="tiny muted">Automático sigue el modo claro u oscuro de tu teléfono.</p></div>`;
  h += `<div class="card"><h2>Hombro lesionado</h2><div class="seg">${[['izq', 'Izquierdo'], ['der', 'Derecho'], ['ambos', 'Ambos']].map(([k, l]) => `<button class="${st.side === k ? 'on' : ''}" data-act="set-side" data-v="${k}">${l}</button>`).join('')}</div></div>`;
  h += `<div class="card"><h2>Mis mancuernas</h2><p class="muted small">Solo estos pesos aparecen en los botones +/−.</p>
    <div class="chips">${st.weights.slice().sort((a, b) => a - b).map(w => `<span class="chipx">${kg(w)} kg<button data-act="w-del" data-v="${w}" aria-label="Quitar ${kg(w)} kg">×</button></span>`).join('')}</div>
    <div class="row"><input class="inp grow" id="w-new" type="text" inputmode="decimal" autocomplete="off" placeholder="Ej: 7,5" aria-label="Nuevo peso en kg"><button class="btn" data-act="w-add">Agregar</button></div></div>`;
  h += `<div class="card"><h2>Entrenamiento</h2>
    ${num('rest', 'Descanso por defecto', `${st.rest}<small>s</small>`, 'Si la plantilla no define uno.')}
    ${num('perWeek', 'Entrenos por semana', st.perWeek, 'Tu meta semanal.')}
    ${num('threshold', 'Umbral de alerta de dolor', st.threshold, 'Desde este dolor la app avisa.')}
    <button class="tog ${st.sound ? 'on' : ''}" data-act="set-tog" data-k="sound"><b>Sonido al terminar el descanso</b><span class="sw"></span></button>
    <button class="tog ${st.vibrate ? 'on' : ''}" data-act="set-tog" data-k="vibrate"><b>Vibración</b><span class="sw"></span></button>
    <button class="btn sm mt" data-act="test-beep">Probar sonido</button></div>`;
  h += `<div class="card"><h2>Plan por fases</h2><div class="seg">${[1, 2, 3].map(p => `<button class="${st.phase === p ? 'on' : ''}" data-act="phase-set" data-p="${p}">Fase ${p}</button>`).join('')}</div>
    <div class="field"><label for="start-date">Fecha de inicio del plan</label><input class="inp" type="date" id="start-date" data-in="start-date" value="${esc(st.startDate)}"></div>
    <div class="field"><label for="phase-since">Fase actual desde</label><input class="inp" type="date" id="phase-since" data-in="phase-since" value="${esc(st.phaseSince || st.startDate)}"></div>
    ${[1, 2, 3].map(p => `<h3>Fase ${p} · ${PHASES[p].weeks} · "${PHASES[p].name}"</h3><ul class="dots small">${PHASES[p].bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`).join('')}
    <h3>Reglas para avanzar</h3><ul class="dots small"><li>2 semanas seguidas cumpliendo la meta semanal, y</li><li>dolor promedio antes de entrenar ≤2, y</li><li>el dolor no sube más de 2 puntos durante las sesiones.</li><li>Si el dolor promedio de la última semana es ≥4, la app sugiere volver a la fase anterior.</li></ul></div>`;
  h += `<div class="card"><h2>📖 Guía de ejercicios</h2><p class="muted small">Toca un ejercicio para ver cómo se hace, los errores comunes y un video.</p>
    ${GROUPS.map(g => { const es = allEx().filter(e => e.group === g); return es.length ? `<h3>${esc(g)}</h3>${es.map(e => `<button class="lib-item" data-act="guide-open" data-id="${esc(e.id)}"><span class="grow"><b>${esc(e.name)}</b></span>${shoulderBadge(e)}<span class="muted">›</span></button>`).join('')}` : ''; }).join('')}</div>`;
  h += `<div class="card"><div class="row between"><h2 class="mb0">Mis plantillas</h2><button class="btn sm" data-act="tpl-new">+ Nueva</button></div>
    <div class="mt">${typeof importButton === 'function' ? importButton() : ''}</div>
    ${S.templates.length ? `<div class="mt">${S.templates.map(t => `<div class="list-row"><span class="grow"><b>${esc(t.name)}</b><div class="tiny muted">${plural(t.items.length, 'ejercicio', 'ejercicios')}</div></span><button class="btn sm" data-act="tpl-edit" data-id="${t.id}">Editar</button><button class="btn sm danger icon" data-act="tpl-del" data-id="${t.id}" aria-label="Borrar plantilla">✕</button></div>`).join('')}</div>` : '<p class="muted small">Aún no tienes plantillas propias. Puedes crearlas aquí o guardar una sesión como plantilla.</p>'}</div>`;
  const mine = S.exercises.filter(e => !e.hidden);
  if (typeof aiSettingsCard === 'function') h += aiSettingsCard();
  h += `<div class="card"><div class="row between"><h2 class="mb0">Mis ejercicios</h2><button class="btn sm" data-act="ex-new">+ Nuevo</button></div>
    ${mine.length ? `<div class="mt">${mine.map(e => `<div class="list-row"><span class="grow"><b>${esc(e.name)}</b> ${shoulderBadge(e)}<div class="tiny muted">${esc(e.group)} · ${esc(TYPES[e.type])} · meta ${esc(e.goal)}</div></span><button class="btn sm" data-act="ex-edit" data-id="${e.id}">Editar</button></div>`).join('')}</div>` : '<p class="muted small">Crea ejercicios propios con nombre, grupo, tipo, etiqueta de hombro, meta y tip.</p>'}</div>`;
  h += `<div class="card"><h2>Respaldo</h2><p class="muted small">Tus datos viven solo en este teléfono. Descarga un respaldo de vez en cuando.</p>
    <div class="row"><button class="btn grow" data-act="exp-copy">Copiar JSON</button><button class="btn grow" data-act="exp-dl">Descargar JSON</button></div>
    <h3>Importar</h3><p class="muted small">Se fusiona por id: no se duplican entrenos, plantillas ni ejercicios.</p>
    <button class="btn block" data-act="imp-file">Elegir archivo .json</button>
    <div class="field"><textarea class="inp" id="imp-text" placeholder="…o pega aquí el JSON copiado"></textarea></div>
    <button class="btn block" data-act="imp-paste">Importar texto pegado</button></div>`;
  h += rulesCard();
  h += `<p class="center tiny muted">Mi Entreno v${APP_VERSION} · ${S.sessions.length} entrenos guardados en este dispositivo</p>`;
  return h;
}

