/* Estado de la app y guardado en localStorage (clave mientreno.v1). */
import { toast } from './ui/toast.js';
import { dayStr } from './util.js';
export const APP_VERSION = '1.0.0';
export const KEY = 'mientreno.v1';
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
export function load() {
  const d = defaultState(); let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
  if (!s || typeof s !== 'object') return d;
  return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) }, ui: { ...d.ui, ...(s.ui || {}) },
    exercises: Array.isArray(s.exercises) ? s.exercises : [], templates: Array.isArray(s.templates) ? s.templates : [],
    sessions: Array.isArray(s.sessions) ? s.sessions : [] };
}
export let S = load();
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('No se pudo guardar en este dispositivo.', 'bad'); }
}
export const UI = { tab: 'inicio', ci: null, finishing: null, histOpen: {}, prog: { ex: null, metric: null }, lib: { q: '', target: 'draft' },
  tplEdit: null, exEdit: null, confirmFn: null, nd: null };

