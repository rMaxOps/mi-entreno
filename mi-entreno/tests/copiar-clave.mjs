/* Copia al portapapeles el correo o la contraseña de un usuario de prueba, sin mostrarla en pantalla.
   Uso (en PowerShell, dentro de la carpeta tests):
     node copiar-clave.mjs A correo     → copia el correo de A
     node copiar-clave.mjs A clave      → copia la contraseña de A
   Después pégala con Ctrl+V en el panel de Supabase (proyecto mi-entreno-pruebas). */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const [quien, que] = process.argv.slice(2).map(s => (s || '').toUpperCase());
if (!['A', 'B'].includes(quien) || !['CORREO', 'CLAVE'].includes(que)) {
  console.log('Uso: node copiar-clave.mjs A|B correo|clave');
  process.exit(1);
}
const env = Object.fromEntries(readFileSync(new URL('./.env', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const valor = env[`PRUEBA_${quien}_${que === 'CORREO' ? 'EMAIL' : 'PASSWORD'}`];
execSync('clip', { input: valor });
console.log(`✓ ${que === 'CORREO' ? 'Correo' : 'Contraseña'} de ${quien} copiado. Pégalo con Ctrl+V.`);
