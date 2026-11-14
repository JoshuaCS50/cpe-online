---
id: core.c.if-else
kind: lesson
track: core
unit: a3
order: 2
title: if and else
titleKid: Choosing which way to go
language: c
concepts: [if, else, condition, block]
prereqs: [core.c.comparisons]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["50"]
        expect: "Pass\n"
      - stdin: ["49"]
        expect: "Fail\n"
      - stdin: ["100"]
        expect: "Pass\n"
      - stdin: ["0"]
        expect: "Fail\n"
  - type: code-contains
    pattern: 'else'
    message: Uses else for the other case
hints:
  - The mark passes when it is 50 or more, so the condition is mark >= 50.
  - Put printf("Pass\n"); inside the braces after if, and printf("Fail\n"); inside the braces after else.
  - 'The finished part is: if (mark >= 50) { printf("Pass\n"); } else { printf("Fail\n"); }'
hintsKid:
  - Fifty or more is a pass. Ask if mark >= 50.
  - Say Pass in the first part. Say Fail after else.
  - 'Type this: if (mark >= 50) { printf("Pass\n"); } else { printf("Fail\n"); }'
---
Every program so far has run its lines from top to bottom, one after the next. A choice breaks that habit. With `if`, the program looks at a condition and decides whether to run a group of lines or skip past them.

## The shape of an if

```c
if (condition) {
    // runs only when the condition is true
}
```

The braces hold the lines that belong to the choice. When the condition is true, every line between them runs. When it is false, the whole group is skipped and the program carries on after the closing brace.

## Adding the other path

```c
if (condition) {
    // runs when the condition is true
} else {
    // runs when it is false
}
```

`else` has no condition of its own. It is the path taken when the `if` failed, so exactly one of the two groups runs. Without `else`, the program simply continues after the `if`, whether the condition was true or false.

## What counts as true

Any comparison or logic question from the previous lesson can be the condition. So can a single value: any number that is not `0` counts as true, and `0` counts as false. That is why `if (age)` runs whenever the age is not zero, and `if (0)` never runs.

## Indentation is for people

The computer ignores the spaces at the start of a line. People do not. Indent every line inside the braces by 4 spaces, and the shape of the choice becomes visible at a glance.

## Always use braces

C lets you leave the braces out when the body is only one line. Do not do it. Here is why:

```c
if (score > 50)
    printf("Pass\n");
    printf("Well done\n");
```

That looks like two lines under the `if`, but only the first one belongs to it. The second line runs every time, whatever the score is.

With braces there is no doubt:

```c
if (score > 50) {
    printf("Pass\n");
    printf("Well done\n");
}
```

Both lines now sit inside the braces, so both run together or neither does.

## Common mistakes

- **`if (mark = 50)` instead of `if (mark == 50)`.** The first stores 50 in `mark` and then tests the stored value, which is not zero, so the branch runs every time. The program still runs, so nothing warns you.
- **A semicolon straight after the condition: `if (x > 3);`.** That semicolon is the whole body, so the `if` does nothing, and the next line runs every time.
- **The wrong boundary.** `>` and `>=` differ by exactly one value, and that value is often the one that matters. A mark of 50 passes, so the test must be `mark >= 50`.

::: kid
You walk along a path. Soon you reach a fork.

One way goes left, and one way goes right.

A sign asks a yes or no question.

Yes sends you left. No sends you right.

You walk one way only, never both.

`if` is the sign. `else` is the other way.

Put every step inside the braces, and nothing gets lost.
:::

```c {role=example file=even.c}
#include <stdio.h>

int main() {
    int n = 7;

    if (n % 2 == 0) {
        printf("%d is even\n", n);
    } else {
        printf("%d is odd\n", n);
    }

    n = 10;

    if (n % 2 == 0) {
        printf("%d is even\n", n);
    } else {
        printf("%d is odd\n", n);
    }
    return 0;
}
```

::: try
The program reads a mark and must print `Pass` when the mark is 50 or more, and `Fail` otherwise. The reading is already written. Replace the comment with the test and both answers.

It is checked with several marks, so the answer has to be decided, not typed in.
:::

::: try-kid
The program reads a mark. Fifty or more is a pass.

Replace the comment. Say Pass in the first part. Say Fail after else.

Press Run to test it.
:::

```c {role=starter file=grade.c}
#include <stdio.h>

int main() {
    int mark;

    scanf("%d", &mark);

    // Print Pass or Fail here.

    return 0;
}
```

```c {role=solution file=grade.c}
#include <stdio.h>

int main() {
    int mark;

    scanf("%d", &mark);

    if (mark >= 50) {
        printf("Pass\n");
    } else {
        printf("Fail\n");
    }

    return 0;
}
```
