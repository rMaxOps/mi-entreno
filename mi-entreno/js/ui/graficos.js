/* Gráficos SVG hechos a mano. */
import { clamp, esc, pColor, painWord } from '../util.js';
/* ---------- Gráficos SVG hechos a mano ---------- */
export function niceMax(v) { if (v <= 10) return Math.max(1, Math.ceil(v)); const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p * 2) / 2 * p; }
export const fmtN = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
/* Curva suave (Catmull-Rom) que no se sale del área del gráfico */
export function smoothPath(pts, yLo, yHi) {
  if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
  const cy = v => clamp(v, yLo, yHi);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, cy(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, cy(p2[1] - (p3[1] - p1[1]) / 6)];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
/* Envuelve el SVG con los datos para mostrarlos al tocar (ver chartTouch más abajo) */
export function chartBox(svg, xs, texts, def, W) {
  const data = esc(JSON.stringify({ xs, texts, W }));
  return `<div class="chartbox" data-chart="${data}">${svg}<div class="readout" aria-live="polite">${def}</div></div>`;
}
export let chartSeq = 0;
export function lineChart({ labels, series, yMin = 0, yMax, label = 'Gráfico', unit = '' }) {
  const n = labels.length; if (!n) return '';
  const W = 340, H = 180, L = 30, R = 14, T = 12, B = 26, id = 'cg' + (++chartSeq);
  const vals = series.flatMap(s => s.values).filter(v => v != null);
  if (yMax == null) yMax = niceMax(Math.max(1, ...vals));
  if (yMax <= yMin) yMax = yMin + 1;
  const x = i => n === 1 ? L + (W - L - R) / 2 : L + i * (W - L - R) / (n - 1);
  const y = v => T + (H - T - B) * (1 - (v - yMin) / (yMax - yMin));
  let g = '', defs = '';
  for (let k = 0; k <= 4; k++) {
    const v = yMin + (yMax - yMin) * k / 4, yy = y(v).toFixed(1);
    g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/><text x="${L - 6}" y="${+yy + 4}" text-anchor="end">${fmtN(v)}</text>`;
  }
  const xl = n <= 2 ? [...Array(n).keys()] : [0, Math.floor((n - 1) / 2), n - 1];
  [...new Set(xl)].forEach(i => { g += `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="${i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'}">${esc(labels[i])}</text>`; });
  g += `<line class="cross" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>`;
  series.forEach((s, si) => {
    /* cada tramo sin datos vacíos se dibuja por separado */
    const runs = []; let run = [];
    s.values.forEach((v, i) => { if (v == null) { if (run.length) runs.push(run); run = []; } else run.push([x(i), y(v)]); });
    if (run.length) runs.push(run);
    if (series.length === 1 && runs.length === 1 && runs[0].length > 1) {
      const r = runs[0];
      defs += `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${s.color};stop-opacity:.28"/><stop offset="1" style="stop-color:${s.color};stop-opacity:0"/></linearGradient>`;
      g += `<path d="${smoothPath(r, T, H - B)}L${r[r.length - 1][0].toFixed(1)} ${H - B}L${r[0][0].toFixed(1)} ${H - B}Z" fill="url(#${id})"/>`;
    }
    runs.forEach(r => {
      g += `<path d="${smoothPath(r, T, H - B)}" fill="none" style="stroke:${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? 'stroke-dasharray="5 4"' : ''}/>`;
      if (r.length === 1) g += `<circle cx="${r[0][0].toFixed(1)}" cy="${r[0][1].toFixed(1)}" r="3.5" style="fill:${s.color}"/>`;
    });
    /* último punto destacado */
    const li = s.values.map((v, i) => v == null ? -1 : i).filter(i => i >= 0).pop();
    if (li != null) g += `<circle class="last" cx="${x(li).toFixed(1)}" cy="${y(s.values[li]).toFixed(1)}" r="5.5" style="fill:${s.color}"/>`;
    s.values.forEach((v, i) => { if (v != null) g += `<circle class="hov" data-i="${i}" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="5" style="fill:${s.color}" visibility="hidden" data-s="${si}"/>`; });
  });
  const texts = labels.map((lb, i) => `<span>${esc(lb)}</span>` + series.map(s => s.values[i] == null ? '' : `<span>${esc(s.name || '')} <b>${fmtN(s.values[i])}${unit}</b></span>`).join(''));
  const lastI = n - 1;
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}"><defs>${defs}</defs>${g}</svg>`;
  return chartBox(svg, labels.map((_, i) => +x(i).toFixed(1)), texts, `<span>Último:</span>${texts[lastI].replace(/^<span>[^<]*<\/span>/, '')}<span class="tiny">· toca el gráfico para ver cada día</span>`, W);
}
export function barChart({ labels, values, yMax = 10, label = 'Gráfico' }) {
  const n = labels.length; if (!n) return '';
  const W = 340, H = 150, L = 26, R = 8, T = 10, B = 24;
  const bw = (W - L - R) / n, y = v => T + (H - T - B) * (1 - v / yMax);
  let g = '';
  [0, 5, 10].forEach(v => { g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; });
  g += `<line class="cross" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>`;
  values.forEach((v, i) => {
    /* barra con punta redondeada arriba y base recta en el eje */
    const h = Math.max(2, (H - T - B) - (y(v) - T)), bx = L + i * bw + bw * 0.2, w = bw * 0.6, top = H - B - h, r = Math.min(4, w / 2, h);
    g += `<path d="M${bx.toFixed(1)} ${H - B}V${(top + r).toFixed(1)}Q${bx.toFixed(1)} ${top.toFixed(1)} ${(bx + r).toFixed(1)} ${top.toFixed(1)}H${(bx + w - r).toFixed(1)}Q${(bx + w).toFixed(1)} ${top.toFixed(1)} ${(bx + w).toFixed(1)} ${(top + r).toFixed(1)}V${H - B}Z" style="fill:${pColor(v)}"/>`;
  });
  const xl = n <= 2 ? [...Array(n).keys()] : [0, n - 1];
  xl.forEach(i => { g += `<text x="${(L + i * bw + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="${i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'}">${esc(labels[i])}</text>`; });
  const texts = labels.map((lb, i) => `<span>${esc(lb)}</span><span>dolor máx. <b>${values[i]}/10</b> · ${esc(painWord(values[i]))}</span>`);
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${g}</svg>`;
  return chartBox(svg, labels.map((_, i) => +(L + i * bw + bw / 2).toFixed(1)), texts, `<span>Último:</span>${texts[n - 1].replace(/^<span>[^<]*<\/span>/, '')}`, W);
}
/* Al tocar o arrastrar sobre un gráfico: línea guía en el día más cercano y sus valores abajo */
export function chartTouch(e) {
  const box = e.target.closest && e.target.closest('.chartbox'); if (!box) return;
  const d = JSON.parse(box.dataset.chart), svg = box.querySelector('svg'), rc = svg.getBoundingClientRect();
  const vx = (e.clientX - rc.left) / rc.width * d.W;
  let i = 0; d.xs.forEach((x, k) => { if (Math.abs(x - vx) < Math.abs(d.xs[i] - vx)) i = k; });
  const cross = svg.querySelector('.cross'); cross.setAttribute('x1', d.xs[i]); cross.setAttribute('x2', d.xs[i]); cross.setAttribute('visibility', 'visible');
  svg.querySelectorAll('.hov').forEach(c => c.setAttribute('visibility', +c.dataset.i === i ? 'visible' : 'hidden'));
  box.querySelector('.readout').innerHTML = d.texts[i];
}
document.addEventListener('pointerdown', chartTouch);
document.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'mouse') chartTouch(e); });

