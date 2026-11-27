const CACHE = "essenwa-v1";
const SHELL = ["./", "index.html", "manifest.json", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  // Data Firebase (Firestore, Auth, Storage) selalu langsung ke jaringan
  if (/googleapis\.com|firebaseio\.com|firebasestorage|identitytoolkit/.test(u.hostname)) return;
  // Halaman utama: jaringan dulu agar update dari GitHub langsung terbaca
  if (r.mode === "navigate" || u.pathname.endsWith("index.html")) {
    e.respondWith(fetch(r).then(res => { caches.open(CACHE).then(c => c.put(r, res.clone())); return res; }).catch(() => caches.match("index.html")));
    return;
  }
  // Lainnya (ikon, modul Firebase SDK): cache dulu
  e.respondWith(caches.match(r).then(h => h || fetch(r).then(res => {
    if (res.ok) caches.open(CACHE).then(c => c.put(r, res.clone()));
    return res;
  })));
});
