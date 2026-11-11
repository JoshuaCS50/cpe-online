# CPE Online

A mobile-friendly web IDE for **C, C++, Python**, and **Java** that runs entirely in your browser. Anyone with a phone or tablet that has data can open the site once — after that, no internet is needed to keep coding.

> Modeled loosely on Dev-C++ and Code::Blocks: editor, output console, file tabs, save/open. Designed thumb-first for phones.

## Features

- **Write C, C++, Python, and Java** with syntax highlighting (CodeMirror).
- **Run C / C++ in the browser** via [JSCPP](https://github.com/felixhao28/JSCPP) — no server, no compile API.
- **Run Python** via [Pyodide](https://pyodide.org/) (lazy-loaded on first Python run).
- **Save** your code as `.c` / `.cpp` / `.py` / `.java` files; **open** files back from your device.
- **Auto-save** every keystroke to `localStorage`, plus tabs / multi-file support.
- **Terminal input like a desktop IDE**: when a program asks for input, type it in the terminal and press Enter. Stop ends a running program.
- **Installable as a PWA** — "Add to Home Screen" on phones for an app-like icon.
- **Works offline** after the first visit (service worker precaches the app shell + JSCPP bundle).
- **Onboarding hint, examples menu** (Hello World, scanf input, loops, arrays, etc.).
- **Themes**: dark, light, auto. Adjustable font size. Optional line wrapping.

## Quick start

The app is being rebuilt on Vite + TypeScript (see docs/PLAN.md, kept local). The original app runs unchanged from `src/legacy/` while it is replaced module by module.

```bash
npm install
npm run dev        # dev server with hot reload
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm test           # unit tests (Vitest)
npm run lint
```

### Deploy

Static output in `dist/`. Target host is Cloudflare Pages (build command `npm run build`, output directory `dist`). `public/_headers` sends the cross-origin isolation headers the Python runner and debugger rely on.

## Project layout

```
.
├── index.html                 # Vite entry: app shell markup
├── vite.config.ts             # build, dev headers, Vitest config
├── public/
│   ├── _headers               # Cloudflare Pages headers (COOP/COEP)
│   ├── manifest.webmanifest   # PWA metadata
│   ├── sw.js                  # service worker (offline caching)
│   └── vendor/JSCPP.es5.min.js
├── src/
│   ├── main.ts                # entry; boots the legacy app for now
│   └── legacy/                # original app, being ported to TypeScript
│       ├── css/app.css
│       └── js/                # app, editor, console, storage, runners, ...
└── tests/unit/                # Vitest tests
```

## How offline works

On the first visit, the service worker (`sw.js`) precaches `index.html`, the CSS, every JS module, and the JSCPP bundle. Third-party CDN files (CodeMirror, Pyodide) are stored using a stale-while-revalidate cache the first time they're hit. Subsequent visits — even on airplane mode — load entirely from cache.

## Known limitations

- **No varargs in `<stdio.h>`** before JSCPP 2.x — we ship 2.0.6 which supports `printf` and `scanf`. Multi-file `#include "myheader.h"` projects aren't supported.
- **Java** is a placeholder in v1; the Java runner shows a "coming soon" message and lets you save `.java` files. A WASM JVM (DoppioJVM / TeaVM) will land in a future update.
- **Interactive input needs cross-origin isolation.** C, C++ and Python run in workers and pause at `scanf` / `cin` / `input()` until you type in the terminal. That relies on shared memory, which browsers only allow when the site sends the headers in `public/_headers`. On a host without them, C and C++ fall back to reading input queued before the run.
- **`scanf("%c", ...)` does not work** in the bundled JSCPP build (it fails upstream too).
- **No real `gcc`/`clang`** — JSCPP is an interpreter that covers the C subset typical for coursework. If you need full compiler features, that would require a much larger WASM toolchain.

## Tech credits

- [CodeMirror 5](https://codemirror.net/5/) — editor
- [JSCPP](https://github.com/felixhao28/JSCPP) — JavaScript C/C++ interpreter
- [Pyodide](https://pyodide.org/) — Python in WebAssembly
- [Catppuccin](https://github.com/catppuccin)-inspired color palette

## License

MIT
