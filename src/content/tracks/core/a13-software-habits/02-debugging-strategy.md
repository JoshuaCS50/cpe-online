---
id: core.c.debugging-strategy
kind: lesson
track: core
unit: a13
order: 2
title: A debugging strategy
titleKid: Being a bug detective
language: c
concepts: [debugging, reproduce, hypothesis, tracing, divide-and-conquer]
prereqs: [core.c.loop-bugs, core.c.arrays]
est_minutes: 16
checks:
  - type: io-cases
    cases:
      - stdin: ["7", "1 3 2 5 4 6 2"]
        expect: "Peak at reading 2: 3\nPeak at reading 4: 5\nPeak at reading 6: 6\nPeaks: 3\n"
      - stdin: ["5", "1 2 2 1 0"]
        expect: "Peaks: 0\n"
      - stdin: ["4", "1 2 3 4"]
        expect: "Peaks: 0\n"
      - stdin: ["3", "5 1 5"]
        expect: "Peaks: 0\n"
      - stdin: ["5", "0 9 0 9 0"]
        expect: "Peak at reading 2: 9\nPeak at reading 4: 9\nPeaks: 2\n"
hints:
  - 'Reproduce with the smallest failing input. Try 4 readings, 1 2 3 4: there is no peak, but the program finds one. Print i, values[i - 1], values[i] and values[i + 1] inside the loop to see why.'
  - 'For the last reading there is no right-hand neighbour: values[i + 1] reads past the readings (here it holds 0). A peak needs both neighbours, so the loop must stop at i < n - 1.'
  - 'Now try 1 2 2 1 0. Two equal readings side by side are a flat top, not peaks: the comparisons must be > on both sides, not >=.'
hintsKid:
  - 'Find the smallest list that goes wrong.'
  - 'Print the numbers the program compares. Look closely.'
  - 'The last reading has no right neighbour. Equal numbers are not peaks.'
---
Earlier bug hunts showed classic mistakes one at a time. Real bugs do not announce which kind they are. What finds them reliably is not cleverness but a **method**, the same one every time.

## 1. Reproduce it

Find an input that shows the bug every time, then make it as small as possible. A bug that appears with 200 readings usually also appears with 4, and 4 can be traced by hand. If you cannot make the bug happen on purpose, you cannot tell whether you fixed it.

## 2. Know what should happen

Work out the right answer yourself before looking at the output. Without it, a wrong output can look reasonable.

## 3. Read the evidence

If there is an error message, read all of it: the line number and the words (the error cards here explain them). If there is no message, the evidence is the output, and the gap between it and what you expected.

## 4. Make a guess, then test it

Say a specific **hypothesis** out loud: "the loop goes one step too far", "the comparison should not include equal values". Then test it, by tracing or by a small experiment. A guess you test is progress either way; random changes until it works are not.

## 5. Look inside: tracing

Add `printf` lines that show the values the program is working with:

```c
printf("i=%d  left=%d  this=%d  right=%d\n", i, values[i - 1], values[i], values[i + 1]);
```

Seeing the actual numbers usually ends the mystery in seconds. The debugger in Code mode does the same without editing the code: set a breakpoint, step, and watch the variables. Remove the trace lines when you are done.

## 6. Divide and conquer

When you do not know where the problem is, cut the program in half: print the state in the middle. If it is already wrong there, the bug is in the first half; if not, in the second. Repeat. This is binary search, applied to code.

## 7. Change one thing, then retest everything

Fix the cause, not the symptom (adding `if (n == 4) peaks--;` hides the bug for one input). Make one change, rerun the failing input, then rerun the cases that already worked, so the fix did not break them.

## Explaining helps

Explaining the code line by line to someone else, or even to a rubber duck on your desk, often reveals the bug halfway through a sentence. It forces you to say what each line really does, not what you meant it to do.

## Common mistakes

- **Testing only the input you wrote the program for.** The first test case below passes even with both bugs in place.
- **Changing several things at once.** If it then works, you do not know which change mattered, or which one broke something else.
- **Assuming the computer is wrong.** It does exactly what the code says; the question is what the code says.

::: kid
A bug detective works step by step.

First, make the bug happen on purpose.

Use the smallest example that still goes wrong.

Then print the numbers the program is using.

Make a guess. Check it. Change one thing at a time.
:::

```c {role=example file=trace.c}
#include <stdio.h>

int main() {
    int values[5] = {4, 7, 7, 3, 8};
    int rises = 0;

    // Trace each comparison while counting how often the value goes up.
    for (int i = 1; i < 5; i++) {
        int up = values[i] > values[i - 1];
        printf("i=%d  before=%d  now=%d  up=%d\n", i, values[i - 1], values[i], up);
        if (up) {
            rises++;
        }
    }
    printf("Rises: %d\n", rises);
    return 0;
}
```

::: try
This program counts **peaks** in a list of sensor readings: a reading that is bigger than both the reading before it and the reading after it. It works on the first test case, but it is wrong on others, for example `1 2 3 4` (no peaks, since the last reading has no reading after it) and `1 2 2 1 0` (no peaks: a flat top is not a peak). Use the method: reproduce, trace, guess, fix one thing, retest. There are two bugs.
:::

::: try-kid
A peak is a reading bigger than both its neighbours.

The program counts peaks, but sometimes gets it wrong.

Find the two bugs, one at a time.
:::

```c {role=starter file=peaks.c}
#include <stdio.h>

int main() {
    int values[20] = {0};
    int n;
    int peaks = 0;

    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &values[i]);
    }

    for (int i = 1; i < n; i++) {
        if (values[i] >= values[i - 1] && values[i] >= values[i + 1]) {
            peaks++;
            printf("Peak at reading %d: %d\n", i + 1, values[i]);
        }
    }
    printf("Peaks: %d\n", peaks);
    return 0;
}
```

```c {role=solution file=peaks.c}
#include <stdio.h>

int main() {
    int values[20] = {0};
    int n;
    int peaks = 0;

    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &values[i]);
    }

    for (int i = 1; i < n - 1; i++) {
        if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
            peaks++;
            printf("Peak at reading %d: %d\n", i + 1, values[i]);
        }
    }
    printf("Peaks: %d\n", peaks);
    return 0;
}
```
