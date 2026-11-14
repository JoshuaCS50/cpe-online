// Runs a program out of sight and collects what it prints, for the lesson
// checker. Input comes from a fixed list instead of the keyboard.

import type { LessonLanguage } from "../content/schema";
import { runProgram } from "../runners/run";
import type { ConsoleIO } from "../terminal/console";
import type { ProgramResult, ProgramRunner } from "./checker";

/** Generous: the first run of Python or MATLAB also downloads its runtime. */
const TIME_LIMIT_MS: Record<LessonLanguage, number> = { c: 15_000, cpp: 120_000, arduino: 120_000, python: 120_000, matlab: 180_000 };

interface CaptureConsole extends ConsoleIO {
  stdout(): string;
}

export function createCaptureConsole(stdin: readonly string[]): CaptureConsole {
  const pending = [...stdin];
  let out = "";
  return {
    write: (text) => void (out += text),
    writeLine: (text) => void (out += text + "\n"),
    // Error text is reported through onError; status lines are not program output.
    writeErr: () => {},
    writeInfo: () => {},
    clear: () => void (out = ""),
    // A program that asks for more input than the check gives reaches the end of input.
    readLine: () => {
      const line = pending.shift();
      return line === undefined ? Promise.reject(new Error("end of input")) : Promise.resolve(line);
    },
    tryReadLineSync: () => pending.shift() ?? null,
    pushStdin: (text) => void pending.push(...text.split(/\r?\n/)),
    resetInput: () => void (pending.length = 0),
    cancelPendingReads: () => {},
    drainBuffer: () => {
      const text = pending.map((line) => line + "\n").join("");
      pending.length = 0;
      return text;
    },
    bufferedLineCount: () => pending.length,
    setInputActive: () => {},
    focusInput: () => {},
    appendElement: () => {},
    stdout: () => out,
  };
}

/** A runner for the checker. `signal` lets the learner cancel a check in progress. */
/** `files` are the data files the program can open; each run starts from a fresh copy. */
export function createProgramRunner(language: LessonLanguage, fileName: string, signal?: AbortSignal, files: Record<string, string> = {}): ProgramRunner {
  return async (code, stdin, sim): Promise<ProgramResult> => {
    const consoleIO = createCaptureConsole(stdin);
    const abort = new AbortController();
    const cancel = (): void => abort.abort();
    signal?.addEventListener("abort", cancel);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      abort.abort();
    }, TIME_LIMIT_MS[language]);
    let error: string | undefined;
    let filesAfter: Record<string, string> | undefined;
    let pins: string[] | undefined;
    try {
      const result = await runProgram({
        language,
        code,
        fileName,
        consoleIO,
        signal: abort.signal,
        onError: (raw) => void (error = raw.text),
        files: { ...files },
        onFiles: (after) => void (filesAfter = after),
        sim: { runMs: sim?.ms, inputs: sim?.inputs },
        onBoard: (timeline) => void (pins = timeline),
      });
      return {
        stdout: consoleIO.stdout(),
        // A program may end with return 1 on purpose after reporting bad
        // input; only a real error, a time-out or a stop counts as failing.
        ok: error === undefined && !timedOut && !result.stopped,
        files: filesAfter ?? { ...files },
        ...(pins ? { pins } : {}),
        ...(error ? { error } : {}),
        ...(timedOut ? { timedOut } : {}),
      };
    } catch (failure) {
      return { stdout: consoleIO.stdout(), ok: false, error: failure instanceof Error ? failure.message : String(failure) };
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
    }
  };
}
