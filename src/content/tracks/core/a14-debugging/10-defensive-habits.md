---
id: core.c.defensive-habits
kind: lesson
track: core
unit: a14
order: 10
title: Defensive habits
titleKid: Stopping bugs before they start
language: c
concepts: [input-validation, small-steps, scanf-result, assertions, defensive-programming]
prereqs: [core.c.bug-hunt, core.c.while]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["abc", "40", "21"]
        expect: "Setpoint (5-30): Please type a whole number\nSetpoint (5-30): It must be from 5 to 30\nSetpoint (5-30): Setpoint saved: 21\n"
      - stdin: ["4", "30"]
        expect: "Setpoint (5-30): It must be from 5 to 30\nSetpoint (5-30): Setpoint saved: 30\n"
      - stdin: ["5"]
        expect: "Setpoint (5-30): Setpoint saved: 5\n"
      - stdin: []
        expect: "Setpoint (5-30): No input\n"
  - type: code-contains
    pattern: '(==|!=)\s*1\b|\b1\s*(==|!=)|==\s*EOF|EOF\s*=='
    message: 'Checks what scanf returned'
hints:
  - 'Put the reading in a loop: while (1) { ... } and break out of it (or return) once a good value has been saved.'
  - 'Keep what scanf returns: int got = scanf("%d", &setpoint);. If got == EOF, print No input and stop. If got is 0, the text was not a number: read it away with scanf("%s", junk); and print Please type a whole number.'
  - 'Then check the range: if (setpoint < 5 || setpoint > 30), print It must be from 5 to 30 and go round again; otherwise print Setpoint saved and stop.'
hintsKid:
  - 'Keep asking until the answer is good.'
  - 'Check if `scanf` really read a number.'
  - 'Then check the number is from 5 to 30.'
---
The cheapest bug is the one that never gets written. The habits below cost a little time while you write code and save far more while you debug it.

## Work in small steps

Write a few lines, run them, check they work, then write the next few. When something breaks, the bug is almost certainly in the lines you just added. Writing fifty lines before the first run means the bug could be anywhere, and often there are several.

## Read errors from the top

Fix the first error first, then run again (this unit's second lesson). Later messages are often caused by the first.

## Never trust input

Users type letters where numbers belong, press Enter on an empty line, or type 999 for a percentage; sensors fail and report nonsense. A program that assumes good input will one day misbehave, and on a machine that can be dangerous. So check every input:

- **Did it arrive at all?** `scanf` returns how many values it stored, or `EOF` when the input has ended.
- **Is it the right kind?** If `scanf("%d", ...)` returns 0, the text was not a whole number. It is still waiting in the input, so read it away (for example with `scanf("%s", junk)`) before asking again, or the next `scanf` fails on the same text.
- **Is it in range?** A setpoint, a mark, a speed: check it against its limits before using it.

When the input is bad, say clearly what is wrong and, where it makes sense, ask again.

## Check your assumptions

If your code relies on something being true ("count is never 0 here", "the list is sorted"), check it. On a desktop, `<assert.h>` gives `assert(count > 0);`, which stops the program with a message as soon as the assumption fails, instead of letting it carry on with nonsense. Where `assert` is not available, an `if` with a clear message does the same job.

## Small functions, clear names, few surprises

A function that does one job, with a name that says what, is easy to test on its own (unit A13). Constants with names instead of magic numbers, and variables given a starting value where they are made, remove whole families of bugs.

## Let tools help

Desktop compilers can warn about suspicious code, such as `=` inside an `if` or a variable used before it is set. Turn the warnings on (`gcc -Wall`) and treat each one as a bug report. Keep backups or use version control, so a change that makes things worse can be undone.

::: kid
Good habits stop many bugs before they start.

Write a little, then run it. Then write a little more.

Never trust what people type. Check it first.

If it is wrong, say so and ask again.

Small helpers with clear names are easy to check.
:::

```c {role=example file=check-input.c}
#include <stdio.h>

int main() {
    int values[4];
    int got = sscanf("12 7 x 9", "%d %d %d %d", &values[0], &values[1], &values[2], &values[3]);

    // sscanf stopped at the x: only two values were stored.
    printf("Read %d of 4 values\n", got);
    if (got < 4) {
        printf("The data is incomplete, so nothing is saved.\n");
        return 1;
    }
    printf("All values read\n");
    return 0;
}
```

::: try
A greenhouse heater needs a temperature setpoint from 5 to 30 degrees. The program reads it once and saves whatever it gets, even `abc` or `40`. Make it defensive: keep asking until it gets a whole number from 5 to 30. Say `Please type a whole number` for text that is not a number, `It must be from 5 to 30` for a number out of range, and `No input` (then stop) if the input ends. Check what `scanf` returns.
:::

::: try-kid
The heater needs a number from 5 to 30.

People sometimes type letters or silly numbers.

Keep asking until the answer is good.
:::

```c {role=starter file=setpoint.c}
#include <stdio.h>

int main() {
    int setpoint;
    char junk[50];

    printf("Setpoint (5-30): ");
    scanf("%d", &setpoint);
    printf("Setpoint saved: %d\n", setpoint);
    return 0;
}
```

```c {role=solution file=setpoint.c}
#include <stdio.h>

int main() {
    int setpoint;
    char junk[50];

    while (1) {
        printf("Setpoint (5-30): ");
        int got = scanf("%d", &setpoint);
        if (got == EOF) {
            printf("No input\n");
            return 1;
        }
        if (got != 1) {
            scanf("%s", junk);
            printf("Please type a whole number\n");
        } else if (setpoint < 5 || setpoint > 30) {
            printf("It must be from 5 to 30\n");
        } else {
            printf("Setpoint saved: %d\n", setpoint);
            return 0;
        }
    }
}
```
