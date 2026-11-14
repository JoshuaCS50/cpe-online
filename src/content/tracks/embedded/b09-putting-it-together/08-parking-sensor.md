---
id: embedded.projects.parking-sensor
kind: lesson
track: embedded
unit: b9
order: 8
title: "Project: a parking sensor"
titleKid: Lights that warn you before you bump
language: arduino
circuit:
  - { part: ultrasonic, pins: [9, 10], label: Distance }
  - { part: led, pin: 4, colour: red, label: Stop }
  - { part: led, pin: 3, colour: yellow, label: Slow }
  - { part: led, pin: 2, colour: green, label: Clear }
concepts: [ultrasonic-sensor, threshold, if-else, functions]
prereqs: [embedded.projects.distance-sensor, embedded.arduino.traffic-lights]
est_minutes: 18
checks:
  - type: stdout-equals
    ms: 700
    inputs: ["10 50 at 0", "10 20 at 250", "10 5 at 500"]
    expect: "50 cm: clear\n50 cm: clear\n50 cm: clear\n20 cm: slow\n20 cm: slow\n5 cm: stop\n5 cm: stop\n"
hints:
  - 'Check the closest zone first: if (cm < STOP_CM) red, else if (cm < SLOW_CM) yellow, else green.'
  - 'In the starter the tests are the wrong way round, so a close obstacle is caught by "less than SLOW_CM" before it reaches the stop test.'
  - 'if (cm < STOP_CM) { show(HIGH, LOW, LOW, "stop", cm); } else if (cm < SLOW_CM) { ... } else { ... }'
hintsKid:
  - 'Check for very close first.'
  - 'Then check for close.'
  - 'Put the stop test before the slow test.'
---
Cars beep and light up as you reverse towards a wall. This project builds the light part: green when the way is clear, yellow when the obstacle is close, red when you must stop. It joins the distance sensor from the last project to the traffic-light LEDs from unit B2.

## What you build

The HC-SR04 on pins 9 (Trig) and 10 (Echo), and three LEDs with their resistors: red on 4, yellow on 3, green on 2. The Circuit tab has the full wiring.

## Zones

| Distance | Light | Meaning |
|---|---|---|
| less than 10 cm | red | stop |
| 10 to 29 cm | yellow | slow down |
| 30 cm or more | green | clear |

## Order matters

A chain of `if ... else if ... else` takes the **first** test that is true. A distance of 5 cm is less than 10 **and** less than 30, so the stop test has to come first; otherwise the yellow test catches it and the red light never comes on.

```arduino
if (cm < STOP_CM)      { /* red */ }
else if (cm < SLOW_CM) { /* yellow */ }
else                   { /* green */ }
```

## Make it your own

- Add the buzzer from the melody project: beep faster as the obstacle gets closer.
- Ignore readings of 0 (no echo) so a missing echo does not show "stop".
- Make the thresholds adjustable with a knob.

::: kid
This project warns you before you bump into a wall.

Green means the way is clear.

Yellow means slow down.

Red means stop!
:::

```arduino {role=example file=zones.ino}
// Print the zone for a few distances, without the sensor.
const int STOP_CM = 10;
const int SLOW_CM = 30;

void zone(long cm) {
    Serial.print(cm);
    if (cm < STOP_CM) Serial.println(" cm: stop");
    else if (cm < SLOW_CM) Serial.println(" cm: slow");
    else Serial.println(" cm: clear");
}

void setup() {
    Serial.begin(9600);
    zone(50);
    zone(20);
    zone(5);
}

void loop() {
}
```

::: try
The parking sensor measures the distance and should light green (30 cm or more), yellow (under 30 cm) or red (under 10 cm), printing the zone each time. But at 5 cm it still shows yellow. Fix the order of the tests.
:::

::: try-kid
At 5 cm the light should be red.

It shows yellow. Fix the order of the tests.
:::

```arduino {role=starter file=parking.ino}
const int TRIG = 9;
const int ECHO = 10;
const int RED = 4;
const int YELLOW = 3;
const int GREEN = 2;
const int STOP_CM = 10;
const int SLOW_CM = 30;

void show(int red, int yellow, int green, const char *zone, long cm) {
    digitalWrite(RED, red);
    digitalWrite(YELLOW, yellow);
    digitalWrite(GREEN, green);
    Serial.print(cm);
    Serial.print(" cm: ");
    Serial.println(zone);
}

long measure() {
    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG, LOW);
    return pulseIn(ECHO, HIGH, 30000) / 58;
}

void setup() {
    Serial.begin(9600);
    pinMode(TRIG, OUTPUT);
    pinMode(ECHO, INPUT);
    pinMode(RED, OUTPUT);
    pinMode(YELLOW, OUTPUT);
    pinMode(GREEN, OUTPUT);
}

void loop() {
    long cm = measure();
    if (cm < SLOW_CM) {
        show(LOW, HIGH, LOW, "slow", cm);
    } else if (cm < STOP_CM) {
        show(HIGH, LOW, LOW, "stop", cm);
    } else {
        show(LOW, LOW, HIGH, "clear", cm);
    }
    delay(100);
}
```

```arduino {role=solution file=parking.ino}
const int TRIG = 9;
const int ECHO = 10;
const int RED = 4;
const int YELLOW = 3;
const int GREEN = 2;
const int STOP_CM = 10;
const int SLOW_CM = 30;

void show(int red, int yellow, int green, const char *zone, long cm) {
    digitalWrite(RED, red);
    digitalWrite(YELLOW, yellow);
    digitalWrite(GREEN, green);
    Serial.print(cm);
    Serial.print(" cm: ");
    Serial.println(zone);
}

long measure() {
    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG, LOW);
    return pulseIn(ECHO, HIGH, 30000) / 58;
}

void setup() {
    Serial.begin(9600);
    pinMode(TRIG, OUTPUT);
    pinMode(ECHO, INPUT);
    pinMode(RED, OUTPUT);
    pinMode(YELLOW, OUTPUT);
    pinMode(GREEN, OUTPUT);
}

void loop() {
    long cm = measure();
    if (cm < STOP_CM) {
        show(HIGH, LOW, LOW, "stop", cm);
    } else if (cm < SLOW_CM) {
        show(LOW, HIGH, LOW, "slow", cm);
    } else {
        show(LOW, LOW, HIGH, "clear", cm);
    }
    delay(100);
}
```
