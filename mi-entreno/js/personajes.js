/* =========================================================
   PERSONAJES (skill personajes-animados)
   Esqueleto SVG común + estilo de cada personaje + accesorios.
   Usa ANIMACIONES (js/animaciones.js). Se carga antes del script
   principal y no depende de él.
   ========================================================= */
import { ANIMACIONES, GENERICA } from './animaciones.js';

/* Articulaciones en la pose base (de pie, de perfil, mirando a la derecha) */
export const J = { hip: [80, 82], sh: [80, 50], neck: [80, 46], head: [80, 34], el: [80, 70], wr: [80, 88], kn: [80, 106], an: [80, 130] };
export const _o = p => `transform-origin:${p[0]}px ${p[1]}px`;

/* El elenco: uno por grupo. Solo cambia la apariencia, no las medidas. */
export const CAST = {
  coach: { name: 'Coach Hombro', group: 'Rehab hombro', color: '#c8f53a', torso: 14, limb: 7, desc: 'Tranquilo, con banda en la frente. Es quien da los avisos de dolor.' },
  tiron: { name: 'Tirón', group: 'Tirón', color: '#3987e5', torso: 10, limb: 6, desc: 'Delgado y ágil, con el pelo en punta. Siempre cerca de la barra.' },
  empuje: { name: 'Empuje', group: 'Empuje', color: '#e0703a', torso: 20, limb: 8, desc: 'Fuerte y redondeado, con muñequeras.' },
  patas: { name: 'Patas', group: 'Piernas', color: '#9085e9', torso: 12, limb: 7, desc: 'Piernas largas con calcetas altas y zapatillas grandes.' },
  nucleo: { name: 'Núcleo', group: 'Core', color: '#e87ba4', torso: 18, limb: 7, desc: 'Compacto, con una franja en el abdomen.' },
};
export const CHAR_BY_GROUP = { 'Rehab hombro': 'coach', 'Tirón': 'tiron', 'Empuje': 'empuje', 'Piernas': 'patas', 'Core': 'nucleo' };
export const charOf = ex => CHAR_BY_GROUP[ex && ex.group] || 'coach';
/* Color del nombre como texto: el lima del Coach se oscurece en tema claro */
export const charInk = who => who === 'coach' ? 'var(--ac-tx)' : CAST[who].color;

/* ---------- Partes del cuerpo ---------- */
export function _head(c) {
  const [x, y] = J.head;
  let h = `<circle class="headc" cx="${x}" cy="${y}" r="11"/>
    <circle class="eye" cx="${x + 5}" cy="${y - 1.5}" r="1.8"/>
    <path class="mouth m-ok" d="M${x + 3} ${y + 5} q3 2 6 -1"/>
    <path class="mouth m-serio" d="M${x + 3} ${y + 5.5} h6"/><path class="mouth m-serio" d="M${x + 2} ${y - 6} l6 1.6"/>`;
  if (c === 'coach') h += `<rect class="acc" x="${x - 11.5}" y="${y - 7}" width="23" height="4.5" rx="2"/><path class="accs" stroke-width="3" d="M${x - 10} ${y - 5} l-7 4 M${x - 10} ${y - 4} l-6 7"/>`;
  if (c === 'tiron') h += `<path class="acc" d="M${x - 9} ${y - 6} l2 -9 l4 6 l3 -9 l3 8 l4 -7 l1 9 z"/>`;
  return h;
}
export function _shoe(c) {
  const [x, y] = J.an;
  if (c === 'patas') return `<path class="acc" d="M${x - 5} ${y - 4} h10 q9 0 11 6 v3 h-21 z"/>`;
  return `<path class="limb" stroke-width="6" d="M${x - 1} ${y + 1} h10"/>`;
}
export function _leg(c, s) {
  const C = CAST[c];
  const sock = c === 'patas' ? `<path class="accs" stroke-width="${C.limb + 1}" d="M${J.an[0]} ${J.an[1] - 12} V${J.an[1] - 2}"/>` : '';
  return `<g class="th-${s} ${s === 'b' ? 'back' : ''}" style="${_o(J.hip)}"><path class="limb" stroke-width="${C.limb}" d="M${J.hip[0]} ${J.hip[1]} L${J.kn[0]} ${J.kn[1]}"/>
    <g class="sh-${s}" style="${_o(J.kn)}"><path class="limb" stroke-width="${C.limb}" d="M${J.kn[0]} ${J.kn[1]} L${J.an[0]} ${J.an[1]}"/>${sock}
      <g class="ft-${s}" style="${_o(J.an)}">${_shoe(c)}</g></g></g>`;
}
export function _arm(c, s, hold) {
  const C = CAST[c], [wx, wy] = J.wr;
  const band = c === 'empuje' ? `<path class="accs" stroke-width="${C.limb + 2}" d="M${wx} ${wy - 6} V${wy - 2}"/>` : '';
  const db = {
    db: `<rect class="db" x="${wx - 8}" y="${wy - 1}" width="16" height="7" rx="3"/>`,
    dbp: `<rect class="db" x="${wx - 4.5}" y="${wy - 2}" width="9" height="9" rx="3"/>`,
    dbv: `<rect class="db" x="${wx - 3.5}" y="${wy - 4}" width="7" height="16" rx="3"/>`,
  }[hold] || '';
  return `<g class="ua-${s} ${s === 'b' ? 'back' : ''}" style="${_o(J.sh)}"><path class="limb" stroke-width="${C.limb}" d="M${J.sh[0]} ${J.sh[1]} L${J.el[0]} ${J.el[1]}"/>
    <g class="fa-${s}" style="${_o(J.el)}"><path class="limb" stroke-width="${C.limb}" d="M${J.el[0]} ${J.el[1]} L${wx} ${wy}"/>${band}
      <circle class="headc" cx="${wx}" cy="${wy + 1}" r="${C.limb / 2 + 1.5}"/>${db}</g></g>`;
}
export function _torso(c) {
  const C = CAST[c];
  let h = `<path class="shirt" stroke-width="${C.torso}" d="M${J.hip[0]} ${J.hip[1] - 2} L${J.sh[0]} ${J.sh[1] + 3}"/>`;
  if (c === 'nucleo') h += `<path class="limb" stroke-width="${C.torso + 0.5}" stroke-linecap="butt" style="opacity:.85" d="M${J.hip[0]} ${J.hip[1] - 14} V${J.hip[1] - 9}"/>`;
  return h;
}

/* ---------- Accesorios ('nombre:valor') ---------- */
export const PROPS = {
  suelo: (y = 134) => `<line class="floor" x1="-10" y1="${y}" x2="170" y2="${y}"/>`,
  barra: (y = 11) => `<path class="props" stroke-width="5" d="M40 ${y} H120"/><path class="props" stroke-width="3" d="M44 ${y} V${y - 14} M116 ${y} V${y - 14}"/>`,
  pared: (x = 104) => `<rect class="prop" x="${x}" y="-30" width="8" height="164"/>`,
  banco: () => `<rect class="prop" x="26" y="94" width="96" height="7" rx="3"/><path class="props" stroke-width="4" d="M34 101 V121 M114 101 V121"/>`,
  silla: () => `<rect class="prop" x="52" y="110" width="34" height="5" rx="2"/><path class="props" stroke-width="4" d="M54 70 V133 M84 115 V133"/>`,
  cojin: () => `<rect class="prop" x="10" y="108" width="32" height="6" rx="3"/>`,
  toalla: () => `<rect class="towel" x="62" y="99.5" width="12" height="5" rx="2.5"/>`,
};
export const _props = list => (list || []).map(p => { const [n, v] = String(p).split(':'); return PROPS[n] ? PROPS[n](v === undefined ? undefined : +v) : ''; }).join('');

/* ---------- Arma un personaje ---------- */
export function pjRig(c, { cls = '', props = [], front = [], hold = {}, vista = '0 0 160 140', label = '' } = {}) {
  return `<svg class="pj ${cls}" viewBox="${vista}" style="--pc:${CAST[c].color}" role="img" aria-label="${label || CAST[c].name}">
    ${_props(props)}
    <g class="root" style="${_o(J.hip)}">
      ${_leg(c, 'b')}
      <g class="tor" style="${_o(J.hip)}">${_arm(c, 'b', hold.b)}${_torso(c)}<g class="hd" style="${_o(J.neck)}">${_head(c)}</g>${_arm(c, 'f', hold.f)}</g>
      ${_leg(c, 'f')}
    </g>${_props(front)}</svg>`;
}

/* ---------- CSS: estilo común + cada animación ---------- */
export function _animCss(id, a) {
  let css = '';
  Object.entries(a.base || {}).forEach(([seg, t]) => { css += `.ex-${id} .${seg}{transform:${t}}`; });
  (a.ocultar || []).forEach(seg => { css += `.ex-${id} .${seg}{opacity:0}`; });
  Object.entries(a.keyframes || {}).forEach(([seg, fr]) => {
    css += `@keyframes ${id}-${seg}{${fr.map(([p, t]) => `${p}%{transform:${t}}`).join('')}}`;
    css += `.ex-${id}.loop .${seg}{animation:${id}-${seg} ${a.duracion}s ease-in-out infinite}`;
    /* "menos movimiento": inicio (primer fotograma) y final (el más cercano a a.final, o al 50 %) */
    const meta = a.final ?? 50;
    const end = fr.reduce((m, f) => (Math.abs(f[0] - meta) < Math.abs(m[0] - meta) ? f : m));
    css += `.ex-${id}.pose-a .${seg}{transform:${fr[0][1]}}.ex-${id}.pose-b .${seg}{transform:${end[1]}}`;
  });
  return css;
}
(function pjStyles() {
  const base = `
.pj{overflow:hidden}
.pj g{transform-box:view-box}
.pj .limb{fill:none;stroke:var(--fig);stroke-linecap:round;stroke-linejoin:round}
.pj .back{opacity:.5}
.pj .headc{fill:var(--fig)}
.pj .eye{fill:var(--fig-ink)}
.pj .mouth{fill:none;stroke:var(--fig-ink);stroke-width:1.6;stroke-linecap:round}
.pj .m-serio{display:none}.pj.serio .m-serio{display:inline}.pj.serio .m-ok{display:none}
.pj .shirt{fill:none;stroke:var(--pc);stroke-linecap:round}
.pj .acc{fill:var(--pc)}
.pj .accs{fill:none;stroke:var(--pc);stroke-linecap:round}
.pj .prop{fill:var(--prop)}
.pj .props{fill:none;stroke:var(--prop);stroke-linecap:round}
.pj .floor{stroke:var(--prop);stroke-width:2;opacity:.6}
.pj .db{fill:var(--prop2)}
.pj .towel{fill:#f4ead2;stroke:var(--bg);stroke-width:1}
.pj.paused *{animation-play-state:paused!important}
.still .ua-f{transform:rotate(-10deg)}.still .fa-f{transform:rotate(-18deg)}.still .ua-b{transform:rotate(8deg)}.still .fa-b{transform:rotate(-10deg)}
@media (prefers-reduced-motion:reduce){.pj *{animation:none!important}}`;
  const st = document.createElement('style');
  st.id = 'pj-styles';
  st.textContent = base + Object.entries(ANIMACIONES).map(([id, a]) => _animCss(id, a)).join('\n');
  document.head.appendChild(st);
})();

/* ---------- Lo que usa la app ---------- */
export const pjReduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
/* Id de la animación de un ejercicio (propia o la genérica de su grupo) */
export const pjAnimId = ex => ANIMACIONES[ex.id] ? ex.id : (GENERICA[ex.group] || 'plank');
/* Frase corta del ejercicio: la de la animación o el tip del ejercicio */
export const pjFrase = ex => ANIMACIONES[ex.id] ? ANIMACIONES[ex.id].frase : (ex.tip || ANIMACIONES[pjAnimId(ex)].frase);

/* El personaje del grupo haciendo el ejercicio. Con "menos movimiento": inicio → final, sin bucle. */
export function pjExercise(ex, reduced = pjReduced()) {
  const id = pjAnimId(ex), a = ANIMACIONES[id], who = charOf(ex);
  const opt = k => ({ cls: `ex-${id} ${k}`, props: a.props, front: a.delante, hold: a.mano || {}, vista: a.vista, label: `${CAST[who].name} haciendo ${ex.name}` });
  return reduced
    ? `${pjRig(who, opt('pose-a'))}<span class="pj-arrow" aria-hidden="true">→</span>${pjRig(who, opt('pose-b'))}`
    : pjRig(who, opt('loop'));
}
/* Personaje quieto (para presentar la rutina, el check-in y el resumen) */
export function pjStill(who, mood = '') {
  return pjRig(who, { cls: `still ${mood === 'serio' ? 'serio' : ''}`, props: [], label: CAST[who].name + (mood === 'serio' ? ' (serio)' : '') });
}
/* Globo de texto con el nombre del personaje */
export function pjBubble(who, text) {
  return `<div class="bubble"><small style="color:${charInk(who)}">${CAST[who].name}</small>${text}</div>`;
}

/* Pausa las animaciones que salen de la pantalla (ahorra batería) */
export let _pjIO = null;
export function pjObserve() {
  if (!('IntersectionObserver' in window)) return;
  if (!_pjIO) _pjIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('paused', !e.isIntersecting)), { rootMargin: '40px' });
  /* se vuelve a empezar en cada pantalla, así no quedan observados los dibujos que ya no existen */
  _pjIO.disconnect();
  document.querySelectorAll('.pj.loop').forEach(s => _pjIO.observe(s));
}
