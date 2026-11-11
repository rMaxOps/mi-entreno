/* Pruebas de seguridad (Row Level Security) contra el proyecto mi-entreno-pruebas.
   Usa dos usuarios de prueba (A y B) cuyas credenciales están en tests/.env (no va al repo).
   Correr:  cd tests && npm install && npm test
   Nunca apuntes estas pruebas al proyecto de producción. */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const SUPA_URL = 'https://vcyfdsworbuzoliuwpwo.supabase.co';           // mi-entreno-pruebas (NUNCA producción)
const KEY = 'sb_publishable_DvGsn814Zx97sqB81mhBpQ_zqMQ9OeX';

const env = Object.fromEntries(readFileSync(new URL('./.env', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));

const cliente = () => createClient(SUPA_URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
let ok = 0, mal = 0;
const check = (nombre, cond, extra = '') => { cond ? ok++ : mal++; console.log(`${cond ? '✓' : '✗'} ${nombre}${!cond && extra ? '  → ' + extra : ''}`); };

async function entrar(email, password) {
  const c = cliente();
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`No pude entrar como ${email}: ${error.message}`);
  return { c, uid: data.user.id };
}

const A = await entrar(env.PRUEBA_A_EMAIL, env.PRUEBA_A_PASSWORD);
const B = await entrar(env.PRUEBA_B_EMAIL, env.PRUEBA_B_PASSWORD);
const anon = cliente();
const ahora = () => new Date().toISOString();

/* Filas de ejemplo por tabla (sin user_id: se agrega según quién crea) */
const ej = {
  conditions: () => ({ zone: 'rodilla', side: 'der', status: 'activa', threshold: 4 }),
  equipment: () => ({ kind: 'mancuernas', weights: [2, 4] }),
  exercises: () => ({ slug: 'prueba_' + randomUUID().slice(0, 8), name: 'Ejercicio de prueba', type: 'r' }),
  templates: () => ({ name: 'Plantilla de prueba', items: [] }),
  sessions: () => ({ started_at: ahora(), template_name: 'Prueba' }),
};

console.log('\n== Perfil automático ==');
for (const [n, U] of [['A', A], ['B', B]]) {
  const { data } = await U.c.from('profiles').select('user_id');
  check(`${n} tiene exactamente su perfil`, data && data.length === 1 && data[0].user_id === U.uid, JSON.stringify(data));
}

for (const tabla of Object.keys(ej)) {
  console.log(`\n== ${tabla} ==`);
  const fila = { id: randomUUID(), ...ej[tabla](), user_id: A.uid, updated_at: ahora() };
  let r = await A.c.from(tabla).insert(fila).select();
  check('A crea lo suyo', !r.error && r.data.length === 1, r.error?.message);
  r = await A.c.from(tabla).select('id').eq('id', fila.id);
  check('A lee lo suyo', r.data?.length === 1, r.error?.message);
  r = await B.c.from(tabla).select('id').eq('id', fila.id);
  check('B NO ve lo de A', !r.error && r.data.length === 0, JSON.stringify(r.data) + (r.error?.message || ''));
  r = await anon.from(tabla).select('id').eq('id', fila.id);
  check('Sin sesión NO ve nada', r.error || r.data.length === 0, JSON.stringify(r.data));
  r = await B.c.from(tabla).update({ updated_at: ahora() }).eq('id', fila.id).select();
  check('B NO edita lo de A', r.error || r.data.length === 0, JSON.stringify(r.data));
  r = await B.c.from(tabla).insert({ id: randomUUID(), ...ej[tabla](), user_id: A.uid });
  check('B NO crea filas a nombre de A', !!r.error, 'se pudo crear');
  r = await anon.from(tabla).insert({ id: randomUUID(), ...ej[tabla](), user_id: A.uid });
  check('Sin sesión NO crea nada', !!r.error, 'se pudo crear');
  r = await B.c.from(tabla).upsert({ ...fila, user_id: B.uid, updated_at: ahora() }).select();
  check('B NO se apropia de la fila de A con upsert', !!r.error || r.data.length === 0, JSON.stringify(r.data));
  r = await A.c.from(tabla).update({ user_id: B.uid, updated_at: ahora() }).eq('id', fila.id).select();
  check('A NO puede regalar la fila a B', !!r.error, 'se cambió el dueño');
  r = await A.c.from(tabla).delete().eq('id', fila.id);
  const sigue = await A.c.from(tabla).select('id').eq('id', fila.id);
  check('Nadie borra filas de verdad desde la app', sigue.data?.length === 1, r.error?.message);
  /* Gana la última edición: una versión más vieja se ignora */
  const nuevo = new Date(Date.now() + 1000).toISOString(), viejo = new Date(Date.now() - 60000).toISOString();
  await A.c.from(tabla).update({ updated_at: nuevo, deleted_at: null }).eq('id', fila.id);
  await A.c.from(tabla).update({ updated_at: viejo, deleted_at: ahora() }).eq('id', fila.id);
  r = await A.c.from(tabla).select('deleted_at').eq('id', fila.id);
  check('Una edición más vieja se ignora', r.data?.[0]?.deleted_at === null, JSON.stringify(r.data));
  /* Borrado suave (así se borra para sincronizar) */
  r = await A.c.from(tabla).update({ deleted_at: ahora(), updated_at: new Date(Date.now() + 2000).toISOString() }).eq('id', fila.id).select('deleted_at');
  check('A marca como borrado lo suyo', !!r.data?.[0]?.deleted_at, r.error?.message);
}

console.log('\n== Series y dolor amarrados al dueño ==');
const sesB = { id: randomUUID(), user_id: B.uid, started_at: ahora(), updated_at: ahora() };
await B.c.from('sessions').insert(sesB);
let r = await A.c.from('sets').insert({ id: randomUUID(), user_id: A.uid, session_id: sesB.id, exercise_slug: 'row1', position: 0, set_index: 0, reps: 10 });
check('A NO puede poner una serie en la sesión de B', !!r.error, 'se pudo');
r = await A.c.from('pain_readings').insert({ id: randomUUID(), user_id: A.uid, session_id: sesB.id, moment: 'checkin', value: 3 });
check('A NO puede poner dolor en la sesión de B', !!r.error, 'se pudo');
const condB = { id: randomUUID(), user_id: B.uid, zone: 'hombro', updated_at: ahora() };
await B.c.from('conditions').insert(condB);
const sesA = { id: randomUUID(), user_id: A.uid, started_at: ahora(), updated_at: ahora() };
await A.c.from('sessions').insert(sesA);
r = await A.c.from('pain_readings').insert({ id: randomUUID(), user_id: A.uid, session_id: sesA.id, condition_id: condB.id, moment: 'checkin', value: 3 });
check('A NO puede usar una molestia de B', !!r.error, 'se pudo');
r = await A.c.from('sets').insert({ id: randomUUID(), user_id: A.uid, session_id: sesA.id, exercise_slug: 'row1', position: 0, set_index: 0, reps: 10, pain: 2 }).select();
check('A sí registra series en su sesión', !r.error && r.data.length === 1, r.error?.message);
r = await A.c.from('pain_readings').insert({ id: randomUUID(), user_id: A.uid, session_id: sesA.id, moment: 'checkin', value: 2 }).select();
check('A sí registra dolor en su sesión', !r.error && r.data.length === 1, r.error?.message);
r = await A.c.from('sets').insert({ id: randomUUID(), user_id: A.uid, session_id: sesA.id, exercise_slug: 'row1', position: 0, set_index: 1, pain: 11 });
check('Dolor fuera de 0-10 se rechaza', !!r.error, 'se aceptó');
for (const [t, id, U] of [['sessions', sesB.id, B], ['conditions', condB.id, B], ['sessions', sesA.id, A]])
  await U.c.from(t).update({ deleted_at: ahora(), updated_at: new Date(Date.now() + 3000).toISOString() }).eq('id', id);

console.log('\n== Ejercicios globales ==');
r = await A.c.from('exercises').insert({ id: randomUUID(), user_id: null, slug: 'global_falso', name: 'Falso', type: 'r' });
check('Nadie crea ejercicios globales', !!r.error, 'se pudo');
r = await anon.from('exercises').select('id').limit(1);
check('Sin sesión NO ve ejercicios', r.error || r.data.length === 0, JSON.stringify(r.data));

console.log('\n== Funciones internas ==');
r = await A.c.schema('privado').rpc('crear_perfil');
check('La app NO puede llamar funciones privadas', !!r.error, 'se pudo');

console.log(`\n${ok} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
