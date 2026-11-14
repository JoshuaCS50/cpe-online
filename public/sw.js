// CPE Online service worker: makes the app work offline.
//
// The build fills in two values below (see the swManifest plugin in
// vite.config.ts):
//   __VERSION__   a hash of the build, so each release gets its own caches
//   __PRECACHE__  the app shell: index.html and the hashed JS, CSS and fonts
//
// Three caches:
//   shell    the precached app shell. Replaced as a whole on every release.
//   runtime  language runtimes fetched on first use: the C interpreter, the
//            MATLAB runtime parts, and Python from its CDN. Kept across
//            releases, because they are large and rarely change.
//   pages    everything else same-origin, refreshed in the background.

const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;

const SHELL = `cpe-shell-${VERSION}`;
const RUNTIME = "cpe-runtime-v1";
const PAGES = `cpe-pages-${VERSION}`;
const KEEP = new Set([SHELL, RUNTIME, PAGES]);

const sameOrigin = (url) => url.origin === self.location.origin;

/**
 * Runtime files whose URL changes with every version, so a cached copy is
 * always right: the MATLAB runtime and the C++ compiler (each in a folder
 * named after its version) and Python from its CDN (version in the path).
 */
function isPinnedRuntime(url) {
  if (sameOrigin(url)) return /\/vendor\/(runmat|clang)\/[^/]+\//.test(url.pathname);
  return url.hostname === "cdn.jsdelivr.net" && url.pathname.includes("/pyodide/");
}

/** Runtime files that keep their name across versions: the C interpreter and the MATLAB manifest. */
function isUnpinnedRuntime(url) {
  return sameOrigin(url) && url.pathname.includes("/vendor/");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      // One missing file must not block the whole install.
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => !KEEP.has(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = (await cache.match(request)) ?? (fallbackUrl ? await caches.match(fallbackUrl) : undefined);
    if (cached) return cached;
    throw error;
  }
}

/** Answers from the cache at once and refreshes the copy in the background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) void cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached ?? (await refresh) ?? Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (isPinnedRuntime(url)) {
    event.respondWith(cacheFirst(request, RUNTIME));
    return;
  }
  if (isUnpinnedRuntime(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME));
    return;
  }
  if (!sameOrigin(url)) return;

  // Opening the app: prefer the network so a new release is picked up, and
  // fall back to the cached shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, SHELL, "index.html"));
    return;
  }

  // Hashed build files never change under the same name.
  if (url.pathname.includes("/assets/")) {
    event.respondWith(cacheFirst(request, SHELL));
    return;
  }

  event.respondWith(networkFirst(request, PAGES));
});
