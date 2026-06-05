/* Service Worker for Quick Log PWA */
var CACHE_NAME = 'quick-log-v1';
var URLS_TO_CACHE = [
  '/finance-tracker/quick-log-sync.html',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(['/finance-tracker/quick-log-sync.html']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  /* Only cache GET requests for our HTML file */
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('quick-log-sync.html')){
    e.respondWith(
      caches.open(CACHE_NAME).then(function(cache){
        return fetch(e.request).then(function(response){
          cache.put(e.request, response.clone());
          return response;
        }).catch(function(){
          return cache.match(e.request);
        });
      })
    );
  }
});
