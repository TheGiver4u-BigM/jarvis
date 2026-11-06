// Service Worker: App-Oberfläche zwischenspeichern (nur als Notfall offline) + Push-Berichte empfangen.
const CACHE = 'jarvis-v11';
const SHELL = ['./', 'index.html', 'style.css?v=11', 'app.js?v=11', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});
const PIPER_CACHE = 'jarvis-piper-v1'; // große Stimm-Bausteine (~28 MB) – bleiben über Updates erhalten
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((k) => k !== CACHE && k !== 'jarvis-inbox' && k !== PIPER_CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return; // API-Aufrufe immer live
  if (/\/piper\/.+\.(wasm|data)$/.test(url.pathname)) { // Stimm-Bausteine: einmal laden, dann aus dem Speicher
    e.respondWith(caches.open(PIPER_CACHE).then(async (c) => {
      const hit = await c.match(url.pathname);
      if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok) c.put(url.pathname, r.clone());
      return r;
    }));
    return;
  }
  // Immer zuerst frisch vom Server holen (am Browser-Zwischenspeicher vorbei), nur offline aus dem Speicher
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => {
    const copy = r.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});

// Bericht vom Server (GitHub Actions) empfangen
self.addEventListener('push', (e) => {
  let d;
  try { d = e.data.json(); } catch { d = { titel: 'Jarvis', text: e.data ? e.data.text() : '' }; }
  d.zeit = d.zeit || new Date().toISOString();
  d.gelesen = false;
  // Liste der letzten 15 Berichte im Gerät ablegen (Anzeige erst nach PIN-Entsperrung)
  const addToInbox = caches.open('jarvis-inbox').then(async (c) => {
    const r = await c.match('inbox.json');
    const list = r ? await r.json() : [];
    list.unshift(d);
    await c.put('inbox.json', new Response(JSON.stringify(list.slice(0, 15))));
  });
  e.waitUntil(Promise.all([
    addToInbox,
    self.registration.showNotification(d.titel || 'Jarvis', {
      body: d.kurz || (d.text || '').slice(0, 180),
      icon: 'icon-192.png', badge: 'icon-192.png', tag: 'jarvis-' + (d.typ || 'info'),
      data: { url: './?bericht=1' },
    }),
  ]));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
    for (const w of wins) { w.postMessage('bericht'); return w.focus(); }
    return self.clients.openWindow(e.notification.data.url);
  }));
});
