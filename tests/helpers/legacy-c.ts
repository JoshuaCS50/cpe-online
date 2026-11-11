// Runs C programs through the real JSCPP interpreter and the legacy runner
// under Node, so tests see exactly what a student sees in the browser.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { runC } from "../../src/legacy/js/runners/c.js";

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

export interface LegacyRun {
  /** Everything the program printed. */
  stdout: string;
  /** Exit code, or -1 when the run failed. */
  exitCode: number;
  ok: boolean;
  /** 1-based line the runner highlighted, or null. */
  errorLine: number | null;
  /** First line of the friendly explanation (the rule's title), or null on success. */
  errorTitle: string | null;
  /** The whole friendly explanation as shown in the output panel, or null on success. */
  errorText: string | null;
}

/** Runs `code` through the legacy C runner with `stdin` pre-queued, as the app does. */
export async function runLegacyC(code: string, stdin = ""): Promise<LegacyRun> {
  loadJscpp();
  let stdout = "";
  let errorText: string | null = null;
  let errorLine: number | null = null;
  let pending = stdin;

  const consoleIO = {
    write: (text: string) => {
      stdout += text;
    },
    writeInfo: () => {},
    writeErr: (text: string) => {
      errorText = (errorText ?? "") + text;
    },
    drainBuffer: () => {
      const out = pending;
      pending = "";
      return out;
    },
    pushStdin: () => {},
  };

  const result = await runC({
    code,
    consoleIO,
    signal: undefined,
    onErrorLine: (line: number) => {
      errorLine = line;
    },
  });

  // The runner prints "\n❌ Line N — Title\nHint\n"; the title is the first line.
  const shown = errorText as string | null;
  let errorTitle: string | null = null;
  if (shown !== null) {
    const firstLine = shown.trim().split("\n")[0] ?? "";
    errorTitle = firstLine.replace(/^❌\s*/, "").replace(/^Line \d+ — /, "");
  }

  return {
    stdout,
    exitCode: result.exitCode,
    ok: result.ok,
    errorLine,
    errorTitle,
    errorText: shown === null ? null : shown.trim(),
  };
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
