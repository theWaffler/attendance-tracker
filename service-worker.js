// Basic service worker for offline caching
const CACHE_NAME = "attendance-risk-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./js/main.js",
  "./js/state.js",
  "./js/storage.js",
  "./js/policy.js",
  "./js/holidays.js",
  "./js/warningMeter.js",
  "./js/timeline.js",
  "./data/holidays.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then(
      cached =>
        cached ||
        fetch(request).catch(() => {
          // Offline fallback for HTML
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match("./index.html");
          }
        })
    )
  );
});

