// Functions in the C interpreter, including the prototype fix in
// scripts/patch-jscpp.mjs: a prototype above main and the definition below
// it must count as one function.

import { describe, expect, it } from "vitest";
import { escapeSpacesInStringLiterals } from "../../src/runners/c/prepare-source";
import { rawJscppError, runCInteractive } from "../helpers/jscpp";

const run = (code: string, stdin: string[] = []): string => runCInteractive(escapeSpacesInStringLiterals(code), stdin).stdout;

const WITH_PROTOTYPE = `#include <stdio.h>

int square(int x);
float average(int a, int b, int c);

int main() {
    int n = 4;
    printf("%d %d %.1f\\n", square(7), square(n), average(1, 2, 4));
    return 0;
}

int square(int x) {
    return x * x;
}

float average(int a, int b, int c) {
    return (a + b + c) / 3.0;
}`;

describe("functions in C", () => {
  it("calls a function declared by a prototype and defined after main", () => {
    expect(run(WITH_PROTOTYPE)).toBe("49 16 2.3\n");
  });

  it("calls a function defined before main", () => {
    expect(run(`#include <stdio.h>\n\nint twice(int x) {\n    return 2 * x;\n}\n\nint main() {\n    printf("%d\\n", twice(21));\n    return 0;\n}`)).toBe("42\n");
  });

  it("passes arguments as copies", () => {
    const code = `#include <stdio.h>\n\nvoid change(int n) {\n    n = 99;\n}\n\nint main() {\n    int score = 5;\n    change(score);\n    printf("%d\\n", score);\n    return 0;\n}`;
    expect(run(code)).toBe("5\n");
  });

  it("keeps a local variable separate from a global one with the same name", () => {
    const code = `#include <stdio.h>\n\nint count = 100;\n\nvoid show() {\n    int count = 5;\n    printf("%d\\n", count);\n}\n\nint main() {\n    show();\n    count++;\n    printf("%d\\n", count);\n    return 0;\n}`;
    expect(run(code)).toBe("5\n101\n");
  });

  it("still reports two different functions with the same name and argument types", () => {
    const code = `#include <stdio.h>\n\nint f(int x) {\n    return 1;\n}\n\nint f(int x) {\n    return 2;\n}\n\nint main() {\n    printf("%d\\n", f(3));\n    return 0;\n}`;
    expect(rawJscppError(code)).not.toBeNull();
  });
});
