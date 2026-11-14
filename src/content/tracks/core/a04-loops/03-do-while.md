---
id: core.c.do-while
kind: lesson
track: core
unit: a4
order: 3
title: do-while loops
titleKid: Try first, then check
language: c
concepts: [loop, do-while, input-checking]
prereqs: [core.c.while]
links:
  - to: core.c.while
    kind: contrast
    note: while tests before the first run, so its body can run zero times; do-while always runs its body at least once.
est_minutes: 10
checks:
  - type: io-cases
    cases:
      - stdin: ["5"]
        expect: "You chose 5\n"
      - stdin: ["0", "11", "4"]
        expect: "You chose 4\n"
      - stdin: ["-3", "10"]
        expect: "You chose 10\n"
  - type: code-contains
    pattern: 'do\s*\{'
    message: Uses a do-while loop
hints:
  - The number has to be read at least once, which is exactly what do-while is for. Put the scanf inside do { ... }.
  - The loop should repeat while the number is out of range, that is while n < 1 || n > 10.
  - 'The loop is: do { scanf("%d", &n); } while (n < 1 || n > 10);'
hintsKid:
  - Read the number inside do. It always runs once.
  - Ask again if it is under 1 or over 10.
  - 'Type this: do { scanf("%d", &n); } while (n < 1 || n > 10);'
---
An `if` checks first and may run nothing. A `while` loop works the same way: it tests the condition before the first turn, so the body can run zero times. Sometimes that is wrong, because the body is exactly what produces the value being tested.

Reading an answer is the clearest example. You cannot judge a number before you have read one, and the first read must always happen. A loop whose body reads, and whose test then judges the result, is the right tool. C has one, called `do-while`.

## The shape

```c
do {
    // lines to repeat
} while (condition);
```

C runs the body first, then tests the condition. If it is true, the body runs again; if it is false, the loop ends. Because the test sits at the bottom, the body always runs at least once.

The semicolon after `while (condition);` is required here. A plain `while` loop ends with a closing brace and no semicolon, so this one is easy to forget. Leave it out and the program will not run.

## Asking until the input is right

A menu that accepts only 1 to 10 must read a number before it can tell whether the number is any good:

```c
int n;

do {
    scanf("%d", &n);
} while (n < 1 || n > 10);
```

The test describes bad input, not good input. `n < 1 || n > 10` means "out of range", so the loop repeats while the number is out of range and stops as soon as a number from 1 to 10 arrives. No extra `scanf` before the loop is needed, because the first one already sits inside the body.

## The three loops side by side

| Loop | When the test runs | Fewest runs of the body | Typical use |
|---|---|---|---|
| `while` | before each turn | 0 | repeat while something remains |
| `for` | before each turn | 0 | count a fixed number of turns |
| `do-while` | after each turn | 1 | read input, then check it |

The first two can skip their body completely. The reading loop above cannot, which is why it needs the third kind.

## Common mistakes

- **No semicolon after `while (condition)`.** This loop needs one. Without it the program will not run.
- **Testing for good input.** The condition says when to go round again, so it must describe the bad case. `while (n >= 1 && n <= 10);` repeats while the number is fine and stops at the first bad one.
- **Declaring the variable inside the braces.** With `do { int n; scanf("%d", &n); } while (n < 1);` the test cannot see `n`, because it disappears at the closing brace. Declare the variable before the loop.

::: kid
Soup is cooking in a pot. You always taste it once.

If it tastes right, you stop. If not, you add a little salt.

Then you taste it again. You keep tasting while it is not right.

The first taste always happens, before any checking.

A while loop would check first and might never taste.

So do-while fits here.
:::

```c {role=example file=digits.c}
#include <stdio.h>

int main() {
    int n = 4096;
    int copy = n;
    int digits = 0;

    do {
        digits++;
        n = n / 10;
    } while (n != 0);

    printf("%d has %d digits\n", copy, digits);

    // A while loop would report 0 digits for 0, because its test fails first.
    copy = 0;
    n = 0;
    digits = 0;

    do {
        digits++;
        n = n / 10;
    } while (n != 0);

    printf("%d has %d digit\n", copy, digits);

    return 0;
}
```

::: try
The program must read a number and keep asking until the number is from 1 to 10, then print `You chose` and the number. The printing is already written. Replace the comment and the `scanf` line with a `do-while` loop.

It is tested with someone typing numbers that are out of range before a good one, so the answer has to be worked out, not typed in.
:::

::: try-kid
The program asks for a number from 1 to 10.

Read the number inside a do-while loop.

If it is too small or too big, ask again.

Then say You chose and the number.

Press Run to test it.
:::

```c {role=starter file=choose.c}
#include <stdio.h>

int main() {
    int n;

    // Keep asking until n is from 1 to 10.
    scanf("%d", &n);

    printf("You chose %d\n", n);

    return 0;
}
```

```c {role=solution file=choose.c}
#include <stdio.h>

int main() {
    int n;

    do {
        scanf("%d", &n);
    } while (n < 1 || n > 10);

    printf("You chose %d\n", n);

    return 0;
}
```
