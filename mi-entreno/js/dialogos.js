/* =========================================================
   DIÁLOGOS de los personajes (skill personajes-animados)
   Frases cortas, cercanas y sin exagerar. Varias opciones por
   situación para que no se repitan. El Coach Hombro da los avisos
   de dolor y nunca da diagnósticos: ante algo fuerte o raro,
   sugiere consultar al kinesiólogo.
   ========================================================= */
import { tieneHombro, zonaDolor } from './logica/perfil.js';
export const DIALOGOS = {
  coach: {
    presentar: ['Hoy vamos de a poco. Si algo molesta, me avisas.', 'Lo importante hoy es la técnica, no el peso.', 'Escucha a tu {zona}: hoy manda.'],
    primero: ['Partimos suave. Primera serie con poco peso.', 'Calentamos bien y después vemos cómo responde tu {zona}.', 'Tranqui, la primera es para sentir el movimiento.'],
    mitad: ['Vamos en la mitad. ¿Cómo va tu {zona}?', 'Mitad lista. Respira y sigue con calma.', 'Buen ritmo. Si sube el dolor, bajamos la carga.'],
    ultima: ['Última serie. Con buena técnica hasta el final.', 'La última y listo. Sin apurarse.', 'Queda una. Controlada, como todas.'],
    record: ['¡Nuevo récord y sin dolor! Así se hace.', 'Récord con buena técnica: eso vale doble.', '¡Bien! Subiste sin que tu {zona} reclamara.'],
    dolor_alto: ['Hasta aquí por hoy con este. Pasemos al siguiente.', 'Ese dolor es mucho. Dejemos este ejercicio por hoy.', 'Paremos este. Si el dolor es punzante o raro, consulta a tu kinesiólogo.'],
    final: ['Sesión lista. Mañana te pregunto cómo amaneció tu {zona}.', '¡Buen trabajo! Ahora a descansar y a hidratarse.', 'Terminamos. La constancia es lo que más ayuda.'],
    serie: ['Bien ahí.', 'Así, controlado.', 'Buena serie.'],
    checkin_g: ['Semáforo verde: hoy entrenamos normal.', 'Tu {zona} viene bien. Vamos con calma igual.', 'Buen día para entrenar. Partimos calentando.'],
    checkin_y: ['Hoy con cuidado: un peso menos y rango más corto.', 'Semáforo amarillo. Entrenamos, pero escuchando a tu {zona}.', 'Vamos más suave hoy. Nada que moleste.'],
    checkin_r: ['[h]Hoy no. Mejor solo Rehab suave o descanso.', 'Hoy no. Mejor descanso o algo muy suave.', 'Con ese dolor, hoy le damos descanso a tu {zona}.', 'Hoy toca cuidarse. Si el dolor es fuerte o raro, consulta a tu kinesiólogo.'],
  },
  tiron: {
    presentar: ['¡La barra es mi lugar feliz! Hoy tiramos con calma.', 'Hoy espalda y bíceps. Codos hacia la cadera.', 'Tiramos sin balanceo, ¿ya?'],
    primero: ['Primera serie: siente cómo trabaja la espalda.', 'Partimos controlados, sin tirones.', 'Escápulas juntas y vamos.'],
    mitad: ['Vamos en la mitad. Espalda firme.', 'Mitad lista. Sin apurar las bajadas.', 'Buen ritmo. Sigue así.'],
    ultima: ['¡Última serie! Tira con técnica.', 'La última, bien controlada.', 'Queda una. Codos a la cadera.'],
    record: ['¡Récord! Esa espalda está despertando.', '¡Nuevo récord de tirón!', '¡Bien! Más fuerte que la última vez.'],
    final: ['Listo el tirón. ¡Buena espalda!', 'Terminamos. Mañana se siente.', '¡Buen trabajo en la barra!'],
    serie: ['Buena.', 'Así, sin balanceo.', 'Bien tirado.'],
  },
  empuje: {
    presentar: ['Empujamos con control: codos a unos 45°.', 'Día de empuje. Si algo reclama, bajamos el peso.', 'Hoy pecho y tríceps, con cuidado.'],
    primero: ['Primera serie: liviana y controlada.', 'Partimos suave. Codos a 45°.', 'Siente el movimiento antes de cargar.'],
    mitad: ['Mitad lista. Nada por encima de la cabeza si molesta.', 'Vamos en la mitad. Control al bajar.', 'Buen ritmo. Sin rebotes.'],
    ultima: ['¡Última! Empuja con técnica.', 'Queda una serie. Tranqui y firme.', 'La última, controlada.'],
    record: ['¡Récord! Y sin dolor.', '¡Nuevo récord de empuje!', '¡Bien! Más fuerte y con técnica.'],
    final: ['Listo el empuje. ¡Bien hecho!', 'Terminamos. Cero dolor, cero drama.', '¡Buen trabajo!'],
    serie: ['Buena.', 'Así, controlado.', 'Bien empujado.'],
  },
  patas: {
    presentar: ['Piernas al ataque 🦵', 'Hoy piernas y core. Espalda recta.', 'Día de piernas: talones apoyados.'],
    primero: ['Primera serie para calentar las piernas.', 'Partimos suave, buscando buena postura.', 'Siente cómo trabajan los glúteos.'],
    mitad: ['Mitad lista. Las piernas aguantan.', 'Vamos en la mitad. Rodillas alineadas.', 'Buen ritmo, sigue así.'],
    ultima: ['¡Última serie! Con todo y con técnica.', 'Queda una. Espalda recta.', 'La última y a estirar.'],
    record: ['¡Récord de piernas!', '¡Nuevo récord! Esas piernas mandan.', '¡Bien! Más fuerte que la otra vez.'],
    final: ['¡Piernas listas! A estirar un poco.', 'Terminamos. Mañana las vas a sentir.', '¡Buen trabajo!'],
    serie: ['Buena.', 'Así, firme.', 'Bien ahí.'],
  },
  nucleo: {
    presentar: ['Todo parte desde el centro.', 'Hoy core: respira tranquilo.', 'Abdomen firme y espalda neutra.'],
    primero: ['Primera serie: respira y aprieta el abdomen.', 'Partimos con calma, la zona lumbar pegada.', 'Siente el centro firme.'],
    mitad: ['Mitad lista. Respira.', 'Vamos en la mitad. Sin aguantar el aire.', 'Buen ritmo.'],
    ultima: ['¡Última! Centro firme.', 'Queda una. Respira y aprieta.', 'La última, controlada.'],
    record: ['¡Récord de core!', '¡Nuevo récord! Ese centro está firme.', '¡Bien!'],
    final: ['Core listo. ¡Bien hecho!', 'Terminamos. A respirar.', '¡Buen trabajo!'],
    serie: ['Buena.', 'Así, respirando.', 'Bien.'],
  },
};

/* Presentación de cada rutina base: qué se trabaja y en qué fijarse */
export const INTRO_RUTINA = {
  rehab: { who: 'coach', text: 'Hoy es día de cuidar el hombro: todo suave y lento. Fíjate en que nada duela.' },
  full: { who: 'coach', text: 'Cuerpo completo: un poco de todo. Fíjate en la técnica más que en el peso.' },
  a: { who: 'tiron', text: 'Hoy tiramos: espalda y bíceps. Fíjate en llevar el codo hacia la cadera.' },
  b: { who: 'empuje', text: 'Empuje con cuidado: codos a 45° y nada por encima de la cabeza si molesta.' },
  c: { who: 'patas', text: 'Piernas y core. Fíjate en la espalda recta y en los talones apoyados.' },
  libre: { who: 'coach', text: 'Sesión libre: agrega lo que quieras y escucha a tu cuerpo.' },
};

/* Elige una frase sin repetir la última que dijo ese personaje en esa situación */
export const _ultimaFrase = {};
/* Marcas en las frases: {zona} se reemplaza por la zona de la persona ("tu rodilla derecha") y la frase
   no se usa si no tiene molestias; [h] = solo para quien tiene molestia de hombro. */
export function decir(who, sit) {
  const z = zonaDolor(), h = tieneHombro();
  let lista = ((DIALOGOS[who] && DIALOGOS[who][sit]) || DIALOGOS.coach[sit] || [''])
    .filter(f => (z || !f.includes('{zona}')) && (h || !f.startsWith('[h]')));
  if (!lista.length) lista = [''];
  const k = who + ':' + sit;
  let i = Math.floor(Math.random() * lista.length);
  if (lista.length > 1 && i === _ultimaFrase[k]) i = (i + 1) % lista.length;
  _ultimaFrase[k] = i;
  return lista[i].replace(/^\[h\]/, '').replace(/\{zona\}/g, z || '');
}
