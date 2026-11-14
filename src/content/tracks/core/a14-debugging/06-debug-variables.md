---
id: core.c.debug-variables
kind: lesson
track: core
unit: a14
order: 6
title: Variables and the call stack
titleKid: Seeing every box and who called whom
language: c
concepts: [variables-panel, call-stack, frames, recursion, inspect-state]
prereqs: [core.c.breakpoints, core.c.recursion]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["240", "180"]
        expect: "Boxes made: Boxes passed: Pass rate: 75%\n"
      - stdin: ["50", "50"]
        expect: "Boxes made: Boxes passed: Pass rate: 100%\n"
      - stdin: ["200", "30"]
        expect: "Boxes made: Boxes passed: Pass rate: 15%\n"
      - stdin: ["0", "0"]
        expect: "Boxes made: Boxes passed: Pass rate: 0%\n"
hints:
  - 'Open it in the editor, set a breakpoint on the return line inside percent, press Debug and type 240 and 180. In the debug pane, look at the percent() frame: what are part and whole?'
  - 'Inside percent, part is 240 and whole is 180: the two values arrived the wrong way round. Click the main frame to see the line that made the call.'
  - 'The call must pass the part first: percent(passed, made).'
hintsKid:
  - 'Pause inside percent. Look at part and whole.'
  - 'They are the wrong way round.'
  - 'Swap them in the call: `percent(passed, made)`.'
---
When the debugger pauses, the debug pane shows the state of the whole program at that moment. Learning to read it turns the debugger from a novelty into the fastest way to understand what code really does.

## The variables of each call

Each function call has its own variables: its parameters and the variables made inside it. The pane groups them by call. For each variable you see its name and its current value; hovering shows its type.

Values that **changed** since the last pause are highlighted, and hovering over one shows what it **was** before. After a step, the highlighted values are exactly what the last line did, which makes a wrong assignment stand out.

Variables made outside every function (globals) are listed separately.

## The call stack

When `main` calls `percent`, and `percent` calls another function, they are all running at once, each waiting for the one it called to finish. This chain is the **call stack** (the same stack as in unit A8). The pane lists it with the newest call at the top, each with the line it is at. Click a call to see its line in the editor and its own variables.

The call stack answers two questions that are hard to answer any other way: **how did the program get here?** and **what did the caller pass in?**

## Recursion in the stack

A recursive function appears once for every call that has not finished yet, each with its own copy of the parameters. Pausing inside `factorial(1)` from `factorial(4)` shows four `factorial()` entries, with `n` equal to 1, 2, 3 and 4. A runaway recursion shows up as a stack that keeps growing.

## Desktop debuggers

Debuggers for desktop compilers work the same way. They add **watch expressions** (type an expression such as `count * 2` and see its value at every pause) and conditional breakpoints (pause only when `i == 50`). Here the pane shows every variable of every call, which covers most of what a watch would.

::: kid
When the program pauses, the debugger shows every box.

Boxes that just changed light up.

It also shows which helper called which.

Click a helper to see its own boxes.

That shows what each helper was given.
:::

```c {role=example file=stack.c}
#include <stdio.h>

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    // Open this in the editor, set a breakpoint on "return 1;", press
    // Debug, and look at the call stack: four factorial() calls, each
    // with its own n.
    printf("4! = %d\n", factorial(4));
    return 0;
}
```

::: try
A packing line counts the boxes it made and the boxes that passed inspection, and shows the pass rate: 180 passed out of 240 made is 75%. The program prints the wrong rate. Open it in the editor, pause inside `percent` and look at the values it was given. Fix the bug.
:::

::: try-kid
180 out of 240 boxes passed. That is 75 out of every 100.

The program gets it wrong.

Pause inside the helper and look at what it was given.
:::

```c {role=starter file=rate.c}
#include <stdio.h>

// What percentage part is of whole, rounded down. 0 when whole is 0.
int percent(int part, int whole) {
    if (whole == 0) {
        return 0;
    }
    return part * 100 / whole;
}

int main() {
    int made;
    int passed;
    printf("Boxes made: ");
    scanf("%d", &made);
    printf("Boxes passed: ");
    scanf("%d", &passed);

    printf("Pass rate: %d%%\n", percent(made, passed));
    return 0;
}
```

```c {role=solution file=rate.c}
#include <stdio.h>

// What percentage part is of whole, rounded down. 0 when whole is 0.
int percent(int part, int whole) {
    if (whole == 0) {
        return 0;
    }
    return part * 100 / whole;
}

int main() {
    int made;
    int passed;
    printf("Boxes made: ");
    scanf("%d", &made);
    printf("Boxes passed: ");
    scanf("%d", &passed);

    printf("Pass rate: %d%%\n", percent(passed, made));
    return 0;
}
```
