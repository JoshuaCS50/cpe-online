// Runs Arduino sketches on the virtual board in Node, with the real clang
// and the same Arduino.h and board as the browser.

import type { ScheduledInput } from "../../src/runners/arduino/board";
import { DEFAULT_RUN_MS, SKETCH_HEADERS, runSketch, sketchSource } from "../../src/runners/arduino/sketch";
import { compileCppCached } from "./clang";

export interface SketchResult {
  serial: string;
  timeline: string[];
  warnings: string[];
  /** Compiler messages or a crash, or null. */
  error: string | null;
}

export async function runArduino(code: string, options: { runMs?: number; inputs?: readonly ScheduledInput[] } = {}): Promise<SketchResult> {
  const compiled = await compileCppCached(sketchSource(code), SKETCH_HEADERS);
  if (!compiled.wasm) return { serial: "", timeline: [], warnings: [], error: compiled.messages || "The compiler stopped without a message." };
  let serial = "";
  try {
    const module = await WebAssembly.compile(compiled.wasm as BufferSource);
    const { board } = runSketch(
      module,
      { write: (_fd, text) => void (serial += text), readMore: () => null },
      { runMs: options.runMs ?? DEFAULT_RUN_MS, inputs: options.inputs ?? [] },
    );
    return { serial, timeline: board.timeline(), warnings: board.warnings, error: null };
  } catch (error) {
    return { serial, timeline: [], warnings: [], error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) };
  }
}
