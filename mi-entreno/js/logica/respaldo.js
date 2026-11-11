/* Respaldo JSON: exportar e importar. */
import { S, save } from '../estado.js';
import { render } from '../ui/render.js';
import { toast } from '../ui/toast.js';
import { plural } from '../util.js';
/* ---------- Respaldo ---------- */
export function exportData() { return JSON.stringify({ app: 'mi-entreno', v: 1, exportedAt: new Date().toISOString(), settings: S.settings, exercises: S.exercises, templates: S.templates, sessions: S.sessions }, null, 2); }
export function importData(txt) {
  let o;
  try { o = JSON.parse(txt); } catch (e) { toast('Ese texto no es un JSON válido.', 'bad'); return; }
  if (!o || typeof o !== 'object' || !Array.isArray(o.sessions)) { toast('El archivo no parece un respaldo de Mi Entreno.', 'bad'); return; }
  const wasEmpty = !S.sessions.length;
  const add = { sessions: 0, templates: 0, exercises: 0 };
  ['sessions', 'templates', 'exercises'].forEach(k => {
    const ids = new Set(S[k].map(x => x.id));
    (Array.isArray(o[k]) ? o[k] : []).forEach(x => {
      if (x && x.id && !ids.has(x.id) && (k !== 'sessions' || (typeof x.start === 'number' && Array.isArray(x.items)))) { S[k].push(x); ids.add(x.id); add[k]++; }
    });
  });
  if (wasEmpty && o.settings && typeof o.settings === 'object') S.settings = { ...S.settings, ...o.settings };
  save(); render();
  toast(`Importado: ${plural(add.sessions, 'entreno', 'entrenos')}, ${plural(add.templates, 'plantilla', 'plantillas')}, ${plural(add.exercises, 'ejercicio', 'ejercicios')}.`, 'ok');
}
export async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); return true; }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); let ok = false;
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    ta.remove(); return ok;
  }
}

