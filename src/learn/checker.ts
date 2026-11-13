// "Check my answer": runs a learner's program against a lesson's checks.
//
// This module only decides pass or fail. How a program is run is passed in,
// so the same checks run in the browser (through the real runtimes) and in
// tests.

import type { Check, LessonLanguage } from "../content/schema";

export interface ProgramResult {
  /** Everything the program printed. Typed input is not echoed here. */
  stdout: string;
  /** False when the program stopped with an error. */
  ok: boolean;
  /** The runtime's own error message, when there was one. */
  error?: string;
  /** True when the program was stopped for running too long. */
  timedOut?: boolean;
  /** Every file after the run (C programs), name -> text. */
  files?: Record<string, string>;
}

export type ProgramRunner = (code: string, stdin: readonly string[]) => Promise<ProgramResult>;

export interface CheckOutcome {
  pass: boolean;
  /** One line saying what was checked. */
  title: string;
  /** Why it failed, in plain words. */
  detail?: string;
  expected?: string;
  actual?: string;
  /** What `actual` is, when it is not the program's output. */
  actualLabel?: string;
}

/** Output as a learner sees it: line endings unified, trailing spaces and blank end lines dropped. */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

/** Code without comments, so a pattern hidden in a comment does not count. */
export function stripComments(code: string, language: LessonLanguage): string {
  if (language === "python") return code.replace(/#[^\n]*/g, "");
  if (language === "matlab") return code.replace(/%[^\n]*/g, "");
  return code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, "");
}

function describeInput(stdin: readonly string[]): string {
  return stdin.length === 0 ? "no input" : `input ${stdin.map((line) => `"${line}"`).join(", ")}`;
}

function failedRun(result: ProgramResult): string | null {
  if (result.timedOut) return "The program ran for too long and was stopped. Look for a loop that never ends.";
  if (!result.ok) return "The program stopped with an error before it finished.";
  return null;
}

function compareOutput(title: string, result: ProgramResult, expect: string): CheckOutcome {
  const actual = normalizeOutput(result.stdout);
  const expected = normalizeOutput(expect);
  const failure = failedRun(result);
  if (failure) return { pass: false, title, detail: failure, expected, actual };
  if (actual === expected) return { pass: true, title };
  const detail =
    actual.toLowerCase() === expected.toLowerCase()
      ? "Close: only capital letters differ."
      : actual.replace(/\s+/g, "") === expected.replace(/\s+/g, "")
        ? "Close: only spaces or line breaks differ."
        : "The output is not what the task asks for.";
  return { pass: false, title, detail, expected, actual };
}

/**
 * Runs every check. The program is run once per distinct input, however many
 * checks share it.
 */
export async function runChecks(
  code: string,
  language: LessonLanguage,
  checks: readonly Check[],
  run: ProgramRunner,
): Promise<CheckOutcome[]> {
  const runs = new Map<string, Promise<ProgramResult>>();
  const runWith = (stdin: readonly string[]): Promise<ProgramResult> => {
    const key = JSON.stringify(stdin);
    let pending = runs.get(key);
    if (!pending) {
      pending = run(code, stdin);
      runs.set(key, pending);
    }
    return pending;
  };

  const outcomes: CheckOutcome[] = [];
  for (const check of checks) {
    switch (check.type) {
      case "stdout-equals":
        outcomes.push(compareOutput(`Output with ${describeInput(check.stdin)}`, await runWith(check.stdin), check.expect));
        break;
      case "io-cases":
        for (const testCase of check.cases) {
          outcomes.push(compareOutput(`Output with ${describeInput(testCase.stdin)}`, await runWith(testCase.stdin), testCase.expect));
        }
        break;
      case "stdout-regex": {
        const result = await runWith(check.stdin);
        const title = `Output with ${describeInput(check.stdin)}`;
        const failure = failedRun(result);
        const actual = normalizeOutput(result.stdout);
        if (failure) outcomes.push({ pass: false, title, detail: failure, actual });
        else if (new RegExp(check.pattern).test(actual)) outcomes.push({ pass: true, title });
        else outcomes.push({ pass: false, title, detail: check.message ?? "The output does not have the form the task asks for.", actual });
        break;
      }
      case "file-equals": {
        const result = await runWith(check.stdin);
        const title = `The file ${check.file} with ${describeInput(check.stdin)}`;
        const failure = failedRun(result);
        const text = result.files?.[check.file];
        const expected = normalizeOutput(check.expect);
        if (failure) outcomes.push({ pass: false, title, detail: failure, expected });
        else if (text === undefined) outcomes.push({ pass: false, title, detail: `The program did not write a file called ${check.file}.`, expected });
        else if (normalizeOutput(text) === expected) outcomes.push({ pass: true, title });
        else outcomes.push({ pass: false, title, detail: "The file does not hold what the task asks for.", expected, actual: normalizeOutput(text), actualLabel: "Your file holds" });
        break;
      }
      case "code-contains": {
        const found = new RegExp(check.pattern).test(stripComments(code, language));
        outcomes.push(found ? { pass: true, title: check.message } : { pass: false, title: check.message, detail: "This is not in your code yet." });
        break;
      }
    }
  }
  return outcomes;
}

export function allPassed(outcomes: readonly CheckOutcome[]): boolean {
  return outcomes.length > 0 && outcomes.every((outcome) => outcome.pass);
}
