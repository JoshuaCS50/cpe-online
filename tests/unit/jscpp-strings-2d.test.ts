// <string.h> functions and arrays of arrays in the C interpreter. Upstream
// JSCPP crashed in strcmp (equal strings), strcat, strncat and sprintf,
// copied nothing in strncpy, and rejected every 2D initialiser list.
// scripts/patch-jscpp.mjs fixes them.

import { describe, expect, it } from "vitest";
import { escapeSpacesInStringLiterals } from "../../src/runners/c/prepare-source";
import { rawJscppError, runCInteractive } from "../helpers/jscpp";

function source(body: string): string {
  return `#include <stdio.h>\n#include <string.h>\n\nint main() {\n${body}\n    return 0;\n}`;
}

function run(body: string, stdin: string[] = []): string {
  return runCInteractive(escapeSpacesInStringLiterals(source(body)), stdin).stdout;
}

describe("strcmp", () => {
  it("gives 0 for equal strings", () => {
    expect(run(`    char a[10] = "sun";\n    char b[10] = "sun";\n    printf("%d %d\\n", strcmp(a, b), strcmp("same", "same"));`)).toBe("0 0\n");
  });

  it("gives the sign of the first difference", () => {
    expect(run(`    printf("%d %d\\n", strcmp("apple", "pear") < 0, strcmp("pear", "apple") > 0);`)).toBe("1 1\n");
  });

  it("puts a shorter word first when it is the start of the longer one", () => {
    expect(run(`    printf("%d %d\\n", strcmp("sun", "sunny") < 0, strcmp("sunny", "sun") > 0);`)).toBe("1 1\n");
  });

  it("orders capital letters before small ones", () => {
    expect(run(`    printf("%d\\n", strcmp("Zebra", "apple") < 0);`)).toBe("1\n");
  });

  it("compares words read with scanf", () => {
    const body = `    char a[20];\n    char b[20];\n    scanf("%s", a);\n    scanf("%s", b);\n    printf("%d\\n", strcmp(a, b) == 0);`;
    expect(run(body, ["moon", "moon"])).toBe("1\n");
    expect(run(body, ["moon", "mood"])).toBe("0\n");
  });
});

describe("copying and joining strings", () => {
  it("joins with strcat", () => {
    expect(run(`    char a[30] = "sun";\n    char b[30] = "flower";\n    strcat(a, b);\n    strcat(a, "s");\n    printf("%s %d\\n", a, (int) strlen(a));`)).toBe("sunflowers 10\n");
  });

  it("copies with strcpy", () => {
    expect(run(`    char a[30];\n    strcpy(a, "rose");\n    printf("%s\\n", a);`)).toBe("rose\n");
  });

  it("copies at most n characters with strncpy", () => {
    expect(run(`    char a[10];\n    strncpy(a, "abcdef", 3);\n    a[3] = '\\0';\n    printf("%s\\n", a);`)).toBe("abc\n");
  });

  it("joins at most n characters with strncat", () => {
    expect(run(`    char a[20] = "ab";\n    strncat(a, "cdef", 2);\n    printf("%s\\n", a);`)).toBe("abcd\n");
  });

  it("formats into a string with sprintf", () => {
    expect(run(`    char buf[30];\n    sprintf(buf, "%d-%s", 7, "up");\n    printf("[%s]\\n", buf);`)).toBe("[7-up]\n");
  });

  it("copies a word that fits exactly, terminator included", () => {
    expect(run(`    char a[4];\n    strcpy(a, "abc");\n    printf("%s\\n", a);`)).toBe("abc\n");
  });

  it("refuses to copy or join past the end of the destination", () => {
    expect(rawJscppError(source(`    char a[4];\n    strcpy(a, "abcd");`))).not.toBeNull();
    expect(rawJscppError(source(`    char a[4] = "ab";\n    strcat(a, "cdef");`))).not.toBeNull();
  });
});

describe("one-dimensional starting values", () => {
  it("fills the rest with 0 after a single value", () => {
    expect(run(`    int a[3] = {1};\n    printf("%d %d %d\\n", a[0], a[1], a[2]);`)).toBe("1 0 0\n");
  });

  it("still sets everything to 0 with = {0}", () => {
    expect(run(`    int a[4] = {0};\n    printf("%d %d\\n", a[0], a[3]);`)).toBe("0 0\n");
  });
});

describe("arrays of arrays", () => {
  it("takes a nested list of starting values", () => {
    expect(run(`    int s[2][3] = {{1, 0, 1}, {0, 0, 1}};\n    printf("%d %d %d\\n", s[0][0], s[0][1], s[1][2]);`)).toBe("1 0 1\n");
  });

  it("fills rows and values that are left out with 0", () => {
    expect(run(`    int s[3][3] = {{1}, {4, 5}};\n    printf("%d %d %d %d %d\\n", s[0][0], s[0][2], s[1][1], s[2][0], s[2][2]);`)).toBe("1 0 5 0 0\n");
  });

  it("sets every element to 0 with = {0}", () => {
    expect(run(`    int s[2][3] = {0};\n    printf("%d %d\\n", s[0][0], s[1][2]);`)).toBe("0 0\n");
  });

  it("works out the first size from the list", () => {
    expect(run(`    int s[][2] = {{1, 2}, {3, 4}, {5, 6}};\n    printf("%d\\n", s[2][1]);`)).toBe("6\n");
  });

  it("passes a 2D array to a function", () => {
    const code = `#include <stdio.h>\n\nint total(int m[][3], int rows) {\n    int sum = 0;\n    for (int r = 0; r < rows; r++) {\n        for (int c = 0; c < 3; c++) {\n            sum += m[r][c];\n        }\n    }\n    return sum;\n}\n\nint main() {\n    int m[2][3] = {{1, 2, 3}, {4, 5, 6}};\n    printf("%d\\n", total(m, 2));\n    return 0;\n}`;
    expect(runCInteractive(code, []).stdout).toBe("21\n");
  });

  it("reads into each element with scanf", () => {
    const body = `    int g[2][2];\n    for (int r = 0; r < 2; r++) {\n        for (int c = 0; c < 2; c++) {\n            scanf("%d", &g[r][c]);\n        }\n    }\n    printf("%d %d\\n", g[0][1], g[1][0]);`;
    expect(run(body, ["1", "2", "3", "4"])).toBe("2 3\n");
  });

  it("still reports too many rows", () => {
    expect(rawJscppError(source(`    int s[2][2] = {{1, 2}, {3, 4}, {5, 6}};`))).not.toBeNull();
  });

  it("still reports a single value other than 0 for a whole 2D array", () => {
    expect(rawJscppError(source(`    int s[2][2] = {5};`))).not.toBeNull();
  });
});

describe("scanf %s", () => {
  it("reads symbols as well as letters, up to the next space", () => {
    const body = `    char a[20];\n    char b[20];\n    scanf("%s %s", a, b);\n    printf("[%s] [%s] %d\\n", a, b, (int) strlen(a));`;
    expect(run(body, ["([]{}) a+b*(c-d)"])).toBe("[([]{})] [a+b*(c-d)] 6\n");
    expect(run(body, [")", "x=1;"])).toBe("[)] [x=1;] 1\n");
  });
});

describe("array starting values", () => {
  it("copies each value, so changing the array leaves the variable alone", () => {
    expect(run(`    int x = 1;\n    int a[2] = {x, x};\n    a[0] = 5;\n    printf("%d %d %d\\n", x, a[0], a[1]);`)).toBe("1 5 1\n");
  });

  it("starts fresh on every call of a function", () => {
    const code = `#include <stdio.h>\n\nvoid f(int n) {\n    int a[3] = {n};\n    int g[2][2] = {{n, n}};\n    printf("%d %d %d %d\\n", a[0], a[1], g[0][1], g[1][0]);\n    a[1] = 99;\n    g[1][0] = 99;\n}\n\nint main() {\n    f(1);\n    f(2);\n    return 0;\n}`;
    expect(runCInteractive(escapeSpacesInStringLiterals(code), []).stdout).toBe("1 0 1 0\n2 0 2 0\n");
  });

  it("starts fresh on every pass of a loop", () => {
    expect(run(`    for (int i = 1; i <= 2; i++) {\n        int a[2] = {i};\n        printf("%d %d ", a[0], a[1]);\n        a[1] = 7;\n    }\n    printf("\\n");`)).toBe("1 0 2 0 \n");
  });
});
