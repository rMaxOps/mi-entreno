/* Cliente de Supabase. Se carga desde el CDN solo cuando hace falta y nunca bloquea la app:
   si no hay internet, la app sigue funcionando con los datos del teléfono. */
import { SUPABASE_ACTIVO, SUPABASE_JS } from '../config.js';

let cliente = null, cargando = null;

export function nube() {
  if (cliente) return Promise.resolve(cliente);
  if (!cargando) {
    cargando = import(SUPABASE_JS)
      .then(m => (cliente = m.createClient(SUPABASE_ACTIVO.url, SUPABASE_ACTIVO.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'mientreno.auth' },
      })))
      .catch(e => { cargando = null; throw e; });
  }
  return cargando;
}
