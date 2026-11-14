---
id: embedded.arduino.traffic-lights
kind: lesson
track: embedded
unit: b2
order: 4
title: A traffic-light sequence
titleKid: Red, yellow, green
language: arduino
concepts: [sequence, functions, timing, outputs]
prereqs: [embedded.arduino.blink, core.c.functions]
est_minutes: 14
checks:
  - type: pins
    ms: 8500
    expect: "0 ms: pin 10 HIGH\n0 ms: pin 11 LOW\n0 ms: pin 12 LOW\n4000 ms: pin 10 LOW\n4000 ms: pin 11 HIGH\n5000 ms: pin 11 LOW\n5000 ms: pin 12 HIGH\n8000 ms: pin 10 HIGH\n8000 ms: pin 12 LOW\n"
hints:
  - 'Each phase is one call to setLights and one delay: setLights(LOW, HIGH, LOW); delay(YELLOW_MS); is the yellow phase.'
  - 'The order is green, then yellow, then red, and loop() starts again with green.'
  - 'The red phase is setLights(HIGH, LOW, LOW); delay(RED_MS);'
hintsKid:
  - 'Green is done. Add yellow, then red.'
  - 'Each one is `setLights` and then a `delay`.'
  - 'Red is `setLights(HIGH, LOW, LOW);`'
---
A traffic light is a classic first machine to control: three outputs, switched in a fixed order with fixed times, forever. The same pattern runs washing machine programs, conveyor sequences and bottling lines: a **sequence** of steps, each with its own outputs and duration.

## Wiring

Three LEDs, each with a 220-ohm resistor, on three pins:

| Light | Pin |
|---|---|
| Red | 12 |
| Yellow | 11 |
| Green | 10 |

## One function per idea

Writing three `digitalWrite` lines for every phase repeats a lot of code and makes it easy to leave a light on by mistake. A small function that sets all three lights at once keeps each phase to one line, and guarantees every light is set every time:

```arduino
void setLights(int red, int yellow, int green) {
    digitalWrite(RED, red);
    digitalWrite(YELLOW, yellow);
    digitalWrite(GREEN, green);
}
```

Then the whole cycle reads like the table a traffic engineer would write:

| Phase | Red | Yellow | Green | Time |
|---|---|---|---|---|
| Go | off | off | on | 4 s |
| Get ready to stop | off | on | off | 1 s |
| Stop | on | off | off | 3 s |

## Reading the timeline

At a moment when several lights change together, the timeline lists them by pin number, whatever order the code switched them in. Changes that happen in the same millisecond are, for a person watching, simultaneous.

## Sequences get harder

This version uses `delay()`, so during a red phase the board cannot notice a pedestrian pressing the crossing button. Real controllers react while they wait. Unit B5 rebuilds this sequence as a **state machine** driven by `millis()`, which can handle buttons, sensors and timing all at once.

::: kid
A traffic light has three lights: red, yellow and green.

Green means go. Yellow means get ready to stop. Red means stop.

The board turns them on in order, again and again.

Each colour stays on for its own time.
:::

```arduino {role=example file=crossing.ino}
const int RED = 12;
const int GREEN = 10;

void setup() {
    pinMode(RED, OUTPUT);
    pinMode(GREEN, OUTPUT);
    Serial.begin(9600);
}

void loop() {
    Serial.println("Walk");
    digitalWrite(RED, LOW);
    digitalWrite(GREEN, HIGH);
    delay(3000);

    Serial.println("Hurry");
    for (int i = 0; i < 4; i++) {
        digitalWrite(GREEN, LOW);
        delay(250);
        digitalWrite(GREEN, HIGH);
        delay(250);
    }

    Serial.println("Wait");
    digitalWrite(GREEN, LOW);
    digitalWrite(RED, HIGH);
    delay(3000);
}
```

::: try
Finish the traffic light. The green phase is written: green on for 4 seconds. Add the yellow phase (yellow alone for 1 second) and the red phase (red alone for 3 seconds), then the cycle starts again with green.
:::

::: try-kid
Green is already done.

Add yellow for 1 second.

Then add red for 3 seconds.
:::

```arduino {role=starter file=traffic.ino}
const int RED = 12;
const int YELLOW = 11;
const int GREEN = 10;

const int GREEN_MS = 4000;
const int YELLOW_MS = 1000;
const int RED_MS = 3000;

void setLights(int red, int yellow, int green) {
    digitalWrite(RED, red);
    digitalWrite(YELLOW, yellow);
    digitalWrite(GREEN, green);
}

void setup() {
    pinMode(RED, OUTPUT);
    pinMode(YELLOW, OUTPUT);
    pinMode(GREEN, OUTPUT);
}

void loop() {
    setLights(LOW, LOW, HIGH);
    delay(GREEN_MS);

    // Add the yellow phase and the red phase.
}
```

```arduino {role=solution file=traffic.ino}
const int RED = 12;
const int YELLOW = 11;
const int GREEN = 10;

const int GREEN_MS = 4000;
const int YELLOW_MS = 1000;
const int RED_MS = 3000;

void setLights(int red, int yellow, int green) {
    digitalWrite(RED, red);
    digitalWrite(YELLOW, yellow);
    digitalWrite(GREEN, green);
}

void setup() {
    pinMode(RED, OUTPUT);
    pinMode(YELLOW, OUTPUT);
    pinMode(GREEN, OUTPUT);
}

void loop() {
    setLights(LOW, LOW, HIGH);
    delay(GREEN_MS);

    setLights(LOW, HIGH, LOW);
    delay(YELLOW_MS);

    setLights(HIGH, LOW, LOW);
    delay(RED_MS);
}
```
