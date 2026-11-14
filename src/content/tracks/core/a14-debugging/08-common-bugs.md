---
id: core.c.common-bugs
kind: lesson
track: core
unit: a14
order: 8
title: Hunting common bugs
titleKid: The bugs everyone meets
language: c
concepts: [common-bugs, assignment-vs-equality, integer-division, missing-ampersand, stray-semicolon, off-by-one]
prereqs: [core.c.rubber-duck, core.c.for]
est_minutes: 16
checks:
  - type: io-cases
    cases:
      - stdin: ["4", "60", "45", "72", "50"]
        expect: "Above 50: 2\nAverage: 56.8\n"
      - stdin: ["3", "10", "20", "40"]
        expect: "Above 50: 0\nAverage: 23.3\n"
      - stdin: ["2", "51", "100"]
        expect: "Above 50: 2\nAverage: 75.5\n"
hints:
  - 'First the crash: read the card. One scanf is storing a value without its &.'
  - 'Next, "Above 50" counts everything: look at the end of the if line. A semicolon there ends the if, and the count++ below always runs.'
  - 'Last, the average loses its decimals because total / count divides two ints. Write (double) total / count.'
hintsKid:
  - 'Read the card. One scanf has no `&`.'
  - 'Look at the end of the if line. Is there a stray `;`?'
  - 'Write `(double) total / count` for the average.'
---
Most bugs are not new. The same dozen mistakes turn up in beginners' and professionals' code, year after year. Knowing them by sight saves hours: when a program misbehaves, run through this list first.

## The list

**`=` instead of `==`.** `if (count = 0)` does not compare: it sets `count` to 0, and the test is then false. Read every `=` inside an `if` or loop condition aloud as "becomes" and check that is what you mean.

**Off by one.** `i <= n` where `i < n` was meant, or a count that starts at 1 instead of 0. Loops over 0 to n - 1 use `<`. Test with the smallest cases, such as one item.

**Integer division.** `7 / 2` is 3 in C, and `total / count` throws away the fraction even when the result is stored in a `double`. Cast one side: `(double) total / count`.

**A missing `&` in `scanf`.** `scanf("%d", value)` passes the value instead of where to put it. Here it stops with a card; on a desktop it can crash much later. Every variable that `scanf` fills needs `&` (except a char array for `%s`).

**A stray semicolon.** `if (x > 50);` or `for (i = 0; i < n; i++);`: the semicolon is an empty statement that ends the `if` or loop, and the block below it always runs, or runs once. The program looks right at a glance, which is what makes it nasty.

**Variables used before they are set.** In real C, a variable that was never given a value holds leftover junk. (Here new variables happen to start at 0, so the bug can hide.) Give every variable a starting value.

**Loops that never end.** The loop variable never changes (`while (i < 10)` with no `i++`), or changes the wrong way. If a program stops responding, press Stop and look at what changes inside the loop.

**Missing `break` in a `switch`.** Without it, the next `case` runs too.

## How to use the list

When a program misbehaves, before anything else, scan it for these patterns. It takes a minute, and finds the problem surprisingly often. Then fall back on the full method from earlier in this unit.

::: kid
Some bugs happen to everybody.

One equals sign sets a box. Two equals signs compare.

A stray `;` after an if can switch the if off.

Dividing two whole numbers throws away the part after the dot.

`scanf` needs a `&` before the box name.

Learn these, and you will spot them fast.
:::

```c {role=example file=pitfalls.c}
#include <stdio.h>

int main() {
    int total = 7;
    int count = 2;

    // Integer division drops the .5:
    printf("total / count = %d\n", total / count);
    // A cast keeps it:
    printf("(double) total / count = %.1f\n", (double) total / count);

    // = sets, == compares:
    int level = 5;
    if (level == 0) {
        printf("empty\n");
    } else {
        printf("level is %d\n", level);
    }
    return 0;
}
```

::: try
This program reads how many marks there are, then the marks, and prints how many are above 50 and the average with one decimal. It contains three of the common bugs from this lesson: one makes it crash, one makes the count wrong, and one loses the decimals of the average. Find and fix all three.
:::

::: try-kid
The program counts marks above 50 and finds the average.

It has three of the bugs from this lesson.

Fix them one at a time.
:::

```c {role=starter file=marks.c}
#include <stdio.h>

int main() {
    int count;
    int total = 0;
    int above = 0;

    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        int mark;
        scanf("%d", mark);
        total = total + mark;
        if (mark > 50);
        {
            above++;
        }
    }

    double average = total / count;
    printf("Above 50: %d\n", above);
    printf("Average: %.1f\n", average);
    return 0;
}
```

```c {role=solution file=marks.c}
#include <stdio.h>

int main() {
    int count;
    int total = 0;
    int above = 0;

    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        int mark;
        scanf("%d", &mark);
        total = total + mark;
        if (mark > 50) {
            above++;
        }
    }

    double average = (double) total / count;
    printf("Above 50: %d\n", above);
    printf("Average: %.1f\n", average);
    return 0;
}
```
