// Web Worker that runs JSCPP. The main thread sees stdout chunks streaming
// in via postMessage, so the user gets progressive output instead of
// everything at once at the end of a synchronous run.
//
// Input: lines queued before the run are consumed first. When the program
// reads more, the worker blocks on a SharedArrayBuffer until the user types
// a line in the terminal (needs cross-origin isolation). Without a shared
// buffer the program gets end of input instead.

// The page passes the absolute JSCPP URL as the worker name, because the
// bundled worker no longer sits at a fixed path relative to /vendor.
importScripts(self.name || "../../vendor/JSCPP.es5.min.js");

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

// Sleeps until the page answers with a line of input. Returns the line, or
// null for end of input. Buffer layout: see src/runners/input-channel.ts.
function waitForLine(channel) {
  const header = new Int32Array(channel, 0, 2);
  Atomics.store(header, 0, 0);
  self.postMessage({ type: "stdin-request" });
  Atomics.wait(header, 0, 0);
  if (Atomics.load(header, 0) !== 1) return null;
  // Copy out of shared memory: TextDecoder cannot read it directly.
  const bytes = new Uint8Array(channel, 8, Atomics.load(header, 1)).slice();
  return new TextDecoder().decode(bytes);
}

self.onmessage = (e) => {
  if (!e.data || e.data.type !== "run") return;
  const { code, stdin, input } = e.data;

  let queued = String(stdin || "");
  const config = {
    stdio: {
      // Each character/string write becomes a postMessage so the main
      // thread can append it to the output panel in near-real-time.
      write: (s) => {
        self.postMessage({ type: "stdout", text: s });
      },
      // The patched JSCPP build calls this each time the program reads and
      // its buffer is empty. Input queued before the run goes first; after
      // that the program waits for the user to type a line in the terminal.
      drain: () => {
        if (queued) {
          const out = queued;
          queued = "";
          return out;
        }
        return input ? waitForLine(input) : null;
      },
    },
    unsigned_overflow: "warn",
    includes: {},
  };

  try {
    const patched = escapeSpacesInStringLiterals(code);
    const exitCode = self.JSCPP.run(patched, "", config);
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
