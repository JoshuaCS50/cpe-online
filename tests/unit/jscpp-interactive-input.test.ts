// The vendored JSCPP build is patched (scripts/patch-jscpp.mjs) to pull input
// on demand. These tests pin down that behaviour against the real interpreter.

import { describe, expect, it } from "vitest";
import { runCInteractive, runLegacyC } from "../helpers/legacy-c";

const c = (body: string) => `#include <stdio.h>\nint main() {\n${body}\n    return 0;\n}\n`;
const cpp = (body: string) => `#include <iostream>\nusing namespace std;\nint main() {\n${body}\n    return 0;\n}\n`;

describe("C input on demand", () => {
  it("never asks for input when the program reads none", () => {
    const run = runCInteractive(c('    printf("hi\\n");'), ["unused"]);
    expect(run).toEqual({ stdout: "hi\n", requests: 0, unused: ["unused"] });
  });

  it("asks once per scanf, after the prompt has been printed", () => {
    const body = [
      "    int a, b;",
      '    printf("A: ");',
      '    scanf("%d", &a);',
      '    printf("B: ");',
      '    scanf("%d", &b);',
      '    printf("sum=%d\\n", a + b);',
    ].join("\n");
    const run = runCInteractive(c(body), ["7", "35"]);
    expect(run.stdout).toBe("A: B: sum=42\n");
    expect(run.requests).toBe(2);
  });

  it("serves two numbers typed on one line without a second request", () => {
    const body = ['    int a, b;', '    scanf("%d", &a);', '    scanf("%d", &b);', '    printf("%d\\n", a * b);'].join("\n");
    const run = runCInteractive(c(body), ["6 7", "never"]);
    expect(run.stdout).toBe("42\n");
    expect(run.requests).toBe(1);
    expect(run.unused).toEqual(["never"]);
  });

  it("skips a blank line when a number is wanted", () => {
    const run = runCInteractive(c('    int a;\n    scanf("%d", &a);\n    printf("%d\\n", a);'), ["", "9"]);
    expect(run.stdout).toBe("9\n");
    expect(run.requests).toBe(2);
  });

  it("reads a float and a word", () => {
    const body = ['    float f;', '    char word[20];', '    scanf("%f", &f);', '    scanf("%s", word);', '    printf("%.1f %s\\n", f, word);'].join("\n");
    const run = runCInteractive(c(body), ["2.5", "hello"]);
    expect(run.stdout).toBe("2.5 hello\n");
  });

  // scanf("%c", &ch) fails with "Memory overflow" in the untouched upstream
  // bundle too, with all input supplied up front. It is an interpreter bug,
  // not something the on-demand patch changes; revisit when JSCPP is upgraded.
  it.todo("scanf %c reads one character");

  it("getchar asks only when the buffer is empty", () => {
    const body = ['    int first = getchar();', '    int second = getchar();', '    printf("%c%c\\n", first, second);'].join("\n");
    const run = runCInteractive(c(body), ["ab"]);
    expect(run.stdout).toBe("ab\n");
    expect(run.requests).toBe(1);
  });

  it("gets reads a whole line", () => {
    const run = runCInteractive(c('    char line[40];\n    gets(line);\n    printf("[%s]\\n", line);'), ["two words"]);
    expect(run.stdout).toBe("[two words]\n");
    expect(run.requests).toBe(1);
  });

  it("sscanf parses its own string and never asks for input", () => {
    const body = ['    int a, b;', '    sscanf("3 4", "%d %d", &a, &b);', '    printf("%d\\n", a + b);'].join("\n");
    const run = runCInteractive(c(body), ["unused"]);
    expect(run.stdout).toBe("7\n");
    expect(run.requests).toBe(0);
  });

  it("input queued before the run still works through the legacy runner", async () => {
    const body = ['    int a, b;', '    scanf("%d", &a);', '    scanf("%d", &b);', '    printf("%d\\n", a - b);'].join("\n");
    const run = await runLegacyC(c(body), "50\n8\n");
    expect(run.stdout).toBe("42\n");
  });
});

describe("C++ input on demand", () => {
  it("never asks for input when the program reads none", () => {
    const run = runCInteractive(cpp('    cout << "hi" << endl;'), ["unused"]);
    expect(run.stdout).toBe("hi\n");
    expect(run.requests).toBe(0);
  });

  it("cin >> asks once per line it needs", () => {
    const body = ['    int a, b;', '    cout << "A: ";', '    cin >> a;', '    cout << "B: ";', '    cin >> b;', '    cout << a + b << endl;'].join("\n");
    const run = runCInteractive(cpp(body), ["40", "2"]);
    expect(run.stdout).toBe("A: B: 42\n");
    expect(run.requests).toBe(2);
  });

  it("cin >> a >> b takes both values from one line", () => {
    const run = runCInteractive(cpp("    int a, b;\n    cin >> a >> b;\n    cout << a * b << endl;"), ["6 7"]);
    expect(run.stdout).toBe("42\n");
    expect(run.requests).toBe(1);
  });
});
