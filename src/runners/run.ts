// Runs a program in whichever runtime its language needs. Every runtime
// reports failures the same way, as a RawError, so the caller can explain
// them with one catalog.

import type { DebugResult } from "../debugger/types";
import type { RawError } from "../diagnostics/types";
import type { Language } from "../storage/types";
import type { ConsoleIO } from "../terminal/console";
import { runCInWorker } from "./c/c-runner";
import { runMatlabInWorker } from "./matlab/matlab-runner";
import { runPythonInWorker } from "./python/python-runner";

export interface RunOptions {
  language: Language;
  code: string;
  /** Shown in error messages, for example "sum_loop.m". */
  fileName: string;
  consoleIO: ConsoleIO;
  signal?: AbortSignal;
  onError: (error: RawError) => void;
}

/** Languages whose programs the Stop button can end. */
export function canStop(language: string | undefined): boolean {
  return language === "c" || language === "cpp" || language === "python" || language === "matlab";
}

export function runProgram(options: RunOptions): Promise<DebugResult> {
  const { language, code, fileName, consoleIO, signal, onError } = options;
  switch (language) {
    case "c":
    case "cpp":
      return runCInWorker({ code, consoleIO, signal, onError: (text) => onError({ language, text }) });
    case "python":
      return runPythonInWorker({ code, consoleIO, signal, onError: (text) => onError({ language, text }) });
    case "matlab":
      return runMatlabInWorker({
        code,
        fileName,
        consoleIO,
        signal,
        onError: (error) =>
          onError({
            language,
            text: error.diagnostic,
            details: {
              message: error.message,
              identifier: error.identifier,
              line: error.line ?? undefined,
              column: error.column ?? undefined,
            },
          }),
      });
    case "java":
      consoleIO.writeInfo(
        "Java cannot run in the browser yet.\n" +
          "You can still write and save .java files here, and run them with a JDK on a computer.\n",
      );
      return Promise.resolve({ ok: false, exitCode: -1 });
  }
}
