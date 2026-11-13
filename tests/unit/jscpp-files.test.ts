// Files and the end of input in the C interpreter. Upstream JSCPP had no
// file functions at all, scanf returned the number of % codes instead of the
// number of values read, getchar() gave 0 at the end of input and EOF did
// not exist. scripts/patch-jscpp.mjs adds virtual files: the host passes
// config.files (name -> text) and reads it back after the run.

import { describe, expect, it } from "vitest";
import { escapeSpacesInStringLiterals } from "../../src/runners/c/prepare-source";
import { rawJscppError, runCInteractive } from "../helpers/jscpp";

function run(code: string, stdin: string[] = [], files: Record<string, string> = {}): { stdout: string; files: Record<string, string> } {
  const stdout = runCInteractive(escapeSpacesInStringLiterals(code), stdin, files).stdout;
  return { stdout, files };
}

const HEAD = "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n";

describe("writing files", () => {
  it("creates a file with fopen \"w\" and fprintf", () => {
    const result = run(HEAD + String.raw`
int main() {
    FILE *f = fopen("log.txt", "w");
    if (f == NULL) {
        printf("could not open\n");
        return 1;
    }
    for (int i = 1; i <= 3; i++) {
        fprintf(f, "reading %d: %.1f\n", i, i * 1.5);
    }
    fputs("done\n", f);
    fputc('!', f);
    fclose(f);
    printf("saved\n");
    return 0;
}`);
    expect(result.stdout).toBe("saved\n");
    expect(result.files["log.txt"]).toBe("reading 1: 1.5\nreading 2: 3.0\nreading 3: 4.5\ndone\n!");
  });

  it("empties an existing file with \"w\" and adds to the end with \"a\"", () => {
    const files = { "old.txt": "old text\n", "list.txt": "one\n" };
    run(HEAD + String.raw`
int main() {
    FILE *f = fopen("old.txt", "w");
    fprintf(f, "new\n");
    fclose(f);
    FILE *g = fopen("list.txt", "a");
    fprintf(g, "two\n");
    fclose(g);
    return 0;
}`, [], files);
    expect(files).toEqual({ "old.txt": "new\n", "list.txt": "one\ntwo\n" });
  });

  it("writes to stdout and stderr like printf", () => {
    expect(run(HEAD + String.raw`
int main() {
    fprintf(stdout, "out %d\n", 1);
    fprintf(stderr, "err\n");
    fflush(stdout);
    return 0;
}`).stdout).toBe("out 1\nerr\n");
  });
});

describe("reading files", () => {
  const data = { "temps.txt": "21.5\n22.0\n19.5\n" };

  it("returns NULL when the file does not exist", () => {
    expect(run(HEAD + String.raw`
int main() {
    FILE *f = fopen("missing.txt", "r");
    if (f == NULL) {
        printf("no such file\n");
        return 1;
    }
    return 0;
}`).stdout).toBe("no such file\n");
  });

  it("reads line by line with fgets until it returns NULL", () => {
    expect(run(HEAD + String.raw`
int main() {
    char line[50];
    int count = 0;
    FILE *f = fopen("temps.txt", "r");
    while (fgets(line, sizeof(line), f) != NULL) {
        count++;
        printf("%d:%s", count, line);
    }
    fclose(f);
    printf("%d lines\n", count);
    return 0;
}`, [], { ...data }).stdout).toBe("1:21.5\n2:22.0\n3:19.5\n3 lines\n");
  });

  it("stops fgets at the size it is given", () => {
    expect(run(HEAD + String.raw`
int main() {
    char part[5];
    FILE *f = fopen("words.txt", "r");
    while (fgets(part, 5, f) != NULL) {
        printf("[%s]", part);
    }
    printf("\n");
    return 0;
}`, [], { "words.txt": "abcdefg\nhi\n" }).stdout).toBe("[abcd][efg\n][hi\n]\n");
  });

  it("reads numbers with fscanf until it stops returning 1", () => {
    expect(run(HEAD + String.raw`
int main() {
    double t, sum = 0;
    int n = 0;
    FILE *f = fopen("temps.txt", "r");
    while (fscanf(f, "%lf", &t) == 1) {
        sum += t;
        n++;
    }
    printf("%d values, average %.2f, eof %d\n", n, sum / n, feof(f));
    fclose(f);
    return 0;
}`, [], { ...data }).stdout).toBe("3 values, average 21.00, eof 1\n");
  });

  it("reads characters with fgetc until EOF, and rewinds", () => {
    expect(run(HEAD + String.raw`
int main() {
    FILE *f = fopen("a.txt", "r");
    int c;
    int letters = 0;
    while ((c = fgetc(f)) != EOF) {
        if (c != '\n') {
            letters++;
        }
    }
    rewind(f);
    printf("%d %c\n", letters, getc(f));
    fclose(f);
    return 0;
}`, [], { "a.txt": "hey\nyou\n" }).stdout).toBe("6 h\n");
  });

  it("writes a file and reads it back in the same program", () => {
    const result = run(HEAD + String.raw`
int main() {
    FILE *out = fopen("squares.txt", "w");
    for (int i = 1; i <= 4; i++) {
        fprintf(out, "%d %d\n", i, i * i);
    }
    fclose(out);
    FILE *in = fopen("squares.txt", "r");
    int a, b, total = 0;
    while (fscanf(in, "%d %d", &a, &b) == 2) {
        total += b;
    }
    fclose(in);
    printf("%d\n", total);
    return 0;
}`);
    expect(result.stdout).toBe("30\n");
    expect(result.files["squares.txt"]).toBe("1 1\n2 4\n3 9\n4 16\n");
  });
});

describe("reading CSV", () => {
  it("splits lines with sscanf and literal commas", () => {
    expect(run(HEAD + String.raw`
int main() {
    char line[60];
    int h, m;
    double temp;
    FILE *f = fopen("log.csv", "r");
    fgets(line, sizeof(line), f);
    while (fgets(line, sizeof(line), f) != NULL) {
        if (sscanf(line, "%d:%d,%lf", &h, &m, &temp) == 3) {
            printf("%02d%02d=%.1f ", h, m, temp);
        } else {
            printf("bad ");
        }
    }
    printf("\n");
    return 0;
}`, [], { "log.csv": "time,temp\n08:30,21.5\noops\n09:00,22.4\n" }).stdout).toBe("0830=21.5 bad 0900=22.4 \n");
  });

  it("splits lines with strtok, empty pieces skipped", () => {
    expect(run(HEAD + String.raw`
int main() {
    char line[60] = "pump,3,,12.5";
    char *field = strtok(line, ",");
    while (field != NULL) {
        printf("[%s]", field);
        field = strtok(NULL, ",");
    }
    printf(" %s\n", line);
    return 0;
}`).stdout).toBe("[pump][3][12.5] pump\n");
  });

  it("finds a separator with strchr, strrchr and strstr", () => {
    expect(run(HEAD + String.raw`
int main() {
    char s[30] = "key=value=x";
    char *p = strchr(s, '=');
    char *q = strrchr(s, '=');
    char *r = strstr(s, "val");
    *p = '\0';
    printf("%s|%s|%s|%s|%c\n", s, p + 1, q, r, r[1]);
    printf("%s\n", s + 1);
    return 0;
}`).stdout).toBe("key|value=x|=x|value=x|a\ney\n");
  });
});

describe("the end of input", () => {
  it("returns how many values scanf stored, and EOF at the end", () => {
    expect(run(HEAD + String.raw`
int main() {
    int x, sum = 0, n;
    while ((n = scanf("%d", &x)) == 1) {
        sum += x;
    }
    printf("sum %d, last %d, EOF %d\n", sum, n, EOF);
    return 0;
}`, ["4 5", "6"]).stdout).toBe("sum 15, last -1, EOF -1\n");
  });

  it("returns 0 and leaves the input when the text is not a number", () => {
    expect(run(HEAD + String.raw`
int main() {
    int x = 7;
    char word[20];
    int n = scanf("%d", &x);
    scanf("%s", word);
    printf("%d %d %s\n", n, x, word);
    return 0;
}`, ["abc"]).stdout).toBe("0 7 abc\n");
  });

  it("does not skip over text to find a number further on", () => {
    expect(run(HEAD + String.raw`
int main() {
    int x = -1;
    char junk[20];
    int n = scanf("%d", &x);
    if (n == 0) {
        scanf("%s", junk);
    }
    int m = scanf("%d", &x);
    printf("%d %s %d %d\n", n, junk, m, x);
    return 0;
}`, ["abc", "40"]).stdout).toBe("0 abc 1 40\n");
  });

  it("counts partial matches in sscanf", () => {
    expect(run(HEAD + String.raw`
int main() {
    int a = 0, b = 0;
    printf("%d ", sscanf("5 x", "%d %d", &a, &b));
    printf("%d ", sscanf("", "%d", &a));
    printf("%d\n", sscanf("010", "%d", &a));
    printf("%d %d\n", a, b);
    return 0;
}`).stdout).toBe("1 -1 1\n10 0\n");
  });

  it("gives EOF from getchar at the end of input", () => {
    expect(run(HEAD + String.raw`
int main() {
    int c, n = 0;
    while ((c = getchar()) != EOF) {
        n++;
    }
    printf("%d\n", n);
    return 0;
}`, ["ab", "c"]).stdout).toBe("5\n");
  });

  it("reads typed lines with fgets(line, size, stdin)", () => {
    expect(run(HEAD + String.raw`
int main() {
    char line[40];
    while (fgets(line, sizeof(line), stdin) != NULL) {
        line[strlen(line) - 1] = '\0';
        printf("<%s>", line);
    }
    printf("\n");
    return 0;
}`, ["set speed 40", "stop"]).stdout).toBe("<set speed 40><stop>\n");
  });
});

describe("file mistakes give clear errors", () => {
  it("using the NULL from a failed fopen", () => {
    expect(rawJscppError(HEAD + "int main() {\n    char line[10];\n    FILE *f = fopen(\"nope.txt\", \"r\");\n    fgets(line, 10, f);\n    return 0;\n}\n")).toMatch(/null file/);
  });

  it("reading a file opened for writing", () => {
    expect(rawJscppError(HEAD + "int main() {\n    FILE *f = fopen(\"x.txt\", \"w\");\n    fgetc(f);\n    return 0;\n}\n")).toMatch(/not open for reading/);
  });

  it("using a file after fclose", () => {
    expect(rawJscppError(HEAD + "int main() {\n    FILE *f = fopen(\"x.txt\", \"w\");\n    fclose(f);\n    fputc('a', f);\n    return 0;\n}\n")).toMatch(/already closed/);
  });

  it("an unknown mode", () => {
    expect(rawJscppError(HEAD + "int main() {\n    FILE *f = fopen(\"x.txt\", \"write\");\n    return 0;\n}\n")).toMatch(/the mode must be/);
  });
});
