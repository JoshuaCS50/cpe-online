---
id: core.c.for
kind: lesson
track: core
unit: a4
order: 2
title: for loops
titleKid: Counting from start to finish
language: c
concepts: [loop, for, counter, increment]
prereqs: [core.c.while]
links:
  - to: core.c.while
    kind: builds-on
    note: A for loop is a while loop with its start, test and step written on one line.
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["3"]
        expect: "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n"
      - stdin: ["7"]
        expect: "7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n"
  - type: code-contains
    pattern: 'for\s*\('
    message: Uses a for loop
hints:
  - The counter goes from 1 to 5. Start it at 1, keep going while it is 5 or less, and add one each time.
  - Inside the loop, print one line of the table using n, the counter, and their product.
  - 'The loop is: for (int i = 1; i <= 5; i++) { printf("%d x %d = %d\n", n, i, n * i); }'
hintsKid:
  - Count from 1 to 5. Start at 1. Stop after 5.
  - Each time, say one line of the table.
  - 'Type this: `for (int i = 1; i <= 5; i++) { printf("%d x %d = %d\n", n, i, n * i); }`'
---
Many loops count. They begin at one number, finish at another, and move by a fixed amount each time round. This shape is so common that C gives it a loop of its own, with all three parts written on one line where they are easy to read and easy to check.

## The shape

```c
for (start; test; step) {
    // lines to repeat
}
```

The start runs once, before anything else, and usually sets the counter. The test runs before every repetition, and the body runs only while the test is true. The step runs after every repetition, just before the next test. Then C returns to the test.

## The same loop, two ways

```c
int i = 1;

while (i <= 5) {
    printf("%d\n", i);
    i++;
}
```

```c
for (int i = 1; i <= 5; i++) {
    printf("%d\n", i);
}
```

Read the `for` line from left to right and the three parts of the `while` version appear in the same order. `int i = 1` is the start, `i <= 5` is the test, and `i++` is the step that used to sit at the bottom of the body. Both loops print 1 to 5.

## Counting in other ways

The step does not have to go up by one. `i--` counts down, and `i += 2` moves in twos, so `for (int i = 10; i > 0; i -= 2)` prints 10, 8, 6, 4 and 2.

The test decides where the loop stops, and `<` and `<=` differ by one. Starting at 1, `i < 5` gives four turns, for 1, 2, 3 and 4. Change it to `i <= 5` and there are five turns, because the 5 is now included as well.

## Where the counter lives

A counter declared in the brackets, as in `for (int i = 1; ...)`, belongs to the loop alone. It is created by the start and disappears at the closing brace, so using `i` after the loop is an error. A counter declared before the loop, as in the `while` version above, stays alive afterwards and could still be used once the loop is over.

## Adding things up

A loop can collect a result as it goes. Start a total at 0 before the loop, then add each number to it:

```c
int total = 0;

for (int i = 1; i <= 10; i++) {
    total += i;
}
```

After the last turn, `total` holds 1 + 2 + 3 and so on up to 10, which is 55.

## Common mistakes

- **Off by one.** Writing `i < 5` when five turns were meant gives only four. Check the last value the loop should reach and pick `<` or `<=` to match it.
- **A semicolon after the brackets.** `for (...);` makes an empty instruction the whole body. The counter still moves, but the lines that should repeat never run.
- **Changing the counter in the body as well.** With `i++` in the step and another `i++` in the body, the counter jumps two at a time and the loop ends early.

::: kid
A staircase goes up to the top.

You stand at the bottom step, number 1.

You climb one step and count it.

Then the next step, and the next.

Each step is one more than the last.

At the top you stop climbing.

The bottom, the top, and one step at a time.

That is all a for loop needs.
:::

```c {role=example file=squares.c}
#include <stdio.h>

int main() {
    for (int i = 1; i <= 5; i++) {
        printf("%d squared is %d\n", i, i * i);
    }
    return 0;
}
```

::: try
The program reads a number `n` and prints the first five lines of its times table, in the form `3 x 1 = 3` and so on up to `3 x 5 = 15`. Replace the comment with a `for` loop.

It is checked with more than one number, so the answer has to be worked out, not typed in.
:::

::: try-kid
The program reads a number.

Print five lines of its table.

Start at 1 and stop after 5.

Each line looks like 3 x 1 = 3.

Use a for loop where the comment is.

Press Run to test it.
:::

```c {role=starter file=table.c}
#include <stdio.h>

int main() {
    int n;

    scanf("%d", &n);

    // Print the table here.

    return 0;
}
```

```c {role=solution file=table.c}
#include <stdio.h>

int main() {
    int n;

    scanf("%d", &n);

    for (int i = 1; i <= 5; i++) {
        printf("%d x %d = %d\n", n, i, n * i);
    }

    return 0;
}
```
