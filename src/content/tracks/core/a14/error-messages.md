---
id: core.c.error-messages
kind: lesson
track: core
unit: a14
order: 2
title: Reading an error message
titleKid: What the error card is telling you
language: c
concepts: [error-message, line-number, first-error, syntax-error]
prereqs: [core.c.kinds-of-bugs]
est_minutes: 12
checks:
  - type: stdout-equals
    expect: "Current: 3 A\nPower: 36 W\nDone\n"
hints:
  - 'Run, read the first card, fix only that, and run again. The first card points at line 5; its original message says line 6, where the computer got confused.'
  - 'The next card is about text that never ends: look for a string whose closing double quote is missing.'
  - 'The last card says something called pritnf does not exist. That is a typing slip for printf.'
hintsKid:
  - 'Fix one card at a time. Then press Run again.'
  - 'Look for a missing `;` and a missing quote mark.'
  - 'One word is spelt wrong. Look closely at each printf.'
---
In unit A2 you met the error card. This lesson is about reading it like a detective: getting everything out of it, and knowing what to do when several things are wrong at once.

## The parts of a message

Every error tells you three things:

1. **Where:** a line (and often a column), shown on the card as `file.c:6:5` and highlighted in the editor.
2. **What:** a short description, such as "a semicolon is missing" or "this variable does not exist".
3. **The original message:** what the interpreter itself said, one click away on the card. Desktop compilers print messages in the same style, so learning to read them here pays off later.

Read the whole card before touching the code. The "why" and "how to fix it" parts often save several minutes of guessing.

## Where it noticed is not always where it is

The computer reports the place where it got **confused**, which can be after the actual mistake. A missing `;` at the end of line 5 is only noticed when line 6 starts with something that cannot follow. A missing `}` may only be noticed at the very end of the file. So:

- Look at the line shown, **and** the line before it.
- For a missing bracket or quote, work backwards from the line shown.

For a missing semicolon the card here does this for you: it points at the line that needs the `;`, while the original message still names the line after it. Desktop compilers usually report the line after, so keep the habit.

## One error at a time

When several things are wrong, the program usually only reports the **first** problem it reaches. Fixing it lets the computer get further, and it may then report the next one. That is progress, not a step backwards.

Desktop compilers sometimes list many errors at once, but one early mistake can cause a cascade of later messages that disappear when it is fixed. Either way the rule is the same: **fix the first error, then run again.** Do not try to fix all of them from one list.

## Errors that appear only when a line runs

Some problems are only found when the program reaches that line: a misspelt function name, or a division by zero. Lines above it run normally and their output appears before the card. That output is a clue: the problem is after the last line that printed.

## When the card is not enough

- Copy the original message into a search engine: almost every message has been seen and explained thousands of times.
- Undo your last change and run again. If the error goes away, the change caused it.
- Look for typos in names: `pritnf`, `Printf` and `printf` are three different names to C.

::: kid
The error card is a clue, not a telling-off.

It says where the computer got stuck.

Look at that line and the line above it.

Fix only the first problem. Then run again.

The next clue may pop up. That means you are getting closer.
:::

```c {role=example file=clues.c}
#include <stdio.h>

int main() {
    int total = 12;
    int parts = 0;
    printf("Step 1: total is %d\n", total);
    printf("Step 2: parts is %d\n", parts);
    // Without this check, total / parts would stop the program with a
    // division-by-zero card here, after steps 1 and 2 had printed.
    // That output would show that the problem comes after them.
    if (parts == 0) {
        printf("Step 3: cannot share among 0 parts\n");
    } else {
        printf("Step 3: each part is %d\n", total / parts);
    }
    return 0;
}
```

::: try
This program works out the current and power in a 12 V circuit with a 4-ohm resistor, but it contains three mistakes, and the cards show them one at a time. Run it, read the card, fix that one mistake, and run again, until it prints the current, the power and `Done`.
:::

::: try-kid
This program has three small mistakes.

The cards show them one at a time.

Fix one, run it, and read the next card.
:::

```c {role=starter file=circuit.c}
#include <stdio.h>

int main() {
    int volts = 12;
    int ohms = 4
    int amps = volts / ohms;
    printf("Current: %d A\n", amps);
    pritnf("Power: %d W\n", volts * amps);
    printf("Done\n);
    return 0;
}
```

```c {role=solution file=circuit.c}
#include <stdio.h>

int main() {
    int volts = 12;
    int ohms = 4;
    int amps = volts / ohms;
    printf("Current: %d A\n", amps);
    printf("Power: %d W\n", volts * amps);
    printf("Done\n");
    return 0;
}
```
