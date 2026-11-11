// Page side of the MATLAB worker: starts runs, relays output to the terminal,
// answers input requests, and stops programs.

import type { DebugResult } from "../../debugger/types";
import type { ConsoleIO } from "../../terminal/console";
import type { MatlabWorkerMessage, MatlabWorkerRequest } from "./protocol";

export interface MatlabRunOptions {
  code: string;
  fileName: string;
  consoleIO: ConsoleIO;
  signal?: AbortSignal;
  onErrorLine?: (line: number) => void;
}

let worker: Worker | null = null;

function getWorker(): Worker {
  worker ??= new Worker(new URL("./matlab-worker.ts", import.meta.url), {
    type: "module",
    // The worker cannot work out where /vendor is; the page can.
    name: new URL("vendor/runmat/", document.baseURI).href,
  });
  return worker;
}

function discardWorker(): void {
  worker?.terminate();
  worker = null;
}

/** Download size in whole megabytes, for the first-run notice. */
function megabytes(bytes: number): string {
  return `${Math.round(bytes / 1_000_000)} MB`;
}

export function runMatlabInWorker(options: MatlabRunOptions): Promise<DebugResult> {
  const { code, fileName, consoleIO, signal, onErrorLine } = options;
  const active = getWorker();
  const send = (request: MatlabWorkerRequest): void => active.postMessage(request);

  return new Promise<DebugResult>((resolve) => {
    let settled = false;
    let announcedDownload = false;

    function finish(result: DebugResult): void {
      if (settled) return;
      settled = true;
      active.removeEventListener("message", handleMessage);
      active.removeEventListener("error", handleCrash);
      signal?.removeEventListener("abort", stop);
      resolve(result);
    }

    // A running program cannot be interrupted from outside, so Stop ends the
    // worker. The runtime is reloaded (from the browser cache) on the next run.
    function stop(): void {
      discardWorker();
      finish({ ok: false, exitCode: -1, stopped: true });
    }

    function handleMessage(event: MessageEvent<MatlabWorkerMessage>): void {
      const message = event.data;
      switch (message.type) {
        case "loading":
          if (!announcedDownload) {
            announcedDownload = true;
            consoleIO.writeInfo(
              `Loading MATLAB runtime (first time only, about ${megabytes(message.totalBytes)} uncompressed)…\n`,
            );
          }
          break;
        case "ready":
          consoleIO.writeInfo("MATLAB runtime ready.\n");
          break;
        case "stdout":
          consoleIO.write(message.text);
          break;
        case "stderr":
          consoleIO.writeErr(message.text);
          break;
        case "stdin-request":
          consoleIO.readLine().then(
            (line) => send({ type: "stdin-reply", line }),
            () => send({ type: "stdin-reply", line: null }),
          );
          break;
        case "done":
          consoleIO.writeInfo("\n[program finished]\n");
          finish({ ok: true, exitCode: 0 });
          break;
        case "error":
          if (message.line !== null) onErrorLine?.(message.line);
          consoleIO.writeErr("\n" + message.message.trimEnd() + "\n");
          finish({ ok: false, exitCode: 1 });
          break;
        case "load-failed":
          consoleIO.writeErr("Could not load the MATLAB runtime: " + message.message + "\n");
          consoleIO.writeInfo("Tip: connect to the internet once so the runtime is stored for offline use.\n");
          discardWorker();
          finish({ ok: false, exitCode: -1 });
          break;
      }
    }

    function handleCrash(event: ErrorEvent): void {
      consoleIO.writeErr("\nThe MATLAB runner crashed: " + (event.message || "unknown error") + "\n");
      discardWorker();
      finish({ ok: false, exitCode: -1 });
    }

    active.addEventListener("message", handleMessage);
    active.addEventListener("error", handleCrash);
    if (signal?.aborted) {
      finish({ ok: false, exitCode: -1, stopped: true });
      return;
    }
    signal?.addEventListener("abort", stop);
    send({ type: "run", code, fileName });
  });
}
