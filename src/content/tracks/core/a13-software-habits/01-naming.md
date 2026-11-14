---
id: core.c.naming
kind: lesson
track: core
unit: a13
order: 1
title: Names, constants and comments
titleKid: Good labels on every box
language: c
concepts: [naming, constants, define, magic-numbers, comments, refactoring]
prereqs: [core.c.functions]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["1500"]
        expect: "Duty: 127 of 255\n"
      - stdin: ["2900"]
        expect: "Duty: 246 of 255\nWarning: running above 80%\n"
      - stdin: ["4000"]
        expect: "Duty: 255 of 255\nWarning: running above 80%\n"
      - stdin: ["-20"]
        expect: "Duty: 0 of 255\n"
  - type: code-contains
    pattern: '#define\s+MAX_RPM\s+3000\b'
    message: 'Defines MAX_RPM as 3000'
  - type: code-contains
    pattern: '#define\s+MAX_DUTY\s+255\b'
    message: 'Defines MAX_DUTY as 255'
  - type: code-contains
    pattern: '^(?![\s\S]*\b3000\b[\s\S]*\b3000\b)(?![\s\S]*\b255\b[\s\S]*\b255\b)(?![\s\S]*\b204\b[\s\S]*\b204\b)'
    message: 'Writes 3000, 255 and 204 only once each, in their #define lines'
  - type: code-contains
    pattern: 'int\s+dutyFromRpm\s*\(\s*int\s+rpm\s*\)'
    message: 'Renames f(int a) to dutyFromRpm(int rpm)'
hints:
  - 'Add three lines under the #include: #define MAX_RPM 3000, #define MAX_DUTY 255 and #define WARN_DUTY 204. Then use the names everywhere the numbers were.'
  - 'Rename the function to dutyFromRpm and its parameter to rpm. In main, call the variables rpm and duty.'
  - 'The printf line must not contain 255 either: print it with %d and MAX_DUTY, as in printf("Duty: %d of %d\n", duty, MAX_DUTY);'
hintsKid:
  - 'Give each special number a name with `#define`.'
  - 'Give the helper and its boxes names that say what they hold.'
  - 'Then the numbers appear only once, at the top.'
---
A program is read far more often than it is written: by the next student, by a lab partner, and by you in three weeks, when you have forgotten everything. Code that works but cannot be understood is hard to fix and easy to break. Good names and comments cost seconds and save hours.

## Names that say what they hold

| Hard to read | Clear |
|---|---|
| `int x, y, t;` | `int speed, distance, seconds;` |
| `int f(int a)` | `int dutyFromRpm(int rpm)` |
| `int flag;` | `int motorRunning;` |
| `double d;` | `double distanceMm;` |

Guidelines that help:

- **Variables are nouns** (`temperature`, `pulseCount`); **functions are verbs or questions** (`readSensor`, `isFull`).
- **Put the unit in the name** when it is not obvious: `delayMs`, `angleDeg`, `voltageMv`. A famous Mars probe was lost because one program worked in pound-seconds and another in newton-seconds.
- **Short names are fine for short lives.** `i` for a loop counter over three lines is clear; `i` as a variable used across a whole function is not.
- **Pick one style and keep it.** This course uses `camelCase` for C variables and functions, and `UPPER_CASE` for constants.

## No magic numbers

A **magic number** is a value in the code whose meaning is not written down:

```c
if (level > 920) {        // what is 920?
```

Give it a name, once, at the top:

```c
#define TANK_FULL_LEVEL 920    // ADC reading when the float switch trips

if (level > TANK_FULL_LEVEL) {
```

Now the line explains itself, and when the tank changes, there is one place to edit instead of a hunt through the program for every `920` (and the risk of changing an unrelated `920`). `#define NAME value` swaps the name for the value before the program runs; `const int TANK_FULL_LEVEL = 920;` works too and has a type.

0 and 1 used as starting values and steps are not magic; 255, 1023, 3000 and 920 are.

## Comments say why

The code already says **what** it does. A comment is for what the code cannot say: **why**, units, limits, and surprises.

```c
count = count + 1;     // add one to count       <- repeats the code: useless

// The sensor reports twice per turn, so halve the count.
rpm = pulses * 60 / 2;                            <- explains a decision
```

A good habit is a short comment above each function saying what it takes, what it returns and any limits. When code changes, change its comment too: a wrong comment is worse than none.

## Refactoring

Changing the structure of working code without changing what it does is called **refactoring**. Do it in small steps and run the program after each one, comparing the output with what it printed before. That is exactly the task below.

## Common mistakes

- **Names that lie.** A variable called `average` that holds a total misleads every reader.
- **Commenting the obvious, skipping the important.** `i++; // increment i` but no word on why the 0.8 is there.
- **Renaming without retesting.** A missed rename or a changed constant changes behaviour; check the output after every step.

::: kid
Imagine boxes with no labels in a big cupboard.

Finding anything takes ages.

Good names are clear labels on the boxes.

Special numbers get a name too, written once at the top.

A short note can say why something was done.
:::

```c {role=example file=tank.c}
#include <stdio.h>

#define TANK_FULL_LEVEL 920    // ADC reading when the float switch trips
#define TANK_EMPTY_LEVEL 80    // below this the pump would run dry
#define ADC_MAX 1023           // 10-bit converter

// Turns a raw ADC reading into a percentage of a full tank.
int levelPercent(int adcReading) {
    return adcReading * 100 / ADC_MAX;
}

int main() {
    int readings[4] = {50, 400, 930, 1023};

    for (int i = 0; i < 4; i++) {
        int adc = readings[i];
        printf("ADC %4d = %3d%%", adc, levelPercent(adc));
        if (adc > TANK_FULL_LEVEL) {
            printf("  full: close the valve");
        } else if (adc < TANK_EMPTY_LEVEL) {
            printf("  low: stop the pump");
        }
        printf("\n");
    }
    return 0;
}
```

::: try
This program works: it turns a motor speed in rpm into a PWM duty value from 0 to 255 and warns above 80%. But nobody can tell what `f`, `a`, `x`, `3000` or `204` mean. Refactor it without changing what it prints: define `MAX_RPM` (3000), `MAX_DUTY` (255) and `WARN_DUTY` (204) and use them instead of the numbers, so each number is written only once; rename `f(int a)` to `dutyFromRpm(int rpm)`; and give the variables in `main` clear names.
:::

::: try-kid
The program works, but its labels are bad.

Give the special numbers names at the top.

Give the helper and the boxes clear names.

It must still print exactly the same.
:::

```c {role=starter file=motor.c}
#include <stdio.h>

int f(int a) {
    if (a > 3000) {
        a = 3000;
    }
    if (a < 0) {
        a = 0;
    }
    return a * 255 / 3000;
}

int main() {
    int x;
    scanf("%d", &x);
    int y = f(x);
    printf("Duty: %d of 255\n", y);
    if (y > 204) {
        printf("Warning: running above 80%%\n");
    }
    return 0;
}
```

```c {role=solution file=motor.c}
#include <stdio.h>

#define MAX_RPM 3000     // the motor's rated top speed
#define MAX_DUTY 255     // 8-bit PWM: 255 is always on
#define WARN_DUTY 204    // 80% of MAX_DUTY

// Turns a speed in rpm into a PWM duty value, limited to 0..MAX_DUTY.
int dutyFromRpm(int rpm) {
    if (rpm > MAX_RPM) {
        rpm = MAX_RPM;
    }
    if (rpm < 0) {
        rpm = 0;
    }
    return rpm * MAX_DUTY / MAX_RPM;
}

int main() {
    int rpm;
    scanf("%d", &rpm);
    int duty = dutyFromRpm(rpm);
    printf("Duty: %d of %d\n", duty, MAX_DUTY);
    if (duty > WARN_DUTY) {
        printf("Warning: running above 80%%\n");
    }
    return 0;
}
```
