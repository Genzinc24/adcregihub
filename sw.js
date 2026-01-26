const CACHE = 'regihub-cache-v2';
const CORE = [
  'index.html',
  'styles.css',
  'app.js',
  'indexeddb.js',
  'manifest.webmanifest',
  'favicon.ico',
  'assets/logo.png',
  'assets/icon-192.png',
  'assets/icon-512.png'
];
self.addEventListener('install', (e)=>{
  e.waitUntil(
    caches.open(CACHE).then((c)=> c.addAll(CORE)).then(()=> self.skipWaiting())
  );
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=> Promise.all(keys.filter(k=>k!==CACHE).map(k=> caches.delete(k))))
  );
});
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET') return;
  if(url.origin === location.origin){
    e.respondWith(
      caches.match(e.request).then(res=> res || fetch(e.request).then(resp=>{
        const clone = resp.clone();
        caches.open(CACHE).then(c=> c.put(e.request, clone));
        return resp;
      }).catch(()=> caches.match('index.html')))
    );
  }
});
