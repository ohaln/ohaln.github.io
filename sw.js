const CACHE = 'alshflow-v2';
const CORE = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const stocker = (req, res) => {
  if (res && (res.ok || res.type === 'opaque')) {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const memeOrigine = new URL(req.url).origin === self.location.origin;
  if (memeOrigine) {
    // Le code de l'app : réseau d'abord (toujours la dernière version), cache si hors ligne
    e.respondWith(
      fetch(req).then(res => stocker(req, res))
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  } else {
    // Bibliothèques CDN (Alpine, Tailwind, polices…) : cache d'abord
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => stocker(req, res))));
  }
});
