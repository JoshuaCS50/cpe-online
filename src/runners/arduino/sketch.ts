// Turning an Arduino sketch into a C++ program and running it on the virtual
// board. Shared by the browser worker and the tests.

import { compileCpp } from "../cpp/compile";
import type { CompileResult, RunClang } from "../cpp/compile";
import { runWasiProgram } from "../cpp/wasi";
import type { WasiHost } from "../cpp/wasi";
import arduinoHeader from "./Arduino.h?raw";
import ssd1306Header from "./Adafruit_SSD1306.h?raw";
import { DeepSleepWake, VirtualBoard } from "./board";
import type { BoardOptions } from "./board";
import type { BoardId } from "./profiles";

/** The name clang's messages use for the learner's code. */
export const SKETCH_FILE = "sketch.ino";

/** Board time a sketch runs for when nothing else is said, in ms. */
export const DEFAULT_RUN_MS = 10_000;

/**
 * The Arduino IDE adds `#include <Arduino.h>` before a sketch. The #line
 * directive keeps clang's line numbers equal to the lines of the sketch.
 */
export function sketchSource(code: string, board: BoardId = "uno"): string {
  // The ESP32 part of Arduino.h is switched on by this define.
  const define = board === "esp32" ? "#define CPE_BOARD_ESP32 1\n" : "";
  return `${define}#include "Arduino.h"\n#line 1 "${SKETCH_FILE}"\n${code}`;
}

/** Headers a sketch can include. Servo lives in Arduino.h; Servo.h is there so `#include <Servo.h>` works as on a real board. */
export const SKETCH_HEADERS: Record<string, string> = {
  "Arduino.h": arduinoHeader,
  "Servo.h": '#include "Arduino.h"\n',
  // I²C: the screen library talks to the board directly, so Wire only needs to exist.
  "Wire.h":
    '#ifndef CPE_WIRE_H\n#define CPE_WIRE_H\n#include "Arduino.h"\nclass TwoWire {\npublic:\n  void begin() {}\n  void begin(int, int) {}\n  void setClock(unsigned long) {}\n};\ninline TwoWire Wire;\n#endif\n',
  "SPI.h": '#include "Arduino.h"\n',
  "Adafruit_GFX.h": '#include "Arduino.h"\n',
  "Adafruit_SSD1306.h": ssd1306Header,
  // TimerOne: an interrupt every so many microseconds (Uno Timer1).
  "TimerOne.h": [
    "#ifndef CPE_TIMERONE_H",
    "#define CPE_TIMERONE_H",
    '#include "Arduino.h"',
    "class TimerOne {",
    "  double period = 1000000;",
    "  int slot = -1;",
    "  bool running = false;",
    "public:",
    "  void initialize(unsigned long microseconds = 1000000) { period = microseconds; }",
    "  void setPeriod(unsigned long microseconds) { period = microseconds; if (running) start(); }",
    "  void attachInterrupt(void (*fn)()) { slot = cpe_isr_slot(fn); start(); }",
    "  void attachInterrupt(void (*fn)(), unsigned long microseconds) { period = microseconds; attachInterrupt(fn); }",
    "  void detachInterrupt() { stop(); slot = -1; }",
    "  void start() { if (slot >= 0) { cpe_timer_start(slot, period, 1); running = true; } }",
    "  void stop() { if (slot >= 0) cpe_timer_stop(slot); running = false; }",
    "  void restart() { start(); }",
    "  void resume() { start(); }",
    "};",
    "inline TimerOne Timer1;",
    "#endif",
    "",
  ].join("\n"),
};

export function compileSketch(runClang: RunClang, code: string, board: BoardId = "uno"): Promise<CompileResult> {
  return compileCpp(runClang, sketchSource(code, board), SKETCH_HEADERS);
}

export interface SketchRun {
  board: VirtualBoard;
  exitCode: number;
}

/** Runs a compiled sketch until its board time is used up. A crash is thrown. */
export function runSketch(module: WebAssembly.Module, host: WasiHost, options: BoardOptions): SketchRun {
  const board = new VirtualBoard(options);
  // Each wake-up from deep sleep starts the program again with fresh memory, on the same board and clock.
  for (;;) {
    try {
      const result = runWasiProgram(module, host, { arduino: board.imports() }, (memory, instance) => board.useInstance(memory, instance));
      return { board, exitCode: result.exitCode };
    } catch (error) {
      if (!(error instanceof DeepSleepWake)) throw error;
      if (!board.wakeAfterSleep(error.sleepMs)) return { board, exitCode: 0 };
    }
  }
}
