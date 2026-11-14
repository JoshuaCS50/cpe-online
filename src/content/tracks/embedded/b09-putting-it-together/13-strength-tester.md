---
id: embedded.projects.strength-tester
kind: lesson
track: embedded
unit: b9
order: 13
title: "Project: a strength tester"
titleKid: Press hard and ring the bell
language: arduino
circuit:
  - { part: fsr, pin: A0, label: Press here }
  - { part: servo, pin: 9, label: Needle }
  - { part: buzzer, pin: 8, label: Bell }
concepts: [force-sensor, map, servo, tone]
prereqs: [embedded.arduino.map-constrain, embedded.projects.melody]
est_minutes: 16
checks:
  - type: pins
    ms: 950
    inputs: ["A0 0 at 0", "A0 512 at 300", "A0 950 at 600"]
    expect: "0 ms: servo on pin 9 at 180 degrees\n300 ms: servo on pin 9 at 90 degrees\n600 ms: tone on pin 8 at 880 Hz\n600 ms: servo on pin 9 at 13 degrees\n900 ms: tone on pin 8 off\n"
hints:
  - 'The needle should start at 180° when nobody presses and swing towards 0° as the press gets harder.'
  - 'map can run a range backwards: the output range can go from 180 down to 0.'
  - 'int angle = map(force, 0, 1023, 180, 0);'
hintsKid:
  - 'The needle starts at the wrong end.'
  - 'Make it start at 180 and go down.'
  - 'Try `map(force, 0, 1023, 180, 0)`.'
---
Fairground strength testers have a needle that swings further the harder you hit, and a bell for the strongest. This one uses a force-sensing resistor (FSR): a thin pad whose resistance falls as you press it.

## What you build

- An FSR in a voltage divider: one lead to 5 V, the other to A0 with a 10 kΩ resistor from A0 to GND. The harder the press, the higher the reading.
- A servo on pin 9 as the needle (brown GND, red 5 V, orange signal).
- A buzzer on pin 8 as the bell.

## Running a range backwards

The needle's scale reads from right to left: 180° at rest, 0° at full strength. `map` does that by giving the output range backwards:

```arduino
int angle = map(force, 0, 1023, 180, 0);   // 0 -> 180°, 512 -> 90°, 1023 -> 0°
```

## The bell

When the reading passes `BELL_AT` (900), the sketch rings: `tone(BUZZER, 880)`, waits 300 ms, then `noTone`. Because the ring takes 300 ms, the needle stops moving while the bell sounds, just like the real machine.

## What an FSR can and cannot do

An FSR tells "how hard" well, but not "how many grams": pads differ, and readings drift as the pad warms and ages. For weighing things, a load cell is the right sensor.

::: kid
Press the pad as hard as you can.

The harder you press, the further the needle swings.

Press really hard, and the bell rings!
:::

```arduino {role=example file=force_meter.ino}
// Print how hard the pad is pressed.
void setup() {
    Serial.begin(9600);
}

void loop() {
    int force = analogRead(A0);
    Serial.print("Force: ");
    Serial.println(force);
    delay(300);
}
```

::: try
The needle (servo on pin 9) should rest at 180° and swing towards 0° the harder the force sensor on A0 is pressed, and the bell (pin 8) should ring above `BELL_AT`. But the needle moves the wrong way: it rests at 0°. Make it run from 180° down to 0°.
:::

::: try-kid
The needle starts at the wrong end.

Make it rest at 180 and swing down when you press.
:::

```arduino {role=starter file=strength.ino}
#include <Servo.h>

const int SENSOR = A0;
const int BUZZER = 8;
const int BELL_AT = 900;

Servo needle;

void setup() {
    needle.attach(9);
}

void loop() {
    int force = analogRead(SENSOR);
    needle.write(map(force, 0, 1023, 0, 180));
    if (force > BELL_AT) {
        tone(BUZZER, 880);
        delay(300);
        noTone(BUZZER);
    }
    delay(100);
}
```

```arduino {role=solution file=strength.ino}
#include <Servo.h>

const int SENSOR = A0;
const int BUZZER = 8;
const int BELL_AT = 900;

Servo needle;

void setup() {
    needle.attach(9);
}

void loop() {
    int force = analogRead(SENSOR);
    needle.write(map(force, 0, 1023, 180, 0));
    if (force > BELL_AT) {
        tone(BUZZER, 880);
        delay(300);
        noTone(BUZZER);
    }
    delay(100);
}
```
