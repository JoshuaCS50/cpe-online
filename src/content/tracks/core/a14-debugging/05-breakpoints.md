---
id: core.c.breakpoints
kind: lesson
track: core
unit: a14
order: 5
title: Breakpoints and stepping
titleKid: Pausing the program to look inside
language: c
concepts: [debugger, breakpoint, step-over, step-into, step-out]
prereqs: [core.c.debugging-method, core.c.functions]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["4", "1234", "7", "90", "505"]
        expect: "Digit sum of 1234 is 10\nDigit sum of 7 is 7\nDigit sum of 90 is 9\nDigit sum of 505 is 10\n"
      - stdin: ["2", "99999", "10"]
        expect: "Digit sum of 99999 is 45\nDigit sum of 10 is 1\n"
hints:
  - 'Press "Open in the editor", set a breakpoint on the line inside the while loop of digitSum, press Debug and type 2 and 1234 when asked. Step with F10 and watch n and sum in the debug pane.'
  - 'Watch what happens when n gets down to 1: the loop stops before the 1 is added. The condition n > 9 is false for a single digit.'
  - 'Every digit must be added, so the loop must run while n > 0. Change while (n > 9) to while (n > 0).'
hintsKid:
  - 'Open it in the editor. Click next to a line to make a red dot.'
  - 'Press Debug. Step one line at a time. Watch n and sum.'
  - 'The last digit is never added. Loop while `n > 0`.'
---
`printf` lines show values at the moments you chose in advance. A **debugger** lets you stop the program at any line while it runs, look at every variable, and then move forward one line at a time, watching the values change. No code changes are needed, and nothing has to be removed afterwards.

The debugger is in **Code mode**. In a lesson, the **Open in the editor** button next to the task copies your code there.

## Breakpoints

A **breakpoint** marks a line where the program should pause. Click in the gutter to the left of the line numbers: a red dot appears. Click it again to remove it. You can set several.

Then press **Debug** (F6) instead of Run. The program runs normally until it reaches a line with a breakpoint, and pauses **before** that line runs. The line is highlighted, and the debug pane shows where you are and the values of the variables. With no breakpoints at all, the debugger pauses at the first line of `main`.

Put the breakpoint a little before the place you suspect, so you can watch the problem happen.

## Stepping

While paused, these buttons (and keys) move the program on:

| Button | Key | What it does |
|---|---|---|
| Continue | F5 | run until the next breakpoint, or the end |
| Step over | F10 | run the highlighted line, then pause on the next one |
| Step into | F11 | if the line calls one of your functions, go inside it and pause on its first line |
| Step out | Shift+F11 | finish the current function and pause back where it was called |
| Stop | Shift+F5 | end the program |

**Step over** treats a function call as a single step: the whole function runs, and you see its result. Use it for calls you trust, such as `printf`. **Step into** follows the call inside, line by line. Use it for your own function when you suspect it. If you stepped into something that turns out to be fine, **step out** to get back quickly.

When the program asks for input while you debug, type it in the terminal as usual.

## A way of working

1. Before you press Debug, decide what you expect each variable to be.
2. Step, and compare each new value with your expectation.
3. The first value that differs points at the line that just ran.

Stepping through every line of a long loop is slow. Set the breakpoint inside the loop and use **Continue** to jump from one pass to the next.

::: kid
The debugger can pause a program.

Click beside a line to put a red dot there.

Press Debug. The program stops at the red dot.

Now you can see what is in every box.

Step forward one line at a time and watch them change.
:::

```c {role=example file=countdown.c}
#include <stdio.h>

int square(int x) {
    int result = x * x;
    return result;
}

int main() {
    // Open this in the editor, set a breakpoint on the line with
    // square(i), press Debug, and try Step over versus Step into.
    for (int i = 1; i <= 3; i++) {
        int s = square(i);
        printf("%d squared is %d\n", i, s);
    }
    return 0;
}
```

::: try
`digitSum` should add up the digits of a number: 1234 gives 1 + 2 + 3 + 4 = 10. The program reads how many numbers follow, then the numbers, but most sums come out too small. Open it in the editor, put a breakpoint inside `digitSum`, press Debug, and step through one call while watching `n` and `sum`. Find the bug and fix it.
:::

::: try-kid
The helper should add up the digits of a number.

1234 should give 10, but it does not.

Use the debugger to watch it work. Find the bug.
:::

```c {role=starter file=digits.c}
#include <stdio.h>

int digitSum(int n) {
    int sum = 0;
    while (n > 9) {
        sum = sum + n % 10;
        n = n / 10;
    }
    return sum;
}

int main() {
    int count;
    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        int number;
        scanf("%d", &number);
        printf("Digit sum of %d is %d\n", number, digitSum(number));
    }
    return 0;
}
```

```c {role=solution file=digits.c}
#include <stdio.h>

int digitSum(int n) {
    int sum = 0;
    while (n > 0) {
        sum = sum + n % 10;
        n = n / 10;
    }
    return sum;
}

int main() {
    int count;
    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        int number;
        scanf("%d", &number);
        printf("Digit sum of %d is %d\n", number, digitSum(number));
    }
    return 0;
}
```
