import { describe, expect, it } from "vitest";
import { errorLineFromTraceback, trimTraceback } from "../../src/runners/python/python-runner";

const TRACEBACK = [
  "Traceback (most recent call last):",
  '  File "/lib/python312.zip/_pyodide/_base.py", line 574, in eval_code_async',
  "    await CodeRunner(",
  '  File "/lib/python312.zip/_pyodide/_base.py", line 394, in run_async',
  "    coroutine = eval(self.code, globals, locals)",
  '  File "main.py", line 5, in <module>',
  "    print(area(3))",
  '  File "main.py", line 2, in area',
  "    return w * h",
  "NameError: name 'h' is not defined",
  "",
].join("\n");

describe("errorLineFromTraceback", () => {
  it("returns the innermost line in the user's file", () => {
    expect(errorLineFromTraceback(TRACEBACK)).toBe(2);
  });

  it("recognises the default <exec> file name", () => {
    expect(errorLineFromTraceback('  File "<exec>", line 7, in <module>\nZeroDivisionError: division by zero')).toBe(7);
  });

  it("ignores frames inside the interpreter", () => {
    expect(errorLineFromTraceback('  File "/lib/python312.zip/_pyodide/_base.py", line 574, in eval_code_async')).toBeNull();
  });
});

describe("trimTraceback", () => {
  it("keeps the header, the user's frames and the error", () => {
    expect(trimTraceback(TRACEBACK)).toBe(
      [
        "Traceback (most recent call last):",
        '  File "main.py", line 5, in <module>',
        "    print(area(3))",
        '  File "main.py", line 2, in area',
        "    return w * h",
        "NameError: name 'h' is not defined",
      ].join("\n"),
    );
  });

  it("leaves text without a user frame unchanged", () => {
    expect(trimTraceback("SyntaxError: invalid syntax\n")).toBe("SyntaxError: invalid syntax");
  });
});
