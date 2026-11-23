// ühr — the service worker: makes ühr installable and lets it open without a connection.
// network first (so a new version is always taken), the last copy from the cache when offline.
const CACHE='uhr-v11.21';
const SHELL=['./','index.html','app.js','app.css','ui.css','tokens.css','under.css','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r).then(res=>{if(res.ok&&!/\.(mp4|mov)$/i.test(new URL(r.url).pathname)){const c=res.clone();caches.open(CACHE).then(k=>k.put(r,c))}return res})
    .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))))});
