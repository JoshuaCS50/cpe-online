---
id: embedded.projects.colour-mixer
kind: lesson
track: embedded
unit: b9
order: 3
title: "Project: a colour mixer"
titleKid: Mixing light like paint
language: arduino
circuit:
  - { part: rgb-led, pins: [9, 10, 11], label: Mood light }
concepts: [pwm, colour-mixing, functions, duty-cycle]
prereqs: [embedded.projects.knob-dimmer]
est_minutes: 16
checks:
  - type: pins
    ms: 3500
    expect: "0 ms: pin 9 PWM 255\n0 ms: pin 10 PWM 0\n0 ms: pin 11 PWM 0\n1000 ms: pin 9 PWM 0\n1000 ms: pin 10 PWM 255\n2000 ms: pin 10 PWM 0\n2000 ms: pin 11 PWM 255\n3000 ms: pin 9 PWM 128\n3000 ms: pin 11 PWM 128\n"
hints:
  - 'setColour receives three values, one per colour, but writes the red value to every pin.'
  - 'Each pin gets its own value: the red pin gets red, the green pin gets green, the blue pin gets blue.'
  - 'analogWrite(RED, red); analogWrite(GREEN, green); analogWrite(BLUE, blue);'
hintsKid:
  - 'Every colour gets the red number. That is the bug.'
  - 'Green should get the green number.'
  - 'Blue should get the blue number.'
---
An RGB LED is three LEDs (red, green and blue) under one milky lens. Dim each one with PWM and your eye blends them into one colour, the same way a screen makes millions of colours from red, green and blue dots.

## What you build

A common-cathode RGB LED: its longest leg to GND, and each colour leg through its own 220 Ω resistor to a PWM pin: red on 9, green on 10, blue on 11.

## Mixing light

Light adds up, unlike paint:

| Red | Green | Blue | You see |
|---|---|---|---|
| 255 | 0 | 0 | red |
| 0 | 255 | 0 | green |
| 255 | 255 | 0 | yellow |
| 128 | 0 | 128 | purple |
| 0 | 255 | 255 | cyan |
| 255 | 255 | 255 | white |

## One function for a colour

Three `analogWrite` lines for every colour are easy to get wrong, so the project wraps them in a function that takes a colour as three numbers:

```arduino
void setColour(int red, int green, int blue) {
    analogWrite(RED, red);
    analogWrite(GREEN, green);
    analogWrite(BLUE, blue);
}
```

Then each step of a light show is one line: `setColour(128, 0, 128);`.

## Make it your own

- Add three knobs and set each colour by hand.
- Fade smoothly between colours with a loop that steps each value.
- A common-anode LED works the other way round: common leg to 5 V, and 0 means full brightness, so use `255 - value`.

::: kid
This light can show many colours.

It has red, green and blue lights inside.

Mixing them makes new colours.

Red and blue together make purple.
:::

```arduino {role=example file=rainbow.ino}
// Step through a few colours, half a second each.
const int RED = 9;
const int GREEN = 10;
const int BLUE = 11;

void show(int r, int g, int b) {
    analogWrite(RED, r);
    analogWrite(GREEN, g);
    analogWrite(BLUE, b);
    delay(500);
}

void loop() {
    show(255, 0, 0);
    show(255, 128, 0);
    show(255, 255, 0);
    show(0, 255, 0);
    show(0, 0, 255);
    show(128, 0, 255);
}

void setup() {
}
```

::: try
The sketch shows red, green, blue and purple for a second each, using `setColour`. But `setColour` writes the red value to all three pins, so every colour comes out wrong. Fix it so each pin gets its own colour's value.
:::

::: try-kid
The colours come out wrong.

Fix `setColour` so each colour gets its own number.
:::

```arduino {role=starter file=mixer.ino}
const int RED = 9;
const int GREEN = 10;
const int BLUE = 11;

void setColour(int red, int green, int blue) {
    analogWrite(RED, red);
    analogWrite(GREEN, red);
    analogWrite(BLUE, red);
}

void setup() {
    pinMode(RED, OUTPUT);
    pinMode(GREEN, OUTPUT);
    pinMode(BLUE, OUTPUT);
}

void loop() {
    setColour(255, 0, 0);
    delay(1000);
    setColour(0, 255, 0);
    delay(1000);
    setColour(0, 0, 255);
    delay(1000);
    setColour(128, 0, 128);
    delay(1000);
}
```

```arduino {role=solution file=mixer.ino}
const int RED = 9;
const int GREEN = 10;
const int BLUE = 11;

void setColour(int red, int green, int blue) {
    analogWrite(RED, red);
    analogWrite(GREEN, green);
    analogWrite(BLUE, blue);
}

void setup() {
    pinMode(RED, OUTPUT);
    pinMode(GREEN, OUTPUT);
    pinMode(BLUE, OUTPUT);
}

void loop() {
    setColour(255, 0, 0);
    delay(1000);
    setColour(0, 255, 0);
    delay(1000);
    setColour(0, 0, 255);
    delay(1000);
    setColour(128, 0, 128);
    delay(1000);
}
```
