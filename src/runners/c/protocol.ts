// Messages between the page and the C / C++ worker.

import type { DebugCommand, PausedState } from "../../debugger/types";

interface StartFields {
  code: string;
  /** Input queued before the run; consumed before the user is asked. */
  stdin: string;
  /** Channel the worker sleeps on while the user types (see input-channel.ts). */
  input: SharedArrayBuffer | null;
}

export type CWorkerRequest =
  | ({ type: "run" } & StartFields)
  | ({ type: "debug"; breakpoints: number[] } & StartFields)
  | { type: "debug-command"; command: DebugCommand; breakpoints: number[] };

export type CWorkerMessage =
  | { type: "stdout"; text: string }
  | { type: "stdin-request" }
  | { type: "paused"; state: PausedState }
  | { type: "done"; exitCode: number }
  | { type: "error"; message: string };
