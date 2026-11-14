/* Service worker de Turrón: la app funciona sin conexión (todo menos Gemini).
   tools/build.py reemplaza 8e9a0a631c con un hash del sitio, así cada publicación renueva la caché. */
var V = 'turron-8e9a0a631c';
var CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V && k.indexOf('turron-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function keep(req, res) {
  if (res && (res.ok || res.type === 'opaque')) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(req, cp); }); }
  return res;
}

self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url);
  // Las páginas de inicio de sesión de Firebase (/__/auth/...) nunca pasan por aquí.
  if (u.origin === location.origin && u.pathname.indexOf('/__/') === 0) return;
  // La página: primero la red (para recibir actualizaciones), si no hay conexión la copia guardada.
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(function (res) { return keep('./index.html', res); }).catch(function () {
      return caches.match('./index.html').then(function (hit) { return hit || caches.match('./'); });
    }));
    return;
  }
  // Archivos propios y fuentes: primero la caché.
  if (u.origin === location.origin || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com' ||
      (u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0)) {
    e.respondWith(caches.match(r).then(function (hit) { return hit || fetch(r).then(function (res) { return keep(r, res); }); }));
  }
  // Todo lo demás (Gemini, Firestore, inicio de sesión) va directo a la red y nunca se guarda.
});
