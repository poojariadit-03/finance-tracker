/* Service Worker for Quick Log PWA */
var CACHE_NAME = 'quick-log-v2';

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(['/finance-tracker/quick-log-sync.html']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  /* Delete ALL old caches */
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){
        console.log('Deleting old cache:', k);
        return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('quick-log-sync.html')){
    e.respondWith(
      /* Network first — always try to get latest, fallback to cache */
      fetch(e.request).then(function(response){
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(e.request, clone);
        });
        return response;
      }).catch(function(){
        return caches.match(e.request);
      })
    );
  }
});
