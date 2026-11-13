// scanf into arrays and doubles. Upstream JSCPP treats every pointer into an
// array as a text buffer, so scanf("%d", &values[i]) failed with "Memory
// overflow", and it did not know %lf. scripts/patch-jscpp.mjs fixes both.

import { describe, expect, it } from "vitest";
import { escapeSpacesInStringLiterals } from "../../src/runners/c/prepare-source";
import { rawJscppError, runCInteractive } from "../helpers/jscpp";

function run(body: string, stdin: string[]): string {
  const code = `#include <stdio.h>\n#include <string.h>\n\nint main() {\n${body}\n    return 0;\n}`;
  return runCInteractive(escapeSpacesInStringLiterals(code), stdin).stdout;
}

describe("scanf into arrays", () => {
  it("reads into each element in a loop", () => {
    const body = `    int values[3];\n    for (int i = 0; i < 3; i++) {\n        scanf("%d", &values[i]);\n    }\n    printf("%d %d %d\\n", values[0], values[1], values[2]);`;
    expect(run(body, ["1", "2", "3"])).toBe("1 2 3\n");
  });

  it("changes only the element it is given", () => {
    expect(run(`    int values[3] = {0};\n    scanf("%d", &values[1]);\n    printf("%d %d %d\\n", values[0], values[1], values[2]);`, ["7"])).toBe("0 7 0\n");
  });

  it("accepts values + i as well as &values[i]", () => {
    const body = `    int values[3];\n    for (int i = 0; i < 3; i++) {\n        scanf("%d", values + i);\n    }\n    printf("%d\\n", values[0] + values[1] + values[2]);`;
    expect(run(body, ["4", "5", "6"])).toBe("15\n");
  });

  it("reads decimals into a float array", () => {
    expect(run(`    float v[2];\n    scanf("%f", &v[1]);\n    printf("%.2f\\n", v[1]);`, ["2.5"])).toBe("2.50\n");
  });

  it("reads two elements in one call", () => {
    expect(run(`    int v[2];\n    scanf("%d %d", &v[0], &v[1]);\n    printf("%d\\n", v[0] + v[1]);`, ["3 4"])).toBe("7\n");
  });

  it("still reads a word into a char array with %s", () => {
    expect(run(`    char name[20];\n    scanf("%s", name);\n    printf("Hi %s, %d letters\\n", name, (int)strlen(name));`, ["Thandi"])).toBe("Hi Thandi, 6 letters\n");
  });

  it("still stops a write past the end of the array", () => {
    const code = `#include <stdio.h>\n\nint main() {\n    int v[2];\n    int *p = v + 2;\n    scanf("%d", p);\n    return 0;\n}`;
    expect(rawJscppError(code, "9\n")).not.toBeNull();
  });
});

describe("scanf %lf", () => {
  it("reads a double", () => {
    expect(run(`    double d;\n    scanf("%lf", &d);\n    printf("%.3f\\n", d * 2);`, ["3.125"])).toBe("6.250\n");
  });

  it("prints a double with %lf and %.2lf", () => {
    expect(run(`    double d = 2.5;\n    printf("%lf and %.2lf\\n", d, d);`, [])).toBe("2.500000 and 2.50\n");
  });

  it("prints a long with %ld", () => {
    expect(run(`    long big = 123456;\n    printf("%ld\\n", big);`, [])).toBe("123456\n");
  });

  it("reads into a double array", () => {
    expect(run(`    double v[2];\n    scanf("%lf", &v[0]);\n    scanf("%lf", &v[1]);\n    printf("%.1f\\n", v[0] + v[1]);`, ["1.5", "2.25"])).toBe("3.8\n");
  });
});
