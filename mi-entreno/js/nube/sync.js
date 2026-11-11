/* Sincronización con Supabase (skill datos-y-privacidad).
   - Offline primero: la app siempre lee y escribe la copia local; esto solo sube y baja cambios.
   - Al guardar se detecta qué registro cambió (huella) y se le pone hora de edición (updated_at).
   - Conflictos: gana la última edición, por registro (el servidor ignora versiones más viejas).
   - Lo que se borra en la app se sube como "borrado" (deleted_at) para que los otros teléfonos lo sepan.
   Una sesión de entreno viaja junto con sus series y sus lecturas de dolor. */
import { CUENTA_UID, S, save } from '../estado.js';
import { molestiaPrincipal, perfil } from '../logica/perfil.js';
import { HOOKS } from '../registro.js';
import { nube } from './cliente.js';

const TABLAS = ['profiles', 'conditions', 'equipment', 'exercises', 'templates', 'sessions', 'sets', 'pain_readings'];
const esUUID = s => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const nuevoId = () => crypto.randomUUID();
const iso = t => (t == null ? null : new Date(t).toISOString());
const ms = t => (t ? Date.parse(t) : 0);

/* Huella corta de un objeto (para saber si cambió) */
function huella(obj) {
  const s = JSON.stringify(obj);
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/* Datos de sincronización guardados dentro del estado de la cuenta */
export function meta(st = S) {
  st.meta = st.meta || {};
  for (const k of ['h', 'u', 'pend', 'tomb', 'cursor']) st.meta[k] = st.meta[k] || {};
  return st.meta;
}
const condicionPrincipal = st => molestiaPrincipal(st);

/* ---------- Ids: con cuenta, todo usa UUID (se generan en el teléfono) ---------- */
export function asegurarIds(st) {
  const mapaTpl = {};
  for (const t of st.templates) if (!esUUID(t.id)) { const n = nuevoId(); mapaTpl[t.id] = n; t.id = n; }
  const remapTpl = x => { if (x && mapaTpl[x.tplId]) x.tplId = mapaTpl[x.tplId]; };
  st.sessions.forEach(remapTpl); remapTpl(st.draft);
  for (const s of st.sessions) {
    if (!esUUID(s.id)) {
      const n = nuevoId();
      if (st.ui && st.ui.ndSkip && st.ui.ndSkip[s.id]) { st.ui.ndSkip[n] = st.ui.ndSkip[s.id]; delete st.ui.ndSkip[s.id]; }
      s.id = n;
    }
    s.pids = s.pids || {};
    if (!s.pids.c) s.pids.c = nuevoId();
    if (s.painEnd != null && !s.pids.e) s.pids.e = nuevoId();
    if (s.nextDay && !s.pids.n) s.pids.n = nuevoId();
    (s.items || []).forEach(i => (i.done || []).forEach(d => { if (!d.id) d.id = nuevoId(); }));
  }
  for (const e of st.exercises) if (!esUUID(e.uuid)) e.uuid = nuevoId();
  for (const c of perfil(st).conditions) if (!esUUID(c.id)) c.id = nuevoId();
  for (const q of perfil(st).equipment) if (!esUUID(q.id)) q.id = nuevoId();
}

/* Cada registro sincronizable, con su clave "tabla:id" */
function entidades(st) {
  const p = perfil(st), out = {};
  out['profiles:me'] = { settings: st.settings, display_name: p.display_name || null, level: p.level || null, goal: p.goal || null,
    coach: p.coach || 'coach', consent_at: p.consent_at || null, onboarded_at: p.onboarded_at || null };
  p.conditions.forEach(c => { out['conditions:' + c.id] = c; });
  p.equipment.forEach(q => { out['equipment:' + q.id] = q; });
  st.exercises.forEach(e => { out['exercises:' + e.uuid] = e; });
  st.templates.forEach(t => { out['templates:' + t.id] = t; });
  st.sessions.forEach(s => { out['sessions:' + s.id] = s; });
  return out;
}

/* Al guardar: detecta qué cambió, le pone hora y lo deja pendiente de subir */
export function marcarCambios(st, uid) {
  if (!uid) return;
  asegurarIds(st);
  const m = meta(st), ents = entidades(st), ahora = new Date().toISOString();
  for (const [k, obj] of Object.entries(ents)) {
    const h = huella(obj);
    if (m.h[k] !== h) { m.h[k] = h; m.u[k] = ahora; m.pend[k] = 1; delete m.tomb[k]; }
  }
  for (const k of Object.keys(m.h)) if (!ents[k] && k !== 'profiles:me') { delete m.h[k]; m.tomb[k] = ahora; m.pend[k] = 1; }
}
HOOKS.antesDeGuardar.push(marcarCambios);

/* ---------- De la app a filas de la base ---------- */
function filas(st, uid, k) {
  const [tabla, id] = k.split(':'), m = meta(st), u = m.u[k] || new Date().toISOString(), base = { user_id: uid, updated_at: u, deleted_at: null };
  const ents = entidades(st), o = ents[k];
  if (tabla === 'profiles') {
    const s = st.settings;
    return [['profiles', { ...base, display_name: o.display_name, level: o.level, goal: o.goal, coach: o.coach,
      days_per_week: s.perWeek, phase: s.phase, plan_start: s.startDate || null, phase_since: s.phaseSince || null,
      settings: s, consent_at: o.consent_at, onboarded_at: o.onboarded_at }]];
  }
  if (tabla === 'conditions') return [['conditions', { ...base, id, zone: o.zone, zone_other: o.zone_other || null, side: o.side || 'na',
    status: o.status || 'activa', since: o.since ? (o.since.length === 7 ? o.since + '-01' : o.since) : null, notes: o.notes || null, bothers: o.bothers || [], threshold: o.threshold || 4 }]];
  if (tabla === 'equipment') return [['equipment', { ...base, id, kind: o.kind, weights: o.weights || [], notes: o.notes || null }]];
  if (tabla === 'exercises') return [['exercises', { ...base, id, slug: o.id, name: o.name, grp: o.group || null, type: o.type || 'r',
    goal: o.goal || null, tip: o.tip || null, tags: { ...(o.tags || {}), shoulder: o.shoulder || 'ok' }, hidden: !!o.hidden }]];
  if (tabla === 'templates') return [['templates', { ...base, id, name: o.name, description: o.desc || null, items: o.items || [] }]];
  if (tabla === 'sessions') {
    const c = condicionPrincipal(st), cid = c ? c.id : null, ck = o.checkin || {};
    const out = [['sessions', { ...base, id, started_at: iso(o.start), ended_at: iso(o.end), template_ref: o.tplId || null,
      template_name: o.tplName || null, phase: o.phase || null, with_rehab: !!o.withRehab, energy: ck.energy || null,
      sleep_h: ck.sleep ?? null, warmup: o.warmup || [], notes: o.notes || null,
      plan: (o.items || []).map(i => ({ ex: i.ex, sets: i.sets, goal: i.goal, rest: i.rest || null })) }]];
    (o.items || []).forEach((i, pos) => (i.done || []).forEach((d, k2) => out.push(['sets', { ...base, id: d.id, session_id: id,
      exercise_slug: i.ex, position: pos, set_index: k2, weight_kg: d.w ?? null, reps: d.reps ?? null, seconds: d.secs ?? null,
      pain: d.pain ?? null, condition_id: d.pain != null ? cid : null, done_at: iso(d.at) }])));
    if (ck.pain != null) out.push(['pain_readings', { ...base, id: o.pids.c, session_id: id, condition_id: cid, moment: 'checkin', value: ck.pain, at: iso(o.start) }]);
    if (o.painEnd != null) out.push(['pain_readings', { ...base, id: o.pids.e, session_id: id, condition_id: cid, moment: 'end', value: o.painEnd, at: iso(o.end || o.start) }]);
    if (o.nextDay) out.push(['pain_readings', { ...base, id: o.pids.n, session_id: id, condition_id: cid, moment: 'next_day', value: o.nextDay.pain, at: iso(o.nextDay.at) }]);
    return out;
  }
  return [];
}

/* ---------- De filas de la base a la app ---------- */
function aSesion(r, sets, lecturas) {
  const items = [];
  (r.plan || []).forEach((p, pos) => { items[pos] = { ex: p.ex, sets: p.sets, goal: p.goal, rest: p.rest || null, done: [] }; });
  for (const x of sets.filter(x => !x.deleted_at).sort((a, b) => a.position - b.position || a.set_index - b.set_index)) {
    if (!items[x.position]) items[x.position] = { ex: x.exercise_slug, sets: 0, goal: '', rest: null, done: [] };
    const d = { id: x.id, pain: x.pain, at: ms(x.done_at) || null };
    if (x.weight_kg != null) d.w = Number(x.weight_kg);
    if (x.reps != null) d.reps = x.reps;
    if (x.seconds != null) d.secs = x.seconds;
    items[x.position].done.push(d);
  }
  const lec = mom => lecturas.find(l => l.moment === mom && !l.deleted_at);
  const c = lec('checkin'), e = lec('end'), n = lec('next_day');
  return { id: r.id, start: ms(r.started_at), end: r.ended_at ? ms(r.ended_at) : null, tplId: r.template_ref, tplName: r.template_name,
    phase: r.phase, withRehab: r.with_rehab, checkin: { pain: c ? c.value : 0, energy: r.energy, sleep: r.sleep_h != null ? Number(r.sleep_h) : null },
    warmup: r.warmup || [], painEnd: e ? e.value : null, notes: r.notes || '', nextDay: n ? { pain: n.value, at: ms(n.at) } : null,
    items: items.filter(Boolean).map(i => ({ ...i, done: i.done || [] })), pids: { c: c && c.id, e: e && e.id, n: n && n.id } };
}

/* ---------- Estado visible de la sincronización ---------- */
export const SYNC = { corriendo: false, ultimo: null, error: null, pendientes: 0 };
const avisar = () => { SYNC.pendientes = CUENTA_UID ? Object.keys(meta().pend).length : 0; window.dispatchEvent(new CustomEvent('mientreno:sync')); };

/* ---------- Subir y bajar ---------- */
/* Si ya hay una sincronización en curso, se espera a que termine y se corre otra (con los cambios nuevos).
   Así quien pide sincronizar siempre obtiene el resultado real. */
let enCurso = null;
export async function sincronizar() {
  if (enCurso) { try { await enCurso; } catch (e) { /* la siguiente lo reintenta */ } }
  if (enCurso) return enCurso;          // otra llamada ya empezó una nueva: se usa esa
  enCurso = correr();
  try { return await enCurso; } finally { enCurso = null; }
}
async function correr() {
  const uid = CUENTA_UID;
  if (!uid || !navigator.onLine) { avisar(); return false; }
  SYNC.corriendo = true; SYNC.error = null; avisar();
  try {
    const c = await nube();
    const { data: ses } = await c.auth.getSession();
    if (!ses.session || ses.session.user.id !== uid) throw new Error('sin-sesion');
    /* Sin consentimiento no se sube ningún dato de salud; bajar sí, para saber si ya lo dio en otro teléfono */
    if (perfil().consent_at) await subir(c, uid);
    await bajar(c, uid);
    if (perfil().consent_at && Object.keys(meta().pend).length) await subir(c, uid);
    SYNC.ultimo = Date.now();
    return true;
  } catch (e) {
    SYNC.error = e.message === 'sin-sesion' ? 'sesion' : 'red';
    console.warn('Sincronización falló:', String(e.message).split(' (')[0].slice(0, 80));   // sin datos del registro
    return false;
  } finally {
    SYNC.corriendo = false; avisar();
  }
}

async function subir(c, uid) {
  const st = S, m = meta(st), claves = Object.keys(m.pend);
  if (!claves.length) return;
  const version = Object.fromEntries(claves.map(k => [k, m.u[k] + '|' + (m.tomb[k] || '')]));
  const porTabla = {}, borrados = [];
  for (const k of claves) {
    if (m.tomb[k]) { borrados.push(k); continue; }
    for (const [t, fila] of filas(st, uid, k)) (porTabla[t] = porTabla[t] || []).push(fila);
  }
  for (const t of TABLAS) {
    const rows = porTabla[t]; if (!rows) continue;
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await c.from(t).upsert(rows.slice(i, i + 200), { onConflict: t === 'profiles' ? 'user_id' : 'id' });
      if (error) throw new Error(error.message);
    }
  }
  for (const k of borrados) {
    const [t, id] = k.split(':');
    const { error } = await c.from(t).update({ deleted_at: m.tomb[k], updated_at: m.tomb[k] }).eq('id', id);
    if (error) throw new Error(error.message);
  }
  /* Solo se limpian las claves que no volvieron a cambiar mientras se subía */
  for (const k of claves) if (version[k] === m.u[k] + '|' + (m.tomb[k] || '')) { delete m.pend[k]; delete m.tomb[k]; }
  if (S === st) save();
}

async function traer(c, t, desde) {
  const out = [];
  for (let vuelta = 0; vuelta < 50; vuelta++) {
    const { data, error } = await c.from(t).select('*').gt('synced_at', desde).order('synced_at').limit(1000);
    if (error) throw new Error(error.message);
    out.push(...data);
    if (data.length < 1000) break;
    desde = data[data.length - 1].synced_at;
  }
  return out;
}

async function bajar(c, uid) {
  const st = S, m = meta(st), p = perfil(st);
  const nuevo = (k, r) => ms(r.updated_at) > ms(m.u[k]) && !m.pend[k];
  const cambios = {}, cursores = {};
  for (const t of TABLAS) {
    cambios[t] = await traer(c, t, m.cursor[t] || '1970-01-01T00:00:00Z');
    if (cambios[t].length) cursores[t] = cambios[t][cambios[t].length - 1].synced_at;
  }
  /* La huella queda igual a lo recién bajado, así no se vuelve a subir */
  const marcar = k => { const e = entidades(st)[k]; if (e) m.h[k] = huella(e); };

  for (const r of cambios.profiles) {
    if (!nuevo('profiles:me', r)) continue;
    Object.assign(st.settings, r.settings || {});
    Object.assign(p, { display_name: r.display_name, level: r.level, goal: r.goal, coach: r.coach, consent_at: r.consent_at, onboarded_at: r.onboarded_at });
    m.u['profiles:me'] = r.updated_at; marcar('profiles:me');
  }
  const lista = (t, arr, idDe, aLocal) => {
    for (const r of cambios[t]) {
      if (t === 'exercises' && r.user_id == null) continue;   // los globales llegan en la etapa 3
      const k = t + ':' + r.id; if (!nuevo(k, r)) continue;
      const i = arr.findIndex(x => idDe(x) === r.id);
      if (r.deleted_at) { if (i >= 0) arr.splice(i, 1); delete m.h[k]; m.u[k] = r.updated_at; continue; }
      const obj = aLocal(r);
      if (i >= 0) arr[i] = obj; else arr.push(obj);
      m.u[k] = r.updated_at; marcar(k);
    }
  };
  lista('conditions', p.conditions, x => x.id, r => ({ id: r.id, zone: r.zone, zone_other: r.zone_other, side: r.side, status: r.status, since: r.since ? String(r.since).slice(0, 7) : '', notes: r.notes, bothers: r.bothers || [], threshold: r.threshold }));
  lista('equipment', p.equipment, x => x.id, r => ({ id: r.id, kind: r.kind, weights: (r.weights || []).map(Number), notes: r.notes }));
  lista('exercises', st.exercises, x => x.uuid, r => ({ id: r.slug, uuid: r.id, name: r.name, group: r.grp, type: r.type, shoulder: (r.tags || {}).shoulder || 'ok', goal: r.goal, tip: r.tip, custom: true, hidden: r.hidden, tags: r.tags || {} }));
  lista('templates', st.templates, x => x.id, r => ({ id: r.id, name: r.name, desc: r.description, items: r.items || [] }));

  /* Sesiones: si cambió la sesión, una serie o un dolor, se trae la sesión completa */
  const ids = new Set([...cambios.sessions.map(r => r.id), ...cambios.sets.map(r => r.session_id), ...cambios.pain_readings.map(r => r.session_id).filter(Boolean)]);
  const lote = [...ids].filter(id => !m.pend['sessions:' + id]);
  for (let i = 0; i < lote.length; i += 100) {
    const parte = lote.slice(i, i + 100);
    const [ss, sets, lec] = await Promise.all([
      c.from('sessions').select('*').in('id', parte), c.from('sets').select('*').in('session_id', parte), c.from('pain_readings').select('*').in('session_id', parte)]);
    for (const q of [ss, sets, lec]) if (q.error) throw new Error(q.error.message);
    for (const r of ss.data) {
      const k = 'sessions:' + r.id, j = st.sessions.findIndex(x => x.id === r.id);
      const hijos = [...sets.data, ...lec.data].filter(x => x.session_id === r.id);
      const ultima = Math.max(ms(r.updated_at), ...hijos.map(x => ms(x.updated_at)));
      if (ultima <= ms(m.u[k]) && j >= 0) continue;
      if (r.deleted_at) { if (j >= 0) st.sessions.splice(j, 1); delete m.h[k]; m.u[k] = new Date(ultima).toISOString(); continue; }
      const obj = aSesion(r, sets.data.filter(x => x.session_id === r.id), lec.data.filter(x => x.session_id === r.id));
      if (j >= 0) st.sessions[j] = obj; else st.sessions.push(obj);
      m.u[k] = new Date(ultima).toISOString(); marcar(k);
    }
  }
  Object.assign(m.cursor, cursores);   // el punto de descarga avanza solo después de aplicar todo
  if (S === st) save();
}

/* ¿Hay datos en la nube? (para decidir si ofrecer importar) */
export async function cuentaTieneDatos() {
  const c = await nube();
  const { count } = await c.from('sessions').select('id', { count: 'exact', head: true }).is('deleted_at', null);
  return (count || 0) > 0;
}

/* ---------- Cuándo sincronizar ---------- */
let reloj = null;
HOOKS.despuesDeGuardar.push((st, uid) => {
  if (!uid || SYNC.corriendo) { avisar(); return; }
  clearTimeout(reloj); reloj = setTimeout(sincronizar, 2000);   // agrupa varios cambios seguidos
  avisar();
});
window.addEventListener('online', () => sincronizar());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sincronizar(); });
setInterval(() => { if (document.visibilityState === 'visible') sincronizar(); }, 60000);
