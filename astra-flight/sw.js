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
const VERSION = 'dd442d875472';
// CacheStorage belongs to the origin, not the registration. Live and preview installations
// share it, so each scope owns a separate namespace. The new prefix also stays outside
// older workers' origin-wide `army-lab-*` cleanup. Leave their unscoped caches untouched.
const SCOPE = encodeURIComponent(new URL(self.registration.scope).pathname);
const CACHE_PREFIX = `stars-game:${SCOPE}:`;
const CACHE = `${CACHE_PREFIX}${VERSION}`;
const MUSIC = `stars-music:${SCOPE}`;
const COMPLETE = '__offline-ready__';
const INSTALLING = '__offline-installing__';

/** Required files fail the install; optional music stops at the first failure and retries on reconnect. */
async function fill(cache, files, required = false) {
  for (const f of files) {
    const hit = await cache.match(f, { ignoreVary: true });
    if (hit?.status === 200) continue;
    if (!required && self.navigator.onLine === false) break;
    try {
      const r = await fetch(f, { cache: 'reload' });
      if (r.status !== 200) throw new Error(`Could not cache ${f}: HTTP ${r.status}`);
      await cache.put(f, r);
    } catch (error) {
      if (required) throw error;
      break;
    }
  }
}

function fileList(value) {
  if (!Array.isArray(value) || !value.every(f => typeof f === 'string' && f.length > 0)) throw new Error('Invalid precache file list');
  return value;
}

async function manifest(name, cache) {
  const r = await fetch(name, { cache: 'reload' });
  if (r.status !== 200) throw new Error(`Could not load ${name}: HTTP ${r.status}`);
  const data = await r.clone().json();
  await cache.put(name, r);
  return data;
}

async function completed() {
  const marker = await (await caches.open(CACHE)).match(COMPLETE);
  return marker?.status === 200 && (await marker.text()) === VERSION;
}

async function musicLists() {
  try {
    const cache = await caches.open(CACHE);
    const hit = await cache.match('precache-music.json');
    if (!hit && self.navigator.onLine === false) return { first: [], later: [] };
    const r = hit ?? (await fetch('precache-music.json', { cache: 'reload' }));
    const j = await r.json();
    return { first: fileList(j.first), later: fileList(j.later) };
  } catch {
    return { first: [], later: [] };
  }
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.put(INSTALLING, new Response(VERSION));
      const files = fileList(await manifest('precache.json', cache));
      const music = await manifest('precache-music.json', cache);
      const first = fileList(music.first);
      fileList(music.later);
      await fill(cache, ['./', ...files], true);
      await fill(await caches.open(MUSIC), first, true);
      // Cache existence alone does not mean installation finished. Keep partial downloads for a retry,
      // but never activate or announce them; an older active worker continues serving its intact build.
      await cache.put(COMPLETE, new Response(VERSION));
      await cache.delete(INSTALLING);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      // Keep this scope's last completed build, not a newer failed partial download.
      // Other scopes and unscoped legacy caches have separate owners and are never pruned here.
      const names = (await caches.keys()).filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE);
      let previous = null;
      for (const n of [...names].reverse()) {
        const old = await caches.open(n);
        const marker = await old.match(COMPLETE);
        if (marker && (await marker.text()) === n.slice(CACHE_PREFIX.length)) { previous = n; break; }
      }
      for (const n of names) if (n !== previous) await caches.delete(n);
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
    for (const c of await self.clients.matchAll()) c.postMessage({ type: have === all.length ? 'music-ready' : 'music-pending', have, total: all.length });
  })().finally(() => {
    filling = null;
  });
  return filling;
}

self.addEventListener('message', (e) => {
  if (e.data === 'offline-status') e.waitUntil(completed().then(ok => e.source?.postMessage({ type: ok ? 'offline-ready' : 'offline-pending', version: VERSION })));
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
