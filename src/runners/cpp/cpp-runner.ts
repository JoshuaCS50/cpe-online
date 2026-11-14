// Page side of the C++ runner: starts a run in the C++ worker, shows its
// output, answers its requests for input, and stops it.
//
// The worker is kept between runs, because it holds the loaded compiler;
// loading it again would cost seconds. Stop ends the worker, so the next run
// loads the compiler again (from the browser's cache).

import type { DebugResult } from "../../debugger/types";
import type { ConsoleIO } from "../../terminal/console";
import { answerInput, canBlockForInput, createInputChannel } from "../input-channel";
import type { CppRunRequest, CppWorkerMessage } from "./protocol";

export interface CppRunOptions {
  code: string;
  consoleIO: ConsoleIO;
  signal?: AbortSignal;
  /** Receives compiler errors and crashes. When given, the runner prints nothing about the error itself. */
  onError?: (text: string) => void;
  /** Run the code as an Arduino sketch on the virtual board. */
  sketch?: CppRunRequest["sketch"];
  /** Receives the board's pin timeline and warnings after a sketch ran. */
  onBoard?: (timeline: string[], warnings: string[]) => void;
}

/** Longest timeline printed in the terminal; the rest is summarised. */
const TIMELINE_LINES = 60;

function printBoard(consoleIO: ConsoleIO, timeline: string[], warnings: string[], runMs: number): void {
  const seconds = runMs >= 1000 ? `${runMs / 1000} s` : `${runMs} ms`;
  if (timeline.length === 0) {
    consoleIO.writeInfo(`\n--- No pin changed in the first ${seconds} of board time ---\n`);
  } else {
    consoleIO.writeInfo(`\n--- Pins over the first ${seconds} of board time ---\n`);
    consoleIO.writeInfo(timeline.slice(0, TIMELINE_LINES).join("\n") + "\n");
    if (timeline.length > TIMELINE_LINES) consoleIO.writeInfo(`... and ${timeline.length - TIMELINE_LINES} more changes\n`);
  }
  for (const warning of warnings) consoleIO.writeInfo(`Note: ${warning}\n`);
}

let worker: Worker | null = null;

function getWorker(): Worker {
  worker ??= new Worker(new URL("./cpp-worker.ts", import.meta.url), {
    type: "module",
    name: new URL("vendor/clang/", document.baseURI).href,
  });
  return worker;
}

function discardWorker(): void {
  worker?.terminate();
  worker = null;
}

export function runCppInWorker(options: CppRunOptions): Promise<DebugResult> {
  const { code, consoleIO, signal } = options;
  const active = getWorker();
  const input = canBlockForInput() ? createInputChannel() : null;

  return new Promise<DebugResult>((resolve) => {
    let settled = false;
    let loadingShown = false;

    function finish(result: DebugResult): void {
      if (settled) return;
      settled = true;
      active.removeEventListener("message", handleMessage);
      active.removeEventListener("error", handleCrash);
      signal?.removeEventListener("abort", stop);
      resolve(result);
    }

    function stop(): void {
      discardWorker();
      finish({ ok: false, exitCode: -1, stopped: true });
    }

    function reportError(text: string): void {
      if (options.onError) options.onError(text);
      else consoleIO.writeErr(`\n${text.trimEnd()}\n`);
    }

    function handleMessage(event: MessageEvent<CppWorkerMessage>): void {
      const message = event.data;
      switch (message.type) {
        case "loading":
          if (!loadingShown) {
            loadingShown = true;
            consoleIO.writeInfo(`Loading the C++ compiler (first time only, about 20 MB)…\n`);
          }
          if (message.loaded >= message.total) consoleIO.writeInfo("C++ compiler ready.\n");
          break;
        case "compiling":
          consoleIO.writeInfo("Compiling…\n");
          break;
        case "warnings":
          consoleIO.writeInfo(`${message.text}\n`);
          break;
        case "stdout":
          consoleIO.write(message.text);
          break;
        case "stdin-request":
          if (input) {
            consoleIO.readLine().then(
              (line) => answerInput(input, line + "\n"),
              () => answerInput(input, null),
            );
          }
          break;
        case "board":
          printBoard(consoleIO, message.timeline, message.warnings, message.runMs);
          options.onBoard?.(message.timeline, message.warnings);
          break;
        case "done":
          if (!options.sketch) consoleIO.writeInfo(`\n[program exited with code ${message.exitCode}]\n`);
          finish({ ok: message.exitCode === 0, exitCode: message.exitCode });
          break;
        case "error":
          reportError(message.message);
          finish({ ok: false, exitCode: -1 });
          break;
        case "load-failed":
          consoleIO.writeErr(`\nThe C++ compiler could not be loaded: ${message.message}\nCheck the connection and press Run again.\n`);
          discardWorker();
          finish({ ok: false, exitCode: -1 });
          break;
      }
    }

    function handleCrash(event: ErrorEvent): void {
      consoleIO.writeErr(`\nThe C++ runner crashed: ${event.message || "unknown error"}\n`);
      discardWorker();
      finish({ ok: false, exitCode: -1 });
    }

    active.addEventListener("message", handleMessage);
    active.addEventListener("error", handleCrash);
    if (signal?.aborted) {
      stop();
      return;
    }
    signal?.addEventListener("abort", stop);
    const request: CppRunRequest = { type: "run", code, stdin: consoleIO.drainBuffer(), input, ...(options.sketch ? { sketch: options.sketch } : {}) };
    active.postMessage(request);
  });
}
