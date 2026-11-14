// Turning an Arduino sketch into a C++ program and running it on the virtual
// board. Shared by the browser worker and the tests.

import { compileCpp } from "../cpp/compile";
import type { CompileResult, RunClang } from "../cpp/compile";
import { runWasiProgram } from "../cpp/wasi";
import type { WasiHost } from "../cpp/wasi";
import arduinoHeader from "./Arduino.h?raw";
import { VirtualBoard } from "./board";
import type { BoardOptions } from "./board";

/** The name clang's messages use for the learner's code. */
export const SKETCH_FILE = "sketch.ino";

/** Board time a sketch runs for when nothing else is said, in ms. */
export const DEFAULT_RUN_MS = 10_000;

/**
 * The Arduino IDE adds `#include <Arduino.h>` before a sketch. The #line
 * directive keeps clang's line numbers equal to the lines of the sketch.
 */
export function sketchSource(code: string): string {
  return `#include "Arduino.h"\n#line 1 "${SKETCH_FILE}"\n${code}`;
}

/** Headers a sketch can include. Servo lives in Arduino.h; Servo.h is there so `#include <Servo.h>` works as on a real board. */
export const SKETCH_HEADERS: Record<string, string> = {
  "Arduino.h": arduinoHeader,
  "Servo.h": '#include "Arduino.h"\n',
};

export function compileSketch(runClang: RunClang, code: string): Promise<CompileResult> {
  return compileCpp(runClang, sketchSource(code), SKETCH_HEADERS);
}

export interface SketchRun {
  board: VirtualBoard;
  exitCode: number;
}

/** Runs a compiled sketch until its board time is used up. A crash is thrown. */
export function runSketch(module: WebAssembly.Module, host: WasiHost, options: BoardOptions): SketchRun {
  const board = new VirtualBoard(options);
  const result = runWasiProgram(module, host, { arduino: board.imports() });
  return { board, exitCode: result.exitCode };
}
