// Contract test for the error catalog: every entry's sample programs are run
// through the real runtime (JSCPP, Pyodide, RunMat), and the error each one
// produces must be explained by that entry, pointing at the stated line.
// A catalog entry that cannot be reached by a real program does not ship.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { loadPyodide } from "pyodide";
import { createInMemoryFsProvider, initRunMat } from "runmat";
import { beforeAll, describe, expect, it } from "vitest";
import { C_CATALOG } from "../../src/diagnostics/catalog-c";
import { CPP_CATALOG } from "../../src/diagnostics/catalog-cpp";
import { MATLAB_CATALOG } from "../../src/diagnostics/catalog-matlab";
import { PYTHON_CATALOG } from "../../src/diagnostics/catalog-python";
import { CATALOG, explainError } from "../../src/diagnostics/engine";
import { parseCError, parseClangError, parsePythonError } from "../../src/diagnostics/parse";
import type { CatalogEntry, RawError } from "../../src/diagnostics/types";
import { runCpp } from "../helpers/clang";
import { rawJscppError } from "../helpers/jscpp";

type Runner = (source: string, stdin: string[]) => Promise<RawError | null>;

const runC: Runner = async (source, stdin) => {
  const text = rawJscppError(source, stdin.map((line) => line + "\n").join(""));
  return text === null ? null : { language: "c", text };
};

const runCppError: Runner = async (source, stdin) => {
  const result = await runCpp(source, stdin);
  return result.error === null ? null : { language: "cpp", text: result.error };
};

let pyodide: Awaited<ReturnType<typeof loadPyodide>>;
const runPython: Runner = async (source) => {
  const namespace = pyodide.globals.get("dict")();
  try {
    await pyodide.runPythonAsync(source, { globals: namespace, filename: "main.py" });
    return null;
  } catch (error) {
    return { language: "python", text: (error as Error).message };
  } finally {
    namespace.destroy();
  }
};

let wasm: Buffer;
const runMatlab: Runner = async (source, stdin) => {
  const session = await initRunMat({
    wasmModule: wasm,
    language: { compat: "matlab" },
    telemetryConsent: false,
    enableGpu: false,
    fsProvider: createInMemoryFsProvider(),
  });
  try {
    const answers = [...stdin];
    await session.setInputHandler(() => answers.shift() ?? "");
    const result = await session.executeRequest({ source: { kind: "text", name: "main.m", text: source } });
    const error = result.error;
    if (!error) return null;
    return {
      language: "matlab",
      text: error.diagnostic,
      details: { message: error.message, identifier: error.identifier, line: error.span?.line, column: error.span?.column },
    };
  } finally {
    session.dispose();
  }
};

beforeAll(async () => {
  pyodide = await loadPyodide();
  const require = createRequire(import.meta.url);
  wasm = readFileSync(require.resolve("runmat/pkg-web/runmat_wasm_web_bg.wasm"));
}, 60_000);

const suites: [string, CatalogEntry[], Runner][] = [
  ["C", C_CATALOG, runC],
  ["C++", CPP_CATALOG, runCppError],
  ["Python", PYTHON_CATALOG, runPython],
  ["MATLAB", MATLAB_CATALOG, runMatlab],
];

describe.each(suites)("%s catalog against the real runtime", (_name, catalog, run) => {
  for (const entry of catalog) {
    entry.tests.forEach((sample, index) => {
      it(`${entry.id} #${index + 1}`, async () => {
        const raw = await run(sample.source, sample.stdin ?? []);
        expect(raw, "the sample program must fail").not.toBeNull();
        if (!raw) return;
        const explanation = explainError(raw, sample.source);
        expect(explanation.entryId).toBe(entry.id);
        if (sample.line !== undefined) expect(explanation.line).toBe(sample.line);
        expect(explanation.raw).toBe(raw.text);
      }, 30_000);
    });
  }
});

describe("catalog rules", () => {
  it("has unique ids", () => {
    const ids = CATALOG.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // py.no-more-input needs a cancelled read, which a plain run cannot produce.
  const UNTESTABLE = new Set(["py.no-more-input"]);

  it("has at least one sample program per entry", () => {
    const missing = CATALOG.filter((entry) => entry.tests.length === 0 && !UNTESTABLE.has(entry.id)).map((entry) => entry.id);
    expect(missing).toEqual([]);
  });

  it("gives every entry complete text, including the simple version", () => {
    const fields = { name: "x", index: "5", size: "3", line: "2", low: "1", high: "3", type: "int", bracket: "(", key: "'b'", names: "'b'", count: "1", operator: "-", left: "int", right: "str", types: "int", text: "abc", kind: "list" };
    const text = (value: unknown): string => (typeof value === "function" ? (value as (f: typeof fields) => string)(fields) : String(value));
    for (const entry of CATALOG) {
      for (const part of [entry.title, entry.what, entry.why, entry.kid.what, entry.kid.fix, ...entry.fix]) {
        expect(text(part).trim().length, entry.id).toBeGreaterThan(3);
        expect(text(part), entry.id).not.toContain("undefined");
      }
      expect(entry.fix.length, entry.id).toBeGreaterThan(0);
    }
  });

  it("keeps the simple version short", () => {
    for (const entry of CATALOG) {
      for (const part of [entry.kid.what, entry.kid.fix]) {
        const sentence = typeof part === "function" ? part({ name: "x", index: "5", size: "3", low: "1", high: "3", suggestion: "y" }) : part;
        for (const piece of sentence.split(/[.?!]\s/)) {
          expect(piece.split(/\s+/).length, `${entry.id}: "${piece}"`).toBeLessThanOrEqual(16);
        }
      }
    }
  });

  it("ends each language with a catch-all, so every error gets a card", () => {
    expect(C_CATALOG[C_CATALOG.length - 1]?.id).toBe("c.unknown");
    expect(CPP_CATALOG[CPP_CATALOG.length - 1]?.id).toBe("cpp.unknown");
    expect(PYTHON_CATALOG[PYTHON_CATALOG.length - 1]?.id).toBe("py.unknown");
    expect(MATLAB_CATALOG[MATLAB_CATALOG.length - 1]?.id).toBe("ml.unknown");
  });
});

describe("parsers", () => {
  it("reads a JSCPP parse failure", () => {
    const text = 'ERROR: Parsing Failure:\nline 4 (column 5): {\\n    int x = 5\\n\n-----^\nExpected "!=", ";" or [ \\n] but "p" found.';
    expect(parseCError(text)).toEqual({ kind: "parse", message: 'Expected "!=", ";" or [ \\n] but "p" found.', line: 4, column: 5 });
  });

  it("reads a JSCPP runtime error", () => {
    expect(parseCError("3:5 variable total does not exist")).toEqual({
      kind: "runtime",
      message: "variable total does not exist",
      line: 3,
      column: 5,
    });
  });

  it("reads clang's compile errors, link errors and crashes", () => {
    const compile = "main.cpp:3:14: error: expected ';' at end of declaration\n    3 |     int x = 5\n      |              ^\n1 error generated.";
    expect(parseClangError(compile)).toEqual({ kind: "compile", message: "expected ';' at end of declaration", line: 3, column: 14 });
    expect(parseClangError("wasm-ld: error: /tmp/main-1.o: undefined symbol: area(int, int)")).toMatchObject({ kind: "link", message: "undefined symbol: area(int, int)", line: null });
    expect(parseClangError("RuntimeError: divide by zero")).toMatchObject({ kind: "runtime", message: "divide by zero", line: null });
  });

  it("reads a JavaScript error from the interpreter as internal", () => {
    expect(parseCError("Maximum call stack size exceeded")).toMatchObject({ kind: "internal", line: null });
  });

  it("reads a Python traceback, using the innermost frame in the user's file", () => {
    const text = [
      "Traceback (most recent call last):",
      '  File "/lib/python312.zip/_pyodide/_base.py", line 574, in eval_code_async',
      '  File "main.py", line 5, in <module>',
      '  File "main.py", line 2, in area',
      "NameError: name 'h' is not defined",
    ].join("\n");
    expect(parsePythonError(text)).toEqual({ kind: "NameError", message: "name 'h' is not defined", line: 2, column: null });
  });

  it("reads an exception with no message", () => {
    expect(parsePythonError("Traceback (most recent call last):\nKeyboardInterrupt")).toMatchObject({ kind: "KeyboardInterrupt", message: "" });
  });
});

describe("explainError", () => {
  it("still explains an error in a language without a catalog", () => {
    const explanation = explainError({ language: "java", text: "Exception in thread main" }, "");
    expect(explanation).toMatchObject({ entryId: "unknown", confidence: "fallback", raw: "Exception in thread main" });
  });
});
