/* Temporizador de descanso, sonido, pantalla encendida y cronómetro. */
import { S, save } from '../estado.js';
import { $, hms, mmss } from '../util.js';
/* ---------- Temporizador de descanso ---------- */
export let restInt = null, actx = null;
export function startRest(sec, label) { if (!S.draft) return; unlockAudio(); S.draft.rest = { end: Date.now() + sec * 1000, total: sec, label, fired: false }; runRest(); }
export function stopRest() { if (S.draft) S.draft.rest = null; clearInterval(restInt); restInt = null; $('#rest').hidden = true; document.body.classList.remove('resting'); }
export function runRest() {
  clearInterval(restInt);
  const r = S.draft && S.draft.rest;
  if (!r) { stopRest(); return; }
  $('#rest').hidden = false; document.body.classList.add('resting');
  restTick(); restInt = setInterval(restTick, 250);
}
export function restTick() {
  const r = S.draft && S.draft.rest; if (!r) { stopRest(); return; }
  const rem = Math.max(0, r.end - Date.now());
  $('#rest-time').textContent = rem > 0 ? mmss(Math.ceil(rem / 1000)) : '¡A la siguiente serie!';
  $('#rest-lbl').textContent = rem > 0 ? 'Descanso' : 'Descanso terminado';
  /* el anillo se va vaciando: 150.8 es el largo del círculo (2·π·24) */
  $('#rest-ring').style.strokeDashoffset = (150.8 * Math.min(1, 1 - rem / (r.total * 1000))).toFixed(1);
  $('#rest').classList.toggle('end', rem <= 0);
  if (rem <= 0 && !r.fired) {
    r.fired = true; save(); alarm();
    setTimeout(() => { if (S.draft && S.draft.rest === r) { stopRest(); save(); } }, 6000);
  }
}
export function unlockAudio() {
  try {
    if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); }
    if (actx && actx.state === 'suspended') actx.resume();
  } catch (e) { actx = null; }
}
export function beep3() {
  if (!actx) return;
  const t0 = actx.currentTime + 0.05;
  for (let i = 0; i < 3; i++) {
    const o = actx.createOscillator(), g = actx.createGain(), t = t0 + i * 0.4;
    o.type = 'sine'; o.frequency.value = i === 2 ? 1175 : 880;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.45, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.28);
  }
}
export function vibrate(p) { if (S.settings.vibrate && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* sin vibración */ } } }
export function alarm() { if (S.settings.sound) { unlockAudio(); beep3(); } vibrate([250, 120, 250, 120, 250]); }

/* ---------- Pantalla encendida (Wake Lock) ---------- */
export let wakeLock = null;
export async function updateWakeLock() {
  const want = !!S.draft && document.visibilityState === 'visible';
  try {
    if (want && !wakeLock && 'wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!want && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { wakeLock = null; }
}
document.addEventListener('visibilitychange', () => { updateWakeLock(); if (document.visibilityState === 'visible') { tickChrono(); if (S.draft && S.draft.rest) restTick(); } });

/* ---------- Cronómetro ---------- */
export function tickChrono() { if (!S.draft) return; const t = hms(Date.now() - S.draft.start); document.querySelectorAll('[data-chrono]').forEach(e => { e.textContent = t; }); }
setInterval(tickChrono, 1000);

