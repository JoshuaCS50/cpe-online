---
id: core.c.rubber-duck
kind: lesson
track: core
unit: a14
order: 7
title: Rubber duck debugging
titleKid: Explaining your code out loud
language: c
concepts: [rubber-duck, explaining, trace-table, swap]
prereqs: [core.c.debug-variables, core.c.trace-tables]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["9 4 7"]
        expect: "Sorted: 4 7 9\n"
      - stdin: ["1 2 3"]
        expect: "Sorted: 1 2 3\n"
      - stdin: ["3 2 1"]
        expect: "Sorted: 1 2 3\n"
      - stdin: ["5 5 2"]
        expect: "Sorted: 2 5 5\n"
      - stdin: ["2 8 6"]
        expect: "Sorted: 2 6 8\n"
  - type: code-contains
    pattern: '\btemp\b'
    message: 'Swaps with a helper variable called temp'
hints:
  - 'Explain the three lines inside the first if, out loud, with a = 9 and b = 4: "a gets b, so a is now 4. Then b gets a, so b is now..."'
  - 'After a = b, the old value of a is gone, so b = a just copies the new a back. Both end up as 4. A swap needs somewhere to keep the old value.'
  - 'Write each swap as three lines: int temp = a; a = b; b = temp; (and the same for the other two swaps).'
hintsKid:
  - 'Say each line out loud with real numbers.'
  - 'After `a = b`, the old a is gone.'
  - 'Keep a copy first: `int temp = a;` then swap.'
---
A programmer once kept a rubber duck on the desk and explained broken code to it, line by line. Surprisingly often, the bug became obvious halfway through a sentence. The trick, now known as **rubber duck debugging**, works with a duck, a classmate who does not even know C, or by writing the explanation down.

## Why it works

When you read your own code silently, you see what you **meant** to write. When you explain it out loud, you have to say what each line **actually** does, in order, with the real values. The gap between the two is the bug.

## How to do it

1. Pick an input, preferably one that goes wrong, and keep it small.
2. Start at the top. For every line say what it does and what the variables hold afterwards: "`total` becomes 0. The loop starts with `i` equal to 1..."
3. Do not skip lines because they are "obviously fine". The bug is usually in a line you were sure about.
4. When what you say does not match what should happen, stop: you have found it.

## Duck, trace table or debugger?

All three do the same job, making you look at the real values one step at a time:

| Tool | Best when |
|---|---|
| Explaining aloud | the code is short and you think you understand it (but it does not work) |
| Trace table on paper | you are learning, or there is no computer, as in an exam |
| Debugger | the program is long, has many variables, or loops many times |

Experienced programmers use all three. Explaining is the quickest to start: no tools at all.

## The classic: swapping two values

The task below contains one of the best-known bugs in programming. Explaining it with real numbers finds it within one sentence. Try it before reading the hints.

::: kid
Find a toy duck, or a friend.

Explain your program to it, one line at a time.

Say what each line really does, with real numbers.

Often you hear the mistake while you are talking.

You do not even need a computer.
:::

```c {role=example file=explain.c}
#include <stdio.h>

int main() {
    // Explaining this aloud with price = 80 and quantity = 3:
    int price = 80;                 // price is 80
    int quantity = 3;               // quantity is 3
    int total = price * quantity;   // total is 80 * 3 = 240
    if (total > 200) {              // 240 > 200 is true, so...
        total = total - 20;         // ...total becomes 220
    }
    printf("Total: %d\n", total);   // prints Total: 220
    return 0;
}
```

::: try
The program reads three numbers and should print them from smallest to largest, by swapping pairs that are in the wrong order. It works for some inputs, but `9 4 7` comes out wrong. Explain the code to yourself (or a duck) out loud with `a = 9` and `b = 4`, find the problem, and fix all three swaps using a helper variable called `temp`.
:::

::: try-kid
The program should put three numbers in order.

Swapping two numbers goes wrong.

Say each line out loud with real numbers to find out why.
:::

```c {role=starter file=three.c}
#include <stdio.h>

int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);

    if (a > b) {
        a = b;
        b = a;
    }
    if (b > c) {
        b = c;
        c = b;
    }
    if (a > b) {
        a = b;
        b = a;
    }

    printf("Sorted: %d %d %d\n", a, b, c);
    return 0;
}
```

```c {role=solution file=three.c}
#include <stdio.h>

int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);

    if (a > b) {
        int temp = a;
        a = b;
        b = temp;
    }
    if (b > c) {
        int temp = b;
        b = c;
        c = temp;
    }
    if (a > b) {
        int temp = a;
        a = b;
        b = temp;
    }

    printf("Sorted: %d %d %d\n", a, b, c);
    return 0;
}
```
