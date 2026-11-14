---
id: core.c.debugging-method
kind: lesson
track: core
unit: a14
order: 4
title: The debugging method
titleKid: Seven steps to catch a bug
language: c
concepts: [debug-method, reproduce, isolate, hypothesis, bug-notebook]
prereqs: [core.c.print-debugging, core.c.else-if]
links:
  - to: core.c.debugging-strategy
    kind: next
    note: The same method on bigger programs, with divide and conquer.
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["85"]
        expect: "Mark: Symbol A\n"
      - stdin: ["80"]
        expect: "Mark: Symbol A\n"
      - stdin: ["65"]
        expect: "Mark: Symbol C\n"
      - stdin: ["79"]
        expect: "Mark: Symbol B\n"
      - stdin: ["50"]
        expect: "Mark: Symbol D\n"
      - stdin: ["49"]
        expect: "Mark: Symbol F\n"
      - stdin: ["101"]
        expect: "Mark: Not a valid mark\n"
hints:
  - 'Reproduce: try the boundary marks 80, 70, 60 and 50, and one in the middle of each band, such as 65. Write down which give the wrong symbol.'
  - '80 should be an A, but the first test is mark > 80. And 65 should be a C, but the program asks about 50 before 60, so 65 already counts as a D.'
  - 'Use mark >= 80, and put the bands in order from the top: >= 80, then >= 70, then >= 60, then >= 50.'
hintsKid:
  - 'Try 80, then 65. Are the answers right?'
  - '80 should be an A. 65 should be a C.'
  - 'Check from the top band down: 80, 70, 60, 50.'
---
Guessing and changing things until a bug goes away sometimes works, and often makes things worse. Good debuggers follow the same steps every time. The method below fits on a sticky note:

1. **Read.** Read the error card or the output carefully, all of it. What exactly happened?
2. **Reproduce.** Find an input that shows the bug every time. Make it as simple as possible.
3. **Isolate.** Narrow down where it goes wrong: which line, which function, which case of an `if`.
4. **Inspect.** Look at the actual values there, with `printf` lines or the debugger.
5. **Hypothesise.** Say exactly what you think is wrong, in one sentence: "65 is caught by the D test because it comes before the C test".
6. **Fix.** Change one thing, the cause you named, not something nearby.
7. **Re-test.** Run the failing input again, and then the inputs that worked before, so the fix did not break anything else.

If the hypothesis turns out to be wrong, that is not wasted: you have ruled something out. Go back to step 4.

## Boundaries are where bugs live

When a program sorts values into bands (marks into symbols, temperatures into warnings, distances into beeps), most bugs sit at the edges between bands. Always test the exact boundary values (80, 70, 60, 50) and one value inside each band. A program can be right for every "normal" value and still wrong at an edge.

## The order of an else-if ladder

In an `if ... else if ...` ladder, the first true test wins and the rest are skipped. So the order matters: testing `mark >= 50` before `mark >= 60` sends every mark from 50 up into the first band. For "at least" tests, go from the highest band down.

## Keep a bug notebook

Many professionals keep notes of the bugs they find: what happened, what the cause was, and how they found it. After a few weeks you will see your own patterns ("I often mix up `>` and `>=`"), and you will catch them before they happen. A line is enough:

```
Symbol program: 80 gave B. Cause: > instead of >=. Found by testing the boundary.
```

::: kid
Catching a bug takes seven steps.

Read what went wrong. Make it happen again.

Find where it goes wrong. Look at the numbers there.

Guess why. Fix that one thing.

Then test again, including what worked before.
:::

```c {role=example file=bands.c}
#include <stdio.h>

int main() {
    // Testing the boundaries of a warning light: always try the edges.
    int temps[6] = {59, 60, 61, 79, 80, 81};

    for (int i = 0; i < 6; i++) {
        int t = temps[i];
        printf("%d degrees: ", t);
        if (t >= 80) {
            printf("red\n");
        } else if (t >= 60) {
            printf("amber\n");
        } else {
            printf("green\n");
        }
    }
    return 0;
}
```

::: try
This program turns a mark out of 100 into a symbol: 80 and above is A, 70 to 79 is B, 60 to 69 is C, 50 to 59 is D, below 50 is F, and anything below 0 or above 100 is `Not a valid mark`. It gives the wrong symbol for some marks. Use the method: find marks that reproduce the problem (test the boundaries), work out the cause, fix it, and re-test. There are two bugs.
:::

::: try-kid
The program turns a mark into a letter.

Some marks get the wrong letter.

Test the edges, like 80 and 60, to find the bugs.
:::

```c {role=starter file=symbol.c}
#include <stdio.h>

int main() {
    int mark;
    printf("Mark: ");
    scanf("%d", &mark);

    if (mark < 0 || mark > 100) {
        printf("Not a valid mark\n");
    } else if (mark > 80) {
        printf("Symbol A\n");
    } else if (mark >= 70) {
        printf("Symbol B\n");
    } else if (mark >= 50) {
        printf("Symbol D\n");
    } else if (mark >= 60) {
        printf("Symbol C\n");
    } else {
        printf("Symbol F\n");
    }
    return 0;
}
```

```c {role=solution file=symbol.c}
#include <stdio.h>

int main() {
    int mark;
    printf("Mark: ");
    scanf("%d", &mark);

    if (mark < 0 || mark > 100) {
        printf("Not a valid mark\n");
    } else if (mark >= 80) {
        printf("Symbol A\n");
    } else if (mark >= 70) {
        printf("Symbol B\n");
    } else if (mark >= 60) {
        printf("Symbol C\n");
    } else if (mark >= 50) {
        printf("Symbol D\n");
    } else {
        printf("Symbol F\n");
    }
    return 0;
}
```
