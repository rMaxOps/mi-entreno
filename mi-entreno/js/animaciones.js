'use strict';
/* =========================================================
   ANIMACIONES de cada ejercicio (skill personajes-animados)
   El esqueleto se ve de perfil, mirando a la derecha. Medidas:
   torso 32, brazo 20 + antebrazo 18, muslo 24 + pierna 24.
   Ángulos en grados: positivo = sentido del reloj.
   Un brazo o pierna que cuelga gira hacia ATRÁS con ángulos positivos
   y hacia ADELANTE con negativos; el torso positivo se inclina hacia adelante.

   Cada ejercicio:
   - duracion: segundos del bucle
   - props: elementos del fondo ('suelo:y', 'barra:y', 'pared:x', 'banco', 'silla', 'cojin', 'toalla')
   - mano: qué sostiene cada mano (f = brazo de adelante, b = de atrás):
           'db' mancuerna vista de lado, 'dbp' vista de frente, 'dbv' vertical
   - base: pose fija por segmento
   - keyframes: fotogramas por segmento [porcentaje, transform]
   - ocultar: segmentos que no se ven
   - vista: viewBox si el ejercicio necesita otro encuadre
   - frase: la indicación corta que dice el personaje
   - final: en qué % está la posición final (para "menos movimiento"; por defecto 50)
   Segmentos: root, tor (torso), hd (cabeza), ua-f/ua-b (brazo), fa-f/fa-b (antebrazo),
              th-f/th-b (muslo), sh-f/sh-b (pierna), ft-f/ft-b (pie)
   ========================================================= */
const R = d => `rotate(${d}deg)`;
const T = (x, y) => `translate(${x}px,${y}px)`;
/* Arma fotogramas iguales para varios segmentos: kf([0,'a'],[50,'b']) */
const kf = (...f) => f;
/* Ida y vuelta típica: quieto, sube, pausa, baja */
const ida = (a, b, p = [0, 12, 45, 58]) => [[p[0], a], [p[1], a], [p[2], b], [p[3], b], [100, a]];

const LYING = '0 50 160 85';
const BAR = '0 -22 160 162';

/* Pose de remo (rodilla y mano en el banco), compartida por remo y patada de tríceps */
const REMO_BASE = { root: T(-20, -12), tor: R(78), hd: R(-12), 'ua-b': R(-113), 'th-b': R(0), 'sh-b': R(90), 'ft-b': R(90), 'th-f': R(-6), 'sh-f': R(10), 'ft-f': R(-4) };
const REMO_PROPS = ['suelo:122', 'banco'];

const ANIMACIONES = {
  /* ---------------- Rehab hombro (Coach Hombro) ---------------- */
  /* Acostado de lado, codo pegado con la toalla. Visto de frente, el antebrazo
     pasa de apoyado en la guata a apuntar al techo (como una puerta que se abre). */
  rot_ext: {
    duracion: 3.2, props: ['suelo:114', 'cojin'], delante: ['toalla'], mano: { f: 'db' }, ocultar: ['ua-b'], vista: LYING,
    base: { root: `${T(0, 22)} ${R(-90)}`, 'ua-f': R(-7), 'th-f': R(-12), 'sh-f': R(22), 'th-b': R(-12), 'sh-b': R(22), 'ft-f': R(-10), 'ft-b': R(-10) },
    keyframes: { 'fa-f': ida('rotate(97deg) scaleY(.45)', 'rotate(97deg) scaleY(-.85)', [0, 15, 50, 62]) },
    frase: 'Codo pegado al cuerpo, lento y sin dolor 👌',
  },
  /* Colgado con brazos estirados: solo bajan los hombros y el cuerpo sube un poco */
  scap_pull: {
    duracion: 2.8, props: ['barra:11'],
    base: { 'th-f': R(-6), 'sh-f': R(12), 'ft-f': R(-6), 'th-b': R(-6), 'sh-b': R(12), 'ft-b': R(-6) },
    keyframes: {
      root: ida(T(0, 0), T(0, -4), [0, 15, 45, 60]),
      'ua-f': ida('rotate(178deg) scaleY(1)', 'rotate(178deg) scaleY(.9)', [0, 15, 45, 60]),
      'ua-b': ida('rotate(178deg) scaleY(1)', 'rotate(178deg) scaleY(.9)', [0, 15, 45, 60]),
    },
    frase: 'Brazos estirados: solo bajan los hombros y se juntan las escápulas.',
  },
  /* Boca abajo: Y (brazos adelante), T (hacia los lados) y W (codos a las costillas) */
  ytw: {
    duracion: 6.5, props: ['suelo:120'], vista: '0 60 160 75',
    base: { root: `${T(-8, 30)} ${R(90)}` },
    keyframes: (() => {
      const Y0 = 'rotate(-178deg) scaleY(.75)', Y1 = 'rotate(-195deg) scaleY(.75)';
      const T0 = 'rotate(-90deg) scaleY(.3)', T1 = 'rotate(-90deg) scaleY(-.3)';
      const W0 = 'rotate(0deg) scaleY(1)', W1 = 'rotate(10deg) scaleY(1)';
      const ua = [[0, Y0], [8, Y1], [18, Y1], [26, Y0], [34, T0], [42, T1], [52, T1], [60, T0], [68, W0], [76, W1], [86, W1], [94, W0], [100, Y0]];
      const fa = [[0, R(0)], [60, R(0)], [68, R(-180)], [76, R(-200)], [86, R(-200)], [94, R(-180)], [100, R(0)]];
      return { 'ua-f': ua, 'ua-b': ua, 'fa-f': fa, 'fa-b': fa };
    })(),
    frase: 'Pulgares arriba y lento. Cada letra cuenta como 1.',
  },
  /* De frente a la pared, antebrazos apoyados: suben deslizando */
  wall_slide: {
    duracion: 3.4, props: ['suelo:134', 'pared:104'],
    keyframes: {
      'ua-f': ida(R(-90), R(-130), [0, 15, 50, 62]), 'ua-b': ida(R(-90), R(-130), [0, 15, 50, 62]),
      'fa-f': ida(R(-90), R(-45), [0, 15, 50, 62]), 'fa-b': ida(R(-90), R(-45), [0, 15, 50, 62]),
      tor: ida(R(0), R(5), [0, 15, 50, 62]),
    },
    frase: 'Sube solo hasta donde no duela.',
  },
  /* Colgado con los pies apoyados: hombros activos, respirando */
  dead_hang: {
    duracion: 3, props: ['barra:17', 'suelo:134'],
    base: { 'th-f': R(-29), 'sh-f': R(58), 'ft-f': R(-29), 'th-b': R(-29), 'sh-b': R(58), 'ft-b': R(-29) },
    keyframes: {
      root: kf([0, T(0, 6)], [50, T(0, 4.5)], [100, T(0, 6)]),
      'ua-f': kf([0, 'rotate(178deg) scaleY(1)'], [50, 'rotate(178deg) scaleY(.96)'], [100, 'rotate(178deg) scaleY(1)']),
      'ua-b': kf([0, 'rotate(178deg) scaleY(1)'], [50, 'rotate(178deg) scaleY(.96)'], [100, 'rotate(178deg) scaleY(1)']),
    },
    frase: 'Hombros activos, nada de colgar flojo. Al principio, pies apoyados.',
  },

  /* ---------------- Tirón (Tirón) ---------------- */
  pullup: {
    duracion: 3, props: ['barra:11'], vista: BAR,
    base: { 'th-f': R(-4), 'sh-f': R(10), 'ft-f': R(-6), 'th-b': R(-4), 'sh-b': R(10), 'ft-b': R(-6) },
    keyframes: {
      root: ida(T(0, -1), T(0, -40)),
      'ua-f': ida(R(178), R(20)), 'ua-b': ida(R(178), R(20)),
      'fa-f': ida(R(0), R(182)), 'fa-b': ida(R(0), R(182)),
    },
    frase: 'Sin balanceo. Si molesta el hombro, cambia a supinas.',
  },
  chinup: {
    duracion: 3, props: ['barra:11'], vista: BAR,
    base: { 'th-f': R(-4), 'sh-f': R(10), 'ft-f': R(-6), 'th-b': R(-4), 'sh-b': R(10), 'ft-b': R(-6) },
    keyframes: {
      root: ida(T(0, -1), T(0, -40)),
      'ua-f': ida(R(178), R(8)), 'ua-b': ida(R(178), R(8)),
      'fa-f': ida(R(0), R(181)), 'fa-b': ida(R(0), R(181)),
    },
    frase: 'Palmas hacia ti y codos hacia las costillas.',
  },
  /* Arriba (con salto o silla) y bajada lenta de 3-5 s */
  negative: {
    duracion: 5, props: ['barra:11'], vista: BAR,
    base: { 'th-f': R(-4), 'sh-f': R(10), 'ft-f': R(-6), 'th-b': R(-4), 'sh-b': R(10), 'ft-b': R(-6) },
    keyframes: {
      root: kf([0, T(0, -40)], [12, T(0, -40)], [72, T(0, -1)], [82, T(0, -1)], [100, T(0, -40)]),
      'ua-f': kf([0, R(20)], [12, R(20)], [72, R(178)], [82, R(178)], [100, R(20)]),
      'ua-b': kf([0, R(20)], [12, R(20)], [72, R(178)], [82, R(178)], [100, R(20)]),
      'fa-f': kf([0, R(182)], [12, R(182)], [72, R(0)], [82, R(0)], [100, R(182)]),
      'fa-b': kf([0, R(182)], [12, R(182)], [72, R(0)], [82, R(0)], [100, R(182)]),
    },
    frase: 'Baja lento, en 3 a 5 segundos. Para si duele abajo.',
  },
  /* Rodilla y mano en el banco: el codo va hacia la cadera */
  row1: {
    duracion: 2.6, props: REMO_PROPS, mano: { f: 'db' }, base: REMO_BASE,
    keyframes: { 'ua-f': ida(R(-78), R(-3)), 'fa-f': ida(R(0), R(-75)) },
    frase: 'Codo hacia la cadera, no hacia la oreja.',
  },
  /* Torso inclinado: los brazos se abren hacia los lados (se ven acortados) */
  rear_fly: {
    duracion: 2.8, props: ['suelo:134'], mano: { f: 'dbp', b: 'dbp' },
    base: { root: T(0, 1.6), tor: R(70), hd: R(-20), 'th-f': R(-15), 'sh-f': R(30), 'ft-f': R(-15), 'th-b': R(-15), 'sh-b': R(30), 'ft-b': R(-15), 'fa-f': R(-12), 'fa-b': R(-12) },
    keyframes: { 'ua-f': ida('rotate(-70deg) scaleY(1)', 'rotate(-58deg) scaleY(.45)'), 'ua-b': ida('rotate(-70deg) scaleY(1)', 'rotate(-58deg) scaleY(.45)') },
    frase: 'Liviano y juntando las escápulas.',
  },
  curl: {
    duracion: 2.6, props: ['suelo:134'], mano: { f: 'dbp', b: 'dbp' },
    base: { 'ua-f': R(-4), 'ua-b': R(-4) },
    keyframes: { 'fa-f': ida(R(0), R(-140)), 'fa-b': ida(R(0), R(-140)) },
    frase: 'Codos quietos a los costados.',
  },
  hammer: {
    duracion: 2.6, props: ['suelo:134'], mano: { f: 'db', b: 'db' },
    base: { 'ua-f': R(-4), 'ua-b': R(-4) },
    keyframes: { 'fa-f': ida(R(0), R(-140)), 'fa-b': ida(R(0), R(-140)) },
    frase: 'Agarre neutro, como un martillo, sin balanceo.',
  },

  /* ---------------- Empuje (Empuje) ---------------- */
  /* De espalda en el suelo, rodillas dobladas: el codo toca suave el suelo y sube */
  floor_press: {
    duracion: 2.8, props: ['suelo:122'], mano: { f: 'db', b: 'db' }, vista: '0 55 160 80',
    base: { root: `${T(10, 30)} ${R(-90)}`, 'th-f': R(-45), 'sh-f': R(135), 'th-b': R(-45), 'sh-b': R(135) },
    keyframes: { 'ua-f': ida(R(24), R(-90)), 'ua-b': ida(R(24), R(-90)), 'fa-f': ida(R(-114), R(0)), 'fa-b': ida(R(-114), R(0)) },
    frase: 'Codos a unos 45°: el suelo te protege el hombro.',
  },
  /* Manos bajo los hombros, cuerpo recto; los codos van hacia atrás */
  pushup: {
    duracion: 2.8, props: ['suelo:126'], vista: LYING,
    keyframes: {
      root: ida(`${T(-5.5, 18)} ${R(68)}`, `${T(-2.5, 29.3)} ${R(82)}`),
      'ua-f': ida(R(-68), R(-13.6)), 'ua-b': ida(R(-68), R(-13.6)),
      'fa-f': ida(R(0), R(-117.5)), 'fa-b': ida(R(0), R(-117.5)),
      'ft-f': ida(R(-15), R(-29)), 'ft-b': ida(R(-15), R(-29)),
    },
    frase: 'Cuerpo recto. Si molesta, hazlas inclinado con las manos en una mesa.',
  },
  /* Sentado con respaldo, palmas enfrentadas */
  neutral_press: {
    duracion: 2.8, props: ['suelo:134', 'silla'], mano: { f: 'db', b: 'db' },
    base: { root: T(-12, 24), 'th-f': R(-90), 'sh-f': R(90), 'th-b': R(-90), 'sh-b': R(90) },
    keyframes: { 'ua-f': ida(R(-35), R(-180)), 'ua-b': ida(R(-35), R(-180)), 'fa-f': ida(R(-145), R(0)), 'fa-b': ida(R(-145), R(0)) },
    frase: 'Solo si subir el brazo no duele. Palmas enfrentadas.',
  },
  /* Sube hasta la altura del hombro, un poco adelante (plano escapular) */
  lateral: {
    duracion: 2.8, props: ['suelo:134'], mano: { f: 'dbp', b: 'dbp' },
    base: { 'fa-f': R(-8), 'fa-b': R(-8) },
    keyframes: { 'ua-f': ida('rotate(-6deg) scaleY(1)', 'rotate(-90deg) scaleY(.5)'), 'ua-b': ida('rotate(-6deg) scaleY(1)', 'rotate(-90deg) scaleY(.5)') },
    frase: 'Hasta la altura del hombro, brazos un poco hacia adelante.',
  },
  /* Misma posición del remo: el brazo queda pegado al cuerpo y solo se estira el codo */
  kickback: {
    duracion: 2.6, props: REMO_PROPS, mano: { f: 'db' }, base: { ...REMO_BASE, 'ua-f': R(12) },
    keyframes: { 'fa-f': ida(R(-90), R(0)) },
    frase: 'El brazo no se mueve, solo el codo.',
  },

  /* ---------------- Piernas (Patas) ---------------- */
  goblet: {
    duracion: 2.8, props: ['suelo:134'], mano: { f: 'dbv' },
    base: { 'ua-f': R(-28), 'fa-f': R(-128), 'ua-b': R(-24), 'fa-b': R(-132) },
    keyframes: {
      root: ida(T(0, 0), T(-15.8, 25.4), [0, 10, 50, 60]), tor: ida(R(0), R(30), [0, 10, 50, 60]), hd: ida(R(0), R(-22), [0, 10, 50, 60]),
      'th-f': ida(R(0), R(-80), [0, 10, 50, 60]), 'th-b': ida(R(0), R(-80), [0, 10, 50, 60]),
      'sh-f': ida(R(0), R(100), [0, 10, 50, 60]), 'sh-b': ida(R(0), R(100), [0, 10, 50, 60]),
      'ft-f': ida(R(0), R(-20), [0, 10, 50, 60]), 'ft-b': ida(R(0), R(-20), [0, 10, 50, 60]),
    },
    frase: 'Talones apoyados y espalda recta.',
  },
  /* Cadera atrás con la espalda recta; las mancuernas bajan cerca de las piernas */
  rdl: {
    duracion: 3, props: ['suelo:134'], mano: { f: 'dbp', b: 'dbp' },
    keyframes: {
      /* rodillas apenas dobladas y fijas: casi todo el movimiento es de la cadera */
      root: ida(T(0, 0), T(-5.9, 2.1)), tor: ida(R(0), R(58)), hd: ida(R(0), R(-25)),
      'th-f': ida(R(-8), R(-25)), 'th-b': ida(R(-8), R(-25)), 'sh-f': ida(R(16), R(35)), 'sh-b': ida(R(16), R(35)),
      'ft-f': ida(R(-8), R(-10)), 'ft-b': ida(R(-8), R(-10)),
      'ua-f': ida(R(-5), R(-46)), 'ua-b': ida(R(-5), R(-46)),
    },
    frase: 'Cadera atrás y mancuernas cerca de las piernas.',
  },
  /* Zancada: baja recto, rodilla de adelante sobre el pie */
  lunge: {
    duracion: 2.8, props: ['suelo:126'], mano: { f: 'db', b: 'db' },
    keyframes: {
      root: ida(T(0, 0), T(0, 10)),
      'th-f': ida(R(-41.4), R(-75)), 'sh-f': ida(R(18.2), R(70)), 'ft-f': ida(R(23.2), R(5)),
      'th-b': ida(R(16.2), R(10)), 'sh-b': ida(R(47.6), R(80)),
    },
    frase: 'Rodilla alineada con el pie.',
  },
  /* De espalda: la cadera sube con la mancuerna encima */
  bridge: {
    duracion: 2.8, props: ['suelo:122'], mano: { f: 'dbp', b: 'dbp' }, vista: LYING,
    keyframes: {
      root: ida(`${T(10, 30)} ${R(-90)}`, `${T(7, 16.5)} ${R(-115)}`),
      'th-f': ida(R(-45), R(17.3)), 'th-b': ida(R(-45), R(17.3)),
      'sh-f': ida(R(135), R(106.8)), 'sh-b': ida(R(135), R(106.8)),
      'ft-f': ida(R(0), R(-9.1)), 'ft-b': ida(R(0), R(-9.1)),
    },
    frase: 'Aprieta arriba 1 segundo.',
  },
  calf: {
    duracion: 2.4, props: ['suelo:134'], mano: { f: 'dbp', b: 'dbp' },
    base: { 'ua-f': R(-4), 'fa-f': R(-6), 'ua-b': R(-4), 'fa-b': R(-6) },
    keyframes: { root: ida(T(0, 0), T(0, -6), [0, 10, 40, 55]), 'ft-f': ida(R(0), R(37), [0, 10, 40, 55]), 'ft-b': ida(R(0), R(37), [0, 10, 40, 55]) },
    frase: 'Pausa arriba y abajo.',
  },

  /* ---------------- Core (Núcleo) ---------------- */
  /* De espalda, brazos al techo y rodillas en 90/90: estira brazo y pierna contrarios */
  dead_bug: {
    duracion: 4.4, props: ['suelo:122'], vista: '0 40 160 95', final: 25,
    base: { root: `${T(10, 30)} ${R(-90)}` },
    keyframes: {
      'ua-f': kf([0, R(-90)], [20, R(-170)], [30, R(-170)], [50, R(-90)], [100, R(-90)]),
      'ua-b': kf([0, R(-90)], [50, R(-90)], [70, R(-170)], [80, R(-170)], [100, R(-90)]),
      'th-b': kf([0, R(-90)], [20, R(-10)], [30, R(-10)], [50, R(-90)], [100, R(-90)]),
      'sh-b': kf([0, R(90)], [20, R(0)], [30, R(0)], [50, R(90)], [100, R(90)]),
      'th-f': kf([0, R(-90)], [50, R(-90)], [70, R(-10)], [80, R(-10)], [100, R(-90)]),
      'sh-f': kf([0, R(90)], [50, R(90)], [70, R(0)], [80, R(0)], [100, R(90)]),
    },
    frase: 'Zona lumbar pegada al suelo todo el rato.',
  },
  /* Plancha sobre antebrazos, cuerpo recto, respirando */
  plank: {
    duracion: 3.2, props: ['suelo:122'], vista: '0 55 160 80',
    base: { 'ua-f': R(-75.5), 'ua-b': R(-75.5), 'fa-f': R(-90), 'fa-b': R(-90), 'ft-f': R(-22.5), 'ft-b': R(-22.5) },
    keyframes: { root: kf([0, `${T(0, 22)} ${R(75.5)}`], [50, `${T(0, 21.2)} ${R(75.5)}`], [100, `${T(0, 22)} ${R(75.5)}`]) },
    frase: 'Cuerpo recto. Si molesta el hombro, apoya las rodillas.',
  },
  /* Colgado: sube las rodillas hasta la cadera, sin balanceo */
  knee_raise: {
    duracion: 2.8, props: ['barra:11'],
    base: { root: T(0, -1), 'ua-f': R(178), 'ua-b': R(178) },
    keyframes: { 'th-f': ida(R(0), R(-90)), 'th-b': ida(R(0), R(-90)), 'sh-f': ida(R(0), R(90)), 'sh-b': ida(R(0), R(90)) },
    frase: 'Solo si colgarte no duele. Sube las rodillas sin balancearte.',
  },
};

/* Ejercicios propios sin animación: pose genérica de su grupo */
const GENERICA = { 'Rehab hombro': 'wall_slide', 'Tirón': 'row1', 'Empuje': 'floor_press', 'Piernas': 'goblet', 'Core': 'plank' };
