// Page side of the Python worker: starts runs, relays output to the terminal,
// answers input requests, and stops programs.

import type { ConsoleIO } from "../../terminal/console";
import { answerInput, createInputChannel } from "../input-channel";
import { PYTHON_MAIN_FILE } from "./protocol";
import type { PythonRunRequest, PythonWorkerMessage } from "./protocol";

export interface PythonRunOptions {
  code: string;
  consoleIO: ConsoleIO;
  signal?: AbortSignal;
  onErrorLine?: (line: number) => void;
}

export interface PythonRunResult {
  ok: boolean;
  exitCode: number;
  stopped?: boolean;
}

/** How long a program gets to react to an interrupt before the worker is ended. */
const STOP_GRACE_MS = 1500;

let worker: Worker | null = null;

function getWorker(): Worker {
  worker ??= new Worker(new URL("./python-worker.ts", import.meta.url), { type: "module" });
  return worker;
}

function discardWorker(): void {
  worker?.terminate();
  worker = null;
}

/** The last line number a traceback reports inside the user's own file. */
export function errorLineFromTraceback(traceback: string): number | null {
  const pattern = new RegExp(`File "(?:${PYTHON_MAIN_FILE.replace(".", "\\.")}|<exec>)", line (\\d+)`, "g");
  let line: number | null = null;
  for (const match of traceback.matchAll(pattern)) line = Number(match[1]);
  return line;
}

/**
 * Drops the interpreter's own frames from a traceback so a beginner sees only
 * their file. Lines before the first frame in the user's file are internal.
 */
export function trimTraceback(traceback: string): string {
  const lines = traceback.trimEnd().split("\n");
  const firstUserFrame = lines.findIndex((line) => line.includes(`File "${PYTHON_MAIN_FILE}"`));
  if (firstUserFrame <= 0) return lines.join("\n");
  const header = lines[0]?.startsWith("Traceback") ? [lines[0]] : [];
  return [...header, ...lines.slice(firstUserFrame)].join("\n");
}

export function runPythonInWorker(options: PythonRunOptions): Promise<PythonRunResult> {
  const { code, consoleIO, signal, onErrorLine } = options;
  const active = getWorker();
  const input = createInputChannel();
  const interruptBuffer = new SharedArrayBuffer(1);
  const interrupt = new Uint8Array(interruptBuffer);

  return new Promise<PythonRunResult>((resolve) => {
    let settled = false;
    let stopping = false;
    let killTimer: ReturnType<typeof setTimeout> | undefined;

    function finish(result: PythonRunResult): void {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      active.removeEventListener("message", onMessage);
      active.removeEventListener("error", onCrash);
      signal?.removeEventListener("abort", onAbort);
      resolve(result);
    }

    // Stop button. First ask politely: SIGINT raises KeyboardInterrupt at the
    // next Python instruction, and a pending input() gets end of input. Code
    // stuck where neither reaches it loses the worker after a short grace
    // period; the runtime then reloads on the next run.
    function onAbort(): void {
      stopping = true;
      interrupt[0] = 2;
      answerInput(input, null);
      killTimer = setTimeout(() => {
        discardWorker();
        finish({ ok: false, exitCode: -1, stopped: true });
      }, STOP_GRACE_MS);
    }

    function onMessage(event: MessageEvent<PythonWorkerMessage>): void {
      const message = event.data;
      switch (message.type) {
        case "loading":
          consoleIO.writeInfo("Loading Python runtime (first time only, ~10 MB)…\n");
          break;
        case "ready":
          consoleIO.writeInfo("Python runtime ready.\n");
          break;
        case "stdout":
          consoleIO.write(message.text);
          break;
        case "stderr":
          consoleIO.writeErr(message.text);
          break;
        case "stdin-request":
          // The program is paused on input(). Answer when the user has typed
          // a line; a cancelled read ends the input.
          consoleIO.readLine().then(
            (line) => answerInput(input, line + "\n"),
            () => answerInput(input, null),
          );
          break;
        case "done":
          consoleIO.writeInfo("\n[program finished]\n");
          finish({ ok: true, exitCode: 0 });
          break;
        case "error": {
          if (stopping || message.interrupted) {
            finish({ ok: false, exitCode: -1, stopped: true });
            break;
          }
          const line = errorLineFromTraceback(message.message);
          if (line !== null) onErrorLine?.(line);
          consoleIO.writeErr("\n" + trimTraceback(message.message) + "\n");
          finish({ ok: false, exitCode: 1 });
          break;
        }
        case "load-failed":
          consoleIO.writeErr("Could not load Python runtime: " + message.message + "\n");
          consoleIO.writeInfo("Tip: connect to the internet once so the runtime caches for offline use.\n");
          discardWorker();
          finish({ ok: false, exitCode: -1 });
          break;
      }
    }

    function onCrash(event: ErrorEvent): void {
      consoleIO.writeErr("\nPython runner crashed: " + (event.message || "unknown error") + "\n");
      discardWorker();
      finish({ ok: false, exitCode: -1 });
    }

    active.addEventListener("message", onMessage);
    active.addEventListener("error", onCrash);
    if (signal) {
      if (signal.aborted) {
        finish({ ok: false, exitCode: -1, stopped: true });
        return;
      }
      signal.addEventListener("abort", onAbort);
    }

    const request: PythonRunRequest = {
      type: "run",
      code,
      stdin: consoleIO.drainBuffer(),
      input,
      interrupt: interruptBuffer,
    };
    active.postMessage(request);
  });
}
