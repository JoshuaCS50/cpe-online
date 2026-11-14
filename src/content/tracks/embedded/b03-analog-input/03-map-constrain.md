---
id: embedded.arduino.map-constrain
kind: lesson
track: embedded
unit: b3
order: 3
title: Scaling readings with map and constrain
titleKid: A knob that turns a servo
language: arduino
circuit:
  - { part: knob, pin: A0 }
  - { part: servo, pin: 9, label: Arm }
concepts: [map, constrain, scaling, servo, limits]
prereqs: [embedded.arduino.analog-read]
est_minutes: 14
checks:
  - type: pins
    ms: 800
    inputs: ["A0 0 at 0", "A0 512 at 300", "A0 1023 at 600"]
    expect: "0 ms: servo on pin 9 at 20 degrees\n300 ms: servo on pin 9 at 90 degrees\n600 ms: servo on pin 9 at 160 degrees\n"
  - type: pins
    ms: 300
    inputs: ["A0 256 at 0"]
    expect: "0 ms: servo on pin 9 at 45 degrees\n"
hints:
  - 'map(raw, 0, 1023, 0, 180) already turns the reading into 0 to 180 degrees. The problem is only at the ends.'
  - 'constrain(value, low, high) gives low if value is below low, high if it is above high, and value otherwise.'
  - 'int angle = constrain(map(raw, 0, 1023, 0, 180), MIN_ANGLE, MAX_ANGLE);'
hintsKid:
  - 'The angle is fine in the middle. Fix the ends.'
  - '`constrain` keeps a number between two limits.'
  - 'Try `constrain(angle, MIN_ANGLE, MAX_ANGLE)`.'
---
A reading of 0 to 1023 is rarely the number you want. A servo wants 0 to 180 degrees, a PWM output wants 0 to 255, a display wants 0 to 100%. Arduino has two small functions for this.

## map: change the range

```arduino
long map(long value, long fromLow, long fromHigh, long toLow, long toHigh);
```

`map` scales a number from one range to another in a straight line:

```arduino
int angle = map(raw, 0, 1023, 0, 180);   // 0 -> 0, 512 -> 90, 1023 -> 180
```

It works in whole numbers and throws away fractions, so 512 maps to 90, not 90.07. It does not limit the result: a value outside the first range gives one outside the second. `map` can also reverse a range: `map(raw, 0, 1023, 180, 0)` turns the servo the other way.

## constrain: stay within limits

```arduino
int safe = constrain(value, low, high);
```

`constrain` returns `low` if the value is below it, `high` if it is above, and the value itself otherwise. It is how a program respects **mechanical limits**: a servo arm that would hit its frame at 0° or 180°, a valve that must never fully close, a motor speed that must stay under a safe maximum.

## Together

```arduino
int angle = constrain(map(raw, 0, 1023, 0, 180), 20, 160);
```

The knob still sweeps the whole range, but the arm stops at 20° and 160°. Between the limits it follows the knob exactly.

## The timeline

The board only records a servo, PWM or tone value when it **changes**, so a loop that writes the same angle every 100 ms shows one line, not one per loop.

::: kid
A knob gives a number from 0 to 1023.

A servo arm wants a number from 0 to 180.

`map` turns one kind of number into the other.

`constrain` stops a number going too low or too high.

That keeps the arm from bumping into things.
:::

```arduino {role=example file=dimmer.ino}
// A knob on A0 sets the brightness of an LED on PWM pin 6.
void setup() {
    pinMode(6, OUTPUT);
}

void loop() {
    int raw = analogRead(A0);
    int brightness = map(raw, 0, 1023, 0, 255);
    analogWrite(6, brightness);
    delay(50);
}
```

::: try
A knob on A0 turns a servo on pin 9. The servo's arm hits its frame below 20° and above 160°. The sketch maps the knob to 0–180°; change it so the angle never goes below `MIN_ANGLE` or above `MAX_ANGLE`.
:::

::: try-kid
The arm must stay between 20 and 160.

Use `constrain` to keep the angle inside those limits.
:::

```arduino {role=starter file=arm.ino}
#include <Servo.h>

const int MIN_ANGLE = 20;
const int MAX_ANGLE = 160;

Servo arm;

void setup() {
    arm.attach(9);
}

void loop() {
    int raw = analogRead(A0);
    int angle = map(raw, 0, 1023, 0, 180);
    arm.write(angle);
    delay(100);
}
```

```arduino {role=solution file=arm.ino}
#include <Servo.h>

const int MIN_ANGLE = 20;
const int MAX_ANGLE = 160;

Servo arm;

void setup() {
    arm.attach(9);
}

void loop() {
    int raw = analogRead(A0);
    int angle = constrain(map(raw, 0, 1023, 0, 180), MIN_ANGLE, MAX_ANGLE);
    arm.write(angle);
    delay(100);
}
```
