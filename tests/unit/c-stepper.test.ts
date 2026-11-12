// Drives the real JSCPP debugger through the stepper, in Node.

import { describe, expect, it } from "vitest";
import { createCStepper } from "../../src/debugger/c-stepper";
import type { StepOutcome } from "../../src/debugger/c-stepper";
import type { PausedState } from "../../src/debugger/types";
import type { JscppDebugger } from "../../src/runners/c/jscpp";
import { debugC } from "../helpers/jscpp";

//  1 #include <stdio.h>
//  2
//  3 int square(int x) {
//  4     int y = x * x;
//  5     return y;
//  6 }
//  7
//  8 int main() {
//  9     int a = 3;
// 10     int total = 0;
// 11     int i;
// 12     for (i = 0; i < 2; i++) {
// 13         total = total + square(a + i);
// 14     }
// 15     printf("%d\n", total);
// 16     return 0;
// 17 }
const PROGRAM = [
  "#include <stdio.h>",
  "",
  "int square(int x) {",
  "    int y = x * x;",
  "    return y;",
  "}",
  "",
  "int main() {",
  "    int a = 3;",
  "    int total = 0;",
  "    int i;",
  "    for (i = 0; i < 2; i++) {",
  "        total = total + square(a + i);",
  "    }",
  '    printf("%d\\n", total);',
  "    return 0;",
  "}",
  "",
].join("\n");

function start(code: string, input: string[] = []) {
  const { debuggerObject, stdout } = debugC(code, input);
  return { stepper: createCStepper(debuggerObject as JscppDebugger), stdout };
}

function paused(outcome: StepOutcome): PausedState {
  if (outcome.kind !== "paused") throw new Error(`expected a pause, program exited with ${outcome.exitCode}`);
  return outcome.state;
}

const values = (state: PausedState, frame = 0): Record<string, string> =>
  Object.fromEntries((state.frames[frame]?.variables ?? []).map((v) => [v.name, v.value]));

const NONE = new Set<number>();

describe("C stepper", () => {
  it("pauses on the first line of main when there are no breakpoints", () => {
    const { stepper } = start(PROGRAM);
    const state = paused(stepper.start(NONE));
    expect(state.reason).toBe("entry");
    expect(state.line).toBe(9);
    expect(state.frames.map((f) => f.name)).toEqual(["main"]);
  });

  it("runs to the first breakpoint when there is one", () => {
    const { stepper } = start(PROGRAM);
    const state = paused(stepper.start(new Set([15])));
    expect(state.reason).toBe("breakpoint");
    expect(state.line).toBe(15);
    expect(values(state)).toMatchObject({ a: "3", total: "25", i: "2" });
  });

  it("step over walks main line by line without entering the function", () => {
    const { stepper } = start(PROGRAM);
    const lines = [paused(stepper.start(NONE)).line];
    for (let n = 0; n < 4; n++) lines.push(paused(stepper.resume("stepOver", NONE)).line);
    expect(lines).toEqual([9, 10, 12, 13, 12]);
  });

  it("step into enters the function and shows its frame above main", () => {
    const { stepper } = start(PROGRAM);
    stepper.start(new Set([13]));
    const state = paused(stepper.resume("stepInto", NONE));
    expect(state.line).toBe(4);
    expect(state.frames.map((f) => [f.name, f.line])).toEqual([
      ["square", 4],
      ["main", 13],
    ]);
    expect(values(state, 0)).toEqual({ x: "3" });
    expect(values(state, 1)).toMatchObject({ a: "3", total: "0", i: "0" });
  });

  it("keeps each function's variables in its own frame", () => {
    const { stepper } = start(PROGRAM);
    const state = paused(stepper.start(new Set([5])));
    expect(values(state, 0)).toEqual({ y: "9", x: "3" });
    expect(Object.keys(values(state, 1))).not.toContain("x");
    expect(Object.keys(values(state, 1))).not.toContain("y");
  });

  it("step out returns to the caller", () => {
    const { stepper } = start(PROGRAM);
    stepper.start(new Set([4]));
    const state = paused(stepper.resume("stepOut", NONE));
    expect(state.frames.map((f) => f.name)).toEqual(["main"]);
    expect(state.reason).toBe("step");
  });

  it("continue stops at a breakpoint each time the line is reached", () => {
    const { stepper } = start(PROGRAM);
    const first = paused(stepper.start(new Set([4])));
    const second = paused(stepper.resume("continue", new Set([4])));
    expect([values(first).x, values(second).x]).toEqual(["3", "4"]);
    const end = stepper.resume("continue", new Set([4]));
    expect(end).toEqual({ kind: "exited", exitCode: 0 });
  });

  it("a breakpoint inside a function stops a step over", () => {
    const { stepper } = start(PROGRAM);
    stepper.start(new Set([13]));
    const state = paused(stepper.resume("stepOver", new Set([5])));
    expect(state.reason).toBe("breakpoint");
    expect(state.line).toBe(5);
  });

  it("applies breakpoints given with a later command", () => {
    const { stepper } = start(PROGRAM);
    stepper.start(NONE);
    expect(paused(stepper.resume("continue", new Set([15]))).line).toBe(15);
  });

  it("runs to the end and reports the exit code and output", () => {
    const { stepper, stdout } = start(PROGRAM);
    stepper.start(NONE);
    expect(stepper.resume("continue", NONE)).toEqual({ kind: "exited", exitCode: 0 });
    expect(stdout()).toBe("25\n");
  });

  it("formats arrays, characters, strings, floats and pointers", () => {
    const code = [
      "#include <stdio.h>",
      "int main() {",
      "    float f = 2.5;",
      "    char c = 'k';",
      "    int nums[3] = {4, 5, 6};",
      '    char name[6] = "Ada";',
      "    int n = 7;",
      "    int *p = &n;",
      '    printf("%d\\n", n);',
      "    return 0;",
      "}",
      "",
    ].join("\n");
    const { stepper } = start(code);
    const state = paused(stepper.start(new Set([9])));
    expect(values(state)).toEqual({ f: "2.5", c: "'k'", nums: "[4,5,6]", name: '"Ada"', n: "7", p: "->7" });
    expect(state.frames[0]?.variables.find((v) => v.name === "nums")?.type).toBe("int[3]");
  });

  it("lists global variables apart from the frames, without library functions", () => {
    const code = ["#include <stdio.h>", "int counter = 10;", "int main() {", "    counter = counter + 1;", "    return 0;", "}", ""].join("\n");
    const { stepper } = start(code);
    const state = paused(stepper.start(NONE));
    expect(state.globals).toEqual([{ name: "counter", value: "10", type: "int" }]);
  });

  it("reads typed input while stepping", () => {
    const code = [
      "#include <stdio.h>",
      "int main() {",
      "    int n;",
      '    scanf("%d", &n);',
      '    printf("%d\\n", n * 2);',
      "    return 0;",
      "}",
      "",
    ].join("\n");
    const { stepper, stdout } = start(code, ["21"]);
    const state = paused(stepper.start(new Set([5])));
    expect(values(state)).toEqual({ n: "21" });
    stepper.resume("continue", NONE);
    expect(stdout()).toBe("42\n");
  });
});
