// malloc, calloc, realloc and free, which upstream JSCPP does not have.
// scripts/patch-jscpp.mjs adds them, with clear errors for the classic
// mistakes: using memory after free, freeing twice, and freeing an address
// that did not come from malloc.

import { describe, expect, it } from "vitest";
import { escapeSpacesInStringLiterals } from "../../src/runners/c/prepare-source";
import { rawJscppError, runCInteractive } from "../helpers/jscpp";

function source(body: string, top = ""): string {
  return `#include <stdio.h>\n#include <stdlib.h>\n\n${top}\nint main() {\n${body}\n    return 0;\n}`;
}

function run(body: string, top = "", stdin: string[] = []): string {
  return runCInteractive(escapeSpacesInStringLiterals(source(body, top)), stdin).stdout;
}

describe("malloc and free", () => {
  it("gives room for one value", () => {
    expect(run(`    int *p = malloc(sizeof(int));\n    *p = 12;\n    printf("%d\\n", *p);\n    free(p);`)).toBe("12\n");
  });

  it("gives room for an array of values", () => {
    expect(run(`    int n = 5;\n    int *v = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        v[i] = i * i;\n    }\n    printf("%d %d %d\\n", v[0], v[2], *(v + 4));\n    free(v);`)).toBe("0 4 16\n");
  });

  it("accepts the result cast with (int *)", () => {
    expect(run(`    int *v = (int *) malloc(3 * sizeof(int));\n    v[2] = 7;\n    printf("%d\\n", v[2]);\n    free(v);`)).toBe("7\n");
  });

  it("keeps the * in other pointer casts", () => {
    expect(run(`    int x = 4;\n    void *anything = &x;\n    int *p = (int *) anything;\n    printf("%d %d\\n", *p, (int) sizeof(int *));`)).toBe("4 4\n");
  });

  it("works for doubles", () => {
    expect(run(`    double *d = malloc(2 * sizeof(double));\n    d[1] = 2.5;\n    printf("%.1f\\n", d[1] * 2);\n    free(d);`)).toBe("5.0\n");
  });

  it("reads input into memory from malloc", () => {
    const body = `    int n;\n    scanf("%d", &n);\n    int *v = malloc(n * sizeof(int));\n    int sum = 0;\n    for (int i = 0; i < n; i++) {\n        scanf("%d", &v[i]);\n        sum += v[i];\n    }\n    printf("%d\\n", sum);\n    free(v);`;
    expect(run(body, "", ["3", "4", "5", "6"])).toBe("15\n");
  });

  it("can be returned from a function", () => {
    const top = `int *make(int n) {\n    int *v = malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        v[i] = i + 1;\n    }\n    return v;\n}\n`;
    expect(run(`    int *v = make(3);\n    printf("%d %d\\n", v[0], v[2]);\n    free(v);`, top)).toBe("1 3\n");
  });

  it("sets a freed pointer to NULL, after which free does nothing", () => {
    expect(run(`    int *v = malloc(2 * sizeof(int));\n    v[0] = 1;\n    free(v);\n    v = NULL;\n    printf("%d\\n", v == NULL);\n    free(v);`)).toBe("1\n");
  });

  it("lets free(NULL) do nothing", () => {
    expect(run(`    int *p = NULL;\n    free(p);\n    printf("ok\\n");`)).toBe("ok\n");
  });
});

describe("calloc and realloc", () => {
  it("starts calloc memory at 0", () => {
    expect(run(`    int *v = calloc(4, sizeof(int));\n    printf("%d %d\\n", v[0], v[3]);\n    free(v);`)).toBe("0 0\n");
  });

  it("keeps the old values when realloc makes a block bigger", () => {
    expect(run(`    int *v = malloc(2 * sizeof(int));\n    v[0] = 1;\n    v[1] = 2;\n    v = realloc(v, 4 * sizeof(int));\n    v[3] = 4;\n    printf("%d %d %d %d\\n", v[0], v[1], v[2], v[3]);\n    free(v);`)).toBe("1 2 0 4\n");
  });
});

describe("memory mistakes", () => {
  it("stops reading past the end of a block", () => {
    expect(rawJscppError(source(`    int *v = malloc(2 * sizeof(int));\n    v[2] = 5;`))).toMatch(/index out of bound 2 >= 2/);
  });

  it("stops using memory after free", () => {
    expect(rawJscppError(source(`    int *v = malloc(sizeof(int));\n    *v = 3;\n    free(v);\n    printf("%d\\n", *v);`))).toMatch(/use after free/);
  });

  it("stops freeing the same memory twice", () => {
    expect(rawJscppError(source(`    int *v = malloc(sizeof(int));\n    free(v);\n    free(v);`))).toMatch(/double free/);
  });

  it("stops freeing an ordinary array", () => {
    expect(rawJscppError(source(`    int v[3] = {0};\n    free(v);`))).toMatch(/bad free/);
  });

  it("stops freeing an address moved along from the start", () => {
    expect(rawJscppError(source(`    int *v = malloc(3 * sizeof(int));\n    v++;\n    free(v);`))).toMatch(/bad free/);
  });
});
