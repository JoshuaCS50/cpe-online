// Runs C programs through the real JSCPP interpreter under Node, so tests see
// exactly what a student sees in the browser.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

interface Jscpp {
  run(code: string, input: string, config?: Record<string, unknown>): unknown;
}

const globals = globalThis as unknown as { window?: unknown; JSCPP?: Jscpp };

function loadJscpp(): Jscpp {
  if (!globals.JSCPP) {
    // The vendored bundle is a classic script that attaches itself to `window`.
    globals.window = globalThis;
    const bundle = fileURLToPath(new URL("../../public/vendor/JSCPP.es5.min.js", import.meta.url));
    vm.runInThisContext(readFileSync(bundle, "utf8"), { filename: bundle });
  }
  if (!globals.JSCPP) throw new Error("JSCPP bundle did not register itself");
  return globals.JSCPP;
}

export interface InteractiveRun {
  stdout: string;
  /** How many times the program asked the host for more input. */
  requests: number;
  /** Lines that were never asked for. */
  unused: string[];
}

/**
 * Runs `code` with input supplied one line per request, the way the terminal
 * does: nothing is available up front, and each request hands over the next
 * entry of `lines` (a newline is appended). When `lines` runs out, requests
 * get end-of-input.
 */
export function runCInteractive(code: string, lines: readonly string[]): InteractiveRun {
  const jscpp = loadJscpp();
  const remaining = [...lines];
  let stdout = "";
  let requests = 0;
  jscpp.run(code, "", {
    stdio: {
      write: (text: string) => {
        stdout += text;
      },
      drain: () => {
        requests += 1;
        const next = remaining.shift();
        return next === undefined ? null : next + "\n";
      },
    },
  });
  return { stdout, requests, unused: remaining };
}

/**
 * Starts `code` under JSCPP's debugger and returns the raw debugger object
 * plus a way to read what the program has printed so far.
 */
export function debugC(code: string, lines: readonly string[] = []): { debuggerObject: unknown; stdout: () => string } {
  const jscpp = loadJscpp();
  const remaining = [...lines];
  let stdout = "";
  const debuggerObject = jscpp.run(code, "", {
    debug: true,
    stdio: {
      write: (text: string) => {
        stdout += text;
      },
      drain: () => {
        const next = remaining.shift();
        return next === undefined ? null : next + "\n";
      },
    },
  });
  return { debuggerObject, stdout: () => stdout };
}

/** The untranslated JSCPP error message for `code`, or null if it runs cleanly. */
export function rawJscppError(code: string, stdin = ""): string | null {
  const jscpp = loadJscpp();
  try {
    jscpp.run(code, stdin, { stdio: { write: () => {} }, maxTimeout: 5000 });
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
