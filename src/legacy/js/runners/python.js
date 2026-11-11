// Python runner using Pyodide, lazy-loaded on first use.

let pyodidePromise = null;

function loadPyodideScript() {
  return new Promise((resolve, reject) => {
    if (window.loadPyodide) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.3/full/pyodide.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Pyodide script"));
    document.head.appendChild(s);
  });
}

async function initPyodide(consoleIO) {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    consoleIO.writeInfo("Loading Python runtime (first time only, ~10 MB)…\n");
    await loadPyodideScript();
    const pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.3/full/",
      stdout: (s) => consoleIO.write(s + "\n"),
      stderr: (s) => consoleIO.writeErr(s + "\n"),
    });
    consoleIO.writeInfo("Python runtime ready.\n");
    return pyodide;
  })();
  return pyodidePromise;
}

export async function runPython({ code, consoleIO }) {
  let pyodide;
  try {
    pyodide = await initPyodide(consoleIO);
  } catch (err) {
    consoleIO.writeErr("Could not load Python runtime: " + err.message + "\n");
    consoleIO.writeInfo("Tip: connect to the internet once so the runtime caches for offline use.\n");
    return { ok: false, exitCode: -1 };
  }

  // Bridge input() to the stdin row.
  window.__cpeReadLine = async () => {
    const line = await consoleIO.readLine();
    return line;
  };

  const prelude = `
import builtins, sys, js, asyncio

async def _cpe_input(prompt=""):
    if prompt:
        print(prompt, end="")
    return await js.window.__cpeReadLine()

def _cpe_sync_input(prompt=""):
    import js as _js
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_cpe_input(prompt))

builtins.input = _cpe_sync_input
`;
  try {
    await pyodide.runPythonAsync(prelude);
    await pyodide.runPythonAsync(code);
    consoleIO.writeInfo("\n[program finished]\n");
    return { ok: true, exitCode: 0 };
  } catch (err) {
    const msg = (err && err.message) || String(err);
    consoleIO.writeErr("\n" + msg + "\n");
    return { ok: false, exitCode: -1, error: err };
  }
}
