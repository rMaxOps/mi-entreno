/* =========================================================
   Crear una rutina pegando su texto (se lee en el teléfono, sin IA y gratis).
   Líneas como "3x10 remo 6 kg", "Plancha 3x30''" o "Sentadilla goblet 3x8-12 90s".
   La lectura de fotos y PDF con IA está en pausa: volverá en la etapa 6 desde un servidor.
   ========================================================= */
import { GROUPS, TYPES } from './datos/catalogo.js';
import { S, UI, save } from './estado.js';
import { allEx, getEx } from './logica/ejercicios.js';
import { ACT, HOOKS, INP } from './registro.js';
import { shoulderBadge } from './ui/componentes.js';
import { closeModal, openModal } from './ui/modales.js';
import { render } from './ui/render.js';
import { toast } from './ui/toast.js';
import { $, clamp, esc, kg, plural, uid } from './util.js';

/* Si en este teléfono quedó guardada una API key de la versión anterior, se borra: ya no se usa */
try { localStorage.removeItem('mientreno.ai'); } catch (e) { /* sin almacenamiento */ }

/* ---------- Botón de entrada (en Entreno y en Más) ---------- */
export const importButton = () => `<button class="btn block" data-act="rut-open" style="margin:0 0 10px">✍️ Crear rutina pegando el texto</button>`;

/* ---------- La hoja: pegar → revisar → confirmar ---------- */
/* UI.imp = { step: 'paste'|'review'|'confirm', text, res } */
ACT['rut-open'] = () => { UI.imp = { step: 'paste', text: '' }; impRender(); };
ACT['rut-back'] = () => { UI.imp.step = UI.imp.res ? 'review' : 'paste'; impRender(); };
ACT['rut-text-local'] = () => {
  const t = (UI.imp.text || '').trim(); if (!t) return toast('Pega primero el texto de la rutina.', 'bad');
  const r = parseLocal(t);
  if (!r.ejercicios.length) return toast('No encontré ejercicios. Prueba con líneas como "3x10 remo 6 kg".', 'bad');
  UI.imp.res = toReview(r); UI.imp.step = 'review'; impRender();
};
INP['rut-text'] = v => { UI.imp.text = v; };

/* Volver a dibujar la hoja sin perder la posición del scroll */
export function impRender() {
  const prev = $('.sheet'), top = prev ? prev.scrollTop : 0;
  openModal(impView());
  const s = $('.sheet'); if (s) s.scrollTop = top;
}
HOOKS.closeModal.push(() => { UI.imp = null; });

export function impView() {
  const m = UI.imp;
  if (m.step === 'paste') return `<h2>Crear rutina pegando el texto</h2>
    <p class="muted small">Pega la rutina de tu kinesiólogo o de donde la tengas, una línea por ejercicio. Por ejemplo: <b>3x10 remo 6 kg</b>, <b>Plancha 3x30''</b> o <b>Sentadilla goblet 3x8-12 90s</b>. Después la revisas antes de guardar.</p>
    <div class="field"><textarea class="inp" style="min-height:160px" data-in="rut-text" aria-label="Texto de la rutina" placeholder="Rutina A&#10;3x12 rotación externa 2 kg&#10;3x10 remo 6 kg c/lado&#10;Plancha 3x30''">${esc(m.text || '')}</textarea></div>
    <button class="btn pri big" data-act="rut-text-local">Leer el texto</button>
    <button class="btn block ghost mt" data-act="modal-close">Cancelar</button>`;
  if (m.step === 'review') return reviewView();
  if (m.step === 'confirm') return confirmView();
  return '';
}

/* ---------- Números con límites ---------- */
export const int = (v, a, b) => { const n = Math.round(Number(v)); return Number.isFinite(n) && v !== null && v !== '' ? clamp(n, a, b) : null; };

/* ---------- Lector simple de líneas, sin IA ---------- */
export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export const STOP = new Set(['de', 'con', 'en', 'el', 'la', 'los', 'las', 'a', 'al', 'y', 'por', 'lado', 'c', 'kg', 'mancuerna', 'mancuernas']);
/* Busca el ejercicio de la biblioteca que más se parece por palabras */
export function matchEx(name) {
  const w = norm(name).split(' ').filter(x => x.length > 2 && !STOP.has(x));
  if (!w.length) return null;
  let best = null, bs = 0;
  allEx().forEach(e => {
    const ew = norm(e.name).split(' ').filter(x => x.length > 2 && !STOP.has(x));
    const hit = w.filter(x => ew.some(y => y.startsWith(x.slice(0, 5)) || x.startsWith(y.slice(0, 5)))).length;
    /* cuenta sobre todo cuántas palabras de la línea calzan; el nombre más corto gana en un empate */
    const sc = hit / w.length + 0.1 * hit / Math.max(1, ew.length);
    if (sc > bs) { bs = sc; best = e; }
  });
  return bs >= 0.6 ? best : null;
}
export function parseLocal(text) {
  const out = { nombre: '', notas: '', ejercicios: [], dudas: [] };
  /* quita viñetas y numeración al inicio ("-", "•", "1)", "2.") sin tocar el "3x10" */
  text.split(/\r?\n/).map(l => l.replace(/^\s*(?:[-•*·]+|\d+\s*[.)])\s*/, '').trim()).filter(Boolean).forEach(line => {
    const sx = line.match(/(\d+)\s*[x×]\s*(\d+)(?:\s*(?:-|–|a)\s*(\d+))?\s*(''|"|”|s\b|seg\w*)?/i);
    if (!sx) { if (!out.nombre && !out.ejercicios.length) out.nombre = line.slice(0, 60); else out.dudas.push(`No entendí la línea: "${line}"`); return; }
    const secs = !!sx[4];
    const kgm = line.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
    const rest = line.match(/(?:desc\w*\s*(\d+)\s*(?:s|seg)?|(\d+)\s*(?:s|seg|")\s*(?:de\s*)?desc\w*)/i);
    const restOnly = !rest && line.slice(sx.index + sx[0].length).match(/\b(\d{2,3})\s*(?:s|seg)\b/i);
    const name = line.replace(sx[0], ' ').replace(kgm ? kgm[0] : '', ' ').replace(rest ? rest[0] : '', ' ').replace(restOnly ? restOnly[0] : '', ' ')
      .replace(/c\/\s*lado|por lado/i, ' ').replace(/\s+/g, ' ').replace(/^[\s,:;-]+|[\s,:;-]+$/g, '').trim();
    const ex = matchEx(name);
    out.ejercicios.push({
      match_id: ex ? ex.id : null, nombre: name || 'Ejercicio', tipo: ex ? ex.type : secs ? 't' : kgm ? 'wr' : 'r',
      series: clamp(+sx[1], 1, 10), reps_min: secs ? null : +sx[2], reps_max: secs ? null : +(sx[3] || sx[2]), segundos: secs ? +sx[2] : null,
      peso_kg: kgm ? parseFloat(kgm[1].replace(',', '.')) : null, descanso_s: rest ? +(rest[1] || rest[2]) : restOnly ? +restOnly[1] : null,
      hombro: ex ? ex.shoulder : 'ok', nota: /c\/\s*lado|por lado/i.test(line) ? 'por lado' : '',
    });
  });
  return out;
}

/* ---------- Revisión editable ---------- */
export const OVERHEAD = /press (militar|de hombro|arnold)|sobre la cabeza|overhead|dominad|pull ?up|chin ?up|fondo|dips?\b|flexion|push ?up|handstand|vertical/i;
export function guessGroup(n) {
  const s = norm(n);
  if (/rotacion|escapul|ytw|y t w|manguito|pared/.test(s)) return 'Rehab hombro';
  if (/sentadilla|zancada|estocada|peso muerto|puente|gluteo|talon|pantorr|pierna|squat|lunge|hip/.test(s)) return 'Piernas';
  if (/plancha|abdominal|crunch|dead bug|core|rueda|hollow|bird/.test(s)) return 'Core';
  if (/remo|dominad|curl|jalon|biceps|pajaro|face pull|row/.test(s)) return 'Tirón';
  if (/press|flexion|fondo|triceps|elevacion|push|aperturas/.test(s)) return 'Empuje';
  return 'Core';
}
export function toReview(r) {
  return {
    name: r.nombre || 'Rutina importada', notes: r.notas || '', dudas: r.dudas || [],
    items: r.ejercicios.map(e => {
      const ex = e.match_id ? getEx(e.match_id) : null, tipo = ex ? ex.type : e.tipo;
      const goal = tipo === 't' ? (e.segundos != null ? String(e.segundos) : '')
        : e.reps_min != null && e.reps_max != null && e.reps_max !== e.reps_min ? `${Math.min(e.reps_min, e.reps_max)}-${Math.max(e.reps_min, e.reps_max)}`
        : e.reps_min != null || e.reps_max != null ? String(e.reps_min ?? e.reps_max) : '';
      return { match: ex ? ex.id : null, name: e.nombre, tipo, group: guessGroup(e.nombre), hombro: ex ? ex.shoulder : (e.hombro === 'care' || OVERHEAD.test(e.nombre) ? 'care' : 'ok'),
        sets: e.series || 3, goal, rest: e.descanso_s, peso: e.peso_kg, note: e.nota || '' };
    }),
  };
}
export const careOf = it => it.match ? getEx(it.match).shoulder === 'care' : (it.hombro === 'care' || OVERHEAD.test(it.name));

export function reviewView() {
  const r = UI.imp.res, lib = allEx();
  const care = r.items.filter(careOf);
  const opts = sel => `<option value="">— Ejercicio nuevo —</option>` + GROUPS.map(g => `<optgroup label="${esc(g)}">${lib.filter(e => e.group === g).map(e => `<option value="${esc(e.id)}" ${e.id === sel ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</optgroup>`).join('');
  let h = `<h2>Revisa tu rutina</h2>`;
  if (r.dudas.length) h += `<div class="note warn small"><b>Cosas que no se leyeron bien:</b><ul class="dots">${r.dudas.map(d => `<li>${esc(d)}</li>`).join('')}</ul>Corrígelas abajo antes de guardar.</div>`;
  if (care.length) h += `<div class="note warn small"><b>⚠ Ojo con el hombro:</b> ${care.map(i => esc(i.name)).join(', ')} ${care.length === 1 ? 'carga' : 'cargan'} el hombro o van por encima de la cabeza. Hazlos solo si no duelen y con poco peso. Si tu kinesiólogo indicó otra cosa, manda eso.</div>`;
  h += `<div class="field"><label for="ri-name">Nombre de la plantilla</label><input class="inp" id="ri-name" data-in="ri-name" value="${esc(r.name)}"></div>`;
  if (r.notes) h += `<p class="small muted"><b>Notas de la rutina:</b> ${esc(r.notes)}</p>`;
  if (!r.items.length) h += '<p class="muted small">No quedan ejercicios.</p>';
  r.items.forEach((it, k) => {
    const ex = it.match ? getEx(it.match) : null, tipo = ex ? ex.type : it.tipo, A = `data-k="${k}"`;
    h += `<div class="ri"><div class="row"><span class="ri-n">${k + 1}</span><input class="inp grow" data-in="ri-f" data-f="name" ${A} value="${esc(it.name)}" aria-label="Nombre del ejercicio ${k + 1}">
        <button class="btn icon ghost" data-act="ri-rm" ${A} aria-label="Quitar ${esc(it.name)}">✕</button></div>
      <div class="row mt" style="gap:6px">${ex ? `<span class="badge ok">✓ En tu biblioteca</span>${shoulderBadge(ex)}` : `<span class="badge ac">Nuevo</span>${careOf(it) ? '<span class="badge care">⚠ cuidado</span>' : ''}`}</div>
      <div class="field"><label>Ejercicio de la biblioteca</label><select class="inp" data-in="ri-match" ${A}>${opts(it.match)}</select></div>
      ${ex ? '' : `<div class="ri-g2"><div><label class="tiny muted">Tipo</label><select class="inp" data-in="ri-sel" data-f="tipo" ${A}>${Object.entries(TYPES).map(([t, l]) => `<option value="${t}" ${t === it.tipo ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
        <div><label class="tiny muted">Grupo</label><select class="inp" data-in="ri-sel" data-f="group" ${A}>${GROUPS.map(g => `<option ${g === it.group ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></div></div>`}
      <div class="ri-g3">
        <div><label class="tiny muted">Series</label><div class="stp-c"><button class="stp-b" data-act="ri-sets" data-d="-1" ${A} aria-label="Menos series">−</button><div class="stp-v">${it.sets}</div><button class="stp-b" data-act="ri-sets" data-d="1" ${A} aria-label="Más series">+</button></div></div>
        <div><label class="tiny muted">${tipo === 't' ? 'Segundos' : 'Reps'}</label><input class="inp" data-in="ri-f" data-f="goal" ${A} value="${esc(it.goal)}" inputmode="${tipo === 't' ? 'numeric' : 'text'}" placeholder="${tipo === 't' ? '30' : '8-12'}"></div>
        <div><label class="tiny muted">Descanso (s)</label><input class="inp" data-in="ri-f" data-f="rest" ${A} value="${it.rest ?? ''}" inputmode="numeric" placeholder="${S.settings.rest}"></div>
      </div>
      ${tipo === 'wr' || tipo === 'bw' ? `<div class="field"><label class="tiny muted">Peso indicado (kg, opcional)</label><input class="inp" data-in="ri-f" data-f="peso" ${A} value="${it.peso ?? ''}" inputmode="decimal" placeholder="—"></div>` : ''}
      <div class="field"><label class="tiny muted">Nota</label><input class="inp" data-in="ri-f" data-f="note" ${A} value="${esc(it.note)}" placeholder="Ej: por lado, lento"></div></div>`;
  });
  h += `<button class="btn pri big mt" data-act="ri-save" ${r.items.length ? '' : 'disabled'}>Guardar como plantilla</button>
    <button class="btn block ghost mt" data-act="modal-close">Descartar</button>`;
  return h;
}
INP['ri-name'] = v => { UI.imp.res.name = v; };
INP['ri-f'] = (v, el) => {
  const it = UI.imp.res.items[+el.dataset.k]; if (!it) return;
  const f = el.dataset.f;
  if (f === 'rest') it.rest = v.trim() === '' ? null : int(v, 0, 600);
  else if (f === 'peso') { const n = parseFloat(String(v).replace(',', '.')); it.peso = Number.isFinite(n) ? clamp(n, 0, 200) : null; }
  else it[f] = v;
};
INP['ri-match'] = (v, el) => {
  const it = UI.imp.res.items[+el.dataset.k]; if (!it) return;
  it.match = v || null;
  if (it.match) { const ex = getEx(it.match); it.tipo = ex.type; it.hombro = ex.shoulder; if (!it.goal) it.goal = ex.goal; }
  impRender();
};
INP['ri-sel'] = (v, el) => { const it = UI.imp.res.items[+el.dataset.k]; if (it) { it[el.dataset.f] = v; impRender(); } };
ACT['ri-sets'] = d => { const it = UI.imp.res.items[+d.k]; if (it) { it.sets = clamp(it.sets + +d.d, 1, 10); impRender(); } };
ACT['ri-rm'] = d => { UI.imp.res.items.splice(+d.k, 1); impRender(); };

/* ---------- Confirmar y guardar ---------- */
ACT['ri-save'] = () => {
  const r = UI.imp.res;
  if (!r.name.trim()) return toast('Ponle un nombre a la plantilla.', 'bad');
  if (r.items.some(i => !i.name.trim())) return toast('Hay un ejercicio sin nombre.', 'bad');
  UI.imp.step = 'confirm'; impRender();
};
export function confirmView() {
  const r = UI.imp.res, nuevos = r.items.filter(i => !i.match);
  return `<h2>¿Guardar “${esc(r.name.trim())}”?</h2>
    <p class="muted">Se creará una plantilla con ${plural(r.items.length, 'ejercicio', 'ejercicios')}${nuevos.length ? ` y se ${nuevos.length === 1 ? 'agregará 1 ejercicio nuevo' : `agregarán ${nuevos.length} ejercicios nuevos`} a tu biblioteca` : ''}.</p>
    <ul class="clean small">${r.items.map(i => `<li class="list-row"><span class="grow"><b>${esc(i.match ? getEx(i.match).name : i.name)}</b><div class="tiny muted">${i.sets} × ${esc(i.goal || '—')}${(i.match ? getEx(i.match).type : i.tipo) === 't' ? ' s' : ''} · descanso ${i.rest ?? S.settings.rest} s</div></span>${i.match ? '' : '<span class="badge ac">Nuevo</span>'}</li>`).join('')}</ul>
    <div class="row mt2"><button class="btn grow" data-act="rut-back">← Revisar</button><button class="btn pri grow" data-act="ri-confirm">Guardar</button></div>`;
}
ACT['ri-confirm'] = () => {
  const r = UI.imp.res, items = [];
  r.items.forEach(i => {
    let id = i.match;
    if (!id) {
      id = 'c_' + uid();
      S.exercises.push({ id, name: i.name.trim(), group: i.group, type: i.tipo, shoulder: careOf(i) ? 'care' : 'ok',
        goal: i.goal.trim() || (i.tipo === 't' ? '30' : '8-12'), tip: i.note.trim(), custom: true });
    }
    const ex = getEx(id);
    const note = [i.note.trim(), i.peso != null ? `Peso indicado: ${kg(i.peso)} kg` : ''].filter(Boolean).join(' · ');
    items.push({ ex: id, sets: i.sets, goal: i.goal.trim() || ex.goal, rest: i.rest || null, note });
  });
  S.templates.push({ id: 'u_' + uid(), name: r.name.trim(), desc: r.notes || 'Creada desde foto o PDF', items });
  save(); closeModal(); render(); toast(`Plantilla “${r.name.trim()}” guardada.`, 'ok');
};
