// Service Worker - Soda Mey Ca
// Versión: 2.0 - Offline completo + sync automático

var CACHE_NAME = 'sodameyca-v2';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ── INSTALL: cachear todos los assets ────────────────────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: limpiar caches viejos ──────────────────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── FETCH: offline-first para assets, network-first para JSONBin ─────────────
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // JSONBin: intentar red, si falla devolver error para que la app lo maneje
  if (url.includes('jsonbin.io')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response(JSON.stringify({offline: true}), {
          status: 503,
          headers: {'Content-Type': 'application/json'}
        });
      })
    );
    return;
  }

  // Assets locales: cache-first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return res;
      });
    }).catch(function() {
      return caches.match('./index.html');
    })
  );
});

// ── SYNC: cuando vuelve el internet, notificar a la app ──────────────────────
self.addEventListener('sync', function(e) {
  if (e.tag === 'sync-data') {
    e.waitUntil(
      self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({type: 'SYNC_NOW'});
        });
      })
    );
  }
});

// ── MESSAGE: recibir mensajes de la app ───────────────────────────────────────
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
