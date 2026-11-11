/* Estado de la app y guardado local.
   - Sin cuenta (modo invitado): todo vive en localStorage con la clave mientreno.v1 (la de siempre).
   - Con cuenta: cada persona tiene su propia copia local en mientreno.cuenta.<id>, que se sincroniza
     con Supabase (js/nube/sync.js). Así la app funciona sin internet y nadie ve datos de otra cuenta. */
import { HOOKS } from './registro.js';
import { toast } from './ui/toast.js';
import { dayStr } from './util.js';
export const APP_VERSION = '2.0.0';
export const KEY = 'mientreno.v1';                 // datos del modo invitado (y de la versión 1)
export const keyCuenta = uid => 'mientreno.cuenta.' + uid;

/* ---------- Estado ---------- */
export function defaultState() {
  return {
    v: 1,
    settings: { side: 'der', weights: [2, 3, 4, 5, 6, 8, 10, 12], rest: 90, perWeek: 3, threshold: 4, phase: 1,
      startDate: dayStr(Date.now()), phaseSince: dayStr(Date.now()), sound: true, vibrate: true, theme: 'auto' },
    exercises: [], templates: [], sessions: [], draft: null,
    ui: { phaseSnooze: 0, ndSkip: {} },
  };
}
export function load(key = KEY) {
  const d = defaultState(); let s = null;
  try { s = JSON.parse(localStorage.getItem(key)); } catch (e) { s = null; }
  if (!s || typeof s !== 'object') return d;
  return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) }, ui: { ...d.ui, ...(s.ui || {}) },
    exercises: Array.isArray(s.exercises) ? s.exercises : [], templates: Array.isArray(s.templates) ? s.templates : [],
    sessions: Array.isArray(s.sessions) ? s.sessions : [] };
}

/* Cuenta activa (null = invitado) y su estado */
export let CUENTA_UID = null;
export let S = load();
const claveActual = () => (CUENTA_UID ? keyCuenta(CUENTA_UID) : KEY);

/* Cambia entre el modo invitado (uid = null) y la copia local de una cuenta */
export function usarAlmacen(uid) {
  if (uid === CUENTA_UID) return;
  CUENTA_UID = uid || null;
  S = load(claveActual());
}
/* Reemplaza el estado completo (por ejemplo, al importar datos a una cuenta) */
export function reemplazarEstado(nuevo) { S = nuevo; save(); }

export function save() {
  try {
    HOOKS.antesDeGuardar.forEach(f => f(S, CUENTA_UID)); // marca qué cambió, para sincronizar
    localStorage.setItem(claveActual(), JSON.stringify(S));
    HOOKS.despuesDeGuardar.forEach(f => f(S, CUENTA_UID));
  } catch (e) { toast('No se pudo guardar en este dispositivo.', 'bad'); }
}
export const UI = { tab: 'inicio', ci: null, finishing: null, histOpen: {}, prog: { ex: null, metric: null }, lib: { q: '', target: 'draft' },
  tplEdit: null, exEdit: null, confirmFn: null, nd: null };
