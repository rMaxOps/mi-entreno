/* =========================================================
   Crear una rutina desde una foto, un PDF o un texto pegado.
   Usa la API de Claude directo desde el navegador (la app es estática).
   Se carga después del script principal de index.html y usa sus
   funciones (S, UI, ACT, INP, openModal, toast, allEx, getEx...).
   Modo de prueba sin gastar API: abre la app con ?mock=1
   (o ?mock=401, ?mock=429, ?mock=offline para probar los errores).
   ========================================================= */
import { GROUPS, TYPES } from './datos/catalogo.js';
import { S, UI, save } from './estado.js';
import { allEx, getEx } from './logica/ejercicios.js';
import { ACT, HOOKS, INP } from './registro.js';
import { shoulderBadge } from './ui/componentes.js';
import { ask, closeModal, openModal } from './ui/modales.js';
import { render } from './ui/render.js';
import { toast } from './ui/toast.js';
import { $, clamp, esc, kg, n1, plural, uid } from './util.js';

export const AI_KEY = 'mientreno.ai';          // aparte de mientreno.v1: así la key nunca sale en los respaldos
export const AI_DEFAULT_MODEL = 'claude-sonnet-5-5';
export const API_URL = 'https://api.anthropic.com/v1/messages';
export const API_VERSION = '2026-10-21';
export const MAX_PDF = 10 * 1024 * 1024;       // ~10 MB
export const MAX_IMG_SIDE = 1568;              // px por lado antes de enviar
export const MOCK = new URLSearchParams(location.search).get('mock');

export function aiCfg() {
  try { const c = JSON.parse(localStorage.getItem(AI_KEY)) || {}; return { key: c.key || '', model: c.model || AI_DEFAULT_MODEL }; }
  catch (e) { return { key: '', model: AI_DEFAULT_MODEL }; }
}
export function aiSave(c) {
  try { localStorage.setItem(AI_KEY, JSON.stringify(c)); return true; }
  catch (e) { toast('No se pudo guardar en este dispositivo.', 'bad'); return false; }
}
export const maskKey = k => k.length > 12 ? `${k.slice(0, 7)}…${k.slice(-4)}` : '••••';

/* ---------- Ajustes: tarjeta "Lectura de rutinas con IA" ---------- */
export function aiSettingsCard() {
  const c = aiCfg();
  return `<div class="card"><h2>Lectura de rutinas con IA</h2>
    <p class="muted small">Para leer fotos y PDF de rutinas, la app usa la API de Claude con tu propia API key.</p>
    ${c.key
      ? `<div class="list-row"><span class="grow"><b>Key guardada</b><div class="tiny muted" style="font-family:monospace">${esc(maskKey(c.key))}</div></span>
          <button class="btn sm danger" data-act="ai-del">Borrar key</button></div>`
      : `<div class="field"><label for="ai-key">API key de Anthropic</label>
          <div class="row"><input class="inp grow" id="ai-key" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="sk-ant-…">
          <button class="btn" data-act="ai-save">Guardar</button></div></div>`}
    <div class="field"><label for="ai-model">Modelo</label>
      <div class="row"><input class="inp grow" id="ai-model" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(c.model)}">
      <button class="btn" data-act="ai-model">Usar</button></div>
      <div class="tiny muted mt">Por defecto: ${AI_DEFAULT_MODEL}</div></div>
    <div class="note warn small"><b>Importante:</b> la key queda guardada solo en este teléfono, no en los respaldos. Es una app personal: no compartas el enlace ni el teléfono con la key cargada. Cada lectura se cobra en tu cuenta de la API.</div></div>`;
}
ACT['ai-save'] = () => {
  const v = ($('#ai-key').value || '').trim();
  if (!/^sk-ant-/.test(v)) return toast('Esa no parece una API key de Anthropic (empieza con sk-ant-).', 'bad');
  if (aiSave({ ...aiCfg(), key: v })) { render(); toast('Key guardada en este teléfono.', 'ok'); }
};
ACT['ai-del'] = () => ask('¿Borrar la API key?', 'Dejarás de poder leer fotos y PDF hasta que pegues una de nuevo.', 'Borrar', () => {
  aiSave({ ...aiCfg(), key: '' }); render(); toast('Key borrada de este teléfono.');
});
ACT['ai-model'] = () => {
  const v = ($('#ai-model').value || '').trim() || AI_DEFAULT_MODEL;
  if (!/^[a-z0-9.-]+$/i.test(v)) return toast('Escribe un nombre de modelo válido.', 'bad');
  if (aiSave({ ...aiCfg(), model: v })) toast(`Modelo: ${v}`, 'ok');
};

/* ---------- Botón de entrada (en Entreno y en Más) ---------- */
export const importButton = () => `<button class="btn block" data-act="rut-open" style="margin:0 0 10px">📷 Crear rutina desde foto o PDF</button>`;

/* ---------- La hoja de importación ---------- */
/* UI.imp = { step: 'choose'|'paste'|'reading'|'error'|'review'|'confirm', file, payload, text, res, err, ctrl } */
ACT['rut-open'] = () => { UI.imp = { step: 'choose', text: '' }; impRender(); };
ACT['rut-cam'] = () => $('#rut-cam').click();
ACT['rut-pick'] = () => $('#rut-file').click();
ACT['rut-paste'] = () => { UI.imp.step = 'paste'; impRender(); };
ACT['rut-back'] = () => { UI.imp.step = UI.imp.res ? 'review' : 'choose'; impRender(); };
ACT['rut-retry'] = () => { if (UI.imp.payload) readWith(UI.imp.payload); };
ACT['rut-text-ai'] = () => {
  const t = (UI.imp.text || '').trim(); if (!t) return toast('Pega primero el texto de la rutina.', 'bad');
  readWith({ kind: 'text', text: t, label: 'Texto pegado' });
};
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

/* Si se cierra la hoja mientras lee, se cancela la petición */
HOOKS.closeModal.push(() => { if (UI.imp && UI.imp.ctrl) UI.imp.ctrl.abort(); UI.imp = null; });

export function impView() {
  const m = UI.imp, c = aiCfg(), canAI = !!(c.key || MOCK);
  const close = '<button class="btn block ghost mt" data-act="modal-close">Cancelar</button>';
  if (m.step === 'choose') return `<h2>Crear rutina desde foto o PDF</h2>
    <p class="muted small">Saca una foto a la rutina de tu kinesiólogo, una revista o una captura, y la app la convierte en una plantilla que puedes revisar antes de guardar.</p>
    ${canAI ? '' : `<div class="note warn small">Para leer fotos y PDF necesitas pegar tu API key en <b>Más → Lectura de rutinas con IA</b>. Mientras tanto puedes pegar el texto de la rutina.</div>`}
    <button class="btn pri big mt" data-act="rut-cam" ${canAI ? '' : 'disabled'}>📷 Sacar foto</button>
    <button class="btn block mt" data-act="rut-pick" ${canAI ? '' : 'disabled'}>📁 Elegir foto o PDF</button>
    <button class="btn block mt" data-act="rut-paste">✍️ Pegar el texto</button>
    ${MOCK ? `<p class="tiny muted center mt">Modo de prueba (mock=${esc(MOCK)}): no se usa la API.</p>` : ''}${close}`;
  if (m.step === 'paste') return `<h2>Pegar el texto de la rutina</h2>
    <p class="muted small">Una línea por ejercicio, por ejemplo: <b>3x10 remo 6 kg</b>, <b>Plancha 3x30''</b> o <b>Sentadilla goblet 3x8-12 90s</b>.</p>
    <div class="field"><textarea class="inp" style="min-height:160px" data-in="rut-text" aria-label="Texto de la rutina" placeholder="Rutina A&#10;3x12 rotación externa 2 kg&#10;3x10 remo 6 kg c/lado&#10;Plancha 3x30''">${esc(m.text || '')}</textarea></div>
    ${canAI ? '<button class="btn pri big" data-act="rut-text-ai">Leer con IA</button>' : ''}
    <button class="btn block mt ${canAI ? '' : 'pri big'}" data-act="rut-text-local">${canAI ? 'Leer sin IA (línea por línea)' : 'Leer el texto'}</button>
    <button class="btn block ghost mt" data-act="rut-back">← Volver</button>`;
  if (m.step === 'reading') return `<h2>Leyendo tu rutina…</h2>${previewHtml(m.payload)}
    <div class="loading" role="status"><span class="spin" aria-hidden="true"></span><span>Esto puede tardar unos segundos.</span></div>${close}`;
  if (m.step === 'error') return `<h2>No se pudo leer</h2>${previewHtml(m.payload)}
    <div class="note bad">${esc(m.err.msg)}</div>
    ${m.err.retry ? '<button class="btn pri big mt" data-act="rut-retry">Reintentar</button>' : ''}
    <button class="btn block mt" data-act="rut-paste">✍️ Pegar el texto en su lugar</button>${close}`;
  if (m.step === 'review') return reviewView();
  if (m.step === 'confirm') return confirmView();
  return '';
}
export function previewHtml(p) {
  if (!p) return '';
  if (p.thumb) return `<img class="rut-prev" src="${p.thumb}" alt="Vista previa de la rutina">`;
  return `<div class="rut-file">${p.kind === 'pdf' ? '📄' : '✍️'} <span class="grow">${esc(p.label || '')}</span></div>`;
}

/* ---------- Archivos: foto (achicada) o PDF ---------- */
export async function onRutFile(e) {
  const f = e.target.files && e.target.files[0]; e.target.value = '';
  if (!f || !UI.imp) return;
  const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
  try {
    if (isPdf) {
      if (f.size > MAX_PDF) { UI.imp.payload = { kind: 'pdf', label: f.name }; return impFail(`El PDF pesa ${n1(f.size / 1048576)} MB y el máximo es 10 MB. Prueba sacando una foto de la página de la rutina.`, false); }
      const data = await fileToBase64(f);
      readWith({ kind: 'pdf', data, label: `${f.name} · ${n1(f.size / 1048576)} MB` });
    } else if (/^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(f.name)) {
      const { data, thumb } = await shrinkImage(f);
      readWith({ kind: 'image', data, thumb, label: f.name });
    } else {
      UI.imp.payload = { kind: 'file', label: f.name };
      impFail('Ese archivo no es una foto ni un PDF.', false);
    }
  } catch (err) {
    UI.imp.payload = { kind: 'file', label: f.name };
    impFail('No pude abrir ese archivo. Si es una foto del iPhone (HEIC), prueba sacándola con el botón "Sacar foto" o como captura de pantalla.', false);
  }
}
export function fileToBase64(f) {
  return new Promise((ok, bad) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1] || '');
    r.onerror = () => bad(r.error); r.readAsDataURL(f);
  });
}
/* Achica a un máximo de 1568 px por lado y comprime en JPEG 0,85 */
export function shrinkImage(f) {
  return new Promise((ok, bad) => {
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      try {
        const k = Math.min(1, MAX_IMG_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h);
        const dataUrl = cv.toDataURL('image/jpeg', 0.85);
        URL.revokeObjectURL(url);
        ok({ data: dataUrl.split(',')[1], thumb: dataUrl });
      } catch (e) { URL.revokeObjectURL(url); bad(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); bad(new Error('imagen')); };
    img.src = url;
  });
}

/* ---------- Llamada a la API ---------- */
export const RUT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['nombre', 'notas', 'ejercicios', 'dudas'],
  properties: {
    nombre: { type: 'string' }, notas: { type: 'string' },
    ejercicios: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['match_id', 'nombre', 'tipo', 'series', 'reps_min', 'reps_max', 'segundos', 'peso_kg', 'descanso_s', 'hombro', 'nota'],
      properties: {
        match_id: { type: ['string', 'null'] }, nombre: { type: 'string' }, tipo: { type: 'string', enum: ['wr', 'bw', 'r', 't'] },
        series: { type: ['integer', 'null'] }, reps_min: { type: ['integer', 'null'] }, reps_max: { type: ['integer', 'null'] },
        segundos: { type: ['integer', 'null'] }, peso_kg: { type: ['number', 'null'] }, descanso_s: { type: ['integer', 'null'] },
        hombro: { type: 'string', enum: ['ok', 'care'] }, nota: { type: 'string' },
      } } },
    dudas: { type: 'array', items: { type: 'string' } },
  },
};
export function rutSystem() {
  const lib = allEx().map(e => `${e.id} | ${e.name}`).join('\n');
  return `Eres el asistente de Mi Entreno, una app personal para registrar entrenamientos en casa con mancuernas y barra de dominadas. La persona está volviendo al ejercicio después de una lesión de hombro.

Tu tarea: leer la rutina del archivo o texto que te mandan y devolverla como JSON con el esquema indicado. Escribe los textos en español de Chile.

Reglas:
- Usa solo lo que dice el archivo. No inventes ejercicios, series ni pesos.
- Si un dato no aparece o no se lee bien, déjalo en null y anótalo en "dudas" (por ejemplo: "No se lee el descanso del ejercicio 3").
- Empareja cada ejercicio con uno de la biblioteca de abajo si es el mismo movimiento: pon su id en "match_id". Si no hay uno equivalente, usa null.
- "tipo": wr = peso + reps; bw = peso corporal (reps, lastre opcional); r = solo reps; t = tiempo en segundos.
- Marca hombro "care" en movimientos por encima de la cabeza, dominadas, fondos y flexiones; el resto "ok".
- Equivalencias: "10-12" → reps_min 10 y reps_max 12; "3x10" → series 3, reps_min 10 y reps_max 10; "30''" o "30 seg" → segundos 30; "c/lado" o "por lado" → nota "por lado".
- "descanso_s" en segundos ("1'30" → 90).
- "nombre": el título de la rutina si aparece; si no, uno corto que la describa.
- "notas": indicaciones generales de la rutina (frecuencia, calentamiento, etc.), o "" si no hay.
- No des diagnósticos ni consejos médicos.

Biblioteca (id | nombre):
${lib}`;
}
export function rutContent(p) {
  const ask = p.kind === 'text'
    ? 'Esta es la rutina en texto. Devuélvela como JSON según las reglas.\n\n<rutina>\n' + p.text + '\n</rutina>'
    : 'Esta es la rutina. Devuélvela como JSON según las reglas.';
  if (p.kind === 'image') return [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: p.data } }, { type: 'text', text: ask }];
  if (p.kind === 'pdf') return [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: p.data } }, { type: 'text', text: ask }];
  return [{ type: 'text', text: ask }];
}

/* Solo estos modelos aceptan el respaldo automático "fallbacks" */
export const withFallback = m => /^claude-(sonnet-5-5|opus-5-5|opus-5|fable-5-[12])$/.test(m);

export async function readWith(p) {
  const m = UI.imp; if (!m) return;
  m.payload = p; m.step = 'reading'; m.err = null; impRender();
  if (!MOCK && !navigator.onLine) return impFail('Sin conexión a internet. Conéctate y reintenta, o pega el texto de la rutina para leerla sin IA.', true);
  const c = aiCfg();
  if (!MOCK && !c.key) return impFail('Falta la API key. Pégala en Más → Lectura de rutinas con IA.', false);
  m.ctrl = new AbortController();
  let data;
  try {
    const res = MOCK ? await mockFetch(p) : await fetch(API_URL, {
      method: 'POST', signal: m.ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': c.key,
        'anthropic-version': API_VERSION,
        ...(withFallback(c.model) ? { 'anthropic-beta': 'server-side-fallback-2026-07-01' } : {}),
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: c.model, max_tokens: 16000,
        ...(withFallback(c.model) ? { fallbacks: 'default' } : {}),   // si el modelo rechaza por error, la API reintenta con otro modelo
        system: rutSystem(),
        output_config: { format: { type: 'json_schema', schema: RUT_SCHEMA } },
        messages: [{ role: 'user', content: rutContent(p) }],
      }),
    });
    if (UI.imp !== m) return;            // se cerró la hoja mientras leía
    if (!res.ok) {
      let detail = ''; try { detail = ((await res.json()).error || {}).message || ''; } catch (e) { /* sin detalle */ }
      return impFail(httpMsg(res.status, detail), res.status === 429 || res.status >= 500);
    }
    data = await res.json();
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    return impFail('No se pudo conectar con la API. Revisa tu conexión y reintenta.', true);
  } finally { if (UI.imp === m) m.ctrl = null; }
  if (data.stop_reason === 'refusal') return impFail('El modelo no quiso procesar este archivo. Prueba con otra foto o pega el texto.', true);
  if (data.stop_reason === 'max_tokens') return impFail('La rutina es muy larga y la respuesta quedó cortada. Prueba con una foto de una parte.', true);
  const txt = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const parsed = parseRutina(txt);
  if (!parsed) return impFail('La respuesta no vino en el formato esperado. Reintenta.', true);
  if (!parsed.ejercicios.length) return impFail('No encontré ejercicios en el archivo. ¿Es una rutina? Prueba con otra foto más nítida o pega el texto.', true);
  m.res = toReview(parsed); m.step = 'review'; impRender();
}
export function impFail(msg, retry) { if (!UI.imp) return; UI.imp.step = 'error'; UI.imp.err = { msg, retry }; impRender(); }
export function httpMsg(st, detail) {
  if (st === 401) return 'La API key no es válida. Revísala en Más → Lectura de rutinas con IA.';
  if (st === 403) return 'Tu API key no tiene permiso para usar este modelo.';
  if (st === 404) return `No existe el modelo "${aiCfg().model}". Revisa el nombre en Más.`;
  if (st === 413) return 'El archivo es muy grande para la API. Prueba con una foto o un PDF más liviano.';
  if (st === 429) return 'Llegaste al límite de uso de la API. Espera un momento y reintenta.';
  if (st === 529 || st >= 500) return 'La API está con problemas o muy ocupada. Reintenta en un rato.';
  if (st === 400) return 'La API rechazó la petición' + (detail ? `: ${detail}` : '.');
  return `Error ${st} de la API.` + (detail ? ` ${detail}` : '');
}

/* ---------- Leer la respuesta con cuidado ---------- */
export const int = (v, a, b) => { const n = Math.round(Number(v)); return Number.isFinite(n) && v !== null && v !== '' ? clamp(n, a, b) : null; };
export function parseRutina(txt) {
  let s = String(txt || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  let o; try { o = JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  if (!o || typeof o !== 'object') return null;
  const ids = new Set(allEx().map(e => e.id));
  const ejercicios = (Array.isArray(o.ejercicios) ? o.ejercicios : []).filter(e => e && typeof e === 'object' && String(e.nombre || '').trim()).slice(0, 40).map(e => ({
    match_id: typeof e.match_id === 'string' && ids.has(e.match_id) ? e.match_id : null,
    nombre: String(e.nombre).trim().slice(0, 80),
    tipo: ['wr', 'bw', 'r', 't'].includes(e.tipo) ? e.tipo : 'r',
    series: int(e.series, 1, 10), reps_min: int(e.reps_min, 1, 200), reps_max: int(e.reps_max, 1, 200),
    segundos: int(e.segundos, 1, 3600), peso_kg: Number.isFinite(Number(e.peso_kg)) && e.peso_kg !== null ? clamp(Number(e.peso_kg), 0, 200) : null,
    descanso_s: int(e.descanso_s, 0, 600), hombro: e.hombro === 'care' ? 'care' : 'ok', nota: String(e.nota || '').trim().slice(0, 200),
  }));
  return { nombre: String(o.nombre || '').trim().slice(0, 60), notas: String(o.notas || '').trim().slice(0, 300),
    ejercicios, dudas: (Array.isArray(o.dudas) ? o.dudas : []).map(d => String(d).trim()).filter(Boolean).slice(0, 12) };
}

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
  let h = `<h2>Revisa tu rutina</h2>${previewHtml(UI.imp.payload && UI.imp.payload.thumb ? UI.imp.payload : null)}`;
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

/* ---------- Modo de prueba (?mock=1): respuestas guardadas, sin gastar API ---------- */
export async function mockFetch(p) {
  await new Promise(r => setTimeout(r, 900));
  const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
  if (MOCK === '401') return json(401, { error: { message: 'invalid x-api-key' } });
  if (MOCK === '429') return json(429, { error: { message: 'rate limited' } });
  if (MOCK === 'offline') throw new TypeError('Failed to fetch');
  const file = p.kind === 'pdf' ? 'respuesta-pdf.json' : p.kind === 'image' ? 'respuesta-foto.json' : 'respuesta-texto.json';
  const r = await fetch('docs/ejemplos/' + file);
  const body = await r.text();
  /* Igual que la API: texto con el JSON adentro (a veces con ``` alrededor, para probar que se limpian) */
  return json(200, { stop_reason: 'end_turn', content: [{ type: 'text', text: p.kind === 'image' ? '```json\n' + body + '\n```' : body }] });
}

/* Entradas de archivo (cámara y galería/archivos) */
document.body.insertAdjacentHTML('beforeend',
  '<input type="file" id="rut-cam" accept="image/*" capture="environment" hidden><input type="file" id="rut-file" accept="image/*,application/pdf" hidden>');
$('#rut-cam').addEventListener('change', onRutFile);
$('#rut-file').addEventListener('change', onRutFile);
