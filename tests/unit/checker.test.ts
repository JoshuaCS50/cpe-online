import { describe, expect, it } from "vitest";
import type { Check } from "../../src/content/schema";
import { allPassed, normalizeOutput, runChecks, stripComments } from "../../src/learn/checker";
import type { ProgramResult, ProgramRunner } from "../../src/learn/checker";

/** A stand-in program: adds the two input numbers, or prints a fixed text. */
function fakeRunner(reply: (stdin: readonly string[]) => Partial<ProgramResult>): { run: ProgramRunner; calls: string[][] } {
  const calls: string[][] = [];
  return {
    calls,
    run: async (_code, stdin) => {
      calls.push([...stdin]);
      return { stdout: "", ok: true, ...reply(stdin) };
    },
  };
}

const adder = (stdin: readonly string[]): Partial<ProgramResult> => ({ stdout: `Sum = ${Number(stdin[0]) + Number(stdin[1])}\n` });

describe("normalizeOutput", () => {
  it("ignores line-ending style, trailing spaces and blank lines at the end", () => {
    expect(normalizeOutput("a  \r\nb\t\n\n\n")).toBe("a\nb");
  });

  it("keeps leading spaces and blank lines in the middle", () => {
    expect(normalizeOutput("  a\n\nb")).toBe("  a\n\nb");
  });
});

describe("stripComments", () => {
  it("removes C comments of both kinds", () => {
    expect(stripComments("int a; // scanf\n/* for ( */ int b;", "c")).not.toMatch(/scanf|for/);
  });

  it("removes Python and MATLAB comments", () => {
    expect(stripComments("x = 1  # print\n", "python")).not.toContain("print");
    expect(stripComments("x = 1; % disp\n", "matlab")).not.toContain("disp");
  });
});

describe("runChecks", () => {
  it("passes when the output matches", async () => {
    const { run } = fakeRunner(() => ({ stdout: "Hi\n" }));
    const outcomes = await runChecks("", "c", [{ type: "stdout-equals", stdin: [], expect: "Hi" }], run);
    expect(outcomes).toEqual([{ pass: true, title: "Output with no input" }]);
    expect(allPassed(outcomes)).toBe(true);
  });

  it("shows expected and actual output when they differ", async () => {
    const { run } = fakeRunner(() => ({ stdout: "Bye\n" }));
    const [outcome] = await runChecks("", "c", [{ type: "stdout-equals", stdin: [], expect: "Hi\n" }], run);
    expect(outcome).toMatchObject({ pass: false, expected: "Hi", actual: "Bye", detail: "The output is not what the task asks for." });
  });

  it("says when only capitals or spacing differ", async () => {
    const capitals = await runChecks("", "c", [{ type: "stdout-equals", stdin: [], expect: "Hello" }], fakeRunner(() => ({ stdout: "hello" })).run);
    expect(capitals[0]?.detail).toMatch(/capital letters/);
    const spacing = await runChecks("", "c", [{ type: "stdout-equals", stdin: [], expect: "Sum = 7" }], fakeRunner(() => ({ stdout: "Sum=7" })).run);
    expect(spacing[0]?.detail).toMatch(/spaces or line breaks/);
  });

  it("runs each case with its own input", async () => {
    const { run, calls } = fakeRunner(adder);
    const check: Check = {
      type: "io-cases",
      cases: [
        { stdin: ["3", "4"], expect: "Sum = 7\n" },
        { stdin: ["10", "-2"], expect: "Sum = 8\n" },
      ],
    };
    const outcomes = await runChecks("", "c", [check], run);
    expect(outcomes.map((outcome) => outcome.pass)).toEqual([true, true]);
    expect(outcomes[0]?.title).toBe('Output with input "3", "4"');
    expect(calls).toEqual([["3", "4"], ["10", "-2"]]);
  });

  it("runs the program once per distinct input", async () => {
    const { run, calls } = fakeRunner(() => ({ stdout: "Total: 12\n" }));
    const checks: Check[] = [
      { type: "stdout-equals", stdin: [], expect: "Total: 12" },
      { type: "stdout-regex", stdin: [], pattern: "^Total: \\d+$" },
    ];
    const outcomes = await runChecks("", "c", checks, run);
    expect(allPassed(outcomes)).toBe(true);
    expect(calls).toHaveLength(1);
  });

  it("fails a check when the program stops with an error", async () => {
    const { run } = fakeRunner(() => ({ stdout: "Hi\n", ok: false, error: "boom" }));
    const [outcome] = await runChecks("", "c", [{ type: "stdout-equals", stdin: [], expect: "Hi" }], run);
    expect(outcome).toMatchObject({ pass: false, detail: "The program stopped with an error before it finished." });
  });

  it("explains a program that ran too long", async () => {
    const { run } = fakeRunner(() => ({ ok: false, timedOut: true }));
    const [outcome] = await runChecks("", "c", [{ type: "stdout-regex", stdin: [], pattern: "x" }], run);
    expect(outcome?.detail).toMatch(/ran for too long/);
  });

  it("uses the author's message for a pattern that does not match", async () => {
    const { run } = fakeRunner(() => ({ stdout: "abc" }));
    const [outcome] = await runChecks("", "c", [{ type: "stdout-regex", stdin: [], pattern: "^\\d+$", message: "Print only the number." }], run);
    expect(outcome).toMatchObject({ pass: false, detail: "Print only the number.", actual: "abc" });
  });

  it("looks for a pattern in the code, not in its comments", async () => {
    const { run, calls } = fakeRunner(() => ({}));
    const check: Check = { type: "code-contains", pattern: "for\\s*\\(", message: "Uses a for loop" };
    expect((await runChecks("for (;;) {}", "c", [check], run))[0]).toEqual({ pass: true, title: "Uses a for loop" });
    expect((await runChecks("// for (;;)\nwhile (1) {}", "c", [check], run))[0]).toMatchObject({ pass: false, title: "Uses a for loop" });
    expect(calls).toHaveLength(0);
  });

  it("compares an Arduino sketch's pins over time, with board inputs per run", async () => {
    const runs: unknown[] = [];
    const run: ProgramRunner = async (_code, _stdin, sim) => {
      runs.push(sim);
      const pressed = sim?.inputs?.length ? ["500 ms: pin 13 HIGH"] : [];
      return { stdout: "ready\n", ok: true, pins: ["0 ms: pin 13 LOW", ...pressed] };
    };
    const checks: Check[] = [
      { type: "pins", expect: "0 ms: pin 13 LOW\n" },
      { type: "pins", inputs: ["2 LOW at 500"], ms: 1000, expect: "0 ms: pin 13 LOW\n500 ms: pin 13 HIGH\n" },
      { type: "pins", inputs: ["2 LOW at 500"], ms: 1000, expect: "0 ms: pin 13 HIGH\n" },
      { type: "stdout-equals", stdin: [], inputs: ["2 LOW at 500"], ms: 1000, expect: "ready\n" },
    ];
    const outcomes = await runChecks("", "arduino", checks, run);
    expect(outcomes.map((outcome) => outcome.pass)).toEqual([true, true, false, true]);
    expect(outcomes[1]?.title).toBe("Pins over time with 2 LOW at 500");
    expect(outcomes[2]).toMatchObject({ detail: "The pins do not change as the task asks.", actualLabel: "Your board did" });
    // One run without inputs, one with: checks with the same inputs share a run.
    expect(runs).toHaveLength(2);
  });

  it("compares a file the program wrote, sharing the run with output checks", async () => {
    const { run, calls } = fakeRunner(() => ({ stdout: "saved\n", files: { "log.txt": "1\n2  \n\n" } }));
    const checks: Check[] = [
      { type: "stdout-equals", stdin: [], expect: "saved\n" },
      { type: "file-equals", stdin: [], file: "log.txt", expect: "1\n2\n" },
      { type: "file-equals", stdin: [], file: "log.txt", expect: "1\n3\n" },
      { type: "file-equals", stdin: [], file: "other.txt", expect: "x" },
    ];
    const outcomes = await runChecks("", "c", checks, run);
    expect(outcomes.map((outcome) => outcome.pass)).toEqual([true, true, false, false]);
    expect(outcomes[2]).toMatchObject({ detail: "The file does not hold what the task asks for.", actual: "1\n2", actualLabel: "Your file holds" });
    expect(outcomes[3]?.detail).toBe("The program did not write a file called other.txt.");
    expect(calls).toHaveLength(1);
  });

  it("does not count an empty list of checks as a pass", () => {
    expect(allPassed([])).toBe(false);
  });
});
