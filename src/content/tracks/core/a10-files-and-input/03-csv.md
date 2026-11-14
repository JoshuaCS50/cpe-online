---
id: core.c.csv
kind: lesson
track: core
unit: a10
order: 3
title: Reading CSV files
titleKid: Lists split by commas
language: c
concepts: [csv, strtok, sscanf, parsing, validation]
prereqs: [core.c.reading-files, core.c.string-functions]
est_minutes: 18
checks:
  - type: io-cases
    cases:
      - stdin: ["T1"]
        expect: "T1: 4 readings, average 22.4\nBad lines: 1\n"
      - stdin: ["T2"]
        expect: "T2: 2 readings, average 19.5\nBad lines: 1\n"
      - stdin: ["T3"]
        expect: "T3: no readings\nBad lines: 1\n"
  - type: code-contains
    pattern: 'strcmp\s*\('
    message: Compares the sensor name with strcmp
hints:
  - "Split each line with strtok: time = strtok(line, \",\"); then sensor = strtok(NULL, \",\"); then text = strtok(NULL, \",\\n\");"
  - Turn the value text into a number with sscanf(text, "%lf", &value). If that does not return 1, or a piece is NULL, the line is bad.
  - For a good line whose sensor matches (strcmp(sensor, wanted) == 0), add the value to a total and count it.
hintsKid:
  - Cut each line at the commas with strtok.
  - Turn the last piece into a number. If it fails, count a bad line.
  - Add up the numbers for the sensor that was asked for.
---
**CSV** (comma-separated values) is the plainest way to store a table in a text file: one row per line, the columns separated by commas, often with a first line naming the columns. Spreadsheets save it, data loggers write it, and almost every tool can read it.

```
time,sensor,value
08:00,T1,21.5
08:00,T2,19.0
```

Reading CSV means reading each line with `fgets` and then **parsing** it: cutting it into fields and turning text into numbers.

## Fixed formats: sscanf

`sscanf` is `scanf` reading from a string. Characters in the format that are not `%` codes must appear in the text, so commas and colons can be part of the format:

```c
int hours, minutes;
double temp;
if (sscanf(line, "%d:%d,%lf", &hours, &minutes, &temp) == 3) {
    // all three values were found
}
```

The result counts the values stored. Comparing it with the number you expect is how you spot a broken line, instead of carrying on with nonsense.

One limit: `%s` reads up to the next space, not the next comma, so `"%s,%d"` swallows the comma and everything after it. Text fields need another tool.

## Text fields: strtok

`strtok` cuts a string into pieces at any of the characters you give it:

```c
char line[] = "08:15,T1,22.0";
char *time = strtok(line, ",");      // "08:15"
char *sensor = strtok(NULL, ",");    // "T1"
char *value = strtok(NULL, ",\n");   // "22.0"
```

The first call gets the string; later calls pass `NULL` to mean "carry on from where you stopped". Each call returns a pointer to the next piece, or `NULL` when there are no pieces left. Including `'\n'` among the separators also strips the newline that `fgets` keeps.

`strtok` works by writing `'\0'` over each separator, so it changes the line, and you cannot use it on a string literal or on a line you still need whole. It also skips empty fields: `a,,b` gives two pieces, not three. For files where a field can be empty, walk the line yourself with `strchr`.

## Turning text into numbers

`sscanf(text, "%lf", &value)` converts and tells you whether it worked. `atof(text)` and `atoi(text)` from `<stdlib.h>` are shorter but return 0 for text that is not a number, so you cannot tell `"0"` from `"error"`.

## Real files are messy

Logs contain errors, missing values and half-written lines. A good parser checks every step (`strtok` returning `NULL`, `sscanf` returning less than expected), counts or reports bad lines, and carries on with the rest. Full CSV also allows quoted fields that contain commas (`"Smith, J",72`); handling those needs a proper parser, beyond this lesson.

## Common mistakes

- **Not skipping the header.** Read the first line once before the loop, or the column names count as a bad row.
- **Comparing text with `==`.** Use `strcmp(sensor, "T1") == 0`.
- **Trusting every line.** One broken line should not stop the whole program or poison the average.

::: kid
A CSV file is a table written as plain text.

Each line is one row.

Commas split the row into boxes.

The program cuts each line at the commas.

Then it turns the number boxes into real numbers.

Some lines are broken. The program counts them and moves on.
:::

```text {role=file file=log.csv}
time,sensor,value
08:00,T1,21.5
08:00,T2,19.0
08:15,T1,22.0
08:15,T2,error
08:30,T1,23.5
08:30,T2,20.0
08:45,T1,22.5
```

```c {role=example file=times.c}
#include <stdio.h>

int main() {
    char line[80];
    FILE *f = fopen("log.csv", "r");
    if (f == NULL) {
        printf("Cannot open log.csv\n");
        return 1;
    }

    fgets(line, sizeof(line), f);    // skip the header
    int row = 1;
    while (fgets(line, sizeof(line), f) != NULL) {
        row++;
        int hours, minutes;
        if (sscanf(line, "%d:%d", &hours, &minutes) == 2) {
            printf("Row %d was logged %d minutes after midnight\n", row, hours * 60 + minutes);
        } else {
            printf("Row %d has no time\n", row);
        }
    }
    fclose(f);
    return 0;
}
```

::: try
`log.csv` (shown below) holds readings from two temperature sensors, and one reading that failed. The program reads a sensor name from the keyboard. Go through the file, skipping the header, and for that sensor count the good readings and add them up. Also count the bad lines in the whole file: lines where a piece is missing or the value is not a number. The printing at the end is done for you.
:::

::: try-kid
The file has readings from two sensors.

Find the readings for the sensor that was typed.

Count them and add them up.

Also count the broken lines.
:::

```c {role=starter file=sensors.c}
#include <stdio.h>
#include <string.h>

int main() {
    char wanted[10];
    char line[80];
    int count = 0;
    int bad = 0;
    double total = 0;

    scanf("%s", wanted);

    FILE *f = fopen("log.csv", "r");
    if (f == NULL) {
        printf("Cannot open log.csv\n");
        return 1;
    }
    fgets(line, sizeof(line), f);    // skip the header

    while (fgets(line, sizeof(line), f) != NULL) {
        // Split the line, check it, and add the value if the sensor matches.
    }
    fclose(f);

    if (count > 0) {
        printf("%s: %d readings, average %.1f\n", wanted, count, total / count);
    } else {
        printf("%s: no readings\n", wanted);
    }
    printf("Bad lines: %d\n", bad);
    return 0;
}
```

```c {role=solution file=sensors.c}
#include <stdio.h>
#include <string.h>

int main() {
    char wanted[10];
    char line[80];
    int count = 0;
    int bad = 0;
    double total = 0;

    scanf("%s", wanted);

    FILE *f = fopen("log.csv", "r");
    if (f == NULL) {
        printf("Cannot open log.csv\n");
        return 1;
    }
    fgets(line, sizeof(line), f);    // skip the header

    while (fgets(line, sizeof(line), f) != NULL) {
        char *time = strtok(line, ",");
        char *sensor = strtok(NULL, ",");
        char *text = strtok(NULL, ",\n");
        double value;
        if (time == NULL || sensor == NULL || text == NULL || sscanf(text, "%lf", &value) != 1) {
            bad++;
        } else if (strcmp(sensor, wanted) == 0) {
            total += value;
            count++;
        }
    }
    fclose(f);

    if (count > 0) {
        printf("%s: %d readings, average %.1f\n", wanted, count, total / count);
    } else {
        printf("%s: no readings\n", wanted);
    }
    printf("Bad lines: %d\n", bad);
    return 0;
}
```
