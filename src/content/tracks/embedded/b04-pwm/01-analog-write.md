---
id: embedded.arduino.analog-write
kind: lesson
track: embedded
unit: b4
order: 1
title: analogWrite and the duty cycle
titleKid: Half on, half off
language: arduino
circuit:
  - { part: led, pin: 9, colour: green, label: Lamp }
concepts: [pwm, duty-cycle, analog-output, resolution]
prereqs: [embedded.arduino.blink]
est_minutes: 12
checks:
  - type: pins
    ms: 2500
    expect: "0 ms: pin 9 PWM 63\n1000 ms: pin 9 PWM 127\n2000 ms: pin 9 PWM 255\n"
hints:
  - 'analogWrite takes 0 to 255, not 0 to 100. 100% is 255.'
  - 'Scale the percentage: percent × 255 ÷ 100. Multiply first, so the whole-number division does not lose everything.'
  - 'return percent * 255 / 100;'
hintsKid:
  - 'The board counts from 0 to 255, not to 100.'
  - 'Full brightness is 255.'
  - 'Try `percent * 255 / 100`.'
---
A digital pin is either fully on (5 V) or fully off (0 V). To dim an LED or slow a motor, a board switches the pin on and off very fast, about 490 times a second on most Uno pins. This is **PWM** (pulse-width modulation). The LED cannot follow such fast flicker, and your eye cannot either: it sees the average.

## The duty cycle

The **duty cycle** is the share of each cycle the pin spends on. 25% on looks dim, 50% looks half bright, 100% is fully on.

```arduino
analogWrite(9, 64);    // about 25% on
analogWrite(9, 128);   // about 50% on
analogWrite(9, 255);   // always on
```

`analogWrite` takes 0 to 255: the Uno's PWM has 8 bits of **resolution**, 256 steps. Only pins marked with a ~ (3, 5, 6, 9, 10 and 11) can do it; on other pins the simulator notes the mistake.

The name is misleading: `analogWrite` does not make an in-between voltage. The pin still only gives 0 V or 5 V. Something slow (an LED seen by an eye, a motor with its weight, a filter of a resistor and capacitor) turns the pulses into an average.

## From percent to duty

```arduino
int duty = percent * 255 / 100;
```

Multiply first. `percent / 100` in whole numbers is 0 for anything under 100, and 0 × 255 is still 0.

::: kid
A pin can only be on or off.

To dim a light, the board flicks it on and off.

It does it hundreds of times every second!

Your eye only sees a softer light.
:::

```arduino {role=example file=three_levels.ino}
// The LED steps through dim, half and full, then off.
const int LED = 9;

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    analogWrite(LED, 32);
    delay(500);
    analogWrite(LED, 128);
    delay(500);
    analogWrite(LED, 255);
    delay(500);
    analogWrite(LED, 0);
    delay(500);
}
```

::: try
The sketch should show the LED on pin 9 at 25%, 50% and 100% brightness, one second each. `dutyFor` should turn a percentage into the 0 to 255 that `analogWrite` wants, but it returns the percentage unchanged. Fix `dutyFor`.
:::

::: try-kid
The lamp should go a quarter on, then half, then full.

Fix `dutyFor` so 100 gives 255.
:::

```arduino {role=starter file=brightness.ino}
const int LED = 9;

int dutyFor(int percent) {
    return percent;
}

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    analogWrite(LED, dutyFor(25));
    delay(1000);
    analogWrite(LED, dutyFor(50));
    delay(1000);
    analogWrite(LED, dutyFor(100));
    delay(1000);
}
```

```arduino {role=solution file=brightness.ino}
const int LED = 9;

int dutyFor(int percent) {
    return percent * 255 / 100;
}

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    analogWrite(LED, dutyFor(25));
    delay(1000);
    analogWrite(LED, dutyFor(50));
    delay(1000);
    analogWrite(LED, dutyFor(100));
    delay(1000);
}
```
