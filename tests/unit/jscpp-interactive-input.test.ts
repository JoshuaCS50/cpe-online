// The vendored JSCPP build is patched (scripts/patch-jscpp.mjs) to pull input
// on demand. These tests pin down that behaviour against the real interpreter.

import { describe, expect, it } from "vitest";
import { runCInteractive } from "../helpers/jscpp";

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

  // Upstream stored %c as text into a number type and failed with "Memory
  // overflow"; scripts/patch-jscpp.mjs stores the character's code instead.
  it("scanf %c reads one character", () => {
    const run = runCInteractive(c('    char ch;\n    scanf("%c", &ch);\n    printf("[%c] %d\\n", ch, ch);'), ["A"]);
    expect(run.stdout).toBe("[A] 65\n");
  });

  it("scanf reads a number, an operator and a number", () => {
    const body = ['    double a, b;', '    char op;', '    scanf("%lf %c %lf", &a, &op, &b);', '    printf("%.1f %c %.1f\\n", a, op, b);'].join("\n");
    expect(runCInteractive(c(body), ["12 + 5"]).stdout).toBe("12.0 + 5.0\n");
  });

  it("scanf %c fills one element of a char array", () => {
    const body = ['    char letters[3] = {0};', '    scanf("%c", &letters[1]);', '    printf("%d %c %d\\n", letters[0], letters[1], letters[2]);'].join("\n");
    expect(runCInteractive(c(body), ["z"]).stdout).toBe("0 z 0\n");
  });

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
