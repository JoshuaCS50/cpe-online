---
id: embedded.esp32.dac-output
kind: lesson
track: embedded
unit: b11
order: 6
title: True analog output with the DAC
titleKid: Making a real in-between voltage
language: arduino
board: esp32
circuit:
  - { part: led, pin: 25, colour: green, label: DAC voltage }
concepts: [dac, analog-output, pwm-vs-dac, resolution, rounding]
prereqs: [embedded.esp32.ledc-pwm, embedded.esp32.adc-12-bit]
est_minutes: 14
checks:
  - type: pins
    ms: 1400
    expect: "0 ms: GPIO 25 DAC 77\n500 ms: GPIO 25 DAC 155\n1000 ms: GPIO 25 DAC 232\n"
hints:
  - 'The DAC has 8 bits: 0 gives 0 V and 255 gives the top of the range. On an ESP32 the top is 3.3 V, not 5 V.'
  - 'So the value for a voltage is volts / 3.3 * 255. Adding 0.5 before storing it in an int rounds to the nearest step.'
  - 'int value = LEVELS[i] / 3.3 * 255 + 0.5;'
hintsKid:
  - 'The top of the range is 3.3 volts.'
  - 'Change 5.0 to 3.3.'
  - 'Try `LEVELS[i] / 3.3 * 255 + 0.5`.'
---
PWM only *pretends* to be an in-between voltage: the pin flicks between 0 V and 3.3 V so fast that an LED or a motor sees the average. Many things cannot be fooled that way: a speaker plays the flicking as a whine, and the analog input of another chip reads 0 or 3.3, not the average. For those, the ESP32 has two pins with a real **DAC** (digital-to-analog converter): **GPIO 25 and GPIO 26**.

## dacWrite

```arduino
dacWrite(25, value);   // value from 0 to 255
```

The DAC has **8 bits**, so 256 steps between 0 V and about 3.3 V, each about 13 mV:

```text
volts = value * 3.3 / 255
value = volts / 3.3 * 255
```

A voltage rarely lands exactly on a step. Storing the result in an `int` cuts off the fraction, so 154.5 becomes 154; adding 0.5 first rounds to the nearest step instead (155).

## PWM or DAC?

| | PWM (ledcWrite) | DAC (dacWrite) |
|---|---|---|
| Pins | almost any output pin | GPIO 25 and 26 only |
| What the pin does | switches fully on and off, fast | holds a steady voltage |
| Steps | you choose, often 8 to 13 bits | 8 bits |
| Good for | LEDs, motors, servos | sound, test voltages, other chips' analog inputs |

The DAC can only give a little current. To drive a speaker or anything heavier, it feeds an amplifier. And not every ESP32 has one: the ESP32-S3 and C3, for example, have no DAC.

## In the simulator

The timeline shows DAC changes as `GPIO 25 DAC 155`, and the 3D view lights an LED on the pin in proportion to the voltage.

::: kid
Most pins can only be fully on or fully off.

Pins 25 and 26 can make a real in-between voltage.

0 means no voltage. 255 means 3.3 volts.

128 is about half way.
:::

```arduino {role=example file=triangle.ino}
// A slow triangle wave on GPIO 25: up from 0 V to 3.3 V, then down again.
const int DAC_PIN = 25;

void setup() {
}

void loop() {
    for (int value = 0; value <= 255; value += 15) {
        dacWrite(DAC_PIN, value);
        delay(20);
    }
    for (int value = 255; value >= 0; value -= 15) {
        dacWrite(DAC_PIN, value);
        delay(20);
    }
}
```

::: try
This sketch should set GPIO 25 to 1.0 V, then 2.0 V, then 3.0 V, for 500 ms each, rounding to the nearest DAC step. It was written with the Uno's 5 V in mind, so every voltage comes out too low. Fix the calculation for the ESP32's 3.3 V DAC.
:::

::: try-kid
This code should make 1, 2 and 3 volts.

It uses 5 volts as the top. The ESP32 top is 3.3 volts.

Fix the sum.
:::

```arduino {role=starter file=dac_levels.ino}
const int DAC_PIN = 25;
const float LEVELS[] = {1.0, 2.0, 3.0};

void setup() {
}

void loop() {
    for (int i = 0; i < 3; i++) {
        int value = LEVELS[i] / 5.0 * 255 + 0.5;
        dacWrite(DAC_PIN, value);
        delay(500);
    }
}
```

```arduino {role=solution file=dac_levels.ino}
const int DAC_PIN = 25;
const float LEVELS[] = {1.0, 2.0, 3.0};

void setup() {
}

void loop() {
    for (int i = 0; i < 3; i++) {
        int value = LEVELS[i] / 3.3 * 255 + 0.5;
        dacWrite(DAC_PIN, value);
        delay(500);
    }
}
```
