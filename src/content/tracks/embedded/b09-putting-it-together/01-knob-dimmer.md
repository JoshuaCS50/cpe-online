---
id: embedded.projects.knob-dimmer
kind: lesson
track: embedded
unit: b9
order: 1
title: "Project: a knob dimmer"
titleKid: Turn a knob, change the light
language: arduino
circuit:
  - { part: knob, pin: A0, label: Brightness }
  - { part: led, pin: 9, colour: yellow, label: Lamp }
concepts: [analog-input, pwm, map, scaling, duty-cycle]
prereqs: [embedded.arduino.analog-read, embedded.arduino.map-constrain]
est_minutes: 15
checks:
  - type: pins
    ms: 900
    inputs: ["A0 0 at 0", "A0 512 at 300", "A0 1023 at 600"]
    expect: "0 ms: pin 9 PWM 0\n300 ms: pin 9 PWM 127\n600 ms: pin 9 PWM 255\n"
hints:
  - 'analogRead gives 0 to 1023, but analogWrite takes 0 to 255. The reading has to be scaled down first.'
  - 'map() scales from one range to the other: map(raw, 0, 1023, 0, 255).'
  - 'int brightness = map(raw, 0, 1023, 0, 255); analogWrite(LED, brightness);'
hintsKid:
  - 'The knob number is too big for the light.'
  - 'Use `map` to make it smaller.'
  - 'Try `map(raw, 0, 1023, 0, 255)`.'
---
Your first complete project joins an input to an output: turning a knob sets how bright a lamp is, like the dimmer switch on a wall. It uses three ideas you already know: **analogRead** to measure the knob, **map** to change the range, and **PWM** to dim the LED.

## What you build

A 10 kΩ potentiometer on A0 and a yellow LED (with its resistor) on pin 9, a PWM pin marked `~`. The Circuit tab shows every wire; on a real board, build it exactly like that.

## How it works

1. The knob is a voltage divider: its middle leg gives anything from 0 V to 5 V as you turn it.
2. `analogRead(A0)` turns that voltage into a number from 0 to 1023.
3. `analogWrite` wants 0 to 255, so `map(raw, 0, 1023, 0, 255)` scales the number down: a quarter turn gives about 64, half gives 127, all the way gives 255.
4. `analogWrite(9, brightness)` sets the PWM duty cycle, and the LED looks dimmer or brighter.

Reading every 50 ms is fast enough that the lamp follows your hand smoothly.

## Make it your own

- Reverse the knob: `map(raw, 0, 1023, 255, 0)`.
- Never fully off: `map(raw, 0, 1023, 20, 255)` keeps a faint glow.
- Swap the LED for a small fan driven through a transistor (unit B4): the same code sets its speed.

## Try it live

Choose **Live** in the inputs menu on the Try tab and press Run: drag the knob in the 3D view, or use the slider under it, and watch the LED follow.

::: kid
This project has a knob and a light.

Turn the knob, and the light gets brighter or dimmer.

The board reads the knob as a number up to 1023.

The light only takes numbers up to 255.

So the board makes the number smaller first.
:::

```arduino {role=example file=knob_report.ino}
// Print the knob reading and the brightness it would give.
void setup() {
    Serial.begin(9600);
}

void loop() {
    int raw = analogRead(A0);
    Serial.print("Knob ");
    Serial.print(raw);
    Serial.print(" -> brightness ");
    Serial.println(map(raw, 0, 1023, 0, 255));
    delay(500);
}
```

::: try
The knob is on A0 and the LED on pin 9. This sketch writes the reading straight to the LED, so it is fully on long before the knob is turned all the way. Scale the reading so the whole turn of the knob covers the whole brightness range, 0 to 255.
:::

::: try-kid
The light is too bright too soon.

Make the knob number smaller with `map`.

Then the whole turn of the knob dims the light.
:::

```arduino {role=starter file=dimmer.ino}
const int KNOB = A0;
const int LED = 9;

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    int raw = analogRead(KNOB);
    analogWrite(LED, raw);
    delay(50);
}
```

```arduino {role=solution file=dimmer.ino}
const int KNOB = A0;
const int LED = 9;

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    int raw = analogRead(KNOB);
    int brightness = map(raw, 0, 1023, 0, 255);
    analogWrite(LED, brightness);
    delay(50);
}
```
