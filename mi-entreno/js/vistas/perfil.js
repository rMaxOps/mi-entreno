/* Asistente de bienvenida (onboarding) y pantalla "Mi perfil" (etapa 2).
   El asistente tiene 4 pasos (datos, molestias, equipo y aviso) y se puede saltar.
   "Mi perfil" usa las mismas piezas en una sola página. Se trabaja sobre un borrador (UI.pf.d)
   y nada se guarda hasta terminar o tocar "Guardar cambios". */
import { CUENTA_UID, S, UI, save } from '../estado.js';
import { t } from '../i18n.js';
import { CON_PESOS, EQUIPOS, ESTADOS, MOVIMIENTOS, NIVELES, OBJETIVOS, SIN_LADO, ZONAS, aplicarPerfil, leerPesos, nombreMolestia, nuevaMolestia, perfil } from '../logica/perfil.js';
import { loginBotones } from '../nube/cuenta.js';
import { pjBubble, pjStill } from '../personajes.js';
import { ACT, INP } from '../registro.js';
import { render } from '../ui/render.js';
import { toast } from '../ui/toast.js';
import { cap, clamp, esc, kg } from '../util.js';

const PASOS = 4;

function borrador() {
  const p = perfil();
  return {
    display_name: p.display_name || '', level: p.level || null, goal: p.goal || null, days: S.settings.perWeek || 3,
    conditions: JSON.parse(JSON.stringify(p.conditions)), sinMolestias: false,
    equipment: Object.fromEntries(p.equipment.map(q => [q.kind, { id: q.id, weights: (q.weights || []).map(kg).join(', '), notes: q.notes || '' }])),
    consent: !!p.consent_at,
  };
}
export function iniciarOnboarding() { UI.pf = { modo: 'onb', paso: 0, d: borrador() }; }
export function abrirPerfil() { UI.pf = { modo: 'editar', paso: 0, d: borrador() }; }

/* ---------- Piezas ---------- */
const opciones = (campo, lista, grupo, valor, act = 'pf-opt', k = '') => `<div class="opts">${lista.map(v =>
  `<button class="opt ${valor === v ? 'on' : ''}" data-act="${act}" data-f="${campo}" data-v="${v}" ${k !== '' ? `data-k="${k}"` : ''} aria-pressed="${valor === v}">${esc(t(grupo + '.' + v))}</button>`).join('')}</div>`;
const stepperH = (act, valor, k = '') => `<div class="stp-c" style="max-width:220px;width:100%"><button class="stp-b" data-act="${act}" data-d="-1" ${k !== '' ? `data-k="${k}"` : ''} aria-label="Menos">−</button>
  <div class="stp-v">${valor}</div><button class="stp-b" data-act="${act}" data-d="1" ${k !== '' ? `data-k="${k}"` : ''} aria-label="Más">+</button></div>`;
const sel = (k, campo, lista, grupo, valor) => `<select class="inp" data-in="pf-c-sel" data-k="${k}" data-f="${campo}">${lista.map(v => `<option value="${v}" ${valor === v ? 'selected' : ''}>${esc(t(grupo + '.' + v))}</option>`).join('')}</select>`;

function pasoDatos(d) {
  return `<div class="card"><h2>${t('perfil.p1_titulo')}</h2><p class="muted small">${t('perfil.p1_texto')}</p>
    <div class="field"><label for="pf-nombre">${t('perfil.nombre')}</label><input class="inp" id="pf-nombre" data-in="pf-f" data-f="display_name" maxlength="60" autocomplete="nickname" value="${esc(d.display_name)}" placeholder="${t('perfil.nombre_ph')}"></div>
    <h3>${t('perfil.nivel')}</h3>${opciones('level', NIVELES, 'niveles', d.level)}
    <h3>${t('perfil.objetivo')}</h3>${opciones('goal', OBJETIVOS, 'objetivos', d.goal)}
    <h3>${t('perfil.dias')}</h3>${stepperH('pf-dias', d.days)}</div>`;
}
function molestiaCard(c, k) {
  return `<div class="ri"><div class="row between"><b>${esc(cap(nombreMolestia(c)))}</b><button class="btn sm danger" data-act="pf-mol-rm" data-k="${k}">${t('perfil.quitar')}</button></div>
    <div class="ri-g2"><div><label class="tiny muted">${t('perfil.zona')}</label>${sel(k, 'zone', ZONAS, 'zonas', c.zone)}</div>
      ${SIN_LADO.includes(c.zone) ? '' : `<div><label class="tiny muted">${t('perfil.lado')}</label>${sel(k, 'side', ['izq', 'der', 'ambos'], 'lados', c.side)}</div>`}</div>
    ${c.zone === 'otra' ? `<div class="field"><input class="inp" data-in="pf-c" data-k="${k}" data-f="zone_other" maxlength="60" value="${esc(c.zone_other || '')}" placeholder="${t('perfil.zona_otra_ph')}"></div>` : ''}
    <label class="tiny muted" style="display:block;margin-top:10px">${t('perfil.estado')}</label>${opciones('status', ESTADOS, 'estados_molestia', c.status, 'pf-c-opt', k)}
    <div class="ri-g2"><div><label class="tiny muted">${t('perfil.desde')}</label><input class="inp" type="month" data-in="pf-c" data-k="${k}" data-f="since" value="${esc(c.since || '')}"></div>
      <div><label class="tiny muted">${t('perfil.umbral')}</label>${stepperH('pf-c-umbral', c.threshold, k)}</div></div>
    <p class="tiny muted">${t('perfil.umbral_ayuda')}</p>
    <label class="tiny muted" style="display:block;margin-top:6px">${t('perfil.molesta')}</label>
    <div class="chips">${MOVIMIENTOS.map(m => `<button class="chipx tgl ${c.bothers.includes(m) ? 'on' : ''}" data-act="pf-c-mov" data-k="${k}" data-v="${m}" aria-pressed="${c.bothers.includes(m)}">${esc(t('movimientos.' + m))}</button>`).join('')}</div>
    <div class="field"><label class="tiny muted">${t('perfil.notas')}</label><textarea class="inp" data-in="pf-c" data-k="${k}" data-f="notes" maxlength="2000" placeholder="${t('perfil.notas_ph')}">${esc(c.notes || '')}</textarea>
      <p class="tiny muted">${t('perfil.notas_ayuda')}</p></div></div>`;
}
function pasoMolestias(d) {
  let h = `<div class="card"><h2>${t('perfil.p2_titulo')}</h2><p class="muted small">${t('perfil.p2_texto')}</p>`;
  if (!d.conditions.length) h += `<div class="opts"><button class="opt ${d.sinMolestias ? 'on' : ''}" data-act="pf-sin" aria-pressed="${d.sinMolestias}">${t('perfil.sin_molestias')}</button></div>
    <button class="btn block mt" data-act="pf-mol-add">${t('perfil.agregar_molestia')}</button>`;
  else h += d.conditions.map(molestiaCard).join('') + `<button class="btn block" data-act="pf-mol-add">${t('perfil.agregar_otra')}</button>`;
  return h + '</div>';
}
function pasoEquipo(d) {
  let h = `<div class="card"><h2>${t('perfil.p3_titulo')}</h2><p class="muted small">${t('perfil.p3_texto')}</p>
    <div class="opts opts2">${EQUIPOS.map(k => `<button class="opt ${d.equipment[k] ? 'on' : ''}" data-act="pf-eq" data-v="${k}" aria-pressed="${!!d.equipment[k]}">${esc(t('equipos.' + k))}</button>`).join('')}</div>`;
  for (const k of CON_PESOS) if (d.equipment[k]) h += `<div class="field"><label>${t('perfil.pesos_de', { equipo: t('equipos.' + k).toLocaleLowerCase('es-CL') })}</label>
    <input class="inp" data-in="pf-eq-pesos" data-k="${k}" inputmode="decimal" value="${esc(d.equipment[k].weights)}" placeholder="${t('perfil.pesos_ph')}"><p class="tiny muted">${t('perfil.pesos_ayuda')}</p></div>`;
  if (d.equipment.otro) h += `<div class="field"><input class="inp" data-in="pf-eq-notas" maxlength="200" value="${esc(d.equipment.otro.notes)}" placeholder="${t('perfil.otro_ph')}"></div>`;
  return h + '</div>';
}
function pasoAviso(d) {
  return `<div class="card"><h2>${t('perfil.p4_titulo')}</h2><div class="note warn">${t('app.aviso_medico')}</div>
    ${CUENTA_UID ? `<p class="small">${t('consentimiento.texto')}</p>
      <label class="tog"><span>${t('consentimiento.acepto')}</span><input type="checkbox" data-in="pf-cons" ${d.consent ? 'checked' : ''} style="width:28px;height:28px"></label>`
      : `<p class="small muted">${t('perfil.p4_invitado')}</p>`}</div>`;
}
function pasoListo(d) {
  const nombre = d.display_name.trim();
  return `<div class="card"><div class="pj-row" style="margin:0">${pjStill('coach')}${pjBubble('coach', esc(t('perfil.listo_titulo', { nombre: nombre ? ', ' + nombre : '' })))}</div>
    <p class="mt">${t('perfil.listo_texto')}</p></div>${perfilCard(false)}
    <button class="btn pri big" data-act="pf-fin">${t('perfil.empezar')}</button>`;
}

/* La pantalla que dibuja render() mientras UI.pf existe */
export function vPerfilPantalla() {
  const f = UI.pf, d = f.d;
  if (f.modo === 'onb') {
    if (f.paso >= PASOS) return pasoListo(d);
    /* Sin cuenta, primero: ¿tienes cuenta? (a la familia la invitamos, así guarda todo en la nube) */
    if (!CUENTA_UID && !f.sinCuenta) return `<div class="card"><div class="pj-row" style="margin:0">${pjStill('coach')}${pjBubble('coach', esc(t('perfil.p0_hola')))}</div></div>
      <div class="card"><h2>${t('perfil.p0_titulo')}</h2><p class="muted small">${t('perfil.p0_texto')}</p>${loginBotones()}</div>
      <button class="btn block" data-act="pf-sin-cuenta" style="min-height:56px">${t('perfil.sin_cuenta')}</button>
      <p class="tiny muted center mt">${t('perfil.sin_cuenta_ayuda')}</p>`;
    return `<div class="onb-top"><span class="tiny muted">${t('perfil.paso', { n: f.paso + 1, total: PASOS })}</span><div class="sesprog"><i style="width:${(f.paso + 1) / PASOS * 100}%"></i></div></div>
      ${[pasoDatos, pasoMolestias, pasoEquipo, pasoAviso][f.paso](d)}
      <div class="row">${f.paso ? `<button class="btn" data-act="pf-atras" style="min-height:56px">${t('perfil.atras')}</button>` : ''}
        <button class="btn pri big grow" data-act="pf-sig">${f.paso === PASOS - 1 ? t('perfil.terminar') : t('perfil.siguiente')}</button></div>
      <button class="btn block ghost mt" data-act="pf-saltar">${t('perfil.saltar')}</button>`;
  }
  return `${pasoDatos(d)}${pasoMolestias(d)}${pasoEquipo(d)}
    <div class="note warn small">${t('app.aviso_medico')}</div>
    <button class="btn pri big mt" data-act="pf-guardar">${t('perfil.guardar')}</button>
    <button class="btn block ghost mt" data-act="pf-cancelar">${t('perfil.cancelar')}</button>`;
}

/* ---------- Resumen del perfil (en Más y al terminar el asistente) ---------- */
export function perfilCard(conBoton = true) {
  const p = perfil(), dias = S.settings.perWeek;
  const datos = p.level || p.goal ? `<p class="small muted">${t('perfil.resumen_nivel', { nivel: p.level ? t('niveles.' + p.level) : '—', objetivo: p.goal ? t('objetivos.' + p.goal) : '—', dias })}</p>` : '';
  const mol = p.conditions.length ? p.conditions.map(c => `<div class="list-row"><span class="grow"><b>${esc(cap(nombreMolestia(c)))}</b>
      <div class="tiny muted">${esc(t('estados_molestia.' + c.status))} · ${t('perfil.avisar_desde', { n: c.threshold })}${c.bothers.length ? ' · ' + esc(t('perfil.le_molesta', { lista: c.bothers.map(m => t('movimientos.' + m).toLocaleLowerCase('es-CL')).join(', ') })) : ''}</div></span></div>`).join('')
    : `<p class="small muted">${t('perfil.sin_molestias_txt')}</p>`;
  const eq = p.equipment.length ? `<div class="chips">${p.equipment.map(q => `<span class="chipx" style="padding:0 14px;font:600 15px var(--f-txt)">${esc(t('equipos.' + q.kind))}${q.weights && q.weights.length ? ` · ${q.weights.map(kg).join(', ')} kg` : ''}${q.kind === 'otro' && q.notes ? ` · ${esc(q.notes)}` : ''}</span>`).join('')}</div>`
    : `<p class="small muted">${t('perfil.sin_equipo')}</p>`;
  return `<div class="card"><div class="row between"><h2 class="mb0">${esc(p.display_name || t('perfil.resumen_titulo'))}</h2>${conBoton ? `<button class="btn sm" data-act="pf-abrir">${t('perfil.editar')}</button>` : ''}</div>
    ${datos}<h3>${t('perfil.molestias_h')}</h3>${mol}<h3>${t('perfil.equipo_h')}</h3>${eq}</div>`;
}

/* ---------- Guardar ---------- */
function guardar(modo) {
  const d = UI.pf.d, p = perfil(), ahora = new Date().toISOString();
  p.display_name = d.display_name.trim().slice(0, 60) || null;
  p.level = d.level; p.goal = d.goal;
  S.settings.perWeek = d.days;
  p.conditions = d.conditions.map(c => ({ ...c, side: SIN_LADO.includes(c.zone) ? 'na' : c.side,
    zone_other: c.zone === 'otra' ? (c.zone_other || '').trim().slice(0, 60) : '', notes: (c.notes || '').slice(0, 2000) }));
  p.equipment = Object.entries(d.equipment).map(([k, q]) => ({ id: q.id || crypto.randomUUID(), kind: k,
    weights: CON_PESOS.includes(k) ? leerPesos(q.weights) : [], notes: k === 'otro' ? (q.notes || '').trim().slice(0, 200) : '' }));
  if (modo === 'onb') { p.onboarded_at = ahora; if (CUENTA_UID && d.consent && !p.consent_at) p.consent_at = ahora; }
  aplicarPerfil(); save();
}

/* ---------- Acciones ---------- */
const d = () => UI.pf.d;
const redibujar = () => render();
ACT['pf-abrir'] = () => { abrirPerfil(); render(); window.scrollTo(0, 0); };
ACT['pf-opt'] = x => { d()[x.f] = x.v; redibujar(); };
ACT['pf-dias'] = x => { d().days = clamp(d().days + +x.d, 1, 7); redibujar(); };
ACT['pf-sin'] = () => { d().sinMolestias = !d().sinMolestias; redibujar(); };
ACT['pf-mol-add'] = () => { d().conditions.push(nuevaMolestia()); d().sinMolestias = false; redibujar(); };
ACT['pf-mol-rm'] = x => { d().conditions.splice(+x.k, 1); redibujar(); };
ACT['pf-c-opt'] = x => { d().conditions[+x.k][x.f] = x.v; redibujar(); };
ACT['pf-c-umbral'] = x => { const c = d().conditions[+x.k]; c.threshold = clamp(c.threshold + +x.d, 1, 10); redibujar(); };
ACT['pf-c-mov'] = x => { const c = d().conditions[+x.k]; c.bothers = c.bothers.includes(x.v) ? c.bothers.filter(m => m !== x.v) : [...c.bothers, x.v]; redibujar(); };
ACT['pf-eq'] = x => {
  const e = d().equipment;
  if (e[x.v]) delete e[x.v];
  else if (x.v === 'ninguno') { for (const k of Object.keys(e)) delete e[k]; e.ninguno = { weights: '', notes: '' }; }
  else { delete e.ninguno; e[x.v] = { weights: '', notes: '' }; }
  redibujar();
};
INP['pf-f'] = (v, el) => { d()[el.dataset.f] = v; };
INP['pf-c'] = (v, el) => { d().conditions[+el.dataset.k][el.dataset.f] = v; };
INP['pf-c-sel'] = (v, el) => {
  const c = d().conditions[+el.dataset.k]; c[el.dataset.f] = v;
  if (el.dataset.f === 'zone') c.side = SIN_LADO.includes(v) ? 'na' : (c.side === 'na' ? 'der' : c.side);
  redibujar();
};
INP['pf-eq-pesos'] = (v, el) => { d().equipment[el.dataset.k].weights = v; };
INP['pf-eq-notas'] = v => { d().equipment.otro.notes = v; };
INP['pf-cons'] = (v, el) => { d().consent = el.checked; };

ACT['pf-sin-cuenta'] = () => { UI.pf.sinCuenta = true; redibujar(); window.scrollTo(0, 0); };
ACT['pf-sig'] = () => {
  const f = UI.pf;
  if (f.paso === PASOS - 1) {
    if (CUENTA_UID && !f.d.consent) return toast(t('perfil.falta_consentimiento'), 'bad');
    guardar('onb');
  }
  f.paso++; redibujar(); window.scrollTo(0, 0);
};
ACT['pf-atras'] = () => { UI.pf.paso = Math.max(0, UI.pf.paso - 1); redibujar(); window.scrollTo(0, 0); };
ACT['pf-saltar'] = () => { perfil().onboarded_at = new Date().toISOString(); save(); UI.pf = null; UI.enter = true; render(); window.scrollTo(0, 0); };
ACT['pf-fin'] = () => { UI.pf = null; UI.tab = 'inicio'; UI.enter = true; render(); window.scrollTo(0, 0); };
ACT['pf-guardar'] = () => { guardar('editar'); UI.pf = null; UI.tab = 'mas'; render(); window.scrollTo(0, 0); toast(t('perfil.guardado'), 'ok'); };
ACT['pf-cancelar'] = () => { UI.pf = null; render(); window.scrollTo(0, 0); };
