// Runs a program in whichever runtime its language needs. Every runtime
// reports failures the same way, as a RawError, so the caller can explain
// them with one catalog.

import type { DebugResult } from "../debugger/types";
import type { RawError } from "../diagnostics/types";
import type { Language } from "../storage/types";
import type { ConsoleIO } from "../terminal/console";
import { runCInWorker } from "./c/c-runner";
import { runCppInWorker } from "./cpp/cpp-runner";
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
  /** Files a C program may open with fopen, name -> text. */
  files?: Record<string, string>;
  /** Receives every file after a C run that created or changed any. */
  onFiles?: (files: Record<string, string>) => void;
}

/** Languages whose programs the Stop button can end. */
export function canStop(language: string | undefined): boolean {
  return language === "c" || language === "cpp" || language === "python" || language === "matlab";
}

export function runProgram(options: RunOptions): Promise<DebugResult> {
  const { language, code, fileName, consoleIO, signal, onError, files, onFiles } = options;
  switch (language) {
    case "cpp":
      // Real C++ (clang in WebAssembly). Files are not supported here yet.
      return runCppInWorker({ code, consoleIO, signal, onError: (text) => onError({ language, text }) });
    case "c":
      return runCInWorker({ code, consoleIO, signal, files, onFiles, onError: (text) => onError({ language, text }) });
    case "python":
      return runPythonInWorker({ code, consoleIO, signal, files, onFiles, onError: (text) => onError({ language, text }) });
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
    case "text":
      consoleIO.writeInfo(`This is a data file, not a program. A C program can read it with fopen("${fileName}", "r").\n`);
      return Promise.resolve({ ok: false, exitCode: -1 });
    case "java":
      consoleIO.writeInfo(
        "Java cannot run in the browser yet.\n" +
          "You can still write and save .java files here, and run them with a JDK on a computer.\n",
      );
      return Promise.resolve({ ok: false, exitCode: -1 });
  }
}
