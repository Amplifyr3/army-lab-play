// Keeps the game fully playable offline once it has been opened once: on install it downloads every file of the build
// (the list is precache.json, written at build time by scripts/precache.mjs), then answers from that copy first, so a
// plane, a dead zone or a network that hangs instead of failing never stalls the game. A new build installs alongside
// in the background and takes over on the next launch; the previous copy is kept until then.
//
// The music has a cache of its own that outlives builds (its files are named by their content, so a new build downloads
// only takes that changed). One take of each track comes with the game's download; the other takes follow in the
// background as soon as the page asks ('music-fill', every launch until they're all in), so the first download stays small
// and the full variety is there long before a player goes offline. <audio> asks for byte ranges: those are cut from
// the saved file.
const VERSION = '66d07f1c47c0';
const CACHE = `army-lab-${VERSION}`;
const MUSIC = 'stars-music';

/** Save each file not saved yet, one by one (a single slow file doesn't fail the rest). */
async function fill(cache, files) {
  for (const f of files) {
    if (await cache.match(f, { ignoreVary: true })) continue;
    try {
      const r = await fetch(f, { cache: 'reload' });
      if (r.ok && r.status === 200) await cache.put(f, r);
    } catch {
      /* offline mid-download: the next launch finishes it */
    }
  }
}

async function musicLists() {
  try {
    const cache = await caches.open(CACHE);
    const r = (await cache.match('precache-music.json')) ?? (await fetch('precache-music.json', { cache: 'reload' }));
    const j = await r.json();
    return { first: j.first ?? [], later: j.later ?? [] };
  } catch {
    return { first: [], later: [] };
  }
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const res = await fetch('precache.json', { cache: 'reload' });
      const files = await res.json();
      await fill(cache, ['./', ...files]);
      try {
        const m = await fetch('precache-music.json', { cache: 'reload' });
        if (m.ok) {
          await cache.put('precache-music.json', m.clone());
          const { first } = await m.json();
          await fill(await caches.open(MUSIC), first ?? []);
        }
      } catch {
        /* a build without music */
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
      // music takes this build no longer lists are let go (here, by the new worker with its own lists: an older worker
      // still answering the page must not prune a newer build's takes)
      const lists = await musicLists();
      const all = [...lists.first, ...lists.later];
      if (all.length) {
        const keep = new Set(all.map((f) => new URL(f, location.href).href));
        const music = await caches.open(MUSIC);
        for (const req of await music.keys()) if (!keep.has(req.url)) await music.delete(req);
      }
      await self.clients.claim();
      for (const c of await self.clients.matchAll()) c.postMessage({ type: 'offline-ready', version: VERSION });
    })(),
  );
});

/** The rest of the music, in the background. */
let filling = null;
function fillMusic() {
  filling ??= (async () => {
    const { first, later } = await musicLists();
    const all = [...first, ...later];
    if (!all.length) return;
    const cache = await caches.open(MUSIC);
    await fill(cache, all);
    let have = 0;
    for (const f of all) if (await cache.match(f)) have++;
    for (const c of await self.clients.matchAll()) c.postMessage({ type: 'music-ready', have, total: all.length });
  })().finally(() => {
    filling = null;
  });
  return filling;
}

self.addEventListener('message', (e) => {
  if (e.data === 'offline-status') caches.has(CACHE).then((ok) => e.source?.postMessage({ type: ok ? 'offline-ready' : 'offline-pending', version: VERSION }));
  if (e.data === 'music-fill') e.waitUntil(fillMusic());
});

/** A saved music file, whole or the byte range the <audio> asked for. */
async function musicAnswer(req, hit) {
  const range = req.headers.get('range');
  if (!range) return hit;
  const blob = await hit.blob();
  const size = blob.size;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  let start = 0;
  let end = size - 1;
  if (m && m[1] !== '') {
    start = Number(m[1]);
    if (m[2] !== '') end = Math.min(Number(m[2]), size - 1);
  } else if (m && m[2] !== '') start = Math.max(0, size - Number(m[2]));
  if (!m || start >= size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': hit.headers.get('Content-Type') ?? 'audio/ogg',
      'Content-Length': String(end - start + 1),
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (/\/music\/[^/]+\.(ogg|m4a)$/.test(url.pathname)) {
    e.respondWith(
      (async () => {
        const hit = await (await caches.open(MUSIC)).match(req.url, { ignoreVary: true, ignoreSearch: true });
        if (hit) return musicAnswer(req, hit);
        // not downloaded yet: streamed from the network (the background download saves it)
        return fetch(req);
      })(),
    );
    return;
  }
  // the sound sheet (sfx.html) isn't part of the offline game: always the network, never the game's page in its place
  if (/\/sfx\.html$|\/sfx-assets\//.test(url.pathname)) return;
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
