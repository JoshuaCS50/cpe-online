---
id: embedded.esp32.touch-pins
kind: lesson
track: embedded
unit: b11
order: 5
title: Touch pins
titleKid: Buttons with no button
language: arduino
board: esp32
circuit:
  - { part: touch-pad, pin: 4 }
  - { part: led, pin: 23, colour: red }
concepts: [capacitive-touch, threshold, touch-read, noise]
prereqs: [embedded.esp32.esp32-pinout, embedded.arduino.hysteresis]
est_minutes: 14
checks:
  - type: pins
    ms: 1000
    inputs: ["GPIO 4 15 at 300", "GPIO 4 72 at 700"]
    expect: "0 ms: GPIO 23 LOW\n300 ms: GPIO 23 HIGH\n700 ms: GPIO 23 LOW\n"
  - type: pins
    ms: 500
    expect: "0 ms: GPIO 23 LOW\n"
  - type: pins
    ms: 300
    inputs: ["GPIO 4 45 at 0"]
    expect: "0 ms: GPIO 23 LOW\n"
hints:
  - 'Run the starter: the LED is on when nobody touches the pad. Which way does the reading move when a finger touches it?'
  - 'On an ESP32 the reading drops when touched, from about 70 to about 15. So "touched" means below the threshold.'
  - 'if (touchRead(TOUCH_PIN) < THRESHOLD) { digitalWrite(LED_PIN, HIGH); } else { digitalWrite(LED_PIN, LOW); }'
hintsKid:
  - 'The light is on at the wrong time.'
  - 'A touch makes the number smaller.'
  - 'Use `<` instead of `>`.'
---
An ESP32 can feel a finger without any button at all. Ten of its pins are **touch sensors**: connect a bare metal pad, a coin or a piece of foil to one, and `touchRead(pin)` tells you whether someone is touching it.

## How touch works

The pin charges and discharges the pad over and over, and counts how long it takes. Your body holds electric charge (it has **capacitance**), so a finger on the pad makes each charge take longer. On the original ESP32, `touchRead` gives a smaller number when touched:

| Pad | Typical touchRead |
|---|---|
| Nobody near | about 70 |
| A hand close by | 40 to 60 |
| A finger on it | 10 to 20 |

The exact numbers depend on the pad's size, the wire length and even the weather, so print a few readings from your own setup before choosing a **threshold**. A value halfway between "untouched" and "touched", such as 30, works for most pads. (Newer chips, the ESP32-S2 and S3, count the other way: their readings *rise* when touched.)

## Which pins

| Touch | T0 | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 |
|---|---|---|---|---|---|---|---|---|---|---|
| GPIO | 4 | 0 | 2 | 15 | 13 | 12 | 14 | 27 | 33 | 32 |

GPIO 4, 13, 14, 27, 32 and 33 are the easy ones; the others are strapping pins or have the LED on them.

## Noise and hands nearby

A hand hovering close lowers the reading too, just not as far. A threshold that is too high (say 60) turns the LED on before anyone touches. For a switch that must not flicker at the edge, use two thresholds, exactly like the fan in the hysteresis lesson: touched below 25, released above 40.

## In the simulator

Touch readings are inputs like any other: `GPIO 4 15 at 300` means a finger on the pad from 300 ms on. With no input, the pad reads 70. The 3D view shows the pad and a finger that presses it.

::: kid
Some ESP32 pins can feel your finger.

Touch a metal pad, and the number gets smaller.

About 70 means nobody is touching.

About 15 means a finger is on the pad.
:::

```arduino {role=example file=touch_values.ino}
// Print what the touch pad on GPIO 4 reads, five times a second.
const int TOUCH_PIN = 4;

void setup() {
    Serial.begin(115200);
}

void loop() {
    Serial.print("Touch reading: ");
    Serial.println(touchRead(TOUCH_PIN));
    delay(200);
}
```

::: try
A touch pad is wired to GPIO 4 and an LED to GPIO 23. The LED should be on only while a finger touches the pad, using the threshold `THRESHOLD`. The comparison is the wrong way round: the LED is on when nobody touches. Fix it.
:::

::: try-kid
The light should be on only while you touch the pad.

Right now it does the opposite.

Fix the test so a touch turns the light on.
:::

```arduino {role=starter file=touch_light.ino}
const int TOUCH_PIN = 4;
const int LED_PIN = 23;
const int THRESHOLD = 30;

void setup() {
    pinMode(LED_PIN, OUTPUT);
}

void loop() {
    if (touchRead(TOUCH_PIN) > THRESHOLD) {
        digitalWrite(LED_PIN, HIGH);
    } else {
        digitalWrite(LED_PIN, LOW);
    }
    delay(20);
}
```

```arduino {role=solution file=touch_light.ino}
const int TOUCH_PIN = 4;
const int LED_PIN = 23;
const int THRESHOLD = 30;

void setup() {
    pinMode(LED_PIN, OUTPUT);
}

void loop() {
    if (touchRead(TOUCH_PIN) < THRESHOLD) {
        digitalWrite(LED_PIN, HIGH);
    } else {
        digitalWrite(LED_PIN, LOW);
    }
    delay(20);
}
```
