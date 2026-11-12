---
id: core.c.testing-functions
kind: lesson
track: core
unit: a5
order: 6
title: Testing functions
titleKid: Checking a helper's answers
language: c
concepts: [testing, test-cases, edge-cases, debugging]
prereqs: [core.c.parameters, core.c.decision-bugs]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["2024"]
        expect: "Leap\n"
      - stdin: ["2023"]
        expect: "Not leap\n"
      - stdin: ["1900"]
        expect: "Not leap\n"
      - stdin: ["2000"]
        expect: "Leap\n"
      - stdin: ["2100"]
        expect: "Not leap\n"
  - type: code-contains
    pattern: '%\s*400'
    message: Handles years divisible by 400
hints:
  - Test the function with the four kinds of year in the task. Which one gives the wrong answer?
  - 1900 is divisible by 4 and by 100 but not by 400, so it is not a leap year. The function only checks 4.
  - 'Check 400 first, then 100, then 4: if (year % 400 == 0) { return 1; } if (year % 100 == 0) { return 0; } return year % 4 == 0;'
hintsKid:
  - Try every kind of year in the task. Which one is wrong?
  - 1900 splits into groups of 100. So it is not a leap year.
  - 'Check 400 first: `if (year % 400 == 0) { return 1; }`'
---
A function that gives the right answer once is not yet a function that works. Testing means choosing inputs on purpose, deciding the right answer before the program runs, and then comparing the two.

## Choosing cases

Three kinds of case earn a place:

- **An ordinary value**, to show the usual path works.
- **The edges**: 0, 1, the largest or smallest value that makes sense, and the value right on a boundary.
- **Every special rule** in the task, each with its own case.

For a function `absolute(n)` that removes a minus sign, four cases cover the ground:

| Call | Expected | Kind of case |
|---|---|---|
| `absolute(5)` | 5 | ordinary |
| `absolute(-5)` | 5 | ordinary, other sign |
| `absolute(0)` | 0 | the edge between the signs |
| `absolute(-1)` | 1 | right next to zero, where the sign changes |

Deciding the expected answer is part of the test. Work it out from the rule, on paper, before running anything. An expected answer taken from the program can only agree with the program.

## A test driver

The simplest driver is a `main` whose only job is to call the function once per case and report what came back:

```c
void check(int test, int actual, int expected) {
    if (actual == expected) {
        printf("Test %d: pass\n", test);
    } else {
        printf("Test %d: FAIL, got %d but expected %d\n", test, actual, expected);
    }
}
```

Then one call for each case:

```c
check(1, absolute(5), 5);
check(2, absolute(-5), 5);
check(3, absolute(0), 0);
check(4, absolute(-1), 1);
```

Each call gives the test a number, the answer from the function, and the answer you worked out. One line of output per case names the test that failed.

## When a case fails

The report gives the input and what came back: `Test 4: FAIL, got -1 but expected 1`. That points straight at the case the code gets wrong, which is usually the rule it has missed. Fix the function and run every test again, because a change that repairs one case can break another.

The example below does exactly this. Change `n < 0` to `n < -1` and run it again: test 4 fails, because -1 comes back unchanged, while the other three still pass. Test 4 is the edge case, and it is the only one that catches the mistake.

## What testing can and cannot do

Testing cannot prove that a function has no mistakes. It can only find the ones your cases reach. That is why cases go where mistakes hide: the edges, and every special rule in the task. A function that passes ten ordinary values may still be wrong at zero.

## Common mistakes

- **Testing only the example from the task.** The example shows that the function can work, not that it always does.
- **Working out the expected answer by running the code.** The code will agree with itself, mistakes included.
- **Changing the test to match a wrong answer.** If the case follows the rule and the code does not, the code is wrong.

::: kid
You made a paper plane.

You throw it gently.

It flies across the room.

You throw it hard.

It flies even further.

You throw it into the wind.

It turns and comes back.

Now you know how it flies.

One good throw is not enough.

Test your helpers the same way.
:::

```c {role=example file=tests.c}
#include <stdio.h>

int absolute(int n) {
    if (n < 0) {
        return -n;
    }
    return n;
}

void check(int test, int actual, int expected) {
    if (actual == expected) {
        printf("Test %d: pass\n", test);
    } else {
        printf("Test %d: FAIL, got %d but expected %d\n", test, actual, expected);
    }
}

int main() {
    check(1, absolute(5), 5);
    check(2, absolute(-5), 5);
    check(3, absolute(0), 0);
    check(4, absolute(-1), 1);
    return 0;
}
```

::: try
A year is a leap year if it is divisible by 4, except that years divisible by 100 are not, except that years divisible by 400 are.

`is_leap` follows only the first part of the rule, so it passes some years and fails others. Test it with 2024, 2023, 1900 and 2000. Find the year that comes back wrong, then fix `is_leap`. Only change the function.
:::

::: try-kid
This helper says if a year is a leap year.

A leap year has an extra day.

Test these years: 2024, 2023, 1900 and 2000.

Say the right answer for each one first.

Then run the program.

One year will come back wrong.

Fix the helper for that year.

Check all four years again.
:::

```c {role=starter file=leap.c}
#include <stdio.h>

int is_leap(int year) {
    return year % 4 == 0;
}

int main() {
    int year;

    scanf("%d", &year);

    if (is_leap(year)) {
        printf("Leap\n");
    } else {
        printf("Not leap\n");
    }
    return 0;
}
```

```c {role=solution file=leap.c}
#include <stdio.h>

int is_leap(int year) {
    if (year % 400 == 0) {
        return 1;
    }
    if (year % 100 == 0) {
        return 0;
    }
    return year % 4 == 0;
}

int main() {
    int year;

    scanf("%d", &year);

    if (is_leap(year)) {
        printf("Leap\n");
    } else {
        printf("Not leap\n");
    }
    return 0;
}
```
