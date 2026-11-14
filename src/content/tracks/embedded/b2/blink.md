---
id: embedded.arduino.blink
kind: lesson
track: embedded
unit: b2
order: 1
title: Blink
titleKid: Making a light flash
language: arduino
concepts: [digital-output, delay, period, frequency, duty-cycle, constants]
prereqs: [embedded.arduino.serial-monitor]
links:
  - to: core.c.naming
    kind: builds-on
    note: Named constants for pins and times, instead of bare numbers.
est_minutes: 12
checks:
  - type: pins
    ms: 2150
    expect: "0 ms: pin 13 HIGH\n100 ms: pin 13 LOW\n200 ms: pin 13 HIGH\n300 ms: pin 13 LOW\n1000 ms: pin 13 HIGH\n1100 ms: pin 13 LOW\n1200 ms: pin 13 HIGH\n1300 ms: pin 13 LOW\n2000 ms: pin 13 HIGH\n2100 ms: pin 13 LOW\n"
hints:
  - 'One pass of loop() is one heartbeat: on 100, off 100, on 100, off 700. That adds up to 1000 ms.'
  - 'Each part is a digitalWrite followed by a delay: digitalWrite(LED, HIGH); delay(FLASH_MS); and so on.'
  - 'The last wait is the long one: digitalWrite(LED, LOW); delay(PAUSE_MS);'
hintsKid:
  - 'Flash, short gap, flash, long gap. Then start again.'
  - 'Each step is a `digitalWrite` and then a `delay`.'
  - 'The long gap is 700 ms.'
---
Blinking an LED is the "Hello, world" of microcontrollers. It proves the board, the wiring and the program all work, and it teaches the basic rhythm of every sketch: set something, wait, set something else.

## The classic blink

```arduino
const int LED = 13;
const int ON_MS = 500;
const int OFF_MS = 500;

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    digitalWrite(LED, HIGH);
    delay(ON_MS);
    digitalWrite(LED, LOW);
    delay(OFF_MS);
}
```

`delay(ms)` stops the program for that many milliseconds. Because `loop()` repeats, the four lines become a steady flash. Naming the pin and the times (unit A13) means one change at the top moves the LED to another pin or changes the speed.

## Period, frequency and duty cycle

Engineers describe a repeating signal with three numbers:

| Term | Meaning | For the blink above |
|---|---|---|
| **Period** | the time for one full cycle | 500 + 500 = 1000 ms |
| **Frequency** | cycles per second: 1000 ms / period | 1 Hz |
| **Duty cycle** | the fraction of the period spent on | 500 / 1000 = 50% |

Change `ON_MS` to 100 and `OFF_MS` to 900 and the period stays 1 s, but the duty cycle drops to 10%: a short wink instead of an even flash. The same three numbers describe the PWM signals of unit B4, which switch thousands of times a second.

## Reading the timeline

The simulator lists every change with its board time. For the classic blink:

```
0 ms: pin 13 HIGH
500 ms: pin 13 LOW
1000 ms: pin 13 HIGH
...
```

The gap between two HIGH lines is the period; the gap between a HIGH and the next LOW is the on time. Reading timelines like this is how you check timing on a real board too, with an oscilloscope or logic analyser.

## The catch with delay

While `delay()` waits, the board does nothing else: it cannot notice a button or read a sensor. For a blink that does not matter. Unit B5 shows how to blink without `delay()`, so the board can do several things at once.

::: kid
To flash a light, turn it on and wait. Then turn it off and wait.

`loop()` does it again and again, so the light keeps flashing.

`delay(500)` means wait half a second.

Short waits make a fast flash. Long waits make a slow one.
:::

```arduino {role=example file=two-speeds.ino}
const int LED = 13;

void flash(int times, int onMs, int offMs) {
    for (int i = 0; i < times; i++) {
        digitalWrite(LED, HIGH);
        delay(onMs);
        digitalWrite(LED, LOW);
        delay(offMs);
    }
}

void setup() {
    pinMode(LED, OUTPUT);
    Serial.begin(9600);
}

void loop() {
    Serial.println("Three slow flashes");
    flash(3, 400, 400);
    Serial.println("Three fast flashes");
    flash(3, 100, 100);
}
```

::: try
Make the LED on pin 13 beat like a heart: a 100 ms flash, a 100 ms gap, another 100 ms flash, then a 700 ms pause, so one heartbeat takes exactly one second, again and again.
:::

::: try-kid
Make the light beat like a heart.

Flash, short gap, flash, long gap.

One beat takes one second.
:::

```arduino {role=starter file=heartbeat.ino}
const int LED = 13;
const int FLASH_MS = 100;
const int PAUSE_MS = 700;

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    // Flash, gap, flash, pause.
}
```

```arduino {role=solution file=heartbeat.ino}
const int LED = 13;
const int FLASH_MS = 100;
const int PAUSE_MS = 700;

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    digitalWrite(LED, HIGH);
    delay(FLASH_MS);
    digitalWrite(LED, LOW);
    delay(FLASH_MS);
    digitalWrite(LED, HIGH);
    delay(FLASH_MS);
    digitalWrite(LED, LOW);
    delay(PAUSE_MS);
}
```
