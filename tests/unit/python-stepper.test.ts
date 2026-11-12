// Drives the Python stepping driver under real Pyodide, in Node.

import { loadPyodide } from "pyodide";
import { beforeAll, describe, expect, it } from "vitest";
import { installPythonDebugger } from "../../src/debugger/python-stepper";
import type { PauseReply, PythonDebugFunction } from "../../src/debugger/python-stepper";
import type { DebugCommand, PausedState } from "../../src/debugger/types";

//  1 def square(x):
//  2     y = x * x
//  3     return y
//  4
//  5 a = 3
//  6 total = 0
//  7 for i in range(2):
//  8     total = total + square(a + i)
//  9 print(total)
const PROGRAM = [
  "def square(x):",
  "    y = x * x",
  "    return y",
  "",
  "a = 3",
  "total = 0",
  "for i in range(2):",
  "    total = total + square(a + i)",
  "print(total)",
  "",
].join("\n");

type Pyodide = Awaited<ReturnType<typeof loadPyodide>>;
let pyodide: Pyodide;
let debug: PythonDebugFunction;
let printed = "";

beforeAll(async () => {
  pyodide = await loadPyodide();
  pyodide.setStdout({ batched: (line: string) => (printed += line + "\n") });
  debug = installPythonDebugger(pyodide);
}, 60_000);

type Step = DebugCommand | "stop" | { command: DebugCommand; breakpoints: number[] };

/** Runs `code`, answering each pause with the next scripted step; returns the pauses seen. */
function session(code: string, breakpoints: number[], steps: Step[]): { pauses: PausedState[]; error: string | null } {
  printed = "";
  const pauses: PausedState[] = [];
  const queue = [...steps];
  const pause = (stateJson: string): string => {
    pauses.push(JSON.parse(stateJson) as PausedState);
    const next = queue.shift() ?? "continue";
    const reply: PauseReply = typeof next === "string" ? { command: next, breakpoints } : next;
    return JSON.stringify(reply);
  };
  const namespace = pyodide.globals.get("dict")();
  let error: string | null = null;
  try {
    debug(code, "main.py", pause, breakpoints, namespace);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  } finally {
    namespace.destroy();
  }
  return { pauses, error };
}

const values = (state: PausedState | undefined, frame = 0): Record<string, string> =>
  Object.fromEntries((state?.frames[frame]?.variables ?? []).map((v) => [v.name, v.value]));

describe("Python stepper", () => {
  it("pauses on the first line when there are no breakpoints", () => {
    const { pauses } = session(PROGRAM, [], ["continue"]);
    expect(pauses).toHaveLength(1);
    expect(pauses[0]).toMatchObject({ reason: "entry", line: 1 });
    expect(pauses[0]?.frames.map((f) => f.name)).toEqual(["<module>"]);
    expect(printed).toBe("25\n");
  });

  it("runs to the first breakpoint when there is one", () => {
    const { pauses } = session(PROGRAM, [9], ["continue"]);
    expect(pauses[0]).toMatchObject({ reason: "breakpoint", line: 9 });
    expect(values(pauses[0])).toEqual({ a: "3", total: "25", i: "1" });
  });

  it("step over stays in the caller", () => {
    const { pauses } = session(PROGRAM, [], ["stepOver", "stepOver", "stepOver", "stepOver", "stepOver", "continue"]);
    expect(pauses.map((p) => p.line)).toEqual([1, 5, 6, 7, 8, 7]);
    expect(pauses.every((p) => p.frames.length === 1)).toBe(true);
  });

  it("step into enters the function and shows its frame above the module", () => {
    const { pauses } = session(PROGRAM, [8], ["stepInto", "continue"]);
    const inside = pauses[1];
    expect(inside).toMatchObject({ reason: "step", line: 2 });
    expect(inside?.frames.map((f) => [f.name, f.line])).toEqual([
      ["square", 2],
      ["<module>", 8],
    ]);
    expect(values(inside, 0)).toEqual({ x: "3" });
    expect(values(inside, 1)).toEqual({ a: "3", total: "0", i: "0" });
  });

  it("step out returns to the caller", () => {
    const { pauses } = session(PROGRAM, [2], ["stepOut", { command: "continue", breakpoints: [] }]);
    expect(pauses[1]?.frames.map((f) => f.name)).toEqual(["<module>"]);
    expect(pauses[1]?.reason).toBe("step");
  });

  it("stops at a breakpoint each time the line is reached", () => {
    const { pauses } = session(PROGRAM, [2], ["continue", "continue"]);
    expect(pauses.map((p) => values(p).x)).toEqual(["3", "4"]);
  });

  it("applies breakpoints given with a later command", () => {
    const { pauses } = session(PROGRAM, [], [{ command: "continue", breakpoints: [9] }, "continue"]);
    expect(pauses.map((p) => [p.reason, p.line])).toEqual([
      ["entry", 1],
      ["breakpoint", 9],
    ]);
  });

  it("lists data only: no modules, functions, classes or dunder names", () => {
    const code = ["import math", "class Dog:", "    pass", "def helper():", "    return 1", "pet = Dog()", "n = math.floor(2.7)", "print(n)", ""].join("\n");
    const { pauses } = session(code, [8], ["continue"]);
    expect(Object.keys(values(pauses[0]))).toEqual(["pet", "n"]);
    expect(values(pauses[0]).n).toBe("2");
  });

  it("formats common values and shortens very long ones", () => {
    const code = ['name = "Ada"', "items = [1, 2, 3]", "pair = {'a': 1}", "ratio = 2.5", "flag = True", "nothing = None", "big = list(range(500))", "print(name)", ""].join("\n");
    const { pauses } = session(code, [8], ["continue"]);
    const shown = values(pauses[0]);
    expect(shown).toMatchObject({ name: "'Ada'", items: "[1, 2, 3]", pair: "{'a': 1}", ratio: "2.5", flag: "True", nothing: "None" });
    expect(shown.big).toHaveLength(200);
    expect(shown.big?.endsWith("...")).toBe(true);
    expect(pauses[0]?.frames[0]?.variables.find((v) => v.name === "items")?.type).toBe("list");
  });

  it("stop ends the program with KeyboardInterrupt", () => {
    const { pauses, error } = session(PROGRAM, [], ["stop"]);
    expect(pauses).toHaveLength(1);
    expect(error).toContain("KeyboardInterrupt");
    expect(printed).toBe("");
  });

  it("reports a runtime error with the line in the user's file", () => {
    const { error } = session("x = 1\nprint(x / 0)\n", [], ["continue"]);
    expect(error).toContain("ZeroDivisionError");
    expect(error).toContain('File "main.py", line 2');
  });

  it("reports a syntax error before any pause", () => {
    const { pauses, error } = session("if True\n    print(1)\n", [], []);
    expect(pauses).toHaveLength(0);
    expect(error).toContain("SyntaxError");
  });

  it("stops tracing afterwards, so a later plain run is not slowed or paused", () => {
    session(PROGRAM, [], ["continue"]);
    expect(pyodide.runPython("import sys\nsys.gettrace() is None")).toBe(true);
  });
});
