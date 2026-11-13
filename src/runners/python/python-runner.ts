// Page side of the Python worker: starts runs and debug sessions, relays
// output to the terminal, answers input requests, and stops programs.

import type { PauseReply } from "../../debugger/python-stepper";
import type { DebugCommand, DebugListener, DebugResult, DebugSession } from "../../debugger/types";
import type { ConsoleIO } from "../../terminal/console";
import { answerInput, canBlockForInput, createInputChannel } from "../input-channel";
import { PYTHON_MAIN_FILE } from "./protocol";
import type { PythonRunRequest, PythonWorkerMessage } from "./protocol";

export interface PythonRunOptions {
  code: string;
  consoleIO: ConsoleIO;
  signal?: AbortSignal;
  onErrorLine?: (line: number) => void;
  /**
   * Receives the full traceback. When given, the runner prints nothing about
   * the error itself and leaves the explanation to the caller.
   */
  onError?: (text: string) => void;
  /** Files the program may open with open(), name -> text. */
  files?: Record<string, string>;
  /** Receives every file after a run that created or changed any. */
  onFiles?: (files: Record<string, string>) => void;
}

export interface PythonDebugOptions extends PythonRunOptions {
  breakpoints: readonly number[];
  listener: DebugListener;
}

export type PythonRunResult = DebugResult;

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

interface Execution {
  stop(): void;
  finished: Promise<PythonRunResult>;
}

/** Common plumbing for runs and debug sessions. */
function execute(
  options: PythonRunOptions,
  debug: PythonRunRequest["debug"],
  onMessage: (message: PythonWorkerMessage) => void,
): Execution {
  const { code, consoleIO, signal, onErrorLine } = options;
  const active = getWorker();
  // Shared memory needs cross-origin isolation. Without it the program still
  // runs, but input() gets end of input and Stop has to end the worker.
  const isolated = canBlockForInput();
  const input = isolated ? createInputChannel() : null;
  const interruptBuffer = isolated ? new SharedArrayBuffer(1) : null;
  const interrupt = interruptBuffer ? new Uint8Array(interruptBuffer) : null;

  let settle: (result: PythonRunResult) => void = () => {};
  const finished = new Promise<PythonRunResult>((resolve) => {
    settle = resolve;
  });
  let settled = false;
  let stopping = false;
  let killTimer: ReturnType<typeof setTimeout> | undefined;

  function finish(result: PythonRunResult): void {
    if (settled) return;
    settled = true;
    clearTimeout(killTimer);
    active.removeEventListener("message", handleMessage);
    active.removeEventListener("error", handleCrash);
    signal?.removeEventListener("abort", stop);
    settle(result);
  }

  // First ask politely: SIGINT raises KeyboardInterrupt at the next Python
  // instruction, a pending input() gets end of input, and a paused debugger
  // is told to stop. Code that none of these reach loses the worker after a
  // short grace period; the runtime then reloads on the next run.
  function stop(): void {
    if (settled || stopping) return;
    stopping = true;
    if (!interrupt || !input) {
      discardWorker();
      finish({ ok: false, exitCode: -1, stopped: true });
      return;
    }
    interrupt[0] = 2;
    answerInput(input, null);
    if (debug) answerInput(debug.control, null);
    killTimer = setTimeout(() => {
      discardWorker();
      finish({ ok: false, exitCode: -1, stopped: true });
    }, STOP_GRACE_MS);
  }

  function handleMessage(event: MessageEvent<PythonWorkerMessage>): void {
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
        if (input) {
          consoleIO.readLine().then(
            (line) => answerInput(input, line + "\n"),
            () => answerInput(input, null),
          );
        }
        break;
      case "files":
        options.onFiles?.(message.files);
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
        if (options.onError) {
          options.onError(trimTraceback(message.message));
          finish({ ok: false, exitCode: 1 });
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
      default:
        break;
    }
    onMessage(message);
  }

  function handleCrash(event: ErrorEvent): void {
    consoleIO.writeErr("\nPython runner crashed: " + (event.message || "unknown error") + "\n");
    discardWorker();
    finish({ ok: false, exitCode: -1 });
  }

  active.addEventListener("message", handleMessage);
  active.addEventListener("error", handleCrash);
  if (signal?.aborted) {
    finish({ ok: false, exitCode: -1, stopped: true });
  } else {
    signal?.addEventListener("abort", stop);
    const request: PythonRunRequest = {
      type: "run",
      code,
      stdin: consoleIO.drainBuffer(),
      input,
      interrupt: interruptBuffer,
      files: options.files,
      debug,
    };
    active.postMessage(request);
  }

  return { stop, finished };
}

/** Runs the program to completion. */
export function runPythonInWorker(options: PythonRunOptions): Promise<PythonRunResult> {
  return execute(options, undefined, () => {}).finished;
}

/** Starts the program under the debugger. */
export function debugPythonInWorker(options: PythonDebugOptions): DebugSession {
  const { listener } = options;
  const control = createInputChannel();
  let breakpoints = [...options.breakpoints];
  let paused = false;

  const execution = execute(options, { breakpoints, control }, (message) => {
    if (message.type === "paused") {
      paused = true;
      listener.onPaused(message.state);
    }
  });

  return {
    command(command: DebugCommand) {
      if (!paused) return;
      paused = false;
      listener.onResumed();
      const reply: PauseReply = { command, breakpoints };
      answerInput(control, JSON.stringify(reply));
    },
    setBreakpoints(lines) {
      breakpoints = [...lines];
    },
    stop: execution.stop,
    finished: execution.finished,
  };
}
