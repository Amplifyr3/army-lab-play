// Keeps the game fully playable offline once it has been opened once: on install it downloads every file of the build
// (the list is precache.json, written at build time by scripts/precache.mjs), then answers from that copy first, so a
// plane, a dead zone or a network that hangs instead of failing never stalls the game. A new build installs alongside
// in the background and takes over on the next launch; the previous copy is kept until then.
const VERSION = '5708f5df438e';
const CACHE = `army-lab-${VERSION}`;

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const res = await fetch('precache.json', { cache: 'reload' });
      const files = await res.json();
      // one by one rather than addAll, so a single slow file doesn't fail the whole download
      for (const f of ['./', ...files]) {
        if (await cache.match(f, { ignoreVary: true })) continue;
        try {
          const r = await fetch(f, { cache: 'reload' });
          if (r.ok) await cache.put(f, r);
        } catch {
          /* offline mid-install: the next launch finishes it */
        }
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      // keep this version and the one before it (a page still running the old build may want its files)
      const names = (await caches.keys()).filter((n) => n.startsWith('army-lab-') && n !== CACHE);
      for (const n of names.slice(0, -1)) await caches.delete(n);
      await self.clients.claim();
      for (const c of await self.clients.matchAll()) c.postMessage({ type: 'offline-ready', version: VERSION });
    })(),
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'offline-status') caches.has(CACHE).then((ok) => e.source?.postMessage({ type: ok ? 'offline-ready' : 'offline-pending', version: VERSION }));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // the page itself: the saved copy, whatever the query string says
      // (ignoreVary: the saved copy was fetched without the Origin header a module script's request carries)
      const opts = { ignoreSearch: req.mode === 'navigate', ignoreVary: true };
      const hit = (await cache.match(req, opts)) ?? (req.mode === 'navigate' ? await cache.match('./', { ignoreVary: true }) : undefined);
      if (hit) return hit;
      // anything not saved yet: the network, kept for next time; if that fails too, any older saved copy
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        const old = await caches.match(req, { ignoreSearch: req.mode === 'navigate', ignoreVary: true });
        if (old) return old;
        throw new Error('offline and not saved');
      }
    })(),
  );
});
