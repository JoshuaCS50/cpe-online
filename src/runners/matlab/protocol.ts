// Messages between the page and the MATLAB worker.

export interface MatlabRunRequest {
  type: "run";
  code: string;
  /** Shown in error messages, for example "sum_loop.m". */
  fileName: string;
}

/** Answer to a "stdin-request": the typed line, or null for end of input. */
export interface MatlabInputReply {
  type: "stdin-reply";
  line: string | null;
}

export type MatlabWorkerRequest = MatlabRunRequest | MatlabInputReply;

export type MatlabWorkerMessage =
  | { type: "loading"; loadedBytes: number; totalBytes: number }
  | { type: "ready" }
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "stdin-request" }
  | { type: "done" }
  | { type: "error"; error: MatlabErrorReport }
  | { type: "load-failed"; message: string };

/** What the runtime reported when a program failed. */
export interface MatlabErrorReport {
  /** The runtime's full diagnostic, with the source line and a caret. */
  diagnostic: string;
  /** Just the message, for example "undefined variable 'z'". */
  message: string;
  identifier?: string;
  line: number | null;
  column: number | null;
}

/** Layout of the vendored runtime; written by scripts/vendor-runmat.mjs. */
export interface RuntimeManifest {
  version: string;
  totalBytes: number;
  parts: { file: string; bytes: number }[];
}
