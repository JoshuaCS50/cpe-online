---
id: core.c.kinds-of-bugs
kind: lesson
track: core
unit: a14
order: 1
title: Bugs happen to everyone
titleKid: Every programmer makes mistakes
language: c
concepts: [bug, syntax-error, runtime-error, logic-error, division-by-zero]
prereqs: [core.c.reading-errors, core.c.if-else]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["120", "90"]
        expect: "Distance in km: Time in minutes: Average speed: 80 km/h\n"
      - stdin: ["30", "60"]
        expect: "Distance in km: Time in minutes: Average speed: 30 km/h\n"
      - stdin: ["45", "30"]
        expect: "Distance in km: Time in minutes: Average speed: 90 km/h\n"
      - stdin: ["10", "0"]
        expect: "Distance in km: Time in minutes: Time must be more than 0\n"
hints:
  - 'Start with the syntax error: run the program and read the card. It points at the line that is missing its semicolon.'
  - 'Next, the logic error: 120 km in 90 minutes is 80 km/h. Speed is distance divided by time, and minutes become hours by multiplying the distance by 60 first: distance * 60 / minutes.'
  - 'Last, the crash: with 0 minutes the division fails. Before working out the speed, add if (minutes <= 0) { printf("Time must be more than 0\n"); return 0; }'
hintsKid:
  - 'Run it and read the card. A line is missing its `;`.'
  - 'Speed is distance divided by time, not times.'
  - 'Dividing by 0 breaks. Check for 0 first.'
---
The first "bug" in computing history was a real one: in 1947, engineers working on the Harvard Mark II computer found a moth stuck in a relay and taped it into their logbook. The word stuck. Today every programmer, at every level, writes bugs every day. Experienced programmers do not make fewer mistakes so much as they find them faster, because they expect them and know where to look.

So an error is not a sign that you are bad at this. It is a normal part of the work, and every one you fix teaches you something.

## Three kinds of bug

**Syntax errors: the program will not run at all.** The code breaks the grammar of the language: a missing `;`, a bracket that is never closed, a misspelt keyword. Nothing runs; you get an error card straight away. These are the easiest bugs: the computer tells you roughly where they are.

**Runtime errors: the program crashes while running.** The code is valid, but it asks for something impossible at the moment it runs: dividing by zero, using an array position that does not exist. The program stops with an error card, often only for certain inputs, which is what makes them sneaky: the program can work for weeks before someone types a 0.

**Logic errors: the program runs and gives the wrong answer.** No card, no crash, just a wrong result, because the instructions do not say what you meant. These are the hardest bugs, because nothing points at them. Only testing with inputs whose answer you already know reveals them.

| Kind | What you see | How you find it |
|---|---|---|
| Syntax | an error card before anything runs | read the card, look at that line and the one before |
| Runtime | output starts, then an error card | find the input that triggers it, read the card |
| Logic | normal-looking but wrong output | test with known answers, then trace or debug |

## Fix them in that order

Syntax errors first, because nothing else can be tested until the program runs. Then the crashes. Then the wrong answers. And after every fix, run again: one fix often uncovers the next problem.

## Preventing crashes

Many runtime errors come from inputs the programmer did not expect. A program that divides by a number the user types must decide what to do when that number is 0, and say so, instead of crashing. Checking input before using it is one of the most useful habits there is.

::: kid
Every programmer makes mistakes. Even experts do.

A mistake in a program is called a bug.

Some bugs stop the program from starting.

Some make it crash in the middle.

Some just give a wrong answer. Those are the trickiest.

Fixing bugs is a normal part of the job.
:::

```c {role=example file=three-bugs.c}
#include <stdio.h>

int main() {
    int boxes = 17;
    int perShelf = 5;

    // A logic error that looks fine: this throws away the remainder,
    // so it says 3 shelves when the 2 extra boxes need a fourth.
    int shelves = boxes / perShelf;
    printf("Shelves (wrong): %d\n", shelves);

    // The fix: round up when there is a remainder.
    shelves = boxes / perShelf;
    if (boxes % perShelf != 0) {
        shelves = shelves + 1;
    }
    printf("Shelves (right): %d\n", shelves);
    return 0;
}
```

::: try
This program works out the average speed of a trip from the distance in km and the time in minutes, but it has one bug of each kind. Fix them in order: the syntax error (it will not run), then the logic error (120 km in 90 minutes should be 80 km/h), then the runtime error (with a time of 0 it crashes; it should print `Time must be more than 0` instead).
:::

::: try-kid
This program has three bugs.

One stops it starting. One gives a wrong answer.

One makes it crash when the time is 0.

Fix them one at a time.
:::

```c {role=starter file=speed.c}
#include <stdio.h>

int main() {
    int distance;
    int minutes;

    printf("Distance in km: ");
    scanf("%d", &distance);
    printf("Time in minutes: ");
    scanf("%d", &minutes)

    int speed = distance * 60 * minutes;
    printf("Average speed: %d km/h\n", speed);
    return 0;
}
```

```c {role=solution file=speed.c}
#include <stdio.h>

int main() {
    int distance;
    int minutes;

    printf("Distance in km: ");
    scanf("%d", &distance);
    printf("Time in minutes: ");
    scanf("%d", &minutes);

    if (minutes <= 0) {
        printf("Time must be more than 0\n");
        return 0;
    }

    int speed = distance * 60 / minutes;
    printf("Average speed: %d km/h\n", speed);
    return 0;
}
```
