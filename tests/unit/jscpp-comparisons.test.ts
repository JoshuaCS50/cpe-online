// In C a comparison is an int: 1 when true, 0 when false. The interpreter
// works with JavaScript booleans internally, and scripts/patch-jscpp.mjs
// converts them where a program can see the difference.

import { describe, expect, it } from "vitest";
import { escapeSpacesInStringLiterals } from "../../src/runners/c/prepare-source";
import { runCInteractive } from "../helpers/jscpp";

function run(body: string, stdin: string[] = []): string {
  const code = `#include <stdio.h>\nint main() {\n${body}\n    return 0;\n}`;
  return runCInteractive(escapeSpacesInStringLiterals(code), stdin).stdout;
}

describe("comparison results in C", () => {
  it("prints a comparison with %d as 1 or 0", () => {
    expect(run(`    int a = 5, b = 8;\n    printf("%d %d %d\\n", a < b, a == b, !(a < b));`)).toBe("1 0 0\n");
  });

  it("prints && and || results as 1 or 0", () => {
    expect(run(`    int n = 15;\n    printf("%d %d\\n", n > 10 && n < 20, n < 0 || n > 99);`)).toBe("1 0\n");
  });

  it("stores a comparison in an int as 1 or 0", () => {
    expect(run(`    int age;\n    scanf("%d", &age);\n    int teen = age >= 13 && age <= 19;\n    printf("%d\\n", teen);`, ["15"])).toBe("1\n");
    expect(run(`    int age;\n    scanf("%d", &age);\n    int teen = age >= 13 && age <= 19;\n    printf("%d\\n", teen);`, ["12"])).toBe("0\n");
  });

  it("compares a stored comparison with 1", () => {
    expect(run(`    int big = 7 > 3;\n    if (big == 1) printf("yes\\n"); else printf("no\\n");`)).toBe("yes\n");
  });

  it("adds comparison results as numbers", () => {
    expect(run(`    int count = 0;\n    count = count + (3 > 2);\n    count += (2 > 3);\n    count += (5 == 5);\n    printf("%d\\n", count);`)).toBe("2\n");
  });

  it("prints a comparison with %f as 1 or 0", () => {
    expect(run(`    printf("%.1f\\n", (float)(1 < 2));`)).toBe("1.0\n");
  });

  it("prints a comparison through cout as 1 or 0", () => {
    const code = `#include <iostream>\nusing namespace std;\nint main() {\n    int a = 5, b = 8;\n    cout << (a < b) << " " << (a > b) << endl;\n    return 0;\n}`;
    expect(runCInteractive(code, []).stdout).toBe("1 0\n");
  });
});
