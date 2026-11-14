---
id: core.c.writing-files
kind: lesson
track: core
unit: a10
order: 2
title: Writing files
titleKid: Saving a page
language: c
concepts: [files, fprintf, fputs, file-modes, append]
prereqs: [core.c.reading-files]
est_minutes: 14
checks:
  - type: file-equals
    stdin: ["3", "72", "45", "50"]
    file: report.txt
    expect: "Mark 1: 72 PASS\nMark 2: 45 FAIL\nMark 3: 50 PASS\nPassed: 2 of 3\n"
  - type: file-equals
    stdin: ["2", "49", "30"]
    file: report.txt
    expect: "Mark 1: 49 FAIL\nMark 2: 30 FAIL\nPassed: 0 of 2\n"
  - type: file-equals
    stdin: ["1", "100"]
    file: report.txt
    expect: "Mark 1: 100 PASS\nPassed: 1 of 1\n"
  - type: stdout-equals
    stdin: ["2", "60", "40"]
    expect: "Report saved in report.txt\n"
hints:
  - Open the file once, before the loop, with FILE *out = fopen("report.txt", "w"); and check it is not NULL.
  - "Inside the loop, fprintf works like printf with the file first: fprintf(out, \"Mark %d: %d %s\\n\", i + 1, mark, mark >= 50 ? \"PASS\" : \"FAIL\");"
  - After the loop, write the Passed line the same way, then fclose(out); before printing the message.
hintsKid:
  - Open report.txt with "w" before the loop.
  - Write one line for each mark with fprintf.
  - Write the total line. Then close the file.
---
Writing a file uses the same `FILE *` as reading, with a different mode and the "f" versions of the printing functions.

## Modes

| Mode | Opens the file to | If the file exists | If it does not |
|---|---|---|---|
| `"r"` | read | reads from the start | `fopen` returns `NULL` |
| `"w"` | write | **empties it first** | creates it |
| `"a"` | add to the end | keeps it, writes after the old text | creates it |

`"w"` is the one to be careful with: opening an important file with `"w"` wipes it, even if nothing is written. A `+` after the letter (`"r+"`, `"a+"`) allows both reading and writing, which this course does not need.

## Writing

```c
FILE *out = fopen("log.txt", "w");
if (out == NULL) {
    printf("Cannot create log.txt\n");
    return 1;
}
fprintf(out, "Speed: %d rpm\n", speed);
fputs("Motor stopped\n", out);
fclose(out);
```

`fprintf` is `printf` with the file as its first value. `fputs` writes a string as it is (it does not add a `'\n'`, unlike `puts`). `fputc` writes one character. Nothing in the file changes until the program writes to it, and the `'\n'` at the end of each line is up to you.

`fprintf(stdout, ...)` prints to the screen, because `stdout`, the screen, is a `FILE *` too. `stderr` is a second screen stream meant for error messages; on a desktop it can be kept apart from normal output.

## Closing matters

On a real computer, written text first collects in memory and goes to the disk in large pieces. `fclose` sends the rest. A program that ends or crashes without `fclose` can leave a file cut short. Close every file you write as soon as you are done with it.

## Logging with "a"

Data loggers usually open their file with `"a"`, so each run adds new lines under the old ones instead of replacing them:

```c
FILE *log = fopen("events.txt", "a");
fprintf(log, "%02d:%02d door opened\n", hours, minutes);
fclose(log);
```

## Common mistakes

- **Opening with `"w"` inside a loop.** Each pass empties the file again, so only the last line survives. Open once before the loop.
- **Writing with `printf` instead of `fprintf`.** The text goes to the screen, not the file.
- **Forgetting `'\n'`.** All the values end up on one long line.

::: kid
Writing a file is like saving a page.

Open it with "w" to start a fresh page.

Careful: "w" rubs out what was there before.

Open it with "a" to add to the end instead.

Write lines with fprintf. Close the page when you finish.
:::

```c {role=example file=logger.c}
#include <stdio.h>

int main() {
    FILE *log = fopen("motor-log.txt", "w");
    if (log == NULL) {
        printf("Cannot create the log\n");
        return 1;
    }

    int speed = 0;
    for (int second = 1; second <= 5; second++) {
        speed = speed + 300;
        fprintf(log, "t=%ds speed=%d rpm\n", second, speed);
    }
    fputs("Target reached\n", log);
    fclose(log);

    // Read it back to show what was saved.
    char line[60];
    FILE *in = fopen("motor-log.txt", "r");
    while (fgets(line, sizeof(line), in) != NULL) {
        printf("%s", line);
    }
    fclose(in);
    return 0;
}
```

::: try
The program reads how many marks there are, then the marks. Write a report to `report.txt`: one line per mark, such as `Mark 1: 72 PASS` (50 or more passes), then a last line `Passed: 2 of 3`. The check looks inside `report.txt`, so write the lines with `fprintf`. The message on the screen is already printed for you.
:::

::: try-kid
Read the marks.

Write one line for each mark into report.txt.

Say PASS for 50 or more, or FAIL.

At the end, write how many passed.
:::

```c {role=starter file=report.c}
#include <stdio.h>

int main() {
    int count;
    scanf("%d", &count);

    // Open report.txt, write a line for each mark and the Passed line, close it.
    for (int i = 0; i < count; i++) {
        int mark;
        scanf("%d", &mark);
    }

    printf("Report saved in report.txt\n");
    return 0;
}
```

```c {role=solution file=report.c}
#include <stdio.h>

int main() {
    int count;
    scanf("%d", &count);

    FILE *out = fopen("report.txt", "w");
    if (out == NULL) {
        printf("Cannot create report.txt\n");
        return 1;
    }

    int passed = 0;
    for (int i = 0; i < count; i++) {
        int mark;
        scanf("%d", &mark);
        if (mark >= 50) {
            passed++;
            fprintf(out, "Mark %d: %d PASS\n", i + 1, mark);
        } else {
            fprintf(out, "Mark %d: %d FAIL\n", i + 1, mark);
        }
    }
    fprintf(out, "Passed: %d of %d\n", passed, count);
    fclose(out);

    printf("Report saved in report.txt\n");
    return 0;
}
```
