// Lesson content: the compiler's rules, the cross-lesson checks, and a
// contract test that runs every lesson's answer through the real runtime.
// A lesson whose own solution fails its checks does not ship.

import { loadPyodide } from "pyodide";
import { beforeAll, describe, expect, it } from "vitest";
import { ContentError, compileLesson, kidTextProblems, validateLibrary } from "../../src/content/compile";
import { loadLibraryFromDisk } from "../../src/content/disk";
import type { DataFile, Lesson } from "../../src/content/schema";
import { allPassed, runChecks } from "../../src/learn/checker";
import type { ProgramResult, ProgramRunner } from "../../src/learn/checker";
import { escapeSpacesInStringLiterals } from "../../src/runners/c/prepare-source";
import { workFolderSetup } from "../../src/runners/python/work-folder";
import { parseInput } from "../../src/runners/arduino/board";
import { profileOf } from "../../src/runners/arduino/profiles";
import type { BoardId } from "../../src/runners/arduino/profiles";
import { runArduino } from "../helpers/arduino";
import { runCpp } from "../helpers/clang";
import { StepLimitError, runCWithLimit } from "../helpers/jscpp";

const HEADER = `---
id: core.c.sample
kind: lesson
track: core
unit: a2
order: 9
title: Sample
language: c
est_minutes: 5
`;

const BODY = `
Normal text.

::: kid
Short words for a child.
:::
`;

const TRY = `
::: try
Print Hi.
:::

::: try-kid
Say Hi.
:::

\`\`\`c {role=starter}
int main(void) { return 0; }
\`\`\`

\`\`\`c {role=solution file=hi.c}
int main(void) { printf("Hi\\n"); return 0; }
\`\`\`
`;

const CHECKS = `checks:
  - type: stdout-equals
    expect: "Hi\\n"
`;

function problemsOf(source: string): string[] {
  try {
    compileLesson(source, "sample.md");
  } catch (error) {
    if (error instanceof ContentError) return error.problems;
    throw error;
  }
  return [];
}

describe("compileLesson", () => {
  it("compiles a lesson with text only", () => {
    const lesson = compileLesson(`${HEADER}---${BODY}`, "sample.md");
    expect(lesson.id).toBe("core.c.sample");
    expect(lesson.bodyHtml).toBe("<p>Normal text.</p>");
    expect(lesson.kidHtml).toBe("<p>Short words for a child.</p>");
    expect(lesson.titleKid).toBe("Sample");
    expect(lesson.hasTryIt).toBe(false);
    expect(lesson.tryIt).toBeUndefined();
  });

  it("compiles the Try it part and keeps code out of the text", () => {
    const lesson = compileLesson(`${HEADER}${CHECKS}---${BODY}${TRY}`, "sample.md");
    expect(lesson.hasTryIt).toBe(true);
    expect(lesson.tryIt?.starter).toEqual({ language: "c", fileName: "main.c", code: "int main(void) { return 0; }\n" });
    expect(lesson.tryIt?.solution.fileName).toBe("hi.c");
    expect(lesson.tryIt?.promptHtml).toBe("<p>Print Hi.</p>");
    expect(lesson.tryIt?.checks).toEqual([{ type: "stdout-equals", stdin: [], expect: "Hi\n" }]);
    expect(lesson.bodyHtml).not.toContain("role=");
    expect(lesson.bodyHtml).not.toContain("printf");
  });

  it("accepts Windows line endings", () => {
    const lesson = compileLesson(`${HEADER}---${BODY}`.replace(/\n/g, "\r\n"), "sample.md");
    expect(lesson.bodyHtml).toBe("<p>Normal text.</p>");
  });

  it("keeps ordinary code blocks in the text, even when they hold block markers", () => {
    const lesson = compileLesson(`${HEADER}---\nText.\n\n\`\`\`c\n::: kid\nint x;\n\`\`\`\n\n::: kid\nHi there.\n:::\n`, "sample.md");
    expect(lesson.bodyHtml).toContain("::: kid");
    expect(lesson.bodyHtml).toContain('class="language-c"');
    expect(lesson.kidHtml).toBe("<p>Hi there.</p>");
  });

  it("shows raw HTML as text instead of running it", () => {
    const lesson = compileLesson(`${HEADER}---\nText <script>alert(1)</script> and\n\n<img src=x onerror=alert(1)>\n\n::: kid\nHi there.\n:::\n`, "sample.md");
    expect(lesson.bodyHtml).not.toContain("<script");
    expect(lesson.bodyHtml).not.toContain("<img");
    expect(lesson.bodyHtml).toContain("&lt;script&gt;");
  });

  it("collects data files and keeps them visible in the text", () => {
    const lesson = compileLesson(`${HEADER}---\nRead this file.\n\n\`\`\`text {role=file file=temps.txt}\n21.5\n22.0\n\`\`\`\n\n::: kid\nHi there.\n:::\n`, "sample.md");
    expect(lesson.files).toEqual([{ name: "temps.txt", text: "21.5\n22.0\n" }]);
    expect(lesson.bodyHtml).toContain("<code>temps.txt</code>");
    expect(lesson.bodyHtml).toContain("21.5");
  });

  const broken: [string, string, RegExp][] = [
    ["a data file without a name", `${HEADER}---${BODY}\n\`\`\`text {role=file}\nx\n\`\`\`\n`, /needs file=<name>/],
    ["a data file name with a folder", `${HEADER}---${BODY}\n\`\`\`text {role=file file=data/x.txt}\nx\n\`\`\`\n`, /needs file=<name>/],
    ["two data files with one name", `${HEADER}---${BODY}\n\`\`\`text {role=file file=x.txt}\na\n\`\`\`\n\n\`\`\`text {role=file file=x.txt}\nb\n\`\`\`\n`, /second data file called x.txt/],
    ["a file check in a MATLAB lesson", `${HEADER.replace("language: c", "language: matlab")}checks:\n  - {type: file-equals, file: out.txt, expect: "x"}\n---${BODY}${TRY.replace(/```c/g, "```matlab")}`, /file-equals only works in C and Python/],
    ["a pins check outside Arduino", `${HEADER}checks:\n  - {type: pins, expect: "0 ms: pin 13 HIGH"}\n---${BODY}${TRY}`, /only work in Arduino lessons/],
    ["a badly written board input", `${HEADER.replace("language: c", "language: arduino")}checks:\n  - {type: pins, inputs: ["press the button"], expect: "x"}\n---${BODY}${TRY.replace(/```c/g, "```arduino")}`, /should look like "2 HIGH at 1200"/],
    ["no kid block", `${HEADER}---\nNormal text.\n`, /no "::: kid" block/],
    ["no explanation", `${HEADER}---\n::: kid\nHi there.\n:::\n`, /no explanation/],
    ["a long kid sentence", `${HEADER}---\nText.\n\n::: kid\nThis sentence just keeps on going and going with far too many words in it.\n:::\n`, /sentence has 15 words/],
    ["a grown-up word in kid text", `${HEADER}---\nText.\n\n::: kid\nThe compiler reads it.\n:::\n`, /grown-up word "compiler"/],
    ["an unknown block", `${HEADER}---\nText.\n\n::: note\nHi.\n:::\n\n::: kid\nHi there.\n:::\n`, /unknown block "::: note"/],
    ["an unclosed block", `${HEADER}---\nText.\n\n::: kid\nHi there.\n`, /"::: kid" is never closed/],
    ["an unknown role", `${HEADER}---${BODY}\n\`\`\`c {role=answer}\nint x;\n\`\`\`\n`, /unknown role "answer"/],
    ["an unclosed code block", `${HEADER}---${BODY}\n\`\`\`c\nint x;\n`, /code block is never closed/],
    ["Try it without checks", `${HEADER}---${BODY}${TRY}`, /missing checks in the header/],
    ["Try it without a solution", `${HEADER}${CHECKS}---${BODY}${TRY.replace(/```c \{role=solution[\s\S]*?```\n/, "")}`, /missing \{role=solution\} block/],
    ["hints without kid hints", `${HEADER}${CHECKS}hints: [One]\n---${BODY}${TRY}`, /hints \(1\) and hintsKid \(0\)/],
    ["a bad regular expression", `${HEADER}checks:\n  - {type: stdout-regex, pattern: "("}\n---${BODY}${TRY}`, /not a valid regular expression/],
    ["an unknown header key", `${HEADER}colour: red\n---${BODY}`, /header/],
    ["an id outside its track", `${HEADER.replace("core.c.sample", "plc.c.sample")}---${BODY}`, /must start with the track name/],
    ["a mini lesson without a symbol", `${HEADER.replace("kind: lesson", "kind: mini")}---${BODY}`, /needs a symbol/],
    ["a mini lesson without an example", `${HEADER.replace("kind: lesson", "kind: mini")}symbol: x\n---${BODY}`, /needs a \{role=example\} block/],
    ["no header", "Just text.\n", /must start with a "---" header/],
  ];
  it.each(broken)("rejects %s", (_name, source, expected) => {
    const problems = problemsOf(source);
    expect(problems.join("\n")).toMatch(expected);
  });
});

describe("kidTextProblems", () => {
  it("ignores code and counts only spoken words", () => {
    expect(kidTextProblems("Type `printf(\"a b c d e f g h i j k l m n\");` now.\n\n```c\nint a, b, c, d, e, f, g, h, i, j, k, l, m;\n```", "kid")).toEqual([]);
  });

  it("treats each sentence on its own", () => {
    expect(kidTextProblems("One two three four five six. Seven eight nine ten eleven twelve!", "kid")).toEqual([]);
  });
});

function lesson(id: string, patch: Partial<Lesson> = {}): Lesson {
  return {
    ...compileLesson(`${HEADER.replace("core.c.sample", id)}---${BODY}`, `${id}.md`),
    ...patch,
  };
}

describe("validateLibrary", () => {
  it("accepts lessons that refer to each other correctly", () => {
    const first = lesson("core.c.one", { order: 1 });
    const second = lesson("core.c.two", { order: 2, prereqs: ["core.c.one"], links: [{ to: "core.c.one", kind: "builds-on", note: "n" }] });
    expect(validateLibrary([first, second])).toEqual([]);
  });

  it("reports a duplicate id", () => {
    expect(validateLibrary([lesson("core.c.one", { order: 1 }), lesson("core.c.one", { order: 2 })]).join("\n")).toMatch(/used by two lessons/);
  });

  it("reports a prerequisite that does not exist", () => {
    expect(validateLibrary([lesson("core.c.one", { prereqs: ["core.c.missing"] })]).join("\n")).toMatch(/prerequisite "core.c.missing" does not exist/);
  });

  it("reports a link that goes nowhere", () => {
    expect(validateLibrary([lesson("core.c.one", { links: [{ to: "core.c.missing", kind: "next", note: "n" }] })]).join("\n")).toMatch(/link to "core.c.missing"/);
  });

  it("reports a prerequisite loop", () => {
    const problems = validateLibrary([
      lesson("core.c.one", { order: 1, prereqs: ["core.c.three"] }),
      lesson("core.c.two", { order: 2, prereqs: ["core.c.one"] }),
      lesson("core.c.three", { order: 3, prereqs: ["core.c.two"] }),
    ]);
    expect(problems.join("\n")).toMatch(/prerequisite loop: core\.c\.one -> core\.c\.three -> core\.c\.two -> core\.c\.one/);
  });

  it("reports a unit the track does not have", () => {
    expect(validateLibrary([lesson("core.c.one", { unit: "z9" })]).join("\n")).toMatch(/unit "z9" is not listed/);
  });

  it("reports two lessons in the same place", () => {
    expect(validateLibrary([lesson("core.c.one"), lesson("core.c.two")]).join("\n")).toMatch(/same unit and order/);
  });
});

// ───── The real lessons ─────

const library = loadLibraryFromDisk();

// Lesson programs are small. The step limit turns a loop that never ends
// into a failed test instead of a test run that never finishes.
// Each run gets a fresh copy of the lesson's data files.
const cRunner =
  (dataFiles: readonly DataFile[] = []): ProgramRunner =>
  async (code, stdin): Promise<ProgramResult> => {
    const files = Object.fromEntries(dataFiles.map((file) => [file.name, file.text]));
    try {
      return { stdout: runCWithLimit(escapeSpacesInStringLiterals(code), stdin, 1_000_000, files).stdout, ok: true, files };
    } catch (error) {
      return { stdout: "", ok: false, error: String(error), files, ...(error instanceof StepLimitError ? { timedOut: true } : {}) };
    }
  };
const runC = cRunner();

let pyodide: Awaited<ReturnType<typeof loadPyodide>>;
const PY_WORK = "/tmp/lesson-work";

// Mirrors the browser worker: a fresh working folder holding the lesson's
// files, and every file read back after the program's names are dropped.
const pythonRunner =
  (dataFiles: readonly DataFile[] = []): ProgramRunner =>
  async (code, stdin): Promise<ProgramResult> => {
    const lines = [...stdin];
    let stdout = "";
    const fs = pyodide.FS;
    fs.mkdirTree(PY_WORK);
    const plain = (): string[] => (fs.readdir(PY_WORK) as string[]).filter((name) => name !== "." && name !== ".." && fs.isFile(fs.stat(`${PY_WORK}/${name}`).mode));
    for (const name of plain()) fs.unlink(`${PY_WORK}/${name}`);
    for (const file of dataFiles) fs.writeFile(`${PY_WORK}/${file.name}`, file.text);
    pyodide.runPython(workFolderSetup(PY_WORK));
    pyodide.setStdin({ stdin: () => lines.shift() ?? null });
    pyodide.setStdout({ batched: (text: string) => void (stdout += text + "\n") });
    const namespace = pyodide.globals.get("dict")();
    let result: ProgramResult;
    try {
      await pyodide.runPythonAsync(code, { globals: namespace, filename: "main.py" });
      result = { stdout, ok: true };
    } catch (error) {
      result = { stdout, ok: false, error: (error as Error).message };
    }
    namespace.destroy();
    pyodide.runPython("import gc\ngc.collect()");
    const files = Object.fromEntries(plain().map((name) => [name, fs.readFile(`${PY_WORK}/${name}`, { encoding: "utf8" }) as string]));
    return { ...result, files };
  };

// C++ lessons compile with the real clang, as in the browser. Files are not supported there yet.
const cppRunner: ProgramRunner = async (code, stdin): Promise<ProgramResult> => {
  const result = await runCpp(code, stdin);
  return { stdout: result.stdout, ok: result.error === null, ...(result.error === null ? {} : { error: result.error }) };
};

// Arduino lessons run on the lesson's board, with the check's board time and inputs.
const arduinoRunner =
  (board: BoardId | undefined): ProgramRunner =>
  async (code, _stdin, sim): Promise<ProgramResult> => {
    const result = await runArduino(code, { runMs: sim?.ms, inputs: (sim?.inputs ?? []).map((input) => parseInput(input, profileOf(board))), board });
    return { stdout: result.serial, ok: result.error === null, pins: result.timeline, ...(result.error === null ? {} : { error: result.error }) };
  };

function runnerFor(language: Lesson["language"], files: readonly DataFile[], board?: BoardId): ProgramRunner | undefined {
  if (language === "cpp") return cppRunner;
  if (language === "arduino") return arduinoRunner(board);
  if (language === "c") return cRunner(files);
  return language === "python" ? pythonRunner(files) : undefined;
}

describe("step-limited C runner", () => {
  it("matches a normal run", async () => {
    const result = await runC('#include <stdio.h>\nint main() {\n    int a;\n    scanf("%d", &a);\n    printf("%d\\n", a * 2);\n    return 0;\n}', ["21"]);
    expect(result).toEqual({ stdout: "42\n", ok: true, files: {} });
  });

  it("stops a loop that never ends instead of hanging", () => {
    const forever = '#include <stdio.h>\nint main() {\n    int n = 3;\n    while (n > 0) {\n        n = n + 0;\n    }\n    return 0;\n}';
    expect(() => runCWithLimit(forever, [], 20_000)).toThrow(StepLimitError);
  });
});

describe("lesson library", () => {
  beforeAll(async () => {
    pyodide = await loadPyodide();
  }, 60_000);

  it("has no problems", () => {
    expect(library.problems).toEqual([]);
  });

  it("holds lessons in more than one language", () => {
    expect(library.lessons.length).toBeGreaterThanOrEqual(4);
    expect(new Set(library.lessons.map((item) => item.language)).size).toBeGreaterThan(1);
  });

  const withTryIt = library.lessons.filter((item) => item.tryIt);

  it.each(withTryIt.map((item) => [item.id, item] as const))("%s: the solution passes its checks", async (_id, item) => {
    const tryIt = item.tryIt!;
    const run = runnerFor(tryIt.solution.language, item.files, item.board);
    expect(run, `no test runner for ${tryIt.solution.language}`).toBeDefined();
    const outcomes = await runChecks(tryIt.solution.code, tryIt.solution.language, tryIt.checks, run!);
    expect(outcomes.filter((outcome) => !outcome.pass)).toEqual([]);
    expect(allPassed(outcomes)).toBe(true);
  }, 60_000);

  it.each(withTryIt.map((item) => [item.id, item] as const))("%s: the starter does not pass yet", async (_id, item) => {
    const tryIt = item.tryIt!;
    const outcomes = await runChecks(tryIt.starter.code, tryIt.starter.language, tryIt.checks, runnerFor(tryIt.starter.language, item.files, item.board)!);
    expect(allPassed(outcomes)).toBe(false);
  }, 60_000);

  it.each(library.lessons.filter((item) => item.example).map((item) => [item.id, item] as const))("%s: the example runs without an error", async (_id, item) => {
    const example = item.example!;
    const result = await runnerFor(example.language, item.files, item.board)!(example.code, []);
    expect(result.error).toBeUndefined();
    // A sketch that only drives pins shows its work in the pin timeline.
    expect((result.stdout + (result.pins ?? []).join("")).trim().length).toBeGreaterThan(0);
  }, 60_000);
});
