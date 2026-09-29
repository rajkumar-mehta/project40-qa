const CACHE='mikas-40-exits-v250-qa';
const ASSETS=[
  './','./index.html','./styles.css?v=250','./app.js?v=250','./manifest.webmanifest',
  './icon-192.png','./icon-512.png','./home-header-autumn.png','./fall-leaves-tile.png',
  './welcome-mika-fall.png','./welcome-title-autumn.png','./welcome-rules-autumn.png','./welcome-honk-only.png',
  './welcome-mika-new.jpg','./car-horn.mp3','./photos/Raj-13.jpg','./photos/Raj-14.jpg'
];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  // Trusted-time probe must be network-only. Never satisfy it from Service Worker cache.
  if(url.origin===self.location.origin && url.searchParams.has('__route4t_time')){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }
  if(url.origin===self.location.origin &&
    (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/app.js') || url.pathname.endsWith('/styles.css'))){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,copy)); return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached || fetch(event.request).then(response=>{
    const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,copy)); return response;
  })));
});
