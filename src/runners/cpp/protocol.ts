// Messages between the page and the C++ worker.

import type { BoardEvent, BoardReport, PinReads, ScheduledInput } from "../arduino/board";
import type { BoardId } from "../arduino/profiles";

/** The vendored compiler's manifest, written by scripts/vendor-clang.mjs. */
export interface ClangManifest {
  version: string;
  /** Folder holding the files, relative to /vendor/clang/. */
  dir: string;
  totalBytes: number;
  /** Files served as they are. */
  whole: string[];
  /** Files served in parts; the worker joins them. */
  split: Record<string, { bytes: number; parts: { file: string; bytes: number }[] }>;
}

export interface CppRunRequest {
  type: "run";
  code: string;
  /** Input queued before the run; consumed before the user is asked. */
  stdin: string;
  /** Channel the worker sleeps on while the user types (see input-channel.ts). */
  input: SharedArrayBuffer | null;
  /** Present for an Arduino sketch: how long to run the virtual board, and inputs over time. */
  /** `live`: run in real time with inputs from the page (see arduino/live.ts). */
  sketch?: { runMs: number; inputs: ScheduledInput[]; board?: BoardId; live?: SharedArrayBuffer };
}

export type CppWorkerMessage =
  /** An Arduino sketch finished: pin changes over time and warnings about the board. */
  | { type: "board"; report: BoardReport }
  /** A live sketch's changes since the last message, the board time, and the pin modes. */
  | { type: "live"; events: BoardEvent[]; t: number; modes: number[]; reads: PinReads }
  /** The compiler is downloading for the first time: bytes so far of the total. */
  | { type: "loading"; loaded: number; total: number }
  | { type: "compiling" }
  /** Warnings from a successful compile. */
  | { type: "warnings"; text: string }
  | { type: "stdout"; text: string }
  | { type: "stdin-request" }
  | { type: "done"; exitCode: number }
  /** stage "compile": clang's messages; "runtime": the program crashed. */
  | { type: "error"; stage: "compile" | "runtime"; message: string }
  | { type: "load-failed"; message: string };
