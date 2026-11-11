/* Cuenta: entrar (Google, enlace por correo o código), modo invitado, consentimiento,
   importar los datos de este teléfono y cerrar sesión (skill datos-y-privacidad). */
import { CUENTA_UID, KEY, S, UI, keyCuenta, load, reemplazarEstado, save, usarAlmacen } from '../estado.js';
import { t } from '../i18n.js';
import { ACT, INP } from '../registro.js';
import { ask, closeModal, openModal } from '../ui/modales.js';
import { render } from '../ui/render.js';
import { toast } from '../ui/toast.js';
import { clamp, esc } from '../util.js';
import { nube } from './cliente.js';
import { SYNC, cuentaTieneDatos, meta, perfil, sincronizar } from './sync.js';

const MARCA = 'mientreno.sesion';   // última cuenta usada en este teléfono (para abrir sin internet)
export const CUENTA = { email: null, sinSesion: false, enviado: null };

const leerMarca = () => { try { return JSON.parse(localStorage.getItem(MARCA)); } catch (e) { return null; } };
const volverAqui = () => location.origin + location.pathname;

/* Al abrir la app: si la última vez había una cuenta, se usa su copia local (funciona sin internet) */
export function cuentaInicial() {
  const m = leerMarca();
  if (m && m.uid) { usarAlmacen(m.uid); CUENTA.email = m.email; }
}

/* Escucha la sesión de Supabase (también la que vuelve desde Google o desde el enlace del correo) */
export async function iniciarCuenta() {
  let c;
  try { c = await nube(); } catch (e) { return; }           // sin internet: se queda con la copia local
  c.auth.onAuthStateChange((evento, ses) => setTimeout(() => alCambiarSesion(evento, ses), 0));
}

async function alCambiarSesion(evento, ses) {
  if (ses && ses.user) {
    const uid = ses.user.id, email = ses.user.email || '';
    const nueva = CUENTA_UID !== uid;
    CUENTA.email = email; CUENTA.sinSesion = false; CUENTA.enviado = null;
    localStorage.setItem(MARCA, JSON.stringify({ uid, email }));
    if (nueva) { usarAlmacen(uid); UI.enter = true; render(); }
    if (evento === 'SIGNED_IN' && nueva) toast(t('cuenta.hola', { email }), 'ok');
    await sincronizar();
    await revisarConsentimiento(uid);
  } else if (CUENTA_UID && evento === 'INITIAL_SESSION') {
    CUENTA.sinSesion = true;                                  // venció la sesión: los datos siguen aquí
    if (UI.tab === 'mas') render();
  }
}

/* ---------- Consentimiento e importación ---------- */
const datosInvitado = () => {
  const g = load(KEY);
  return { g, n: g.sessions.length + g.templates.length + g.exercises.length };
};

async function revisarConsentimiento(uid) {
  if (uid !== CUENTA_UID || $modalAbierto()) return;
  const { g, n } = datosInvitado();
  const yaImportado = (g.ui.importedTo || []).includes(uid);
  let enNube = false;
  try { enNube = await cuentaTieneDatos(); } catch (e) { /* sin red: decide con lo local */ }
  if (n > 0 && !yaImportado && !enNube && !S.sessions.length) abrirImportacion();
  else if (!perfil().consent_at) abrirConsentimiento();
}
const $modalAbierto = () => !!document.querySelector('#modal-root .sheet');

function abrirConsentimiento() {
  UI.cons = { ok: false };
  openModal(`<h2>${t('consentimiento.titulo')}</h2><p>${t('consentimiento.texto')}</p>
    <div class="note warn small">${t('app.aviso_medico')}</div>
    <label class="tog" style="cursor:pointer"><span>${t('consentimiento.acepto')}</span><input type="checkbox" data-in="cons-ok" style="width:28px;height:28px"></label>
    <button class="btn pri big mt" data-act="cons-ok">${t('consentimiento.seguir')}</button>`);
}
INP['cons-ok'] = (v, el) => { UI.cons.ok = el.checked; };
ACT['cons-ok'] = () => {
  if (!UI.cons || !UI.cons.ok) return toast(t('consentimiento.falta'), 'bad');
  perfil().consent_at = new Date().toISOString(); save(); closeModal(); sincronizar();
};

/* Pantalla de importación: revisa el perfil y sube los datos del modo invitado a la cuenta.
   Los datos del modo invitado NO se borran: quedan marcados como importados. */
const ZONAS = ['hombro', 'codo', 'muneca', 'cuello', 'espalda_alta', 'espalda_baja', 'cadera', 'rodilla', 'tobillo', 'otra'];
const MOVS = ['sobre_cabeza', 'colgarse', 'empujar', 'tirar', 'impacto', 'flexion_rodilla', 'girar', 'cargar_peso'];
const EQUIPOS = ['barra_dominadas', 'mancuernas', 'kettlebell', 'bandas', 'banco', 'barra_discos', 'maquinas', 'otro'];

export function abrirImportacion() {
  const { g } = datosInvitado();
  const st = g.settings || {};
  UI.mig = { sinMolestias: false, zone: 'hombro', side: st.side === 'izq' || st.side === 'ambos' ? st.side : 'der', status: 'recuperacion',
    threshold: st.threshold || 4, bothers: ['sobre_cabeza'], equip: ['barra_dominadas', 'mancuernas'],
    weights: (st.weights || [2, 3, 4, 5, 6, 8, 10, 12]).join(', '), goal: 'recuperarme', level: 'pausa', days: st.perWeek || 3, consent: false };
  dibujarImportacion();
}
function dibujarImportacion() {
  const m = UI.mig, { g } = datosInvitado();
  const sel = (campo, lista, grupo) => `<select class="inp" data-in="mig-sel" data-f="${campo}">${lista.map(k => `<option value="${k}" ${m[campo] === k ? 'selected' : ''}>${esc(t(grupo + '.' + k))}</option>`).join('')}</select>`;
  const chk = (campo, lista, grupo) => `<div class="chips">${lista.map(k => `<label class="chipx" style="padding:0 14px;cursor:pointer;font:600 15px var(--f-txt)"><input type="checkbox" data-in="mig-chk" data-f="${campo}" value="${k}" ${m[campo].includes(k) ? 'checked' : ''} style="margin-right:6px">${esc(t(grupo + '.' + k))}</label>`).join('')}</div>`;
  const top = document.querySelector('.sheet'), y = top ? top.scrollTop : 0;
  openModal(`<h2>${t('importar.titulo')}</h2>
    <p class="muted small">${t('importar.resumen', { sesiones: g.sessions.length, plantillas: g.templates.length, ejercicios: g.exercises.length })}</p>
    <h3>${t('importar.molestia')}</h3>
    <label class="tog"><span>${t('importar.sin_molestias')}</span><input type="checkbox" data-in="mig-sin" ${m.sinMolestias ? 'checked' : ''} style="width:26px;height:26px"></label>
    ${m.sinMolestias ? '' : `<div class="ri-g2"><div><label class="tiny muted">${t('importar.zona')}</label>${sel('zone', ZONAS, 'zonas')}</div>
      <div><label class="tiny muted">${t('importar.lado')}</label>${sel('side', ['izq', 'der', 'ambos'], 'lados')}</div></div>
      <div class="ri-g2"><div><label class="tiny muted">${t('importar.estado')}</label>${sel('status', ['activa', 'recuperacion', 'antigua'], 'estados_molestia')}</div>
      <div><label class="tiny muted">${t('importar.umbral')}</label><div class="stp-c"><button class="stp-b" data-act="mig-umbral" data-d="-1" aria-label="Menos">−</button><div class="stp-v">${m.threshold}</div><button class="stp-b" data-act="mig-umbral" data-d="1" aria-label="Más">+</button></div></div></div>
      <label class="tiny muted" style="display:block;margin-top:10px">${t('importar.molesta')}</label>${chk('bothers', MOVS, 'movimientos')}`}
    <h3>${t('importar.equipo')}</h3>${chk('equip', EQUIPOS, 'equipos')}
    ${m.equip.includes('mancuernas') ? `<div class="field"><label>${t('importar.pesos')}</label><input class="inp" data-in="mig-pesos" value="${esc(m.weights)}" inputmode="decimal"></div>` : ''}
    <div class="ri-g2"><div><label class="tiny muted">${t('importar.objetivo')}</label>${sel('goal', ['recuperarme', 'fuerza', 'salud', 'bajar_peso'], 'objetivos')}</div>
      <div><label class="tiny muted">${t('importar.dias')}</label><div class="stp-c"><button class="stp-b" data-act="mig-dias" data-d="-1" aria-label="Menos">−</button><div class="stp-v">${m.days}</div><button class="stp-b" data-act="mig-dias" data-d="1" aria-label="Más">+</button></div></div></div>
    <div class="field"><label>${t('importar.nivel')}</label>${sel('level', ['pausa', 'principiante', 'intermedio'], 'niveles')}</div>
    <h3>${t('consentimiento.titulo')}</h3><p class="small muted">${t('consentimiento.texto')}</p>
    <div class="note warn small">${t('app.aviso_medico')}</div>
    <label class="tog"><span>${t('consentimiento.acepto')}</span><input type="checkbox" data-in="mig-cons" ${m.consent ? 'checked' : ''} style="width:26px;height:26px"></label>
    <button class="btn pri big mt" data-act="mig-ok">${t('importar.boton')}</button>
    <button class="btn block ghost mt" data-act="modal-close">${t('importar.despues')}</button>`);
  const s = document.querySelector('.sheet'); if (s) s.scrollTop = y;
}
INP['mig-sel'] = (v, el) => { UI.mig[el.dataset.f] = v; if (el.dataset.f === 'zone') dibujarImportacion(); };
INP['mig-sin'] = (v, el) => { UI.mig.sinMolestias = el.checked; dibujarImportacion(); };
INP['mig-cons'] = (v, el) => { UI.mig.consent = el.checked; };
INP['mig-pesos'] = v => { UI.mig.weights = v; };
INP['mig-chk'] = (v, el) => {
  const a = UI.mig[el.dataset.f], k = el.value;
  UI.mig[el.dataset.f] = el.checked ? [...new Set([...a, k])] : a.filter(x => x !== k);
  if (el.dataset.f === 'equip' && k === 'mancuernas') dibujarImportacion();
};
ACT['mig-umbral'] = d => { UI.mig.threshold = clamp(UI.mig.threshold + +d.d, 1, 10); dibujarImportacion(); };
ACT['mig-dias'] = d => { UI.mig.days = clamp(UI.mig.days + +d.d, 1, 7); dibujarImportacion(); };

ACT['mig-ok'] = async () => {
  const m = UI.mig, uid = CUENTA_UID;
  if (!uid) return;
  if (!m.consent) return toast(t('consentimiento.falta'), 'bad');
  const pesos = [...new Set(String(m.weights).split(/[,;\s]+/).map(x => parseFloat(x.replace(',', '.'))).filter(x => x > 0 && x <= 200))].sort((a, b) => a - b);
  const { g } = datosInvitado();
  const nuevo = JSON.parse(JSON.stringify(g));
  nuevo.meta = {};
  nuevo.ui = { ...nuevo.ui, importedTo: undefined };
  nuevo.settings.perWeek = m.days;
  if (!m.sinMolestias) { nuevo.settings.side = m.side; nuevo.settings.threshold = m.threshold; }
  if (m.equip.includes('mancuernas') && pesos.length) nuevo.settings.weights = pesos;
  nuevo.profile = {
    level: m.level, goal: m.goal, coach: 'coach', display_name: null, consent_at: new Date().toISOString(), onboarded_at: null,
    conditions: m.sinMolestias ? [] : [{ id: crypto.randomUUID(), zone: m.zone, side: m.side, status: m.status, since: null, notes: '',
      bothers: m.bothers, threshold: m.threshold }],
    equipment: m.equip.map(k => ({ id: crypto.randomUUID(), kind: k, weights: k === 'mancuernas' ? pesos : [] })),
  };
  reemplazarEstado(nuevo);                      // queda en la copia local de la cuenta y pendiente de subir
  closeModal(); UI.enter = true; render();
  toast(t('importar.subiendo'));
  const ok = await sincronizar();
  if (ok && !Object.keys(meta().pend).length && CUENTA_UID === uid) {
    g.ui.importedTo = [...new Set([...(g.ui.importedTo || []), uid])];
    localStorage.setItem(KEY, JSON.stringify(g));  // el modo invitado conserva sus datos, solo se marca
    toast(t('importar.listo', { sesiones: S.sessions.length }), 'ok');
  } else toast(t('importar.quedo_local'));
};

/* ---------- Tarjeta "Tu cuenta" en Más ---------- */
export function estadoSync() {
  if (!navigator.onLine) return t('sync.sin_red');
  if (SYNC.corriendo) return t('sync.subiendo');
  if (SYNC.error) return t('sync.error');
  if (SYNC.pendientes) return t('sync.pendientes', { n: SYNC.pendientes });
  if (!SYNC.ultimo) return t('sync.nunca');
  const min = Math.round((Date.now() - SYNC.ultimo) / 60000);
  return t('sync.al_dia', { hace: min < 1 ? 'recién' : `hace ${min} min` });
}
export function cuentaCard() {
  if (!CUENTA_UID) {
    return `<div class="card"><h2>${t('cuenta.titulo')}</h2><p class="muted small">${t('cuenta.invitado')}</p>
      <button class="btn pri big" data-act="cta-google">${t('cuenta.google')}</button>
      <p class="center tiny muted mt">${t('cuenta.o_correo')}</p>
      <div class="row"><input class="inp grow" id="cta-email" type="email" autocomplete="email" inputmode="email" placeholder="${t('cuenta.correo_ph')}" value="${esc(CUENTA.enviado || '')}"><button class="btn" data-act="cta-email">${t('cuenta.enviar_enlace')}</button></div>
      ${CUENTA.enviado ? `<div class="note info small">${t('cuenta.enviado', { email: esc(CUENTA.enviado) })}</div>
        <p class="small muted">${t('cuenta.codigo_ayuda')}</p>
        <div class="row"><input class="inp grow" id="cta-codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="${t('cuenta.codigo_ph')}"><button class="btn" data-act="cta-codigo">${t('cuenta.entrar_codigo')}</button></div>` : ''}
      <p class="tiny muted mt">${t('cuenta.solo_invitados')}</p></div>`;
  }
  const { n, g } = datosInvitado();
  const puedeImportar = n > 0 && !(g.ui.importedTo || []).includes(CUENTA_UID);
  return `<div class="card"><h2>${t('cuenta.titulo')}</h2>
    <p class="small"><b>${t('cuenta.conectado', { email: esc(CUENTA.email || '') })}</b></p>
    ${CUENTA.sinSesion ? `<div class="note warn small">${t('cuenta.sin_sesion')}</div><button class="btn pri block" data-act="cta-google">${t('cuenta.google')}</button>` : ''}
    <p class="small muted" id="sync-estado">${estadoSync()}</p>
    <div class="row wrap"><button class="btn grow" data-act="cta-sync">${t('cuenta.sincronizar')}</button><button class="btn grow danger" data-act="cta-salir">${t('cuenta.salir')}</button></div>
    ${puedeImportar ? `<button class="btn block mt" data-act="cta-importar">${t('cuenta.importar')}</button>` : ''}</div>`;
}
window.addEventListener('mientreno:sync', () => { const e = document.getElementById('sync-estado'); if (e) e.textContent = estadoSync(); });
window.addEventListener('online', () => { const e = document.getElementById('sync-estado'); if (e) e.textContent = estadoSync(); });

/* ---------- Acciones ---------- */
const errorAuth = e => {
  const msg = String((e && e.message) || ''), st = e && e.status;
  if (/signups? not allowed|not found|user not found/i.test(msg) || st === 422) return t('cuenta.no_invitado');
  if (st === 429 || /rate limit|security purposes/i.test(msg)) return t('cuenta.espera');
  if (/token|otp|expired|invalid/i.test(msg)) return t('cuenta.codigo_malo');
  return t('cuenta.error_red');
};
ACT['cta-google'] = async () => {
  try {
    const c = await nube();
    const { error } = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: volverAqui() } });
    if (error) throw error;
  } catch (e) { toast(errorAuth(e), 'bad'); }
};
ACT['cta-email'] = async () => {
  const email = (document.getElementById('cta-email').value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast(t('cuenta.correo_invalido'), 'bad');
  try {
    const c = await nube();
    const { error } = await c.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: volverAqui() } });
    if (error) throw error;
    CUENTA.enviado = email; render();
  } catch (e) { toast(errorAuth(e), 'bad'); }
};
ACT['cta-codigo'] = async () => {
  const token = (document.getElementById('cta-codigo').value || '').replace(/\D/g, '');
  if (!token || !CUENTA.enviado) return toast(t('cuenta.codigo_malo'), 'bad');
  try {
    const c = await nube();
    const { error } = await c.auth.verifyOtp({ email: CUENTA.enviado, token, type: 'email' });
    if (error) throw error;
  } catch (e) { toast(errorAuth(e), 'bad'); }
};
ACT['cta-sync'] = async () => {
  const ok = await sincronizar();
  toast(ok ? estadoSync() : (navigator.onLine ? t('sync.error') : t('sync.sin_red')), ok ? 'ok' : '');
};
ACT['cta-importar'] = () => abrirImportacion();
ACT['cta-salir'] = async () => {
  await sincronizar();
  const n = Object.keys(meta().pend).length;
  const salir = async () => {
    const uid = CUENTA_UID;
    try { const c = await nube(); await c.auth.signOut(); } catch (e) { /* sin red: se cierra igual en este teléfono */ }
    localStorage.removeItem(MARCA);
    if (uid) localStorage.removeItem(keyCuenta(uid));   // privacidad: no deja datos de la cuenta en el teléfono
    CUENTA.email = null; CUENTA.sinSesion = false;
    usarAlmacen(null); UI.enter = true; render(); toast(t('cuenta.adios'));
  };
  if (n) ask(t('cuenta.salir_pendientes_titulo'), t('cuenta.salir_pendientes', { n }), t('cuenta.salir_igual'), salir);
  else ask(t('cuenta.salir_titulo'), t('cuenta.salir_texto'), t('cuenta.salir'), salir);
};
