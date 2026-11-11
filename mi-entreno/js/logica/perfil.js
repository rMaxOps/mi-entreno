/* Perfil de la persona (etapa 2): nombre, nivel, objetivo, molestias y equipo.
   Vive en S.profile (sin cuenta y con cuenta) y se sincroniza con las tablas
   profiles, conditions y equipment (js/nube/sync.js). */
import { S } from '../estado.js';
import { WARMUP, WARMUP_GENERAL } from '../datos/catalogo.js';
import { t } from '../i18n.js';

export const ZONAS = ['hombro', 'codo', 'muneca', 'cuello', 'espalda_alta', 'espalda_baja', 'cadera', 'rodilla', 'tobillo', 'otra'];
export const SIN_LADO = ['cuello', 'espalda_alta', 'espalda_baja'];          // zonas que no tienen izquierda/derecha
export const ESTADOS = ['activa', 'recuperacion', 'antigua'];
export const MOVIMIENTOS = ['sobre_cabeza', 'colgarse', 'empujar', 'tirar', 'impacto', 'flexion_rodilla', 'girar', 'cargar_peso'];
export const EQUIPOS = ['ninguno', 'barra_dominadas', 'mancuernas', 'kettlebell', 'bandas', 'banco', 'barra_discos', 'maquinas', 'otro'];
export const CON_PESOS = ['mancuernas', 'kettlebell'];
export const OBJETIVOS = ['recuperarme', 'fuerza', 'salud', 'bajar_peso'];
export const NIVELES = ['pausa', 'principiante', 'intermedio'];
/* Género gramatical de cada zona, para decir "hombro derecho" y "rodilla derecha" */
const GENERO = { hombro: 'm', codo: 'm', muneca: 'f', cuello: 'm', espalda_alta: 'f', espalda_baja: 'f', cadera: 'f', rodilla: 'f', tobillo: 'm', otra: 'f' };

export function perfil(st = S) {
  st.profile = st.profile || {};
  st.profile.conditions = st.profile.conditions || [];
  st.profile.equipment = st.profile.equipment || [];
  return st.profile;
}
export const molestiasActivas = (st = S) => perfil(st).conditions.filter(c => c.status !== 'antigua');
export const molestiaPrincipal = (st = S) => molestiasActivas(st)[0] || perfil(st).conditions[0] || null;
export const tieneDatos = (st = S) => st.sessions.length + st.templates.length + st.exercises.length > 0;

/* Falta el asistente: nunca lo hizo ni lo saltó, y no tiene molestias ni equipo cargados (por ejemplo, importados) */
export function onboardingPendiente(st = S) {
  const p = perfil(st);
  return !p.onboarded_at && !p.conditions.length && !p.equipment.length;
}

/* "hombro derecho", "rodilla derecha", "espalda baja", "codo (ambos lados)" */
export function nombreMolestia(c) {
  if (!c) return '';
  const zona = c.zone === 'otra' && c.zone_other ? c.zone_other.trim() : t('zonas.' + c.zone).toLocaleLowerCase('es-CL');
  if (!c.side || c.side === 'na' || SIN_LADO.includes(c.zone)) return zona;
  if (c.side === 'ambos') return `${zona} ${t('perfil.ambos_lados')}`;
  return `${zona} ${t(`perfil.lado_${c.side}_${GENERO[c.zone] || 'f'}`)}`;
}
/* La zona que la app nombra en el check-in y al terminar. Los datos de la versión 1 eran del hombro. */
export function zonaDolor(st = S) {
  const c = molestiaPrincipal(st);
  if (c) return nombreMolestia(c);
  if (tieneDatos(st) && !perfil(st).onboarded_at) return nombreMolestia({ zone: 'hombro', side: st.settings.side || 'der' });
  return null;
}

/* ¿Se muestra lo específico del hombro (rehab, calentamiento, avisos ⚠, "Coach Hombro")?
   Solo si tiene una molestia de hombro activa o en recuperación, o si es un usuario de la versión 1
   (con datos y sin perfil), que se hizo para el hombro. */
export function tieneHombro(st = S) {
  const p = perfil(st);
  if (p.conditions.some(c => c.zone === 'hombro' && c.status !== 'antigua')) return true;
  return !p.conditions.length && tieneDatos(st) && !p.onboarded_at;
}
/* Calentamiento: el del hombro (6 pasos) o uno general (4 pasos) */
export const calentamiento = (st = S) => (tieneHombro(st) ? WARMUP : WARMUP_GENERAL);
/* En el historial, cada sesión muestra la lista que usó (se reconoce por su largo) */
export const calentamientoDe = s => ((s.warmup || []).length === WARMUP_GENERAL.length ? WARMUP_GENERAL : WARMUP);

export function nuevaMolestia() {
  return { id: crypto.randomUUID(), zone: 'hombro', zone_other: '', side: 'der', status: 'activa', since: '', notes: '', bothers: [], threshold: 4 };
}

/* Convierte "2, 3; 4,5 kg" en [2, 3, 4.5] */
export function leerPesos(txt) {
  return [...new Set(String(txt || '').split(/[;\s]+|,(?=\s)|,(?!\d)/).map(x => parseFloat(x.replace(',', '.'))).filter(x => x > 0 && x <= 200))].sort((a, b) => a - b);
}

/* Las partes de la app que aún usan los ajustes antiguos (umbral, lado, pesos, meta semanal)
   toman sus valores del perfil. Las etapas 3 y 4 leerán el perfil directo. */
export function aplicarPerfil(st = S) {
  const p = perfil(st), c = molestiaPrincipal(st);
  if (c) { st.settings.threshold = c.threshold || 4; if (['izq', 'der', 'ambos'].includes(c.side)) st.settings.side = c.side; }
  const m = p.equipment.find(q => q.kind === 'mancuernas');
  if (m && m.weights && m.weights.length) st.settings.weights = m.weights.slice();
}
