---
id: core.c.decision-bugs
kind: lesson
track: core
unit: a3
order: 5
title: "Bug hunt: decisions"
titleKid: Find the sneaky mistakes
language: c
concepts: [logic-error, debugging, assignment-vs-comparison, boundary]
prereqs: [core.c.if-else, core.c.reading-errors]
links:
  - to: core.c.reading-errors
    kind: builds-on
    note: That lesson fixes programs that will not run. These programs run, but give the wrong answer.
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["100"]
        expect: "Perfect score!\nPass\n"
      - stdin: ["50"]
        expect: "Pass\n"
      - stdin: ["49"]
        expect: "Fail\nTry the extra exercises.\n"
      - stdin: ["75"]
        expect: "Pass\n"
  - type: code-contains
    pattern: 'mark\s*==\s*100'
    message: Compares the mark with 100 using ==
hints:
  - Every mark prints Perfect score. Look at the first if. Is it comparing the mark with 100, or storing 100 in it?
  - A mark of exactly 50 should pass. Check whether the second if uses > or >=.
  - Try the extra exercises appears even for a perfect score. Look closely at the end of the third if line, just before the brace.
hintsKid:
  - Every mark says Perfect. Look at the first if. Does it have two = marks?
  - Fifty should pass. Is it > or >=?
  - Look at the end of the last if line. Is there a ; that should not be there?
---
Some bugs stop a program dead. A misspelled name or a missing semicolon brings up an error card. The bugs in this lesson are quieter. The program starts, runs to the last line and prints an answer. The answer is simply wrong.

These are called logic errors. Every instruction did exactly what it said; the instructions just did not say what you meant. The computer cannot tell a correct program from a wrong one that still obeys the rules, so it reports nothing. You are the only detector.

## How to hunt

Write down the output you expect before pressing Run. Without a prediction there is nothing to compare, and a wrong answer can look fine.

Then pick inputs that sit on the edges. If 50 or more passes, then 49, 50 and 100 are the interesting marks, because the boundary sits between them. Add one ordinary value, such as 75, to catch problems that are not about an edge.

Run each input and hold the two answers side by side. When they differ, stop and find the line responsible. Read it slowly, one symbol at a time, and say what each symbol does. The mistake is often one character wide: a `=` where two are needed, a `>` where `>=` belongs, or a stray `;`.

Pressing Check my answer runs several inputs and shows the expected output beside what your program printed. The difference between the two is the clue.

## The three classic decision bugs

### `=` instead of `==`

```c
if (mark = 100) {     // stores 100 in mark
if (mark == 100) {    // compares mark with 100
```

A single `=` stores the value on the right into the variable on the left. So `if (mark = 100)` puts 100 into `mark`, then tests the stored value. Because 100 is not 0, the test is always true. The mark that was typed is overwritten, so every later test reads 100 as well. Use `==`, which asks a question and changes nothing.

### The wrong boundary

```c
if (mark > 50) {      // 50 misses
if (mark >= 50) {     // 50 passes
```

`>` and `>=` differ by exactly one value, and that value is usually the one that matters. Read the task's words: "50 or more" includes 50, so the test is `mark >= 50`. Try the boundary number itself, not only the numbers either side of it.

### A semicolon after the condition

```c
if (mark < 50); {     // the if ends at the ;
if (mark < 50) {      // the block belongs to the if
```

A semicolon is an empty instruction, and here it becomes the whole body of the `if`. The `if` ends at the semicolon. The brace below opens an ordinary block that no longer belongs to the `if`, so that block runs every time, whatever the mark. Look at the end of a condition line whenever a block runs when it should not.

## One fix at a time

Change one thing, run again, and check that one symptom went away. Then look at what is left. Several edits at once mix their effects, and a new wrong answer no longer says which edit caused it.

::: kid
A detective reads a page with a magnifying glass.

Something is wrong, but nothing is on fire.

The page looks fine at a glance.

So the detective checks one mark at a time.

First, are there two `=` marks?

Next, should that `>` be `>=`?

Last, is there a `;` at the end?

One small change, then read the page again.

That is how a bug is caught.
:::

::: try
This program has three bugs on purpose. It still runs, but the answers are wrong.

It should print `Perfect score!` only for a mark of 100. It should print `Pass` for 50 or more, and `Fail` below 50. It should print `Try the extra exercises.` only below 50. Nothing else should change.

Find and fix all three. Change one thing at a time, and run again after each change.
:::

::: try-kid
The program has three small mistakes.

It still runs, but the answers are wrong.

Fix one line. Press Run. Read the answer.

Then look at the next line.

Try these marks when you test.

100 should say Perfect score, then Pass.

50 should say Pass.

49 should say Fail. Then it should ask for extra practice.
:::

```c {role=starter file=marks.c}
#include <stdio.h>

int main() {
    int mark;

    scanf("%d", &mark);

    if (mark = 100) {
        printf("Perfect score!\n");
    }

    if (mark > 50) {
        printf("Pass\n");
    } else {
        printf("Fail\n");
    }

    if (mark < 50); {
        printf("Try the extra exercises.\n");
    }

    return 0;
}
```

```c {role=solution file=marks.c}
#include <stdio.h>

int main() {
    int mark;

    scanf("%d", &mark);

    if (mark == 100) {
        printf("Perfect score!\n");
    }

    if (mark >= 50) {
        printf("Pass\n");
    } else {
        printf("Fail\n");
    }

    if (mark < 50) {
        printf("Try the extra exercises.\n");
    }

    return 0;
}
```
