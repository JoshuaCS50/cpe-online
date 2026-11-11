// Reduces each runtime's error text to a kind, a message and a position.

import { PYTHON_MAIN_FILE } from "../runners/python/protocol";
import type { ParsedError, RawError } from "./types";

/**
 * JSCPP reports in three shapes:
 *   "ERROR: Parsing Failure:\nline 4 (column 5): ...\n---^\nExpected ... but "p" found."
 *   "3:5 variable total does not exist"
 *   "Maximum call stack size exceeded"   (a JavaScript error, no position)
 */
export function parseCError(text: string): ParsedError {
  const parse = /^ERROR: Parsing Failure:\s*\nline (\d+) \(column (\d+)\)/.exec(text);
  if (parse) {
    const lines = text.trimEnd().split("\n");
    return {
      kind: "parse",
      message: lines[lines.length - 1] ?? "",
      line: Number(parse[1]),
      column: Number(parse[2]),
    };
  }
  const runtime = /^(\d+):(\d+) ([\s\S]*)$/.exec(text);
  if (runtime) {
    return { kind: "runtime", message: (runtime[3] ?? "").trim(), line: Number(runtime[1]), column: Number(runtime[2]) };
  }
  return { kind: "internal", message: text.trim(), line: null, column: null };
}

/** A Python traceback: the last line is "ExceptionName: message"; the position is the last frame in the user's file. */
export function parsePythonError(text: string): ParsedError {
  const lines = text.trimEnd().split("\n");
  const last = lines[lines.length - 1] ?? "";
  const colon = last.indexOf(":");
  const named = /^[A-Za-z_][\w.]*$/.test(colon < 0 ? last : last.slice(0, colon));
  const kind = named ? (colon < 0 ? last : last.slice(0, colon)) : "Error";
  const message = named && colon >= 0 ? last.slice(colon + 1).trim() : named ? "" : last.trim();

  const frame = new RegExp(`File "${PYTHON_MAIN_FILE.replace(".", "\\.")}", line (\\d+)`, "g");
  let line: number | null = null;
  for (const match of text.matchAll(frame)) line = Number(match[1]);
  return { kind, message, line, column: null };
}

export function parseRawError(raw: RawError): ParsedError {
  if (raw.details) {
    return {
      kind: raw.details.identifier ?? "error",
      message: raw.details.message,
      line: raw.details.line ?? null,
      column: raw.details.column ?? null,
    };
  }
  if (raw.language === "python") return parsePythonError(raw.text);
  if (raw.language === "c" || raw.language === "cpp") return parseCError(raw.text);
  return { kind: "error", message: raw.text.trim(), line: null, column: null };
}
