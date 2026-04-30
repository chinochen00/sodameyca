var CACHE='sodameyca-v1';
var ASSETS=['/','/index.html','/manifest.json'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS)}));
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
  }));
  self.clients.claim();
});

self.addEventListener('fetch',function(e){
  // Solo cachear recursos locales, pasar JSONBin directo a la red
  if(e.request.url.includes('jsonbin.io')){
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached||fetch(e.request).then(function(res){
        var clone=res.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,clone)});
        return res;
      });
    }).catch(function(){return caches.match('/index.html')})
  );
});
