// Messages between the page and the Python worker.

import type { PausedState } from "../../debugger/types";

export const PYODIDE_VERSION = "0.26.3";
export const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/** Name user code runs under; it is what tracebacks show. */
export const PYTHON_MAIN_FILE = "main.py";

export interface PythonRunRequest {
  type: "run";
  code: string;
  /** Input queued before the run; consumed before the user is asked. */
  stdin: string;
  /**
   * Channel the worker sleeps on while the user types (see input-channel.ts).
   * Null without cross-origin isolation: input() then gets end of input.
   */
  input: SharedArrayBuffer | null;
  /** One shared byte; the page writes 2 (SIGINT) to interrupt running code. Null without isolation. */
  interrupt: SharedArrayBuffer | null;
  /** Files the program may open, name -> text, placed in its working folder. */
  files?: Record<string, string>;
  /** Present for a debug session. */
  debug?: {
    breakpoints: number[];
    /**
     * Channel the worker sleeps on while paused. The page answers with a
     * JSON PauseReply (see debugger/python-stepper.ts), or end-of-input to stop.
     */
    control: SharedArrayBuffer;
  };
}

export type PythonWorkerMessage =
  | { type: "loading" }
  | { type: "ready" }
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "stdin-request" }
  | { type: "paused"; state: PausedState }
  /** Every file in the working folder after the run, sent before "done" or "error" when any changed. */
  | { type: "files"; files: Record<string, string> }
  | { type: "done" }
  | { type: "error"; message: string; interrupted: boolean }
  | { type: "load-failed"; message: string };
