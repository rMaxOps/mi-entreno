/* Configuración pública de Supabase.
   Aquí van SOLO la Project URL y la clave publishable: son públicas a propósito y la seguridad
   depende de las reglas de la base (Row Level Security), no de esconderlas.
   NUNCA pongas aquí la clave secreta / service_role, la contraseña de la base ni otras API keys:
   esas viven solo en el panel de Supabase (secretos de las Edge Functions). */
export const SUPABASE = {
  produccion: { url: 'https://izopliauqqafzftayprs.supabase.co', key: 'sb_publishable_9LM3cUg4D6mD1fO38g7rpA_LC3r15ey' },
  pruebas: { url: 'https://vcyfdsworbuzoliuwpwo.supabase.co', key: 'sb_publishable_DvGsn814Zx97sqB81mhBpQ_zqMQ9OeX' },
};

/* En el computador (localhost) se usa SIEMPRE el proyecto de pruebas, para no tocar datos reales. */
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
export const ENTORNO = local ? 'pruebas' : 'produccion';
export const SUPABASE_ACTIVO = SUPABASE[ENTORNO];

/* Versión fija de supabase-js (se carga desde el CDN, sin paso de build) */
export const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.10/+esm';
