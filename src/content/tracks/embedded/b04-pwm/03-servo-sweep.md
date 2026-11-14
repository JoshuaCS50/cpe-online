---
id: embedded.arduino.servo-sweep
kind: lesson
track: embedded
unit: b4
order: 3
title: Pulses that set a position or a speed
titleKid: A servo that sweeps
language: arduino
circuit:
  - { part: servo, pin: 9, label: Arm }
concepts: [servo, pulse-width, pwm, off-by-one]
prereqs: [embedded.arduino.analog-write, embedded.arduino.map-constrain]
est_minutes: 14
checks:
  - type: pins
    ms: 2400
    expect: "0 ms: servo on pin 9 at 0 degrees\n500 ms: servo on pin 9 at 45 degrees\n1000 ms: servo on pin 9 at 90 degrees\n1500 ms: servo on pin 9 at 135 degrees\n2000 ms: servo on pin 9 at 180 degrees\n"
hints:
  - 'The loop stops before it writes 180, so the sweep ends at 135 degrees.'
  - 'angle < 180 is false when angle is 180. The last position needs <=.'
  - 'for (int angle = 0; angle <= 180; angle += 45)'
hintsKid:
  - 'The arm never gets to 180.'
  - 'The loop stops one step too soon.'
  - 'Use `<=` instead of `<`.'
---
Pulses do two different jobs, depending on what listens to them.

## A motor: the duty cycle sets the speed

A DC motor through a transistor (see the fan project in B9) averages the pulses, just like an LED. `analogWrite(6, 128)` gives about half the power, so about half speed. The motor's weight smooths the pulses out.

## A servo: the pulse width sets the angle

A hobby servo (such as the SG90) has a motor, a gearbox, a position sensor and a small controller inside. It wants one pulse every 20 ms (50 times a second), and reads the **width** of each pulse:

| Pulse width | Angle |
|---|---|
| 1.0 ms | 0° |
| 1.5 ms | 90° |
| 2.0 ms | 180° |

The controller turns the arm until it reaches that angle, then holds it there against a push. The exact widths vary a little between servos.

`analogWrite` cannot make these pulses: its cycle is about 2 ms, not 20. The `Servo` library makes them with a timer:

```arduino
#include <Servo.h>
Servo arm;
arm.attach(9);     // brown GND, red 5 V, orange signal on pin 9
arm.write(90);     // the library turns 90° into a 1.5 ms pulse
```

A servo can draw several hundred milliamps as it starts to move. Power bigger servos from their own 5 V supply, with its GND joined to the board's GND.

::: kid
A servo is a little motor that turns to an angle.

The board sends it a short pulse, again and again.

A longer pulse means a bigger angle.

This arm sweeps from one side to the other.
:::

```arduino {role=example file=wave.ino}
// Wave the arm between 60 and 120 degrees.
#include <Servo.h>

Servo arm;

void setup() {
    arm.attach(9);
}

void loop() {
    arm.write(60);
    delay(400);
    arm.write(120);
    delay(400);
}
```

::: try
The servo on pin 9 should sweep from 0° to 180° in steps of 45°, half a second at each angle, then start again. It never reaches 180°. Fix the loop so the last position is included.
:::

::: try-kid
The arm should go all the way to 180.

It stops at 135. Fix the loop.
:::

```arduino {role=starter file=sweep.ino}
#include <Servo.h>

Servo arm;

void setup() {
    arm.attach(9);
}

void loop() {
    for (int angle = 0; angle < 180; angle += 45) {
        arm.write(angle);
        delay(500);
    }
}
```

```arduino {role=solution file=sweep.ino}
#include <Servo.h>

Servo arm;

void setup() {
    arm.attach(9);
}

void loop() {
    for (int angle = 0; angle <= 180; angle += 45) {
        arm.write(angle);
        delay(500);
    }
}
```
