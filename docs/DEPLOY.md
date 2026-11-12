# Deploying CPE Online

The app is a static site. `npm run build` writes it to `dist/`. The intended host is Cloudflare Pages, because it can send the two response headers the app relies on (see "Why the headers matter").

## One-time setup on Cloudflare Pages

You do these steps yourself in the Cloudflare dashboard; they need your account.

1. Push this repository to GitHub.
2. In Cloudflare: **Workers & Pages** > **Create** > **Pages** > **Connect to Git**, and pick the repository.
3. Build settings:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Production branch: `main`
4. Save and deploy. Node 24 is selected by the `.nvmrc` file in the repository.

Every push to `main` then deploys automatically, and every other branch gets its own preview URL.

## What the build does

1. `scripts/vendor-runmat.mjs` copies the MATLAB runtime from `node_modules` into `public/vendor/runmat/<version>/` and cuts its 69 MB WebAssembly file into 8 MiB parts. Cloudflare Pages refuses single files over 25 MiB.
2. TypeScript is checked.
3. Vite bundles the app into `dist/`.
4. The service worker (`dist/sw.js`) is filled in with the list of app files and a version hash.

`dist/` is about 70 MB, nearly all of it the MATLAB runtime.

## Why the headers matter

`public/_headers` makes Cloudflare send:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Together these make the page "cross-origin isolated", which unlocks shared memory in the browser. The app uses shared memory to let a running program stop and wait while you type its input, and to pause Python in the debugger.

Without the headers the app still loads and programs still run, but:

- `scanf`, `cin` and `input()` receive end of input instead of waiting.
- Python cannot be debugged (C and C++ still can).
- The status bar shows "Typed input is unavailable on this address".

GitHub Pages cannot send these headers, which is why it is no longer the target.

## Checking a deployment

Open the site and check, in this order:

1. The status bar does **not** show the "Typed input is unavailable" warning.
2. Run the "Read a number" example in C: the program waits for you to type.
3. Run a Python example, then a MATLAB example. Each downloads its runtime the first time.
4. Reload once, switch the device to offline (or use the browser's offline mode), reload again: the app opens, and C, Python and MATLAB still run.

## Offline behaviour

- The app shell (HTML, scripts, styles, font) is stored on the first visit.
- Each language runtime is stored the first time it is used: the C interpreter with the first C run, Python (about 10 MB) with the first Python run, MATLAB (about 23 MB compressed) with the first MATLAB run.
- A new release is picked up the next time the app is opened online. The status bar then says "New version ready. Reload to use it."

## Running the production build locally

```bash
npm run build
```

```bash
npm run preview
```

`npm run preview` serves `dist/` with the same two headers, so input and the debugger behave as they will on Cloudflare.
