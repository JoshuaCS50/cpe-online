// CPE Online service worker.
// Precaches the app shell and caches third-party libraries on first use so the
// app works fully offline after the first successful load.

const VERSION = "cpe-online-v7";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/app.js",
  "./js/editor.js",
  "./js/console.js",
  "./js/storage.js",
  "./js/examples.js",
  "./js/cheatsheet.js",
  "./js/zip.js",
  "./js/runners/index.js",
  "./js/runners/c.js",
  "./js/runners/c-streaming.js",
  "./js/runners/c-worker.js",
  "./js/runners/python.js",
  "./js/runners/java.js",
  "./vendor/JSCPP.es5.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // addAll fails the whole install if any entry 404s; fall back to best-effort.
      Promise.all(
        SHELL_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            // Missing optional asset — skip rather than fail the install.
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // Shell / app code: cache-first, then network, then cache fresh response.
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // Third-party CDN assets (CodeMirror, JSCPP, Pyodide): stale-while-revalidate.
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      return cached || (await network) || new Response("", { status: 504 });
    })
  );
});
