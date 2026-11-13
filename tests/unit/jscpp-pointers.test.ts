// Pointers in the C interpreter. Upstream JSCPP crashed on every pointer
// comparison and subtraction, on p += n, on %p and on `if (p)`, and p++
// moved the array the pointer was copied from. scripts/patch-jscpp.mjs
// fixes these.

import { describe, expect, it } from "vitest";
import { escapeSpacesInStringLiterals } from "../../src/runners/c/prepare-source";
import { rawJscppError, runCInteractive } from "../helpers/jscpp";

function source(body: string, top = ""): string {
  return `#include <stdio.h>\n#include <stdlib.h>\n\n${top}\nint main() {\n${body}\n    return 0;\n}`;
}

function run(body: string, top = "", stdin: string[] = []): string {
  return runCInteractive(escapeSpacesInStringLiterals(source(body, top)), stdin).stdout;
}

describe("moving a pointer", () => {
  it("leaves the array alone when the pointer moves", () => {
    expect(run(`    int v[3] = {10, 20, 30};\n    int *p = v;\n    p++;\n    printf("%d %d\\n", v[0], *p);`)).toBe("10 20\n");
  });

  it("leaves another pointer alone when a copy moves", () => {
    expect(run(`    int v[3] = {10, 20, 30};\n    int *p = v;\n    int *q = p;\n    q++;\n    printf("%d %d\\n", *p, *q);`)).toBe("10 20\n");
  });

  it("gives the old position to p++ and the new one to ++p", () => {
    expect(run(`    int v[3] = {5, 6, 7};\n    int *p = v;\n    int a = *p++;\n    int b = *++p;\n    printf("%d %d %d\\n", a, b, v[0]);`)).toBe("5 7 5\n");
  });

  it("moves with += and -=", () => {
    expect(run(`    int v[4] = {1, 2, 3, 4};\n    int *p = v;\n    p += 3;\n    printf("%d ", *p);\n    p -= 2;\n    printf("%d\\n", *p);`)).toBe("4 2\n");
  });

  it("changes the element it points at with (*p)++", () => {
    expect(run(`    int v[2] = {5, 6};\n    int *p = v;\n    (*p)++;\n    printf("%d %d\\n", v[0], v[1]);`)).toBe("6 6\n");
  });
});

describe("comparing pointers", () => {
  it("compares positions in the same array", () => {
    expect(run(`    int v[3] = {0};\n    int *a = &v[0];\n    int *b = &v[2];\n    printf("%d %d %d %d\\n", a < b, a > b, a <= a, b >= a);`)).toBe("1 0 1 1\n");
  });

  it("walks an array until the end with p < v + n", () => {
    expect(run(`    int v[4] = {1, 2, 3, 4};\n    int sum = 0;\n    for (int *p = v; p < v + 4; p++) {\n        sum += *p;\n    }\n    printf("%d\\n", sum);`)).toBe("10\n");
  });

  it("tells whether two pointers point at the same variable", () => {
    expect(run(`    int x = 1, y = 1;\n    int *a = &x;\n    int *b = &x;\n    int *c = &y;\n    printf("%d %d %d\\n", a == b, a == c, a != c);`)).toBe("1 0 1\n");
  });

  it("gives the distance between two positions", () => {
    expect(run(`    int v[5] = {0};\n    int *a = &v[1];\n    int *b = &v[4];\n    printf("%d\\n", (int)(b - a));`)).toBe("3\n");
  });
});

describe("NULL", () => {
  it("compares a pointer with NULL", () => {
    expect(run(`    int x = 1;\n    int *p = NULL;\n    int *q = &x;\n    printf("%d %d %d\\n", p == NULL, q == NULL, q != NULL);`)).toBe("1 0 1\n");
  });

  it("treats a pointer as true when it points somewhere", () => {
    expect(run(`    int x = 1;\n    int *p = &x;\n    int *q = NULL;\n    if (p) {\n        printf("p ");\n    }\n    if (!q) {\n        printf("not q\\n");\n    }`)).toBe("p not q\n");
  });

  it("stops with a clear error when reading through NULL", () => {
    expect(rawJscppError(source(`    int *p = NULL;\n    printf("%d\\n", *p);`))).toMatch(/null pointer/);
  });

  it("stops with a clear error when writing through a pointer that was never set", () => {
    expect(rawJscppError(source(`    int *p;\n    *p = 5;`))).toMatch(/null pointer/);
  });
});

describe("printing addresses with %p", () => {
  it("prints the same address for the same variable", () => {
    const out = run(`    int x = 5;\n    int *p = &x;\n    printf("%p %p\\n", p, &x);`);
    const [a, b] = out.trim().split(" ");
    expect(a).toMatch(/^0x[0-9a-f]+$/);
    expect(a).toBe(b);
  });

  it("prints neighbouring int elements 4 apart", () => {
    const out = run(`    int v[2] = {0};\n    printf("%p %p\\n", &v[0], &v[1]);`);
    const [a, b] = out.trim().split(" ").map((text) => parseInt(text, 16));
    expect(b! - a!).toBe(4);
  });

  it("prints (nil) for NULL", () => {
    expect(run(`    int *p = NULL;\n    printf("%p\\n", p);`)).toBe("(nil)\n");
  });
});

describe("passing addresses to functions", () => {
  it("swaps two variables through pointers", () => {
    const top = `void swap(int *a, int *b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}\n`;
    expect(run(`    int a = 3, b = 8;\n    swap(&a, &b);\n    printf("%d %d\\n", a, b);`, top)).toBe("8 3\n");
  });

  it("reads into a variable through a pointer parameter", () => {
    const top = `void read_number(int *target) {\n    scanf("%d", target);\n}\n`;
    expect(run(`    int value;\n    read_number(&value);\n    printf("%d\\n", value);`, top, ["42"])).toBe("42\n");
  });
});
