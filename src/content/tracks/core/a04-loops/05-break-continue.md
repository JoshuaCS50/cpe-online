---
id: core.c.break-continue
kind: lesson
track: core
unit: a4
order: 5
title: break and continue
titleKid: Stop now, or skip this one
language: c
concepts: [break, continue, sentinel, loop-control]
prereqs: [core.c.for]
links:
  - to: core.c.switch
    kind: same-idea
    note: The same break word leaves a switch. Inside a loop it leaves the loop.
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["4", "-2", "3", "0"]
        expect: "Sum: 7\n"
      - stdin: ["5", "0", "8"]
        expect: "Sum: 5\n"
      - stdin: ["-5", "-1", "10", "0", "99"]
        expect: "Sum: 10\n"
      - stdin: ["0"]
        expect: "Sum: 0\n"
  - type: code-contains
    pattern: '\bbreak\s*;'
    message: Uses break to stop at 0
  - type: code-contains
    pattern: '\bcontinue\s*;'
    message: Uses continue to skip negative numbers
hints:
  - Right after the scanf, check for 0 first. If n == 0, break leaves the loop at once.
  - Then check for a negative number. If n < 0, continue skips the rest of this turn, so the number is never added.
  - 'The two checks are: if (n == 0) { break; } and then if (n < 0) { continue; }, both before total += n;'
hintsKid:
  - First, stop the loop when the number is 0. Use break.
  - Next, skip numbers under 0. Use continue.
  - 'Type these before the adding line: `if (n == 0) { break; }` and `if (n < 0) { continue; }`'
---
A loop usually stops for one reason: its test becomes false. That is the plan you wrote in the brackets. Sometimes the body knows sooner than the test does. A number turns out to be the last one, or an item should not be counted at all. Two words let the body decide: `break` and `continue`.

## break

`break` leaves the loop at once. The rest of the body is skipped, the test is not checked again, and the program carries on with the first line after the loop's closing brace.

A search is a natural use. This loop looks for the first number from 50 upwards that 7 divides exactly, and stops as soon as it finds one:

```c
for (int i = 50; i <= 100; i++) {
    if (i % 7 == 0) {
        printf("First multiple of 7: %d\n", i);
        break;
    }
}
```

It prints `First multiple of 7: 56`. Without the `break`, it would carry on and print every multiple of 7 up to 100.

## while (1)

A test can also be written as `1`, which is true and never changes. The loop then depends on `break` alone to finish. This suits a list that ends with a special value, such as a 0 meaning "there are no more numbers":

```c
while (1) {
    scanf("%d", &n);
    if (n == 0) {
        break;
    }
    total += n;
}
```

A value that marks the end like this is called a stop value. Programmers also call it a sentinel.

This reads clearly when the exit sits near the top. The rule is strict: a `while (1)` loop must contain a `break` that will really be reached. Without one the test never fails and the program never finishes.

## continue

`continue` is gentler. It skips the rest of this turn and jumps straight to the next one. In a `for` loop the step still runs, so the counter keeps moving.

This loop prints only the even numbers from 1 to 10:

```c
for (int i = 1; i <= 10; i++) {
    if (i % 2 != 0) {
        continue;
    }
    printf("%d ", i);
}
printf("\n");
```

Its output is `2 4 6 8 10`. The odd numbers reach the `continue`, and everything below that line is skipped for the rest of the turn.

## Inside nested loops

In nested loops both words act on the innermost loop that contains them. A `break` in the inner loop leaves the inner loop only, and the outer loop carries on with its next turn. Leaving both at once takes more than one `break`, a sign that the loop is doing too much.

## Keep it simple

Use `break` and `continue` once in a while, when they make a loop easier to read. A loop with several `break`s scattered through it is hard to follow, because the reader must hunt for every exit. A plain test in the brackets is usually clearer.

## Common mistakes

- **A `continue` after the line it should skip.** Only the lines below the `continue` are skipped, so the line above it still runs on every turn.
- **A `while (1)` whose `break` can never be reached.** If the `break` sits inside an `if` that can never be true, the loop never ends. Press Stop to end such a program.
- **A `continue` above the counter step in a `while` loop.** The step is skipped with the rest of the body, so the counter never moves and the loop runs for ever.

::: kid
Your basket is empty.

You pick strawberries one by one.

A green one is not ready.

Skip it and reach for the next.

That is what `continue` does.

Your basket slowly fills up.

When it is full, you stop picking.

That is what `break` does.

Continue skips one. Break stops all.
:::

```c {role=example file=evens.c}
#include <stdio.h>

int main() {
    for (int i = 1; i <= 10; i++) {
        if (i % 2 != 0) {
            continue;
        }
        printf("%d ", i);
    }
    printf("\n");
    return 0;
}
```

::: try
The program reads up to 10 numbers and adds them all. Change it so that a 0 means there are no more numbers: the 0 is not added, and nothing after it is read. Negative numbers are skipped and left out of the sum. Print the total of the rest.

Replace the comment with two `if` blocks. It is checked with several lists of numbers, so the answer has to be worked out, not typed in.
:::

::: try-kid
The program reads up to ten numbers.

Add them up.

A 0 means stop reading.

Do not add the 0.

Skip any number below 0.

Print the sum of the rest.

Use break and continue.

Press Run to test it.
:::

```c {role=starter file=positives.c}
#include <stdio.h>

int main() {
    int n;
    int total = 0;

    for (int i = 0; i < 10; i++) {
        scanf("%d", &n);
        // Stop at 0, and skip negative numbers.
        total += n;
    }

    printf("Sum: %d\n", total);

    return 0;
}
```

```c {role=solution file=positives.c}
#include <stdio.h>

int main() {
    int n;
    int total = 0;

    for (int i = 0; i < 10; i++) {
        scanf("%d", &n);
        if (n == 0) {
            break;
        }
        if (n < 0) {
            continue;
        }
        total += n;
    }

    printf("Sum: %d\n", total);

    return 0;
}
```
