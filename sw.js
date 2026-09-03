// Increment VERSION whenever any application asset changes. Do not skip waiting:
// every open client keeps a consistent release until all old tabs are closed.
const VERSION = '1.0.3';
const BASE = new URL(self.registration.scope);
const PREFIX = `color-screen:${encodeURIComponent(BASE.href)}:`;
const CACHE = `${PREFIX}${VERSION}`;
const ASSETS = ['./', './index.html', './styles.css', './app.js', './color.js', './display.js', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
const urls = ASSETS.map(path => new URL(path, BASE).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(urls.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const canonical = new URL(url.pathname, BASE.origin).href;
  if (!urls.includes(canonical)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(canonical);
    return cached || fetch(request);
  })());
});
