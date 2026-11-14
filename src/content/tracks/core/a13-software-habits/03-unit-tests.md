---
id: core.c.unit-tests
kind: lesson
track: core
unit: a13
order: 3
title: Tests that check themselves
titleKid: A checklist the computer ticks off
language: c
concepts: [unit-testing, test-harness, boundary-values, regression-testing, integer-division]
prereqs: [core.c.testing-functions, core.c.debugging-strategy]
est_minutes: 16
checks:
  - type: stdout-regex
    pattern: '^(?![\s\S]*FAIL)[\s\S]*All ([5-9]|\d\d+) tests passed'
    message: 'Runs at least 5 tests, and every one passes'
  - type: code-contains
    pattern: 'check\(\s*mapRange\(\s*512\s*,\s*0\s*,\s*1023\s*,\s*0\s*,\s*255\s*\)\s*,\s*127\s*,'
    message: 'Tests the middle: mapRange(512, 0, 1023, 0, 255) should be 127'
  - type: code-contains
    pattern: 'check\(\s*mapRange\(\s*15\s*,\s*10\s*,\s*20\s*,\s*100\s*,\s*200\s*\)\s*,\s*150\s*,'
    message: 'Tests a range that does not start at 0: mapRange(15, 10, 20, 100, 200) should be 150'
hints:
  - 'Add the two tests named in the checks first, for example check(mapRange(512, 0, 1023, 0, 255), 127, "middle");. Run it: they fail, so the tests have found a bug.'
  - 'Work out (x - inLow) / (inHigh - inLow) for x = 512: in C that is 512 / 1023, which is 0 because both are ints. Every value between the ends becomes the bottom of the output range.'
  - 'Multiply before dividing: return (x - inLow) * (outHigh - outLow) / (inHigh - inLow) + outLow; then add more tests, such as a reversed range, until you have at least 5, all passing.'
hintsKid:
  - 'Add tests for the middle and for 10 to 20.'
  - 'They fail. Good: the tests found a bug.'
  - 'Multiply first, then divide. Then add more tests.'
---
In unit A5 you tested a function by typing inputs and reading the answers. That works once. But programs change, and every change can break something that used to work. Retyping twenty inputs after each change is so dull that nobody does it. The answer is to let the program test itself.

## A test harness

A **unit test** checks one small unit of code, usually one function, with a known input and a known right answer. A tiny helper turns each test into one line:

```c
int tests = 0;
int failed = 0;

void check(int got, int expected, char what[]) {
    tests++;
    if (got == expected) {
        printf("PASS %s\n", what);
    } else {
        failed++;
        printf("FAIL %s: got %d, expected %d\n", what, got, expected);
    }
}
```

```c
check(mapRange(1023, 0, 1023, 0, 255), 255, "top of the range");
```

The expected value is worked out **by hand, before running**, from what the function is supposed to do, never copied from what it prints. Copying the output just confirms that the program does what it does.

On a desktop, C's `<assert.h>` offers `assert(condition)`, which stops the program when a condition is false. This harness reports every result instead, which is friendlier while you are fixing several things.

## Choosing what to test

A function cannot be tested with every input, so choose inputs that are most likely to reveal mistakes:

- **Boundaries.** The smallest and largest allowed values, and the values just inside them. Bugs crowd at edges (`<` versus `<=`, off by one).
- **The middle.** A typical value, where most use happens.
- **Each kind of input.** If the code has different cases (a reversed range, a range not starting at 0, negative numbers), test each one at least once.
- **Special values.** 0, negative numbers, equal values, empty lists.

Each test should check one thing and have a name that says what, so a FAIL line tells you where to look.

## Keep the tests

Tests are not thrown away after the bug is fixed. Keep them in the program, or in a separate test file, and run them all after every change. A test that once found a bug guards against it ever coming back: a **regression test**. Professional projects run thousands of these automatically on every change.

Some programmers write the tests **before** the function, straight from what it is meant to do. It forces you to decide the exact behaviour first, and you know the function is finished when every test passes.

## The integer division trap

The function in the task scales a value, like Arduino's `map()`, which turns a 0 to 1023 analog reading into a 0 to 255 PWM value. Its bug is a classic in C: dividing two ints throws away the fraction, so the order of operations decides the answer:

```c
512 / 1023 * 255      // 0 * 255 = 0
512 * 255 / 1023      // 130560 / 1023 = 127
```

Multiply first, divide last. (On a small microcontroller, also check that the product still fits in an `int`.)

## Common mistakes

- **Expected values copied from the output.** The test then passes even when the function is wrong.
- **Testing only the ends.** The function in the task passes both end tests while being wrong for every value in between.
- **Deleting tests once they pass.** They are worth most later, when someone changes the code.

::: kid
Imagine a checklist for a robot.

Each line says: try this, and you should get that.

The computer does every check and ticks them off.

A cross means something is broken.

After every change, run the whole checklist again.
:::

```c {role=example file=clamp-tests.c}
#include <stdio.h>

int tests = 0;
int failed = 0;

void check(int got, int expected, char what[]) {
    tests++;
    if (got == expected) {
        printf("PASS %s\n", what);
    } else {
        failed++;
        printf("FAIL %s: got %d, expected %d\n", what, got, expected);
    }
}

// Keeps value between low and high.
int clamp(int value, int low, int high) {
    if (value < low) {
        return low;
    }
    if (value > high) {
        return high;
    }
    return value;
}

int main() {
    check(clamp(50, 0, 100), 50, "inside");
    check(clamp(-5, 0, 100), 0, "below");
    check(clamp(150, 0, 100), 100, "above");
    check(clamp(0, 0, 100), 0, "exactly low");
    check(clamp(100, 0, 100), 100, "exactly high");
    printf("%d tests, %d failed\n", tests, failed);
    return 0;
}
```

::: try
`mapRange` scales `x` from the range `inLow..inHigh` to `outLow..outHigh`. Its two tests pass, yet it is wrong for almost every input. Add tests until the bug shows, including `mapRange(512, 0, 1023, 0, 255)` (should be 127) and `mapRange(15, 10, 20, 100, 200)` (should be 150). Then fix `mapRange` so that at least 5 tests run and all of them pass.
:::

::: try-kid
Both tests pass, but the helper is still broken.

Add more tests until one fails.

Then fix the helper so every test passes.
:::

```c {role=starter file=map-tests.c}
#include <stdio.h>

int tests = 0;
int failed = 0;

// Compares a result with the expected value and reports it.
void check(int got, int expected, char what[]) {
    tests++;
    if (got == expected) {
        printf("PASS %s\n", what);
    } else {
        failed++;
        printf("FAIL %s: got %d, expected %d\n", what, got, expected);
    }
}

// Scales x from inLow..inHigh to outLow..outHigh, like Arduino's map().
int mapRange(int x, int inLow, int inHigh, int outLow, int outHigh) {
    return (x - inLow) / (inHigh - inLow) * (outHigh - outLow) + outLow;
}

int main() {
    check(mapRange(0, 0, 1023, 0, 255), 0, "bottom of the range");
    check(mapRange(1023, 0, 1023, 0, 255), 255, "top of the range");

    // Add more tests here.

    if (failed == 0) {
        printf("All %d tests passed\n", tests);
    } else {
        printf("%d of %d tests failed\n", failed, tests);
    }
    return 0;
}
```

```c {role=solution file=map-tests.c}
#include <stdio.h>

int tests = 0;
int failed = 0;

// Compares a result with the expected value and reports it.
void check(int got, int expected, char what[]) {
    tests++;
    if (got == expected) {
        printf("PASS %s\n", what);
    } else {
        failed++;
        printf("FAIL %s: got %d, expected %d\n", what, got, expected);
    }
}

// Scales x from inLow..inHigh to outLow..outHigh, like Arduino's map().
// Multiplies before dividing, so the fraction is not lost.
int mapRange(int x, int inLow, int inHigh, int outLow, int outHigh) {
    return (x - inLow) * (outHigh - outLow) / (inHigh - inLow) + outLow;
}

int main() {
    check(mapRange(0, 0, 1023, 0, 255), 0, "bottom of the range");
    check(mapRange(1023, 0, 1023, 0, 255), 255, "top of the range");
    check(mapRange(512, 0, 1023, 0, 255), 127, "middle");
    check(mapRange(15, 10, 20, 100, 200), 150, "range not starting at 0");
    check(mapRange(0, 0, 1023, 255, 0), 255, "reversed range, bottom");
    check(mapRange(1023, 0, 1023, 255, 0), 0, "reversed range, top");

    if (failed == 0) {
        printf("All %d tests passed\n", tests);
    } else {
        printf("%d of %d tests failed\n", failed, tests);
    }
    return 0;
}
```
