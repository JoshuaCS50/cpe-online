// Python worker. Runs Pyodide off the main thread so that:
//   - input() pauses the program until the user types a line in the terminal,
//   - long or endless programs do not freeze the page,
//   - Stop can interrupt running code.
//
// It is a module worker: Pyodide is loaded with a dynamic import.

import { waitForInput } from "../input-channel";
import { PYODIDE_BASE_URL, PYTHON_MAIN_FILE } from "./protocol";
import type { PythonRunRequest, PythonWorkerMessage } from "./protocol";

interface PyProxy {
  set(key: string, value: unknown): void;
  destroy(): void;
}

interface StreamWriter {
  write: (bytes: Uint8Array) => number;
  isatty?: boolean;
}

interface Pyodide {
  runPythonAsync(code: string, options?: { globals?: PyProxy; filename?: string }): Promise<unknown>;
  setStdout(options: StreamWriter): void;
  setStderr(options: StreamWriter): void;
  setStdin(options: { stdin: () => string | null; isatty?: boolean }): void;
  setInterruptBuffer(buffer: Uint8Array): void;
  globals: { get(name: string): () => PyProxy };
}

interface PyodideModule {
  loadPyodide(options: { indexURL: string }): Promise<Pyodide>;
}

const post = (message: PythonWorkerMessage): void => {
  (self as unknown as { postMessage(message: PythonWorkerMessage): void }).postMessage(message);
};

let pyodidePromise: Promise<Pyodide> | null = null;

function loadPyodideOnce(): Promise<Pyodide> {
  if (!pyodidePromise) {
    post({ type: "loading" });
    pyodidePromise = (async () => {
      const module = (await import(/* @vite-ignore */ `${PYODIDE_BASE_URL}pyodide.mjs`)) as PyodideModule;
      const pyodide = await module.loadPyodide({ indexURL: PYODIDE_BASE_URL });
      post({ type: "ready" });
      return pyodide;
    })();
    // A failed download must not poison later attempts (for example after
    // the connection comes back).
    pyodidePromise.catch(() => {
      pyodidePromise = null;
    });
  }
  return pyodidePromise;
}

/** Forwards whatever Python flushes; `stream: true` keeps split UTF-8 characters intact. */
function streamWriter(type: "stdout" | "stderr"): StreamWriter {
  const decoder = new TextDecoder();
  return {
    write(bytes) {
      const text = decoder.decode(bytes, { stream: true });
      if (text) post({ type, text });
      return bytes.length;
    },
    isatty: true,
  };
}

async function run(request: PythonRunRequest): Promise<void> {
  let pyodide: Pyodide;
  try {
    pyodide = await loadPyodideOnce();
  } catch (error) {
    post({ type: "load-failed", message: error instanceof Error ? error.message : String(error) });
    return;
  }

  const interrupt = new Uint8Array(request.interrupt);
  interrupt[0] = 0;
  pyodide.setInterruptBuffer(interrupt);
  pyodide.setStdout(streamWriter("stdout"));
  pyodide.setStderr(streamWriter("stderr"));

  // Input queued before the run goes first, one line per read. After that
  // the worker sleeps until the user types a line.
  let queued = request.stdin;
  pyodide.setStdin({
    stdin: () => {
      if (queued) {
        const end = queued.indexOf("\n");
        const line = end < 0 ? queued : queued.slice(0, end + 1);
        queued = queued.slice(line.length);
        return line;
      }
      return waitForInput(request.input, () => post({ type: "stdin-request" }));
    },
    isatty: true,
  });

  // A fresh namespace per run: names from the previous run must not leak in.
  const namespace = pyodide.globals.get("dict")();
  namespace.set("__name__", "__main__");
  try {
    await pyodide.runPythonAsync(request.code, { globals: namespace, filename: PYTHON_MAIN_FILE });
    await pyodide.runPythonAsync("import sys\nsys.stdout.flush()\nsys.stderr.flush()");
    post({ type: "done" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "error", message, interrupted: /KeyboardInterrupt/.test(message) });
  } finally {
    namespace.destroy();
  }
}

// An interrupt also surfaces a second time through Pyodide's own event loop
// task. The run above has already reported it, so keep the console quiet.
self.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  if (/KeyboardInterrupt/.test(String(event.reason))) event.preventDefault();
});

self.addEventListener("message", (event: MessageEvent<PythonRunRequest>) => {
  if (event.data?.type === "run") void run(event.data);
});
