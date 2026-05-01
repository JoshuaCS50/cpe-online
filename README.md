# CPE Online

A mobile-friendly web IDE for **C, C++, Python**, and **Java** that runs entirely in your browser. Anyone with a phone or tablet that has data can open the site once — after that, no internet is needed to keep coding.

> Modeled loosely on Dev-C++ and Code::Blocks: editor, output console, file tabs, save/open. Designed thumb-first for phones.

## Features

- **Write C, C++, Python, and Java** with syntax highlighting (CodeMirror).
- **Run C / C++ in the browser** via [JSCPP](https://github.com/felixhao28/JSCPP) — no server, no compile API.
- **Run Python** via [Pyodide](https://pyodide.org/) (lazy-loaded on first Python run).
- **Save** your code as `.c` / `.cpp` / `.py` / `.java` files; **open** files back from your device.
- **Auto-save** every keystroke to `localStorage`, plus tabs / multi-file support.
- **Stdin row** for `scanf` / `cin` / `input()` programs.
- **Installable as a PWA** — "Add to Home Screen" on phones for an app-like icon.
- **Works offline** after the first visit (service worker precaches the app shell + JSCPP bundle).
- **Onboarding hint, examples menu** (Hello World, scanf input, loops, arrays, etc.).
- **Themes**: dark, light, auto. Adjustable font size. Optional line wrapping.

## Quick start

The app is a static site — no build step. Just open `index.html` through any web server.

### Local

```bash
# any static server works; this repo includes a no-cache one for development
python .claude/serve.py 8765
# then open http://localhost:8765
```

### Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then in your repo's **Settings → Pages**, set the source to `Deploy from branch`, branch `main`, folder `/ (root)`. Your site will be live at `https://<you>.github.io/<repo>/`.

## Project layout

```
.
├── index.html              # app shell, toolbar, layout
├── manifest.webmanifest    # PWA metadata
├── sw.js                   # service worker (offline caching)
├── css/
│   └── app.css             # mobile-first stylesheet
├── js/
│   ├── app.js              # bootstrap & UI wiring
│   ├── editor.js           # CodeMirror wrapper
│   ├── console.js          # output panel + stdin
│   ├── storage.js          # localStorage + file save/open
│   ├── examples.js         # starter programs
│   └── runners/
│       ├── index.js        # language dispatch
│       ├── c.js            # C / C++ runner (JSCPP)
│       ├── python.js       # Python runner (Pyodide, lazy-loaded)
│       └── java.js         # Java placeholder ("coming soon")
├── vendor/
│   └── JSCPP.es5.min.js    # vendored interpreter for offline reliability
└── README.md
```

## How offline works

On the first visit, the service worker (`sw.js`) precaches `index.html`, the CSS, every JS module, and the JSCPP bundle. Third-party CDN files (CodeMirror, Pyodide) are stored using a stale-while-revalidate cache the first time they're hit. Subsequent visits — even on airplane mode — load entirely from cache.

## Known limitations

- **No varargs in `<stdio.h>`** before JSCPP 2.x — we ship 2.0.6 which supports `printf` and `scanf`. Multi-file `#include "myheader.h"` projects aren't supported.
- **Java** is a placeholder in v1; the Java runner shows a "coming soon" message and lets you save `.java` files. A WASM JVM (DoppioJVM / TeaVM) will land in a future update.
- **Mid-run interactive stdin in C/C++**: JSCPP runs synchronously, so type all required input lines into the stdin row *before* clicking Run. (Python supports interactive `input()` properly.)
- **No real `gcc`/`clang`** — JSCPP is an interpreter that covers the C subset typical for coursework. If you need full compiler features, that would require a much larger WASM toolchain.

## Tech credits

- [CodeMirror 5](https://codemirror.net/5/) — editor
- [JSCPP](https://github.com/felixhao28/JSCPP) — JavaScript C/C++ interpreter
- [Pyodide](https://pyodide.org/) — Python in WebAssembly
- [Catppuccin](https://github.com/catppuccin)-inspired color palette

## License

MIT
