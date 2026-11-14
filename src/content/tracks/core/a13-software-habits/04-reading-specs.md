---
id: core.c.reading-specs
kind: lesson
track: core
unit: a13
order: 4
title: Reading a specification
titleKid: Following the job card exactly
language: c
concepts: [specification, requirements, edge-cases, hysteresis, state]
prereqs: [core.c.unit-tests, core.c.else-if]
est_minutes: 16
checks:
  - type: io-cases
    cases:
      - stdin: ["6", "50", "19", "20", "80", "81", "50"]
        expect: "Reading 1: level 50, pump OFF\nReading 2: level 19, pump ON\nReading 3: level 20, pump ON\nReading 4: level 80, pump ON\nReading 5: level 81, pump OFF\nReading 6: level 50, pump OFF\nPump started 1 times, 0 bad readings\n"
      - stdin: ["4", "10", "120", "30", "-5"]
        expect: "Reading 1: level 10, pump ON\nReading 2: level 120 is invalid, pump OFF\nReading 3: level 30, pump OFF\nReading 4: level -5 is invalid, pump OFF\nPump started 1 times, 2 bad readings\n"
      - stdin: ["5", "5", "85", "15", "100", "0"]
        expect: "Reading 1: level 5, pump ON\nReading 2: level 85, pump OFF\nReading 3: level 15, pump ON\nReading 4: level 100, pump OFF\nReading 5: level 0, pump ON\nPump started 3 times, 0 bad readings\n"
hints:
  - 'Keep two values between readings: pumpOn (starting at 0, rule 1) and starts. For each reading, check for an invalid level first, then the < 20 and > 80 rules.'
  - 'Rule 4 is the tricky one: from 20 to 80 inclusive, do not touch pumpOn at all, so it keeps whatever it was. That is what stops the pump switching on and off all the time.'
  - 'Count a start only when the pump goes from OFF to ON (rule 5): if (!pumpOn) { starts++; } just before pumpOn = 1.'
hintsKid:
  - 'Remember if the pump is on. It starts off.'
  - 'Below 20, turn it on. Above 80, turn it off.'
  - 'In between, leave it as it was.'
---
Most programs are not invented; they are built to someone else's description of what is needed: a lab sheet, an exam question, a client's email, a datasheet. That description is the **specification** ("spec"). Many failed projects had code that worked perfectly, and did the wrong thing.

## Read it three times

1. **For the big picture.** What is this for? Who uses the result?
2. **For the details.** Underline every input, output, number, unit and word like "must", "only", "at least", "below".
3. **For the gaps.** What does it not say? Write down every question.

## What to pull out

| Look for | Example question |
|---|---|
| Inputs | What comes in, in what format, in what units? |
| Outputs | What exactly must be printed, word for word? |
| Ranges | What values are allowed? What happens outside them? |
| Boundaries | Is "below 20" `< 20` or `<= 20`? What happens at exactly 20? |
| Starting state | Is the pump on or off before the first reading? |
| Errors | What should happen with a bad reading? |

## Turn the spec into tests first

Before writing code, turn each rule into a test case with its expected result, especially the boundaries. If you cannot work out the expected result for a case, the spec has a gap: ask (in real life), or write down the assumption you made. This table is then your plan, your tests and your proof that the program meets the spec.

## Hysteresis: why two thresholds

The task below controls a pump that fills a tank. A single threshold ("on below 50%, off above 50%") would switch the pump on and off many times a second as the water ripples around 50%, which wears out the pump and the relay. The fix, used in thermostats, tank controllers and comparator circuits everywhere, is **hysteresis**: switch on at a low level, off at a high level, and in between **keep doing whatever you were doing**. The program has to remember its state from one reading to the next.

## Safety first

When a reading is impossible (a level of 120% or -5%), the sensor or its wiring has failed. A spec for real equipment always says what to do then, and the answer is almost always the safe state: here, pump off. A program that carries on with nonsense input is dangerous.

## Common mistakes

- **Close enough output.** `Pump: ON` is not `pump ON` when the spec, or the marking script, compares text exactly.
- **Guessing at a boundary.** "Below 20" means 20 itself is not below 20. Test exactly 20.
- **Forgetting the state.** Deciding each reading on its own ignores rule 4, and the pump chatters.

::: kid
A job card says exactly what to do.

Read it slowly, more than once.

Look for every number and every rule.

Ask what happens at the edges, like exactly 20.

Then check each rule with a test.
:::

```c {role=example file=thermostat.c}
#include <stdio.h>

#define HEAT_ON_BELOW 18     // degrees C
#define HEAT_OFF_ABOVE 21

int main() {
    double temps[8] = {20.0, 18.5, 17.9, 19.0, 20.5, 21.2, 20.0, 17.5};
    int heaterOn = 0;

    for (int i = 0; i < 8; i++) {
        if (temps[i] < HEAT_ON_BELOW) {
            heaterOn = 1;
        } else if (temps[i] > HEAT_OFF_ABOVE) {
            heaterOn = 0;
        }
        // Between the two limits the heater keeps its last state.
        printf("%.1f C -> heater %s\n", temps[i], heaterOn ? "on" : "off");
    }
    return 0;
}
```

::: try
Write the pump controller to this specification.

1. The pump starts OFF.
2. A level below 20 turns the pump ON.
3. A level above 80 turns the pump OFF.
4. A level from 20 to 80, inclusive, leaves the pump as it was.
5. A level below 0 or above 100 is invalid: the pump turns OFF for safety, and the reading counts as bad.
6. After each reading print `Reading N: level L, pump ON` (or `OFF`), or for an invalid one `Reading N: level L is invalid, pump OFF`.
7. At the end print `Pump started S times, B bad readings`, where a start is a change from OFF to ON.

The program first reads how many readings follow, then the readings, one per line.
:::

::: try-kid
The pump fills a tank with water.

Below 20, turn it on. Above 80, turn it off.

In between, leave it as it was.

A level under 0 or over 100 is broken. Turn the pump off.
:::

```c {role=starter file=pump.c}
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    // Follow the specification for each of the n readings.

    return 0;
}
```

```c {role=solution file=pump.c}
#include <stdio.h>

#define LOW_LEVEL 20
#define HIGH_LEVEL 80

int main() {
    int n;
    int pumpOn = 0;
    int starts = 0;
    int bad = 0;

    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        int level;
        scanf("%d", &level);

        if (level < 0 || level > 100) {
            pumpOn = 0;
            bad++;
            printf("Reading %d: level %d is invalid, pump OFF\n", i, level);
            continue;
        }

        if (level < LOW_LEVEL) {
            if (!pumpOn) {
                starts++;
            }
            pumpOn = 1;
        } else if (level > HIGH_LEVEL) {
            pumpOn = 0;
        }
        printf("Reading %d: level %d, pump %s\n", i, level, pumpOn ? "ON" : "OFF");
    }
    printf("Pump started %d times, %d bad readings\n", starts, bad);
    return 0;
}
```
