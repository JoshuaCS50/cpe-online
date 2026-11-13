// C / C++ worker. Runs the JSCPP interpreter off the main thread, either
// straight through or under the debugger.
//
// Input: lines queued before the run are consumed first. When the program
// reads more, the worker sleeps on a shared buffer until the user types a
// line in the terminal. Without a shared buffer it gets end of input.
//
// Debugging: each command message runs the program synchronously to the next
// stop and posts the paused state. Between commands the worker is idle, so
// the page stays in control. A program that never reaches a stop can only be
// ended by terminating the worker, which is what Stop does.

import { createCStepper } from "../../debugger/c-stepper";
import type { CStepper, StepOutcome } from "../../debugger/c-stepper";
import { waitForInput } from "../input-channel";
import type { Jscpp, JscppConfig } from "./jscpp";
import { escapeSpacesInStringLiterals } from "./prepare-source";
import type { CWorkerMessage, CWorkerRequest } from "./protocol";

const scope = self as unknown as {
  name: string;
  JSCPP?: Jscpp;
  window?: unknown;
  postMessage(message: CWorkerMessage): void;
};

const post = (message: CWorkerMessage): void => scope.postMessage(message);

let jscppPromise: Promise<Jscpp> | null = null;

/**
 * The interpreter is a classic script that registers itself on `window`. A
 * module worker has neither `importScripts` nor `window`, so the script is
 * fetched and evaluated in the global scope. Its URL arrives as the worker's
 * name, because only the page knows where /vendor is.
 */
function loadJscpp(): Promise<Jscpp> {
  jscppPromise ??= (async () => {
    const response = await fetch(scope.name);
    if (!response.ok) throw new Error(`Could not load the C runtime (${response.status})`);
    scope.window = self;
    (0, eval)(await response.text());
    if (!scope.JSCPP) throw new Error("The C runtime did not start");
    return scope.JSCPP;
  })();
  return jscppPromise;
}

function config(stdin: string, input: SharedArrayBuffer | null, files: Record<string, string>): JscppConfig {
  let queued = stdin;
  return {
    files,
    stdio: {
      write: (text) => post({ type: "stdout", text }),
      // The patched JSCPP build calls this each time the program reads and
      // its buffer is empty.
      drain: () => {
        if (queued) {
          const out = queued;
          queued = "";
          return out;
        }
        return input ? waitForInput(input, () => post({ type: "stdin-request" })) : null;
      },
    },
    unsigned_overflow: "warn",
    includes: {},
  };
}

let stepper: CStepper | null = null;

/** The current run's files, and what they held when it started. */
let files: Record<string, string> = {};
let filesAtStart = "{}";

/** Tells the page about files the program created or changed. */
function reportFiles(): void {
  const now = JSON.stringify(files);
  if (now !== filesAtStart) post({ type: "files", files: { ...files } });
  filesAtStart = now;
}

function report(outcome: StepOutcome): void {
  if (outcome.kind === "paused") {
    post({ type: "paused", state: outcome.state });
  } else {
    stepper = null;
    reportFiles();
    post({ type: "done", exitCode: outcome.exitCode });
  }
}

async function handle(request: CWorkerRequest): Promise<void> {
  try {
    if (request.type === "debug-command") {
      if (stepper) report(stepper.resume(request.command, new Set(request.breakpoints)));
      return;
    }

    const jscpp = await loadJscpp();
    const source = escapeSpacesInStringLiterals(request.code);
    files = { ...request.files };
    filesAtStart = JSON.stringify(files);
    const options = config(request.stdin, request.input, files);
    if (request.type === "run") {
      const exitCode = jscpp.run(source, "", options);
      reportFiles();
      post({ type: "done", exitCode });
    } else {
      stepper = createCStepper(jscpp.run(source, "", { ...options, debug: true }));
      report(stepper.start(new Set(request.breakpoints)));
    }
  } catch (error) {
    stepper = null;
    reportFiles();
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
}

self.addEventListener("message", (event: MessageEvent<CWorkerRequest>) => void handle(event.data));
