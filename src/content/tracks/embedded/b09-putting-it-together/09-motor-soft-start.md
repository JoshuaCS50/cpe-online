---
id: embedded.projects.motor-soft-start
kind: lesson
track: embedded
unit: b9
order: 9
title: "Project: a fan with a soft start"
titleKid: A fan that speeds up gently
language: arduino
circuit:
  - { part: motor, pin: 6, label: Fan }
concepts: [transistor, pwm, duty-cycle, current]
prereqs: [embedded.projects.knob-dimmer]
est_minutes: 16
checks:
  - type: pins
    ms: 1200
    expect: "0 ms: pin 6 PWM 0\n200 ms: pin 6 PWM 51\n400 ms: pin 6 PWM 102\n600 ms: pin 6 PWM 153\n800 ms: pin 6 PWM 204\n1000 ms: pin 6 PWM 255\n"
hints:
  - 'Instead of one jump to 255, step the speed up: 0, 51, 102, 153, 204, 255.'
  - 'A for loop that adds STEP each time does it: for (int speed = 0; speed <= 255; speed += STEP) { ... }'
  - 'Inside the loop: analogWrite(FAN, speed); delay(STEP_MS);'
hintsKid:
  - 'Start slow, then go faster.'
  - 'Use a loop that adds 51 each time.'
  - 'Wait 200 ms between steps.'
---
A pin can give about 20 mA. A small motor wants 200 mA or more, and a big kick when it starts. So motors are never wired straight to a pin: a **transistor** switches the motor's current, and the pin only switches the transistor.

## What you build

- Pin 6 (PWM) through a 1 kΩ resistor to the **base** of a TIP120 transistor.
- The motor (or a fan) from 5 V to the transistor's **collector**.
- The **emitter** to GND.
- A diode across the motor, stripe towards 5 V.

The Circuit tab lists every part and wire.

## Why each part is there

| Part | Job |
|---|---|
| TIP120 | A switch the pin can open and close: a little base current lets a big collector current flow |
| 1 kΩ resistor | Keeps the base current small and safe for the pin |
| Diode | When the motor stops, it pushes back a voltage spike; the diode gives that spike a harmless path |

`analogWrite(6, speed)` switches the transistor on and off about a thousand times a second, so the motor sees an average power: 0 is stopped, 255 is full speed.

## A soft start

Jumping straight to full speed makes the motor draw a big current all at once: lights dim, the board can reset, gears wear. Real fan and pump controllers **ramp** the speed up instead. This project steps it up in five steps over one second.

::: kid
A motor needs more power than a pin can give.

So a part called a transistor does the hard work.

The pin tells the transistor when to switch on.

Starting slowly is kinder to the motor.
:::

```arduino {role=example file=pulse_fan.ino}
// Speed the fan up and down again, forever.
const int FAN = 6;

void setup() {
}

void loop() {
    for (int speed = 0; speed <= 255; speed += 15) {
        analogWrite(FAN, speed);
        delay(30);
    }
    for (int speed = 255; speed >= 0; speed -= 15) {
        analogWrite(FAN, speed);
        delay(30);
    }
}
```

::: try
The fan on pin 6 starts at full speed straight away. Give it a soft start: in `setup()`, step the speed from 0 up to 255 in steps of `STEP` (51), waiting `STEP_MS` (200 ms) after each one, then leave it running at full speed.
:::

::: try-kid
The fan starts too fast.

Make it start at 0 and add 51 each time.

Wait 200 ms between steps.
:::

```arduino {role=starter file=soft_start.ino}
const int FAN = 6;
const int STEP = 51;
const int STEP_MS = 200;

void setup() {
    pinMode(FAN, OUTPUT);
    analogWrite(FAN, 255);
}

void loop() {
}
```

```arduino {role=solution file=soft_start.ino}
const int FAN = 6;
const int STEP = 51;
const int STEP_MS = 200;

void setup() {
    pinMode(FAN, OUTPUT);
    for (int speed = 0; speed <= 255; speed += STEP) {
        analogWrite(FAN, speed);
        delay(STEP_MS);
    }
}

void loop() {
}
```
