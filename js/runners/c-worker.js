// Web Worker that runs JSCPP. The main thread sees stdout chunks streaming
// in via postMessage, so the user gets progressive output instead of
// everything at once at the end of a synchronous run.
//
// Limitation: workers can't synchronously block on user input without
// SharedArrayBuffer (which needs cross-origin isolation). For now this
// runner consumes a fixed `stdin` provided up-front; if JSCPP requests
// more, it gets EOF. For interactive scanf, the main-thread runner with
// window.prompt() is the right tool.

importScripts("../../vendor/JSCPP.es5.min.js");

// JSCPP's preprocessor strips spaces after commas inside string literals.
// Mirror the workaround from c.js so behavior is identical between modes.
function escapeSpacesInStringLiterals(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      const stop = end < 0 ? n : end;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? n : end + 2;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    if (ch === "'") {
      out += ch;
      i += 1;
      while (i < n) {
        const c = src[i];
        out += c;
        i += 1;
        if (c === "\\" && i < n) {
          out += src[i];
          i += 1;
        } else if (c === "'") {
          break;
        }
      }
      continue;
    }
    if (ch === '"') {
      out += ch;
      i += 1;
      while (i < n) {
        const c = src[i];
        if (c === "\\" && i + 1 < n) {
          out += c + src[i + 1];
          i += 2;
        } else if (c === '"') {
          out += c;
          i += 1;
          break;
        } else if (c === " ") {
          out += "\\x20";
          i += 1;
        } else if (c === "\t") {
          out += "\\x09";
          i += 1;
        } else {
          out += c;
          i += 1;
        }
      }
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

self.onmessage = (e) => {
  if (!e.data || e.data.type !== "run") return;
  const { code, stdin } = e.data;

  let remainingStdin = String(stdin || "");
  const config = {
    stdio: {
      // Each character/string write becomes a postMessage so the main
      // thread can append it to the output panel in near-real-time.
      write: (s) => {
        self.postMessage({ type: "stdout", text: s });
      },
    },
    unsigned_overflow: "warn",
    maxTimeout: 30000,
    includes: {},
    getInput: () => {
      // Worker mode is non-interactive: hand JSCPP whatever's left, then EOF.
      const out = remainingStdin;
      remainingStdin = "";
      return out;
    },
  };

  try {
    const patched = escapeSpacesInStringLiterals(code);
    const exitCode = self.JSCPP.run(patched, remainingStdin, config);
    remainingStdin = ""; // JSCPP consumed the up-front stdin
    self.postMessage({ type: "done", exitCode });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: (err && err.message) || String(err),
    });
  }
};

// Signal readiness so the main thread doesn't race the import.
self.postMessage({ type: "ready" });
