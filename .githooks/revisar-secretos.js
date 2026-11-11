#!/usr/bin/env node
/* Revisa lo que vas a guardar en git (git commit) y lo DETIENE si parece una clave secreta.
   Se activa con:  git config core.hooksPath .githooks   (una vez por computador)

   Permitido:  la Project URL y la clave pública de Supabase (sb_publishable_… o el JWT con role "anon").
   Bloqueado:  claves de Anthropic, la clave secreta / service_role de Supabase, contraseñas de base de
               datos, tokens de GitHub, secretos de Google, llaves privadas y archivos .env. */
const { execSync } = require('child_process');

const sh = c => execSync(c, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const problemas = [];

/* 1) Archivos que nunca deben entrar */
const archivos = sh('git diff --cached --name-only --diff-filter=ACMR').split('\n').filter(Boolean);
for (const f of archivos) {
  if (/(^|\/)\.env(\.|$)/.test(f) && !/\.env\.example$/.test(f)) problemas.push(`Archivo de secretos: ${f}`);
  if (/\.(pem|key|p12)$/i.test(f)) problemas.push(`Archivo de llave: ${f}`);
}

/* 2) Texto con forma de secreto en las líneas agregadas */
const PATRONES = [
  [/sk-ant-[A-Za-z0-9_-]{10,}/, 'API key de Anthropic'],
  [/sb_secret_[A-Za-z0-9_-]{10,}/, 'clave secreta de Supabase'],
  [/sbp_[A-Za-z0-9]{20,}/, 'token de acceso de Supabase'],
  [/postgres(ql)?:\/\/[^:\s]+:[^@\s]{6,}@/, 'conexión a la base con contraseña'],
  [/gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/, 'token de GitHub'],
  [/GOCSPX-[A-Za-z0-9_-]{10,}/, 'secreto de Google OAuth'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'llave privada'],
];
/* Un JWT de Supabase es secreto si su contenido dice role "service_role" */
const esJwtSecreto = tok => {
  try {
    const payload = JSON.parse(Buffer.from(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return payload.role && payload.role !== 'anon' && payload.role !== 'authenticated';
  } catch (e) { return false; }
};

let archivo = '';
const diff = sh('git diff --cached -U0 --no-color');
for (const linea of diff.split('\n')) {
  if (linea.startsWith('+++ ')) { archivo = linea.slice(6); continue; }
  if (!linea.startsWith('+') || linea.startsWith('+++')) continue;
  if (archivo.endsWith('.githooks/revisar-secretos.js')) continue; // este mismo archivo describe los patrones
  for (const [re, nombre] of PATRONES) if (re.test(linea)) problemas.push(`${nombre} en ${archivo}`);
  for (const tok of linea.match(/eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g) || [])
    if (esJwtSecreto(tok)) problemas.push(`clave service_role de Supabase en ${archivo}`);
}

if (problemas.length) {
  console.error('\n⛔ Commit detenido: parece que vas a guardar un secreto.\n');
  for (const p of [...new Set(problemas)]) console.error('   • ' + p);
  console.error('\nSaca ese dato del archivo (los secretos van en el panel de Supabase, nunca en el repo)');
  console.error('y vuelve a intentar. Si ya lo pegaste en algún lado, cámbialo (rótalo) en su panel.\n');
  process.exit(1);
}
