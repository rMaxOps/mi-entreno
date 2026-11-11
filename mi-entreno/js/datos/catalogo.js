/* Datos base: ejercicios, guía, calentamiento, plantillas, fases y reglas del hombro. */
/* ---------- Datos base ---------- */
export const GROUPS = ['Rehab hombro', 'Tirón', 'Empuje', 'Piernas', 'Core'];
export const TYPES = { wr: 'Peso + reps', bw: 'Peso corporal (lastre opcional)', r: 'Solo reps', t: 'Tiempo (segundos)' };

export const BASE_EX = [
  ['rot_ext','Rotación externa con mancuerna','Rehab hombro','wr','ok','12-15','Acostado de lado, codo pegado al cuerpo con una toalla doblada. Peso muy liviano, 2-3 s por rep.'],
  ['scap_pull','Retracciones escapulares en barra','Rehab hombro','r','ok','8-12','Colgado con brazos estirados, baja y junta las escápulas sin doblar los codos. Pausa 1 s. Puedes apoyar los pies.'],
  ['ytw','Y-T-W boca abajo','Rehab hombro','r','ok','8-10','Sin peso o con 1 kg. Pulgares hacia arriba, lento. Cada letra cuenta como 1 rep.'],
  ['wall_slide','Deslizamientos en pared','Rehab hombro','r','ok','10-12','Antebrazos contra la pared, sube solo hasta donde no haya dolor.'],
  ['dead_hang','Colgado en barra','Rehab hombro','t','care','15-40','Empieza con los pies apoyados para descargar peso. Hombros activos, no colgado flojo.'],
  ['pullup','Dominadas pronas','Tirón','bw','care','3-8','Agarre al ancho de hombros. Si molesta, cambia a supinas. Sin balanceo.'],
  ['chinup','Dominadas supinas','Tirón','bw','care','3-8','Palmas hacia ti; suele ser más amable con el hombro.'],
  ['negative','Dominadas negativas','Tirón','bw','care','3-6','Sube con un salto o una silla y baja en 3-5 s. Detente si duele en la parte baja.'],
  ['row1','Remo a una mano','Tirón','wr','ok','8-12','Apoyo en banco o silla, lleva el codo hacia la cadera. Reps por brazo.'],
  ['rear_fly','Pájaros (aperturas inversas)','Tirón','wr','ok','12-15','Torso inclinado, peso liviano, junta las escápulas.'],
  ['curl','Curl de bíceps','Tirón','wr','ok','8-12','Codos quietos a los costados.'],
  ['hammer','Curl martillo','Tirón','wr','ok','8-12','Agarre neutro, sin balanceo.'],
  ['floor_press','Press de pecho en el suelo','Empuje','wr','ok','8-12','El suelo limita el recorrido y protege el hombro. Codos a unos 45°.'],
  ['pushup','Flexiones','Empuje','bw','care','5-15','Si molesta, hazlas inclinado con las manos en una mesa. Codos a 45°.'],
  ['neutral_press','Press de hombro agarre neutro','Empuje','wr','care','8-12','Sentado, palmas enfrentadas. Solo si levantar el brazo sobre la cabeza no duele.'],
  ['lateral','Elevaciones laterales','Empuje','wr','care','12-15','Hasta la altura del hombro, brazos un poco hacia adelante (plano escapular).'],
  ['kickback','Patada de tríceps','Empuje','wr','ok','10-15','Brazo pegado al cuerpo, mueve solo el codo.'],
  ['goblet','Sentadilla goblet','Piernas','wr','ok','8-12','Mancuerna pegada al pecho, espalda recta.'],
  ['rdl','Peso muerto rumano','Piernas','wr','ok','8-12','Cadera atrás, mancuernas cerca de las piernas, espalda neutra.'],
  ['lunge','Zancadas','Piernas','wr','ok','8-12','Reps por pierna. Rodilla alineada con el pie.'],
  ['bridge','Puente de glúteo','Piernas','wr','ok','10-15','Mancuerna sobre la cadera, aprieta arriba 1 s.'],
  ['calf','Elevación de talones','Piernas','wr','ok','12-20','Pausa arriba y abajo.'],
  ['dead_bug','Dead bug','Core','r','ok','8-12','Zona lumbar pegada al suelo todo el tiempo.'],
  ['plank','Plancha','Core','t','ok','20-60','Sobre antebrazos. Si molesta el hombro, apoya las rodillas.'],
  ['knee_raise','Elevación de rodillas colgado','Core','bw','care','6-12','Requiere colgarse: solo si el colgado no duele.'],
].map(([id, name, group, type, shoulder, goal, tip]) => ({ id, name, group, type, shoulder, goal, tip }));

/* Guía "Cómo se hace": pasos, errores comunes, cuidado del hombro y un video verificado. */
export const YT = (id, title, channel) => ({ url: 'https://www.youtube.com/watch?v=' + id, title, channel });
export const GUIDE = {
  rot_ext: {
    steps: ['Acuéstate de lado sobre el brazo sano, con la cabeza apoyada en ese brazo o en un cojín.',
      'Pon una toalla doblada entre el codo de arriba y tus costillas. Dobla ese codo en 90°: el antebrazo queda cruzado sobre el abdomen, con la mancuerna en la mano.',
      'Sin despegar el codo de la toalla, gira el antebrazo hacia arriba, como una puerta que se abre. Sube solo hasta donde no duela.',
      'Baja lento, en 2-3 segundos. Termina las reps y cambia de lado.'],
    errors: ['Despegar el codo de la toalla.', 'Echar el cuerpo hacia atrás para ayudarte.', 'Usar mucho peso: con 1-2 kg (o sin peso) basta.'],
    shoulder: 'Es un ejercicio de rehabilitación: tiene que sentirse suave. Si duele, achica el recorrido o hazlo sin peso.',
    video: YT('Axu0GxqDxzM', 'Rotación externa completa de hombro en decúbito lateral', 'Cirugía de Hombro y Codo - Guido Fierro MD') },
  scap_pull: {
    steps: ['Cuélgate de la barra con las manos al ancho de los hombros y los brazos estirados. Si te cuesta, deja los pies apoyados en el suelo o en una silla para quitar peso.',
      'Sin doblar los codos, baja los hombros (aléjalos de las orejas) y junta las escápulas atrás. Tu cuerpo sube solo unos pocos centímetros.',
      'Mantén 1 segundo arriba.',
      'Vuelve lento a quedar colgado. Es un movimiento corto: solo se mueven los omóplatos.'],
    errors: ['Doblar los codos (eso ya es una dominada).', 'Encoger los hombros hacia las orejas.', 'Balancearte.'],
    shoulder: 'Si colgarte molesta, apoya más peso en los pies.',
    video: YT('QXZ5vZrjApY', 'Como hacer la retracción y depresión escapular en barra', 'Kranos Calistenia') },
  ytw: {
    steps: ['Acuéstate boca abajo en el suelo o en la cama, con la frente apoyada en una toalla.',
      'Y: estira los brazos hacia adelante en diagonal, formando una Y, con los pulgares hacia el techo. Levántalos unos centímetros, pausa 1 s y baja.',
      'T: abre los brazos hacia los lados, formando una T, con los pulgares arriba. Levanta, pausa y baja.',
      'W: dobla los codos y acércalos a las costillas, con las manos a la altura de los hombros (forma de W). Junta las escápulas levantando codos y manos.',
      'Cada letra cuenta como 1 rep. Todo lento.'],
    errors: ['Levantar la cabeza o arquear la espalda baja.', 'Hacerlo rápido o con impulso.', 'Encoger los hombros.'],
    shoulder: 'Sin peso o con 1 kg. Si una letra molesta, súbela menos o sáltatela.',
    video: YT('zCQrWhfGppk', 'Ejercicio YTW: estabilidad escapular', 'Glory Sport Physio') },
  wall_slide: {
    steps: ['Párate de frente a la pared, a un paso de distancia.',
      'Apoya los antebrazos en la pared, paralelos, con los codos a la altura de los hombros.',
      'Desliza los antebrazos hacia arriba por la pared, abriéndolos un poco en forma de V, sin despegarlos.',
      'Sube solo hasta donde no duela y vuelve lento a la posición inicial.'],
    errors: ['Encoger los hombros hacia las orejas.', 'Arquear la espalda baja.', 'Forzar el rango para llegar más arriba.'],
    shoulder: 'Usa una toalla bajo los antebrazos si se traban. El rango irá mejorando con las semanas.',
    video: YT('Cw-cgyYtz1k', 'Wall slides (español)', 'FlofitnessPR') },
  dead_hang: {
    steps: ['Ponte bajo la barra. Si está baja o usas una silla, deja los pies apoyados.',
      'Toma la barra con las palmas hacia adelante, al ancho de los hombros.',
      'Doblando las rodillas, deja caer parte de tu peso. Al principio, los pies siguen apoyados para descargar.',
      'Hombros activos: un poco alejados de las orejas, sin quedar colgando flojo. Respira tranquilo.',
      'Aguanta el tiempo meta y bájate con control.'],
    errors: ['Colgar flojo, con los hombros pegados a las orejas.', 'Soltarte de golpe.', 'Quitar el apoyo de los pies antes de tiempo.'],
    shoulder: 'Si duele en la parte alta del hombro, carga más peso en los pies o detente.',
    video: YT('WUY-S2jaghc', '"Active" dead hang: técnica en barra (en inglés)', 'TheLeanBerets') },
  pullup: {
    steps: ['Toma la barra con las palmas hacia adelante, con las manos al ancho de los hombros.',
      'Parte colgado con los brazos estirados y los hombros activos (escápulas abajo).',
      'Sube llevando el pecho hacia la barra y los codos hacia las costillas, hasta que la barbilla pase la barra.',
      'Baja lento, en 2-3 s, hasta estirar los brazos.'],
    errors: ['Balancearte o patear para subir.', 'Hacer medias repeticiones.', 'Encoger los hombros.'],
    shoulder: 'Si molesta, cambia a dominadas supinas (palmas hacia ti), que suelen ser más amables con el hombro.',
    video: YT('pT9ZCIeJhEM', 'Cómo hacer dominadas pronadas (pull ups)', 'Your House Fitness') },
  chinup: {
    steps: ['Toma la barra con las palmas hacia ti y las manos al ancho de los hombros.',
      'Parte colgado con los brazos estirados y los hombros activos.',
      'Sube llevando los codos hacia las costillas hasta que la barbilla pase la barra.',
      'Baja lento, en 2-3 s, hasta estirar los brazos.'],
    errors: ['Balancearte.', 'Quedarte a medio camino al bajar.', 'Estirar el cuello para "pasar" la barbilla.'],
    shoulder: 'Si aún no salen completas o molestan, vuelve a las negativas.',
    video: YT('rfMaANCbzx8', 'Cómo hacer dominadas supinas correctamente', 'Your House Fitness') },
  negative: {
    steps: ['Pon una silla firme bajo la barra.',
      'Súbete o salta hasta quedar con la barbilla sobre la barra, tomándola con las palmas hacia ti.',
      'Saca los pies de la silla y baja lo más lento que puedas, en 3-5 s, hasta estirar los brazos.',
      'Vuelve a subir con ayuda de la silla (no tirando) y repite.'],
    errors: ['Dejarte caer rápido.', 'Soltarte de golpe al final.', 'Subir tirando en vez de con la silla.'],
    shoulder: 'Detente si duele en la parte baja, cuando los brazos están casi estirados.',
    video: YT('lRd0fo8IIeQ', 'Dominada negativa con salto', 'Kranos Calistenia') },
  row1: {
    steps: ['Apoya en una silla o banco la rodilla y la mano del mismo lado. La otra pierna queda en el suelo y la espalda recta, casi paralela al suelo.',
      'Toma la mancuerna con la otra mano, con el brazo estirado hacia el suelo.',
      'Tira llevando el codo hacia la cadera (no hacia el hombro), pegado al cuerpo.',
      'Aprieta la escápula 1 s arriba y baja lento. Termina las reps y cambia de brazo.'],
    errors: ['Girar el torso para subir el peso.', 'Llevar el codo hacia la oreja.', 'Encorvar la espalda.'],
    shoulder: 'Es amigable con el hombro. Si molesta, achica el recorrido arriba.',
    video: YT('ryhxLQUn-cQ', 'Remo con mancuerna a una mano: técnica paso a paso', 'BuhoSalud') },
  rear_fly: {
    steps: ['De pie o sentado en el borde de una silla, inclina el torso hacia adelante (casi paralelo al suelo), con la espalda recta.',
      'Deja las mancuernas colgando bajo el pecho, con las palmas enfrentadas y los codos un poco doblados.',
      'Abre los brazos hacia los lados como alas, hasta la altura de los hombros, juntando las escápulas.',
      'Baja lento.'],
    errors: ['Usar impulso.', 'Subir los hombros hacia las orejas.', 'Usar demasiado peso: aquí se trabaja liviano.'],
    video: YT('ZoUr3z-3EjM', 'Aperturas inversas con mancuernas: cómo hacerlas correctamente', 'Bienestar Integral Tv') },
  curl: {
    steps: ['De pie, con las mancuernas a los lados y las palmas hacia adelante.',
      'Mantén los codos pegados a los costados.',
      'Sube doblando solo los codos, hasta que las mancuernas lleguen cerca de los hombros.',
      'Baja lento hasta estirar los brazos.'],
    errors: ['Balancear el cuerpo.', 'Adelantar los codos.', 'Bajar sin control.'],
    video: YT('rqy0oxx__sU', 'Curl de bíceps con mancuernas de pie', 'Fitness real con el coach Emmanuel Navarro') },
  hammer: {
    steps: ['De pie, con las mancuernas a los lados y las palmas mirando hacia tu cuerpo, como si tomaras un martillo.',
      'Mantén los codos pegados a los costados.',
      'Sube doblando los codos sin girar las muñecas.',
      'Baja lento.'],
    errors: ['Balancear el cuerpo.', 'Girar las muñecas.', 'Separar los codos del cuerpo.'],
    video: YT('RHdacbwKbTo', 'Cómo hacer curl martillo con mancuerna', 'Your House Fitness') },
  floor_press: {
    steps: ['Acuéstate de espalda en el suelo, con las rodillas dobladas y los pies apoyados.',
      'Sube las mancuernas sobre el pecho con los brazos estirados.',
      'Baja doblando los codos, separados del cuerpo unos 45° (no abiertos en cruz), hasta que el brazo toque suave el suelo.',
      'Haz una pausa breve y empuja hacia arriba.'],
    errors: ['Abrir los codos en forma de T.', 'Rebotar los codos contra el suelo.', 'Arquear mucho la espalda.'],
    shoulder: 'Si molesta, usa agarre neutro (palmas enfrentadas). El suelo ya limita el recorrido para proteger el hombro.',
    video: YT('z-bMvgs5oEE', 'Press de pecho en el suelo (floor press)', 'Harbiz') },
  pushup: {
    steps: ['Apoya las manos un poco más anchas que los hombros, con el cuerpo recto de la cabeza a los talones (aprieta glúteos y abdomen).',
      'Baja el pecho hacia el suelo con los codos a unos 45° del cuerpo.',
      'Empuja hasta estirar los brazos.',
      'Versión más fácil: inclinada, con las manos en una mesa o en la pared, o con las rodillas apoyadas.'],
    errors: ['Dejar caer la cadera.', 'Abrir los codos en T.', 'Adelantar la cabeza.'],
    shoulder: 'Si molesta, hazlas inclinado. Mientras más alta la superficie, más fácil.',
    video: YT('e_EKkqoHxns', 'Cómo hacer flexiones de brazos para principiantes, paso a paso', 'Patricio Almirón') },
  neutral_press: {
    steps: ['Siéntate con la espalda apoyada en un respaldo.',
      'Pon las mancuernas a la altura de los hombros, con las palmas enfrentadas y los codos hacia adelante.',
      'Empuja hacia arriba, sin trabar los codos, hasta donde no duela.',
      'Baja lento.'],
    errors: ['Arquear la espalda baja.', 'Bajar de golpe.', 'Usar impulso.'],
    shoulder: 'Solo si levantar el brazo sobre la cabeza no duele, y cuando el dolor lleve 2 semanas en 0-1.',
    video: YT('ODHi3sjRd-A', 'Press sentado con mancuernas, con agarre neutro', 'Rodrigo Bermejo Trainer') },
  lateral: {
    steps: ['De pie, con las mancuernas a los lados y los codos un poco doblados.',
      'Sube los brazos hacia los lados y un poco hacia adelante (unos 30°, el "plano escapular").',
      'Para a la altura de los hombros, no más arriba.',
      'Baja lento, en 2-3 s.'],
    errors: ['Subir sobre la altura de los hombros.', 'Encoger los hombros o balancearte.', 'Girar los pulgares hacia abajo, como "vaciando una botella": irrita el hombro.'],
    shoulder: 'Peso liviano. Si molesta, sube menos.',
    video: YT('Q5m5SRZoWgw', 'Elevación de hombros en el plano de la escápula', 'Proet Ejercicio Terapéutico') },
  kickback: {
    steps: ['Ponte en la misma posición del remo: rodilla y mano apoyadas en una silla, espalda recta.',
      'Sube el codo hasta que el brazo quede pegado al costado, paralelo al suelo, con el antebrazo colgando.',
      'Estira el codo llevando la mancuerna hacia atrás, hasta que todo el brazo quede recto.',
      'Vuelve lento. El brazo, del hombro al codo, no se mueve.'],
    errors: ['Mover el codo hacia arriba y abajo.', 'Balancear la mancuerna.', 'Encorvar la espalda.'],
    video: YT('KBX9Sf0P_eo', 'Patada de tríceps con mancuerna apoyado en banco', 'ReevolveFit') },
  goblet: {
    steps: ['Toma una mancuerna en vertical con ambas manos por un extremo y pégala al pecho.',
      'Pies al ancho de los hombros o un poco más, con las puntas algo hacia afuera.',
      'Baja como si te sentaras en una silla: cadera atrás y abajo, rodillas en la dirección de los pies, pecho arriba.',
      'Baja hasta donde mantengas la espalda recta y sube empujando el suelo con todo el pie.'],
    errors: ['Levantar los talones.', 'Juntar las rodillas hacia adentro.', 'Redondear la espalda.'],
    video: YT('5HHITKuLxUs', 'Cómo hacer sentadilla goblet con mancuerna', 'Your House Fitness') },
  rdl: {
    steps: ['De pie, con los pies al ancho de las caderas y las mancuernas delante de los muslos.',
      'Dobla un poco las rodillas y déjalas fijas.',
      'Lleva la cadera hacia atrás, como si cerraras una puerta con el trasero. El torso se inclina con la espalda recta y las mancuernas bajan pegadas a las piernas.',
      'Baja hasta media canilla o hasta sentir que se estira la parte de atrás del muslo. Sube empujando la cadera hacia adelante y apretando glúteos.'],
    errors: ['Redondear la espalda.', 'Doblar mucho las rodillas (se vuelve sentadilla).', 'Alejar las mancuernas de las piernas.'],
    video: YT('9j_L1KgpK8Y', 'Cómo hacer un peso muerto rumano con mancuernas', 'Your House Fitness') },
  lunge: {
    steps: ['De pie, con una mancuerna en cada mano a los lados.',
      'Da un paso largo hacia adelante (o hacia atrás, que es más fácil para la rodilla).',
      'Baja hasta que ambas rodillas queden cerca de 90°, con la de atrás casi tocando el suelo.',
      'Empuja con el pie de adelante para volver. Termina las reps de una pierna y cambia.'],
    errors: ['Dejar que la rodilla se vaya hacia adentro.', 'Inclinar mucho el torso.', 'Dar un paso muy corto.'],
    video: YT('y8zPm7gJR_E', 'Zancadas con mancuernas', 'Proet Ejercicio Terapéutico') },
  bridge: {
    steps: ['Acuéstate de espalda, con las rodillas dobladas y los pies apoyados cerca de los glúteos.',
      'Pon la mancuerna sobre la cadera, sujeta con las manos (usa una toalla si molesta).',
      'Empuja con los talones y sube la cadera hasta que hombros, cadera y rodillas formen una línea.',
      'Aprieta los glúteos 1 s arriba y baja lento.'],
    errors: ['Arquear la espalda baja en vez de usar los glúteos.', 'Empujar con la punta de los pies.', 'Bajar de golpe.'],
    video: YT('pbqYDNHBWj4', 'Puente de glúteos con mancuerna', 'Emiliano Salas Porta') },
  calf: {
    steps: ['Ponte de pie con la punta de los pies en el borde de un escalón y los talones en el aire. Apóyate en la pared con una mano y toma la mancuerna con la otra.',
      'Sube en puntas lo más alto que puedas y haz una pausa de 1 s.',
      'Baja lento, hasta que los talones queden bajo el nivel del escalón, y haz otra pausa de 1 s.',
      'Sin escalón también sirve: hazlo en el suelo.'],
    errors: ['Rebotar abajo.', 'Hacerlo rápido.', 'Doblar las rodillas para ayudarte.'],
    video: YT('OKFDQOQAk6w', 'Elevaciones de talón en escalón', 'Francisco Cuevas Nutriologo') },
  dead_bug: {
    steps: ['Acuéstate de espalda, con los brazos estirados hacia el techo y las piernas arriba, rodillas dobladas en 90° (como una mesa).',
      'Pega la zona lumbar al suelo apretando el abdomen.',
      'Baja lento un brazo hacia atrás de la cabeza y, a la vez, la pierna contraria hacia el suelo, sin que la espalda se despegue.',
      'Vuelve y alterna de lado. Cada lado cuenta como 1 rep.'],
    errors: ['Despegar la zona lumbar del suelo.', 'Hacerlo rápido.', 'Aguantar la respiración.'],
    shoulder: 'Si llevar el brazo hacia atrás molesta, deja los brazos quietos y mueve solo las piernas.',
    video: YT('SPTBzZdINlg', 'Dead bug (abdominales)', 'Carlos Ruiz') },
  plank: {
    steps: ['Apoya los antebrazos en el suelo, con los codos bajo los hombros.',
      'Estira las piernas y apóyate en la punta de los pies.',
      'Mantén el cuerpo recto de la cabeza a los talones, apretando abdomen y glúteos.',
      'Respira normal y aguanta el tiempo meta.'],
    errors: ['Dejar caer la cadera.', 'Levantar mucho el trasero.', 'Aguantar la respiración.'],
    shoulder: 'Si molesta el hombro, apoya las rodillas.',
    video: YT('QU45oICbzPM', 'Cómo hacer plancha sobre antebrazos', 'Estudio Training') },
  knee_raise: {
    steps: ['Cuélgate de la barra con los hombros activos (no colgado flojo).',
      'Sube las rodillas hacia el pecho, enrollando un poco la pelvis.',
      'Baja lento, sin balancearte.'],
    errors: ['Balancearte o usar impulso.', 'Colgar flojo de los hombros.', 'Bajar las piernas de golpe.'],
    shoulder: 'Solo si colgarte no duele. Si duele, cámbialo por dead bug.',
    video: YT('b6ISbdie4u4', 'Elevación de rodillas colgado', 'Arzur PT') },
};

export const WARMUP = [
  '5 min de movilidad general (caminar, saltos suaves)',
  'Círculos de brazos, de pequeños a grandes',
  'Rotación externa liviana 1×15 por lado',
  'Retracciones escapulares 1×10',
  'Deslizamientos en pared 1×10',
  'Primera serie de cada ejercicio con poco peso',
];

export const I = (ex, sets, goal, rest, note = '') => ({ ex, sets, goal, rest, note });
export const BASE_TPL = [
  { id: 'rehab', name: 'Rehab de hombro', desc: 'Suave; para días con molestia, o 10 min antes de cualquier sesión.', items: [
    I('rot_ext', 2, '12-15', 45), I('scap_pull', 2, '8-12', 45), I('ytw', 2, '8-10', 45), I('wall_slide', 2, '10-12', 45),
    I('dead_hang', 2, '15-30', 60, 'Con los pies apoyados.') ] },
  { id: 'full', name: 'Cuerpo completo', desc: 'La base para volver; 2-3 veces por semana.', items: [
    I('goblet', 3, '8-12', 90), I('row1', 3, '8-12', 90, 'Reps por brazo.'), I('floor_press', 3, '8-12', 90),
    I('negative', 3, '3-6', 120), I('rdl', 3, '8-12', 90), I('plank', 3, '20-40', 60) ] },
  { id: 'a', name: 'A · Tirón', desc: 'Espalda y bíceps.', items: [
    I('scap_pull', 2, '8-12', 60), I('chinup', 3, '3-8', 120, '3-4 series. Si aún no salen completas, cámbialas por negativas.'),
    I('row1', 3, '8-12', 90, 'Reps por brazo.'), I('rear_fly', 3, '12-15', 60), I('hammer', 3, '8-12', 60) ] },
  { id: 'b', name: 'B · Empuje', desc: 'Con cuidado.', extra: 'Press de hombro neutro: solo agrégalo cuando el dolor esté en 0-1 por 2 semanas.', items: [
    I('floor_press', 3, '8-12', 90), I('pushup', 3, '5-15', 90, 'Inclinadas (manos en una mesa) si molesta.'),
    I('lateral', 2, '12-15', 60, '2-3 series.'), I('kickback', 3, '10-15', 60), I('rot_ext', 2, '12-15', 45) ] },
  { id: 'c', name: 'C · Piernas y core', desc: 'Sin carga sobre el hombro.', items: [
    I('goblet', 3, '8-12', 90), I('rdl', 3, '8-12', 90), I('lunge', 3, '8-12', 90, 'Reps por pierna.'),
    I('bridge', 3, '10-15', 60), I('dead_bug', 3, '8-12', 45), I('plank', 3, '20-60', 60) ] },
  { id: 'libre', name: 'Libre', desc: 'Empieza vacía y agregas lo que quieras.', items: [] },
];

export const PHASES = {
  1: { name: 'Retomar', weeks: 'Semanas 1-2', bullets: [
    '3 días por semana: Cuerpo completo (2 series por ejercicio, en vez de 3) + Rehab.',
    'Pesos livianos, sin llegar al fallo (deja 3 reps en reserva).',
    'Dominadas: solo retracciones escapulares y colgado con pies apoyados.' ] },
  2: { name: 'Construir base', weeks: 'Semanas 3-5', bullets: [
    '3 días: Cuerpo completo con 3 series.',
    'Agrega dominadas negativas si el colgado no duele.',
    'Rehab 2-3 veces por semana al inicio de la sesión.' ] },
  3: { name: 'Dividir', weeks: 'Semanas 6+', bullets: [
    '4 días: A Tirón, C Piernas, B Empuje, C Piernas (o A/B/C + Cuerpo completo).',
    'Prueba dominadas supinas completas.',
    'Mantén rotación externa y retracciones como calentamiento fijo.' ] },
};

export const RULES = [
  ['g', '0-2/10 durante el ejercicio: aceptable, sigue.'],
  ['y', '3-4/10: baja el peso, acorta el rango o cambia a una variante más suave.'],
  ['r', '5+/10: detén ese ejercicio por hoy.'],
  ['', 'Si al día siguiente el dolor está peor que antes de entrenar, la próxima vez reduce la carga.'],
  ['', 'Sube de peso solo cuando completes el rango de reps sin dolor.'],
  ['r', 'Dolor punzante, chasquidos con dolor, hormigueo o pérdida de fuerza: para y consulta a tu kinesiólogo o médico.'],
];
export const ENERGY = ['😴', '😕', '😐', '🙂', '⚡'];
export const ENERGY_TXT = ['Muy baja', 'Baja', 'Normal', 'Buena', 'Muy buena'];

