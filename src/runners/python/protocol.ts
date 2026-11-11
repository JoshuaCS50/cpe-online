// Messages between the page and the Python worker.

export const PYODIDE_VERSION = "0.26.3";
export const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/** Name user code runs under; it is what tracebacks show. */
export const PYTHON_MAIN_FILE = "main.py";

export interface PythonRunRequest {
  type: "run";
  code: string;
  /** Input queued before the run; consumed before the user is asked. */
  stdin: string;
  /** Channel the worker sleeps on while the user types (see input-channel.ts). */
  input: SharedArrayBuffer;
  /** One shared byte; the page writes 2 (SIGINT) to interrupt running code. */
  interrupt: SharedArrayBuffer;
}

export type PythonWorkerMessage =
  | { type: "loading" }
  | { type: "ready" }
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "stdin-request" }
  | { type: "done" }
  | { type: "error"; message: string; interrupted: boolean }
  | { type: "load-failed"; message: string };
