---
id: core.c.bug-hunt
kind: lesson
track: core
unit: a14
order: 9
title: Bug-hunt practice
titleKid: A bug hunt on your own
language: c
concepts: [debugging-practice, assignment-vs-equality, initial-values, off-by-one]
prereqs: [core.c.common-bugs]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["4", "12", "7", "25", "9"]
        expect: "Min 7, max 25, range 18\n"
      - stdin: ["3", "-5", "-2", "-9"]
        expect: "Min -9, max -2, range 7\n"
      - stdin: ["1", "42"]
        expect: "Min 42, max 42, range 0\n"
      - stdin: ["0"]
        expect: "No readings\n"
hints:
  - 'Start with 0 readings: the program should say No readings but does not. Look at the condition of the first if, and read its = aloud as "becomes".'
  - 'With 4 readings 12 7 25 9, trace min and max. They start at 0, so a minimum of 7 is never found, and with all negative readings the maximum stays 0.'
  - 'Read the first reading before the loop and start min and max at it; the loop from i = 1 then reads the other n - 1 readings. And use n == 0 in the if.'
hintsKid:
  - 'Try 0 readings first. Look at the first if.'
  - 'Should the smallest start at 0? Try 12 7 25 9.'
  - 'Start min and max at the first reading.'
---
This lesson is practice: one broken program, several bugs, and no new ideas. Use everything from this unit:

- **Read** what it prints, and compare it with what it should print.
- **Reproduce** each problem with the smallest input you can find. The test cases below are a good start: one normal case, all negative readings, a single reading, and no readings at all.
- **Check the common bugs** first: `=` versus `==`, starting values, off by one.
- **Inspect** with `printf` lines, a trace table, the debugger (Open in the editor), or by explaining the code out loud.
- **Fix one thing at a time**, and re-test all the cases after each fix.

The program finds the smallest and largest of a list of sensor readings and the range between them, the kind of summary a data logger shows. It has three bugs, and they hide each other: fixing one can make the output look worse for a moment before it gets better. That is normal.

## Choosing test cases

The test inputs were chosen on purpose, and choosing them is a skill to practise:

- A **normal** case, with the answer worked out by hand.
- Values that break a hidden **assumption**: here, all-negative readings, which catch anything that assumes values are above 0.
- The **smallest** cases: one item, and none.

Whenever you write a program like this yourself, test it with those kinds of input before calling it finished.

::: kid
This is a bug hunt on your own.

The program has three bugs.

Try each test. Find what goes wrong.

Check the common bugs first.

Fix one bug at a time, and test again.
:::

```c {role=example file=logger.c}
#include <stdio.h>

int main() {
    // A correct version of a similar summary, for a fixed list.
    int readings[5] = {18, 23, 21, 16, 25};
    int lowest = readings[0];
    int highest = readings[0];

    for (int i = 1; i < 5; i++) {
        if (readings[i] < lowest) {
            lowest = readings[i];
        }
        if (readings[i] > highest) {
            highest = readings[i];
        }
    }
    printf("Lowest %d, highest %d\n", lowest, highest);
    return 0;
}
```

::: try
The program reads how many readings follow, then the readings, and prints the smallest, the largest and the range (largest minus smallest), or `No readings` when there are none. It has three bugs. Find and fix them all; the four test cases must pass.
:::

::: try-kid
The program finds the smallest and biggest reading.

It has three bugs.

Find them all and fix them.
:::

```c {role=starter file=range.c}
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    if (n = 0) {
        printf("No readings\n");
        return 0;
    }

    int value;
    int min = 0;
    int max = 0;
    for (int i = 1; i < n; i++) {
        scanf("%d", &value);
        if (value < min) {
            min = value;
        }
        if (value > max) {
            max = value;
        }
    }

    printf("Min %d, max %d, range %d\n", min, max, max - min);
    return 0;
}
```

```c {role=solution file=range.c}
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    if (n == 0) {
        printf("No readings\n");
        return 0;
    }

    int value;
    scanf("%d", &value);
    int min = value;
    int max = value;
    for (int i = 1; i < n; i++) {
        scanf("%d", &value);
        if (value < min) {
            min = value;
        }
        if (value > max) {
            max = value;
        }
    }

    printf("Min %d, max %d, range %d\n", min, max, max - min);
    return 0;
}
```
