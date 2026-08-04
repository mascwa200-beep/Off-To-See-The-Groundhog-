/*
 * Service worker for T-Rex Runner.
 *
 * The game is one self-contained HTML file, so "working offline" only needs
 * that file (plus the manifest) kept in the cache. Nothing is fetched at
 * runtime - no fonts, no images, no analytics - so there is nothing else to
 * worry about.
 *
 * Bump CACHE when index.html changes, otherwise installed copies keep serving
 * the version they already have.
 */

var CACHE = 'trex-runner-v1';

var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE ? null : caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  // Cache first: the whole point is that a dead connection changes nothing.
  // A background fetch refreshes the copy for next time when there is a network.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var network = fetch(event.request).then(function (response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function () {
        // Offline and not cached - let the browser show its own error.
        return cached;
      });

      return cached || network;
    })
  );
});
