// Messages between the page and the C / C++ worker.

import type { DebugCommand, PausedState } from "../../debugger/types";

interface StartFields {
  code: string;
  /** Input queued before the run; consumed before the user is asked. */
  stdin: string;
  /** Channel the worker sleeps on while the user types (see input-channel.ts). */
  input: SharedArrayBuffer | null;
  /** Files the program may open, name -> text. */
  files?: Record<string, string>;
}

export type CWorkerRequest =
  | ({ type: "run" } & StartFields)
  | ({ type: "debug"; breakpoints: number[] } & StartFields)
  | { type: "debug-command"; command: DebugCommand; breakpoints: number[] };

export type CWorkerMessage =
  | { type: "stdout"; text: string }
  | { type: "stdin-request" }
  | { type: "paused"; state: PausedState }
  /** Every file after the run, sent before "done" or "error" when the program changed any. */
  | { type: "files"; files: Record<string, string> }
  | { type: "done"; exitCode: number }
  | { type: "error"; message: string };
