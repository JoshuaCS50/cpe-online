// Page side of the C / C++ worker: plain runs and debug sessions.

import type { DebugCommand, DebugListener, DebugResult, DebugSession } from "../../debugger/types";
import { explainJSCPPError } from "../../legacy/js/runners/c.js";
import type { ConsoleIO } from "../../terminal/console";
import { answerInput, canBlockForInput, createInputChannel } from "../input-channel";
import type { CWorkerMessage, CWorkerRequest } from "./protocol";

export interface CRunOptions {
  code: string;
  consoleIO: ConsoleIO;
  signal?: AbortSignal;
  onErrorLine?: (line: number) => void;
}

export interface CDebugOptions extends CRunOptions {
  breakpoints: readonly number[];
  listener: DebugListener;
}

/** A worker that finished cleanly is kept for the next run, so the runtime loads once. */
let idleWorker: Worker | null = null;

function acquireWorker(): Worker {
  const worker =
    idleWorker ??
    new Worker(new URL("./c-worker.ts", import.meta.url), {
      type: "module",
      // The worker cannot work out where /vendor is; the page can.
      name: new URL("vendor/JSCPP.es5.min.js", document.baseURI).href,
    });
  idleWorker = null;
  return worker;
}

interface Execution {
  post(request: CWorkerRequest): void;
  /** Ends the program now. */
  stop(): void;
  finished: Promise<DebugResult>;
}

/** Common plumbing for runs and debug sessions: output, input, errors, stopping. */
function execute(
  options: CRunOptions,
  onMessage: (message: CWorkerMessage) => void,
  begin: (input: SharedArrayBuffer | null) => CWorkerRequest,
): Execution {
  const { consoleIO, signal, onErrorLine } = options;
  const worker = acquireWorker();
  const input = canBlockForInput() ? createInputChannel() : null;

  let settle: (result: DebugResult) => void = () => {};
  const finished = new Promise<DebugResult>((resolve) => {
    settle = resolve;
  });
  let settled = false;

  function finish(result: DebugResult, reusable: boolean): void {
    if (settled) return;
    settled = true;
    worker.removeEventListener("message", handleMessage);
    worker.removeEventListener("error", handleCrash);
    signal?.removeEventListener("abort", stop);
    if (reusable) idleWorker = worker;
    else worker.terminate();
    settle(result);
  }

  // The worker may be deep in a loop or asleep waiting for input, so the
  // only reliable stop is to end it.
  function stop(): void {
    finish({ ok: false, exitCode: -1, stopped: true }, false);
  }

  function handleMessage(event: MessageEvent<CWorkerMessage>): void {
    const message = event.data;
    switch (message.type) {
      case "stdout":
        consoleIO.write(message.text);
        break;
      case "stdin-request":
        // The program is paused on scanf / cin. Answer when the user has
        // typed a line; a cancelled read ends the input.
        if (input) {
          consoleIO.readLine().then(
            (line) => answerInput(input, line + "\n"),
            () => answerInput(input, null),
          );
        }
        break;
      case "done":
        consoleIO.writeInfo(`\n[program exited with code ${message.exitCode}]\n`);
        finish({ ok: message.exitCode === 0, exitCode: message.exitCode }, true);
        break;
      case "error": {
        const { line, friendly } = explainJSCPPError(message.message);
        if (line) onErrorLine?.(line);
        consoleIO.writeErr(`\n❌ ${line ? `Line ${line} — ` : ""}${friendly}\n`);
        finish({ ok: false, exitCode: -1 }, true);
        break;
      }
      default:
        break;
    }
    onMessage(message);
  }

  function handleCrash(event: ErrorEvent): void {
    consoleIO.writeErr(`\n❌ The C runner crashed: ${event.message || "unknown error"}\n`);
    finish({ ok: false, exitCode: -1 }, false);
  }

  worker.addEventListener("message", handleMessage);
  worker.addEventListener("error", handleCrash);
  if (signal?.aborted) stop();
  else {
    signal?.addEventListener("abort", stop);
    worker.postMessage(begin(input));
  }

  return { post: (request) => worker.postMessage(request), stop, finished };
}

/** Runs the program to completion. */
export function runCInWorker(options: CRunOptions): Promise<DebugResult> {
  return execute(
    options,
    () => {},
    (input) => ({ type: "run", code: options.code, stdin: options.consoleIO.drainBuffer(), input }),
  ).finished;
}

/** Starts the program under the debugger. */
export function debugCInWorker(options: CDebugOptions): DebugSession {
  const { listener } = options;
  let breakpoints = [...options.breakpoints];
  let paused = false;

  const execution = execute(
    options,
    (message) => {
      if (message.type === "paused") {
        paused = true;
        listener.onPaused(message.state);
      }
    },
    (input) => ({
      type: "debug",
      code: options.code,
      stdin: options.consoleIO.drainBuffer(),
      input,
      breakpoints,
    }),
  );

  return {
    command(command: DebugCommand) {
      if (!paused) return;
      paused = false;
      listener.onResumed();
      execution.post({ type: "debug-command", command, breakpoints });
    },
    setBreakpoints(lines) {
      breakpoints = [...lines];
    },
    stop: execution.stop,
    finished: execution.finished,
  };
}
