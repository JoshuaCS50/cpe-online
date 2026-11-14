---
id: core.c.reading-files
kind: lesson
track: core
unit: a10
order: 1
title: Reading files
titleKid: Opening a saved page
language: c
concepts: [files, fopen, fgets, fscanf, fclose, eof]
prereqs: [core.c.strings, core.c.pointers]
est_minutes: 16
checks:
  - type: io-cases
    cases:
      - stdin: ["22"]
        expect: "Readings above 22.0: 3\nHighest: 24.5\n"
      - stdin: ["20"]
        expect: "Readings above 20.0: 6\nHighest: 24.5\n"
      - stdin: ["25"]
        expect: "Readings above 25.0: 0\nHighest: 24.5\n"
      - stdin: ["21"]
        expect: "Readings above 21.0: 5\nHighest: 24.5\n"
  - type: code-contains
    pattern: 'fopen\s*\(\s*"readings\.txt"\s*,\s*"r"\s*\)'
    message: Opens readings.txt for reading
  - type: code-contains
    pattern: 'fclose\s*\('
    message: Closes the file with fclose
hints:
  - Open the file with FILE *f = fopen("readings.txt", "r"); and check if (f == NULL) before using it.
  - "Read one number at a time: while (fscanf(f, \"%lf\", &value) == 1) { ... }. Inside, count the values above the limit and keep the highest so far."
  - Start highest at the first reading or at a very low number such as -1000, then fclose(f) when the loop ends.
hintsKid:
  - Open the file with "r" for reading.
  - Read one number each time round the loop.
  - Count the big ones. Remember the biggest. Close the file.
---
Everything a program has stored so far vanished when it ended. **Files** keep data after the program stops: sensor logs, settings, results to hand in. C reads and writes files through a `FILE *`, a pointer to the information C keeps about an open file.

In this course, a program can open the files in the explorer (in Code mode) or the files a lesson gives it, as if they were on a disk. A file the program writes shows up in the explorer, so you can open it and look.

## Opening and closing

```c
FILE *f = fopen("readings.txt", "r");
if (f == NULL) {
    printf("Cannot open readings.txt\n");
    return 1;
}
// ... read from f ...
fclose(f);
```

`fopen` takes the file name and a **mode**: `"r"` to read. It returns `NULL` when it cannot open the file, most often because the name is wrong, so always check before using the pointer. `fclose` tells C you are finished with the file. Every successful `fopen` should have one `fclose`.

## Reading numbers with fscanf

`fscanf` works exactly like `scanf`, but reads from a file. Its result is the number of values it managed to store, so a loop can keep going while that number is right:

```c
double value;
while (fscanf(f, "%lf", &value) == 1) {
    printf("Got %.1f\n", value);
}
```

At the end of the file there is nothing left to read and `fscanf` returns `EOF`, which is -1, so the loop stops. It also stops at text that is not a number, instead of looping forever.

## Reading lines with fgets

`fgets` reads one whole line, spaces included, into a char array:

```c
char line[100];
while (fgets(line, sizeof(line), f) != NULL) {
    printf("Line: %s", line);
}
```

The size stops `fgets` from writing past the end of the array: it reads at most `sizeof(line) - 1` characters and always adds the `'\0'`. The line keeps its `'\n'` at the end (which is why the `printf` above has none). At the end of the file `fgets` returns `NULL`.

`fgets(line, sizeof(line), stdin)` reads a typed line the same way. It is the safe way to read text with spaces, which `scanf("%s")` cannot.

## The feof trap

`feof(f)` only becomes true **after** a read has failed at the end of the file. A loop written as `while (!feof(f))` therefore runs once too often and handles the last value twice. Test the result of the read itself, as in the loops above.

## Common mistakes

- **Not checking for NULL.** Reading from a failed `fopen` stops the program with an error.
- **Wrong file name.** Names must match exactly, capital letters and extension included: `Readings.txt` is a different file.
- **Forgetting `fclose`.** Real programs can lose data that was never written out, and run out of files they may open at once.

::: kid
A file is like a page saved in a folder.

It stays there after the program stops.

First the program opens the page with fopen.

Then it reads the page, one line or number at a time.

When it is done, it closes the page with fclose.
:::

```text {role=file file=readings.txt}
21.5
22.0
23.5
19.0
24.5
20.5
22.5
```

```c {role=example file=show.c}
#include <stdio.h>

int main() {
    char line[50];
    int number = 0;

    FILE *f = fopen("readings.txt", "r");
    if (f == NULL) {
        printf("Cannot open readings.txt\n");
        return 1;
    }

    while (fgets(line, sizeof(line), f) != NULL) {
        number++;
        printf("Line %d: %s", number, line);
    }
    fclose(f);

    printf("The file has %d lines.\n", number);
    return 0;
}
```

::: try
`readings.txt` holds one temperature per line (shown below). The program reads a limit from the keyboard. Open the file, read every temperature, and set `above` to how many are bigger than the limit and `highest` to the biggest one. Close the file when you are done.
:::

::: try-kid
The file has a list of temperatures.

Count the ones bigger than the limit.

Find the biggest one too.
:::

```c {role=starter file=temps.c}
#include <stdio.h>

int main() {
    double limit;
    int above = 0;
    double highest = 0;

    scanf("%lf", &limit);

    // Open readings.txt, read every value, and close the file.

    printf("Readings above %.1f: %d\n", limit, above);
    printf("Highest: %.1f\n", highest);
    return 0;
}
```

```c {role=solution file=temps.c}
#include <stdio.h>

int main() {
    double limit;
    int above = 0;
    double highest = 0;

    scanf("%lf", &limit);

    FILE *f = fopen("readings.txt", "r");
    if (f == NULL) {
        printf("Cannot open readings.txt\n");
        return 1;
    }

    double value;
    int first = 1;
    while (fscanf(f, "%lf", &value) == 1) {
        if (value > limit) {
            above++;
        }
        if (first || value > highest) {
            highest = value;
            first = 0;
        }
    }
    fclose(f);

    printf("Readings above %.1f: %d\n", limit, above);
    printf("Highest: %.1f\n", highest);
    return 0;
}
```
