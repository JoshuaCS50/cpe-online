---
id: embedded.projects.prize-wheel
kind: lesson
track: embedded
unit: b9
order: 11
title: "Project: a stepper prize wheel"
titleKid: Spin the wheel, win a prize
language: arduino
circuit:
  - { part: stepper, pins: [8, 9, 10, 11], label: Wheel }
  - { part: button, pin: 2, wiring: pull-up, label: Spin }
concepts: [stepper-motor, arrays, digital-input, edge-detection]
prereqs: [embedded.projects.mini-piano]
est_minutes: 18
checks:
  - type: stdout-equals
    ms: 3000
    inputs: ["2 LOW at 100", "2 HIGH at 200"]
    expect: "Turned 768 steps: segment 4 (135 degrees)\n"
hints:
  - 'The wheel has 8 segments and a full turn is 2048 steps, so one segment is 2048 / 8 steps.'
  - 'STEPS_PER_SEGMENT should be 256, not 200: with 200 the wheel stops between segments.'
  - 'const int STEPS_PER_SEGMENT = STEPS_PER_TURN / SEGMENTS;'
hintsKid:
  - 'One turn is 2048 steps.'
  - 'The wheel has 8 parts.'
  - 'Each part is 2048 divided by 8 steps.'
---
A stepper motor turns in exact steps: switch its coils in the right order and it moves exactly one step, every time. Count the steps and you always know where it is, which is why steppers drive 3D printers, clocks and camera sliders. Here one drives a prize wheel that always stops dead in the middle of a segment.

## What you build

A 28BYJ-48 stepper on a ULN2003 driver board (the driver gives the coils the current a pin cannot): IN1 to IN4 on pins 8 to 11, the driver's + and − to 5 V and GND. A button on pin 2, to GND, with the pull-up turned on.

## Stepping

The motor has four coils. Switching them on two at a time, in this order, turns the shaft one step each time:

| Step | IN1 | IN2 | IN3 | IN4 |
|---|---|---|---|---|
| 0 | 1 | 1 | 0 | 0 |
| 1 | 0 | 1 | 1 | 0 |
| 2 | 0 | 0 | 1 | 1 |
| 3 | 1 | 0 | 0 | 1 |

After step 3 the pattern starts again. Going through it backwards turns the motor the other way. Through its gearbox the 28BYJ-48 needs **2048 steps for one full turn**, and at least 2 ms between steps, or it just hums. The four LEDs on the driver show which coils are on.

## Exactly in the middle

The wheel has 8 segments, so one segment is 2048 ÷ 8 = 256 steps. Each press spins three segments (768 steps), so the wheel always stops on a segment, never on a line between two.

::: kid
This motor turns in tiny, exact steps.

2048 steps make one whole turn.

The wheel has 8 coloured parts.

Each press spins it three parts along.
:::

```arduino {role=example file=one_turn.ino}
// Turn the wheel once, slowly, then stop.
const int PINS[] = {8, 9, 10, 11};
const int STEPS[4][4] = {{1, 1, 0, 0}, {0, 1, 1, 0}, {0, 0, 1, 1}, {1, 0, 0, 1}};

void setup() {
    Serial.begin(9600);
    for (int i = 0; i < 4; i++) pinMode(PINS[i], OUTPUT);
    for (int step = 0; step < 2048; step++) {
        for (int coil = 0; coil < 4; coil++) digitalWrite(PINS[coil], STEPS[step % 4][coil]);
        delay(2);
    }
    Serial.println("One full turn");
}

void loop() {
}
```

::: try
Each press of the button on pin 2 should spin the wheel exactly three segments. The wheel has `SEGMENTS` (8) segments and a full turn is `STEPS_PER_TURN` (2048) steps, but `STEPS_PER_SEGMENT` is set to 200, so the wheel stops between segments. Work it out from the other two constants.
:::

::: try-kid
The wheel stops in the wrong place.

One turn is 2048 steps. The wheel has 8 parts.

Work out the steps for one part.
:::

```arduino {role=starter file=prize_wheel.ino}
const int PINS[] = {8, 9, 10, 11};
const int STEPS[4][4] = {{1, 1, 0, 0}, {0, 1, 1, 0}, {0, 0, 1, 1}, {1, 0, 0, 1}};
const int BUTTON = 2;
const int STEPS_PER_TURN = 2048;
const int SEGMENTS = 8;
const int STEPS_PER_SEGMENT = 200;

long position = 0;
bool wasPressed = false;

void step() {
    position++;
    for (int coil = 0; coil < 4; coil++) digitalWrite(PINS[coil], STEPS[position % 4][coil]);
    delay(2);
}

void setup() {
    Serial.begin(9600);
    pinMode(BUTTON, INPUT_PULLUP);
    for (int i = 0; i < 4; i++) pinMode(PINS[i], OUTPUT);
}

void loop() {
    bool pressed = digitalRead(BUTTON) == LOW;
    if (pressed && !wasPressed) {
        for (int i = 0; i < 3 * STEPS_PER_SEGMENT; i++) step();
        Serial.print("Turned ");
        Serial.print(position);
        Serial.print(" steps: segment ");
        Serial.print(position * SEGMENTS / STEPS_PER_TURN % SEGMENTS + 1);
        Serial.print(" (");
        Serial.print(position * 360 / STEPS_PER_TURN);
        Serial.println(" degrees)");
    }
    wasPressed = pressed;
    delay(10);
}
```

```arduino {role=solution file=prize_wheel.ino}
const int PINS[] = {8, 9, 10, 11};
const int STEPS[4][4] = {{1, 1, 0, 0}, {0, 1, 1, 0}, {0, 0, 1, 1}, {1, 0, 0, 1}};
const int BUTTON = 2;
const int STEPS_PER_TURN = 2048;
const int SEGMENTS = 8;
const int STEPS_PER_SEGMENT = STEPS_PER_TURN / SEGMENTS;

long position = 0;
bool wasPressed = false;

void step() {
    position++;
    for (int coil = 0; coil < 4; coil++) digitalWrite(PINS[coil], STEPS[position % 4][coil]);
    delay(2);
}

void setup() {
    Serial.begin(9600);
    pinMode(BUTTON, INPUT_PULLUP);
    for (int i = 0; i < 4; i++) pinMode(PINS[i], OUTPUT);
}

void loop() {
    bool pressed = digitalRead(BUTTON) == LOW;
    if (pressed && !wasPressed) {
        for (int i = 0; i < 3 * STEPS_PER_SEGMENT; i++) step();
        Serial.print("Turned ");
        Serial.print(position);
        Serial.print(" steps: segment ");
        Serial.print(position * SEGMENTS / STEPS_PER_TURN % SEGMENTS + 1);
        Serial.print(" (");
        Serial.print(position * 360 / STEPS_PER_TURN);
        Serial.println(" degrees)");
    }
    wasPressed = pressed;
    delay(10);
}
```
