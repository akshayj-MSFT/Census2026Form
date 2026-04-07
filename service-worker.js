// -------------------------------
// Critical Northwest Census PWA
// Service Worker
// -------------------------------

const CACHE_NAME = "cnw-census-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/db.js",
  "/sync.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install — cache core assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — serve cached assets offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          // Offline fallback for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        })
      );
    })
  );
});

// Background Sync — trigger queued submission upload
self.addEventListener("sync", event => {
  if (event.tag === "sync-submissions") {
    event.waitUntil(sendQueuedSubmissions());
  }
});

// Helper: call sync function inside sync.js
async function sendQueuedSubmissions() {
  if (self.registration && self.registration.active) {
    try {
      const clientList = await self.clients.matchAll();
      for (const client of clientList) {
        client.postMessage({ action: "sync" });
      }
    } catch (err) {
      console.error("Background sync failed:", err);
    }
  }
}
