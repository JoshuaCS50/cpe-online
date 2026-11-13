---
id: core.c.print-debugging
kind: lesson
track: core
unit: a14
order: 3
title: Print debugging
titleKid: Making the program tell you what it is doing
language: c
concepts: [print-debugging, tracing, debug-flag, boundary]
prereqs: [core.c.error-messages, core.c.while, core.c.functions]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["50 10"]
        expect: "Full in 7 minutes\n"
      - stdin: ["0 16"]
        expect: "Full in 8 minutes\n"
      - stdin: ["70 20"]
        expect: "Full in 2 minutes\n"
      - stdin: ["95 3"]
        expect: "Full in 5 minutes\n"
      - stdin: ["100 5"]
        expect: "Full in 0 minutes\n"
  - type: code-contains
    pattern: '#define\s+DEBUG\s+0\b'
    message: 'Leaves the trace lines in, switched off with #define DEBUG 0'
hints:
  - 'Run it as it is, with DEBUG switched on, and type 50 10. The trace shows the charge every minute. Work out by hand what the charge should be after each minute and compare.'
  - 'Look at the minute where the charge is exactly 80. The rule says that from 80 upward the battery charges at half the rate. Which comparison decides that?'
  - 'Change charge > 80 to charge >= 80, then switch the traces off with #define DEBUG 0.'
hintsKid:
  - 'Run it. The extra lines show the charge every minute.'
  - 'Look at the minute where the charge is exactly 80.'
  - 'At 80 it should already go slower. Then set DEBUG to 0.'
---
When a program gives a wrong answer and you cannot see why, make it tell you what it is doing. Adding `printf` lines that show the values of variables at chosen moments is called **print debugging**. It is the oldest debugging tool there is, it works in every language and on every machine (including microcontrollers, through the serial port), and professionals use it every day.

## Where to put the prints

- **Inside a loop**, to see each pass: the loop counter and the values that change.
- **Before and after a suspicious line**, to see what it really did.
- **At the start of a function**, showing the values it was given, and **before `return`**, showing what it gives back.
- **In each branch of an `if`**, to see which way the program went.

Start with a few prints around the part you suspect. Add more where the values first go wrong, and narrow it down.

## Make the output easy to read

Label every value, and mark debug lines so they stand out from the real output:

```c
printf("DEBUG minute %d: charge %d, step %d\n", minutes, charge, step);
```

`DEBUG x=7` is clear; a bare `7` among other numbers is not. Then compare each line with what you **expected** it to be. The first line that differs is where to look.

## Switching them off: a debug flag

Debug lines must not stay in the finished output. Deleting them all means retyping them for the next bug, so many programmers leave them in behind a switch:

```c
#define DEBUG 1        // 1 = show traces, 0 = hide them

if (DEBUG) {
    printf("DEBUG charge %d\n", charge);
}
```

One change at the top turns all the traces on or off. With `DEBUG 0`, the `if` is never true and the lines do nothing.

## When printing is not enough

- In a loop that runs thousands of times, the output becomes too long to read. Print only some passes, for example `if (minutes > 95)`, or switch to the debugger.
- To see everything at one moment, or to follow the program step by step, the debugger (next lessons) is faster: no code changes, and you can look at any variable.
- Do not forget to switch the traces off: real programs have been shipped with debug output still in them.

::: kid
You can make a program talk while it runs.

Add printf lines that show what is in each box.

Then compare with what you expected.

The first number that is wrong shows where the bug is.

When you are done, switch the extra lines off.
:::

```c {role=example file=trace.c}
#include <stdio.h>

#define DEBUG 1

// Adds up the numbers from 1 to n, with a trace of every step.
int sumTo(int n) {
    int total = 0;
    int i = 1;
    while (i <= n) {
        total = total + i;
        if (DEBUG) {
            printf("DEBUG i=%d total=%d\n", i, total);
        }
        i++;
    }
    return total;
}

int main() {
    printf("Sum to 5: %d\n", sumTo(5));
    return 0;
}
```

::: try
A battery charger's display shows how many minutes are left until the battery is full. The rules: below 80% the charge rises by `rate` percent each minute; from 80% upward it rises by half of `rate` (but at least 1); it never goes above 100%. The program reads the starting charge and the rate on one line, for example `50 10`, which should take 7 minutes. It gets some answers wrong. Run it with the trace that is already switched on, find the bug, fix it, and then switch the trace off with `#define DEBUG 0`.
:::

::: try-kid
The charger says how long until the battery is full.

From 80 up, the battery fills more slowly.

Use the extra lines to find the bug.

Then switch them off with `DEBUG 0`.
:::

```c {role=starter file=charger.c}
#include <stdio.h>

#define DEBUG 1

int minutesToFull(int start, int rate) {
    int charge = start;
    int minutes = 0;
    while (charge < 100) {
        int step = rate;
        if (charge > 80) {
            step = rate / 2;
            if (step < 1) {
                step = 1;
            }
        }
        if (DEBUG) {
            printf("DEBUG minute %d: charge %d, step %d\n", minutes, charge, step);
        }
        charge = charge + step;
        if (charge > 100) {
            charge = 100;
        }
        minutes++;
    }
    return minutes;
}

int main() {
    int start;
    int rate;
    scanf("%d %d", &start, &rate);
    printf("Full in %d minutes\n", minutesToFull(start, rate));
    return 0;
}
```

```c {role=solution file=charger.c}
#include <stdio.h>

#define DEBUG 0

int minutesToFull(int start, int rate) {
    int charge = start;
    int minutes = 0;
    while (charge < 100) {
        int step = rate;
        if (charge >= 80) {
            step = rate / 2;
            if (step < 1) {
                step = 1;
            }
        }
        if (DEBUG) {
            printf("DEBUG minute %d: charge %d, step %d\n", minutes, charge, step);
        }
        charge = charge + step;
        if (charge > 100) {
            charge = 100;
        }
        minutes++;
    }
    return minutes;
}

int main() {
    int start;
    int rate;
    scanf("%d %d", &start, &rate);
    printf("Full in %d minutes\n", minutesToFull(start, rate));
    return 0;
}
```
