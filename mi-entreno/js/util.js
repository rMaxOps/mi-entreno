/* Utilidades: fechas, números, textos y niveles de dolor. */
/* ---------- Utilidades ---------- */
export const $ = (s, r = document) => r.querySelector(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const pad = n => String(n).padStart(2, '0');
export const DAY = 864e5;
export const kg = w => String(Math.round(w * 100) / 100).replace('.', ',');
export const n1 = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
export const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
export const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
export const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
export function dayStr(t) { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
export function parseDay(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y || 2000, (m || 1) - 1, d || 1); }
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function weekStart(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; }
export function mmss(s) { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; }
export function hms(ms) { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600); return h ? `${h}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }
export function durTxt(ms) { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${pad(m % 60)} min` : `${m} min`; }
export function fmtDate(t, o = { weekday: 'short', day: 'numeric', month: 'short' }) { return new Date(t).toLocaleDateString('es-CL', o); }
export function sd(t) { const d = new Date(t); return `${d.getDate()}/${d.getMonth() + 1}`; }
export function relDay(t) {
  const d = Math.round((parseDay(dayStr(Date.now())) - parseDay(dayStr(t))) / DAY);
  if (d === 0) return 'hoy'; if (d === 1) return 'ayer'; if (d < 7) return `hace ${d} días`;
  return fmtDate(t, { day: 'numeric', month: 'short' });
}
export function parseGoal(g) {
  const m = String(g || '').match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return { min: +m[1], max: Math.max(+m[1], +m[2]) };
  const n = parseInt(g, 10); return n > 0 ? { min: n, max: n } : { min: 8, max: 12 };
}
export const pLevel = p => p <= 2 ? 'g' : p <= 4 ? 'y' : 'r';
export const pColor = p => ({ g: 'var(--ok)', y: 'var(--warn)', r: 'var(--bad)' })[pLevel(p)];
export const painFace = p => p <= 1 ? '😊' : p <= 2 ? '🙂' : p <= 4 ? '😐' : p <= 6 ? '😟' : '😣';
export const pDot = p => p == null ? '<span class="muted">—</span>' : `<span class="pdot" style="background:${pColor(p)}">${p}</span>`;
export const painWord = p => p === 0 ? 'Sin dolor' : p <= 2 ? 'Leve: aceptable' : p <= 4 ? 'Moderado: baja la carga' : 'Alto: detente';

