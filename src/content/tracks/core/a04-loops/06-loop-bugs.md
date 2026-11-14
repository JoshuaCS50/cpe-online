---
id: core.c.loop-bugs
kind: lesson
track: core
unit: a4
order: 6
title: "Bug hunt: loops"
titleKid: Find the loop mistakes
language: c
concepts: [logic-error, debugging, off-by-one, accumulator, loop-invariant, infinite-loop]
prereqs: [core.c.for, core.c.decision-bugs]
links:
  - to: core.c.decision-bugs
    kind: builds-on
    note: The same hunting method, applied to loops.
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["5"]
        expect: "Sum: 15\nEven numbers: 2\n"
      - stdin: ["10"]
        expect: "Sum: 55\nEven numbers: 5\n"
      - stdin: ["4"]
        expect: "Sum: 10\nEven numbers: 2\n"
      - stdin: ["1"]
        expect: "Sum: 1\nEven numbers: 0\n"
  - type: code-contains
    pattern: 'total\s*\+='
    message: Adds each number to the total with +=
hints:
  - Work out the right answers by hand first. For 5, the sum 1 + 2 + 3 + 4 + 5 is 15, and the even numbers are 2 and 4.
  - Run it with 5. The sum is far too small. Look at the line inside the loop that changes total. Does it add i, or replace total with i?
  - Fix one thing and run again. Then check where the loop stops (should 5 itself be counted?) and what total starts at before the loop.
hintsKid:
  - Work it out first. For 5 the sum is 15.
  - Look at the line that changes total. Does it add?
  - Check where the loop stops. Check what total starts at.
---
Some bugs stop a program dead. A misspelled name or a missing semicolon brings up an error. The bugs here are quieter: the program runs to the last line and prints an answer that is simply wrong.

These are logic errors. Every instruction did what it said; the instructions did not say what you meant. The computer cannot tell a correct program from a wrong one that keeps the rules, so it reports nothing.

## Work out the answer first

Before you press Run, work the right answer out by hand for a small input. For 5, the whole numbers from 1 to 5 add up to 15, and two of them are even. Now you have something to compare against. A wrong answer can look reasonable when you have no prediction.

## Trace the loop

The trace table is the main tool for a loop. Give the counter a column, give each changed variable a column, and write one row per turn. Then compare each row with what the code really does.

```c
int total = 0;

for (int i = 1; i <= 3; i++) {
    total += i;
}
```

| Turn | `i` | `total` before | `total` after |
|---|---|---|---|
| 1 | 1 | 0 | 1 |
| 2 | 2 | 1 | 3 |
| 3 | 3 | 3 | 6 |

The table says what should happen; the code says what did happen. The first row where the two disagree points at the line responsible.

## A sentence to check

A loop invariant is one sentence that should be true at the start of every turn. For the loop above it is: `total` holds the sum of all the numbers before `i`. At the start of turn 3, `total` is 3 and the numbers before `i` are 1 and 2, so the sentence holds. When a turn begins and the sentence is false, the line that broke it is the bug.

## Five classic loop bugs

### Off by one

```c
for (int i = 1; i < n; i++) {     // stops before n
for (int i = 1; i <= n; i++) {    // includes n
```

If the task says the numbers up to `n`, then `n` belongs in the sum. Check the last value the loop should reach, then pick `<` or `<=`.

### A total in the wrong place

```c
int total = 1;                    // wrong: starts at one
int total = 0;                    // right: starts at zero

for (int i = 1; i <= n; i++) {
    int total = 0;                // wrong: a new total every turn
}
```

A sum must start at 0, outside the loop. Declared inside the loop it is created again on every turn, so only the last value survives.

### `=` where `+=` belongs

```c
total = i;                        // replaces the total
total += i;                       // adds i to the total
```

The single `=` stores, so the running total is thrown away and replaced by the current number. `+=` keeps what is there and adds to it.

### A loop that never ends

```c
while (i <= 5) {
    printf("%d\n", i);            // i never changes
}

while (i <= 5) {
    i--;                          // wrong way: i never reaches 6
}

while (i <= 5) {
    i++;                          // right way: the exit gets closer
}
```

The test stays true, so the loop runs for ever. Pressing the Stop button ends such a program.

### A semicolon after the loop brackets

```c
for (int i = 1; i <= 5; i++); {   // the ; is the whole body
for (int i = 1; i <= 5; i++) {    // the block repeats
```

The semicolon becomes the whole body. The loop counts to 5 doing nothing, and the block below runs once, after it has finished.

## One fix at a time

Change one line, run again, and check that one symptom has gone. Then trace the loop again with the same small input. Several edits at once mix their effects, and a wrong answer no longer says which one caused it.

::: kid
Count sheep jumping over a fence.

The first sheep jumps.

You say one.

The next sheep jumps.

You say two.

Check your count after each sheep.

If you miss one, the total is wrong.

Go back and count again.

Fix one thing, then count again.

One small slip spoils the whole number.
:::

::: try
This program has three bugs on purpose. It still runs, but the answers are wrong.

It should read `n`, print the sum of the whole numbers from 1 to `n`, and print how many of those numbers are even. Find and fix all three. Change one thing at a time, and run again after each change.
:::

::: try-kid
The program should add the numbers from 1 to n.

It should also count the even numbers.

It has three small mistakes.

Find them one at a time.

Press Run and read the answer.

For 5, the sum should be 15.

The even numbers should be 2.

Fix one line, then run again.
:::

```c {role=starter file=sums.c}
#include <stdio.h>

int main() {
    int n;
    int total = 1;
    int evens = 0;

    scanf("%d", &n);

    for (int i = 1; i < n; i++) {
        total = i;
        if (i % 2 == 0) {
            evens++;
        }
    }

    printf("Sum: %d\n", total);
    printf("Even numbers: %d\n", evens);

    return 0;
}
```

```c {role=solution file=sums.c}
#include <stdio.h>

int main() {
    int n;
    int total = 0;
    int evens = 0;

    scanf("%d", &n);

    for (int i = 1; i <= n; i++) {
        total += i;
        if (i % 2 == 0) {
            evens++;
        }
    }

    printf("Sum: %d\n", total);
    printf("Even numbers: %d\n", evens);

    return 0;
}
```
