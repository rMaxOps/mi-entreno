/* Service worker de Mi Entreno: guarda la app para que funcione sin internet.
   Al cambiar archivos de la app, sube el número de CACHE para que el celular baje la versión nueva. */
const CACHE = 'mi-entreno-v9';
const ASSETS = [
  './',
  './index.html',
  './js/animaciones.js',
  './i18n/es.json',
  './js/datos/catalogo.js',
  './js/dialogos.js',
  './js/estado.js',
  './js/i18n.js',
  './js/logica/ejercicios.js',
  './js/logica/fases.js',
  './js/logica/progresion.js',
  './js/logica/respaldo.js',
  './js/config.js',
  './js/main.js',
  './js/nube/cliente.js',
  './js/nube/cuenta.js',
  './js/nube/sync.js',
  './js/personajes.js',
  './js/registro.js',
  './js/rutina.js',
  './js/ui/acciones.js',
  './js/ui/componentes.js',
  './js/ui/graficos.js',
  './js/ui/modales.js',
  './js/ui/personajes-app.js',
  './js/ui/pwa.js',
  './js/ui/render.js',
  './js/ui/temporizador.js',
  './js/ui/toast.js',
  './js/util.js',
  './js/vistas/entreno.js',
  './js/vistas/historial.js',
  './js/vistas/inicio.js',
  './js/vistas/mas.js',
  './js/vistas/progreso.js',
  './js/vistas/terminar.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Responde rápido desde la caché y, en paralelo, busca la versión nueva en internet. */
/* Fuentes de Google y supabase-js (versión fija en el CDN): se guardan para usarse sin internet */
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* Fuentes de Google: se guardan la primera vez y después se usan sin internet */
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true }) ||
        (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
      const fresh = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
