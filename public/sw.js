// Minimal service worker so the app is installable (e.g. Chrome "Install" / Add to Home Screen)
self.addEventListener("install", (event) => {
    self.skipWaiting();
});
self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});
