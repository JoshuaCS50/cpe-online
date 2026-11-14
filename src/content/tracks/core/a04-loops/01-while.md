---
id: core.c.while
kind: lesson
track: core
unit: a4
order: 1
title: while loops
titleKid: Doing it again and again
language: c
concepts: [loop, while, condition, counter, infinite-loop]
prereqs: [core.c.if-else]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["3"]
        expect: "3\n2\n1\nLiftoff!\n"
      - stdin: ["1"]
        expect: "1\nLiftoff!\n"
      - stdin: ["0"]
        expect: "Liftoff!\n"
  - type: code-contains
    pattern: 'while\s*\('
    message: Uses a while loop to count down
hints:
  - The loop should keep going while n is bigger than 0, so the condition is n > 0.
  - Inside the loop, print n and then make it one smaller with n--. Without n-- the loop never ends.
  - 'The loop is: while (n > 0) { printf("%d\n", n); n--; }'
hintsKid:
  - Keep going while n > 0.
  - Say the number. Then make it one smaller with n--.
  - 'Type this: while (n > 0) { printf("%d\n", n); n--; }'
---
Some jobs ask for the same few lines again and again. Counting down to liftoff, adding up a row of prices, asking for a password until it is correct: each one repeats a step until something changes. Writing those lines out many times would be long and hard to read. A loop repeats them for you.

## The shape of a while loop

```c
while (condition) {
    // lines to repeat
}
```

`while` reads like an `if` that keeps coming back. C tests the condition in the brackets. If the answer is true, it runs the body between the braces, then returns to the condition and tests it once more. If the answer is false, it skips the body and carries on with the line after the closing brace. A condition gives 1 for true and 0 for false.

## A worked trace

```c
int i = 1;

while (i <= 3) {
    printf("%d\n", i);
    i++;
}
```

This prints 1, 2 and 3. The counter `i` starts at 1. The table below follows every test, including the last one, which fails and ends the loop.

| Test | `i` | `i <= 3` | What happens |
|---|---|---|---|
| 1 | 1 | 1 | prints 1, then `i` becomes 2 |
| 2 | 2 | 1 | prints 2, then `i` becomes 3 |
| 3 | 3 | 1 | prints 3, then `i` becomes 4 |
| 4 | 4 | 0 | the loop ends |

## Three parts of a counting loop

Every counting loop needs three things. First, a starting value, written before the loop. Second, a condition that decides whether to go round again. Third, a change inside the body that moves the value towards making the condition false. Leave out any one of the three and the loop either never runs or never stops.

## When a loop never ends

If nothing inside the body changes the condition, the test stays true and the loop runs forever. The program never reaches its last line and never finishes:

```c
int n = 3;

while (n > 0) {
    printf("%d\n", n);
}
```

That prints 3 for ever, because `n` is never made smaller. Adding `n--;` inside the body fixes it. If a program will not finish, press the Stop button; it ends the program.

## A loop can run zero times

The test comes first, so a `while` loop can be skipped completely. Put `int n = 0;` above the same countdown and the test `n > 0` is false at the start. The body is skipped and the program goes straight on. Zero repetitions is a normal result, not an error.

## Common mistakes

- **Forgetting to change the counter.** Nothing in the body alters the condition, so the loop never ends.
- **Changing it the wrong way.** In a countdown, `n++` moves away from the exit. The test stays true and the loop runs for ever.
- **A semicolon after the condition.** `while (n > 0);` makes an empty instruction the whole body. The loop spins without printing anything and never ends.

::: kid
A sink is full of dirty plates.

You pick up one plate and wash it.

Then you look in the sink again.

If a dirty plate is there, you wash another.

When the sink is empty, you stop.

That is a loop. Look, wash, look again.

If you never make the sink emptier, you wash for ever.

So each turn must remove one plate.
:::

```c {role=example file=doubling.c}
#include <stdio.h>

int main() {
    int amount = 1;
    int days = 0;

    while (amount <= 100) {
        amount = amount * 2;
        days++;
    }

    printf("After %d days the amount is %d\n", days, amount);
    return 0;
}
```

::: try
The program reads a number `n` and counts down from it. Print `n`, then `n - 1`, and so on down to 1, one number per line. After the last number the program prints `Liftoff!`, which is already written. Replace the comment with a `while` loop.

It is checked with several starting numbers, including 1 and 0, so the answer has to be worked out, not typed in.
:::

::: try-kid
The program reads a number.

Count down from it to 1, one number on each line.

Then say Liftoff.

Use a while loop where the comment is.

Press Run to test it.
:::

```c {role=starter file=countdown.c}
#include <stdio.h>

int main() {
    int n;

    scanf("%d", &n);

    // Count down here.

    printf("Liftoff!\n");

    return 0;
}
```

```c {role=solution file=countdown.c}
#include <stdio.h>

int main() {
    int n;

    scanf("%d", &n);

    while (n > 0) {
        printf("%d\n", n);
        n--;
    }

    printf("Liftoff!\n");

    return 0;
}
```
