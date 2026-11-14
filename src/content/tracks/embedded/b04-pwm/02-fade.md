---
id: embedded.arduino.fade
kind: lesson
track: embedded
unit: b4
order: 2
title: Fading an LED up and down
titleKid: A light that breathes
language: arduino
circuit:
  - { part: led, pin: 9, colour: blue, label: Breathing light }
concepts: [pwm, fading, persistence-of-vision, loop]
prereqs: [embedded.arduino.analog-write]
est_minutes: 12
checks:
  - type: pins
    ms: 1150
    expect: "0 ms: pin 9 PWM 0\n100 ms: pin 9 PWM 51\n200 ms: pin 9 PWM 102\n300 ms: pin 9 PWM 153\n400 ms: pin 9 PWM 204\n500 ms: pin 9 PWM 255\n600 ms: pin 9 PWM 204\n700 ms: pin 9 PWM 153\n800 ms: pin 9 PWM 102\n900 ms: pin 9 PWM 51\n1000 ms: pin 9 PWM 0\n1100 ms: pin 9 PWM 51\n"
hints:
  - 'The direction turns round at the top (255) but never at the bottom (0), so brightness keeps falling below 0.'
  - 'Turn round at either end: when brightness reaches 0 or less, or 255 or more.'
  - 'if (brightness <= 0 || brightness >= 255) step = -step;'
hintsKid:
  - 'The light goes up and down once, then stays dark.'
  - 'It needs to turn round at the bottom too.'
  - 'Check for 0 as well as 255.'
---
Phones, laptops and smart speakers often show they are asleep with a light that slowly brightens and dims, like breathing. It is PWM with a duty cycle that changes a little at a time.

## The pattern

Keep the brightness in a variable and a **step** to add each time. When the brightness reaches either end, turn the step round:

```arduino
analogWrite(LED, brightness);
brightness += step;
if (brightness <= 0 || brightness >= 255) step = -step;
delay(100);
```

With a step of 51, the light goes 0, 51, 102, 153, 204, 255, then back down. Smaller steps and shorter delays make a smoother fade: a step of 5 every 30 ms takes about 1.5 s each way.

## Why the eye sees smooth light

An eye merges flicker faster than about 50 to 90 times a second into steady light (**persistence of vision**). At 490 Hz the PWM is far above that. The steps of the fade are slow, so you see them as a change in brightness.

Eyes judge brightness on a curve: the step from 0 to 51 looks much bigger than the step from 204 to 255. Lighting products correct for this with a table of values (gamma correction), so a fade looks even.

::: kid
This light gets brighter, then dimmer, again and again.

It looks like it is breathing.

At the top, it turns round and gets dimmer.

At the bottom, it must turn round too!
:::

```arduino {role=example file=smooth_fade.ino}
// A smooth fade: small steps, short waits.
const int LED = 9;
int brightness = 0;
int step = 5;

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    analogWrite(LED, brightness);
    brightness += step;
    if (brightness <= 0 || brightness >= 255) step = -step;
    delay(30);
}
```

::: try
The LED on pin 9 should fade up and down for ever, in steps of 51 every 100 ms. It fades up and down once, then stays off, because the direction only turns round at the top. Make it turn round at the bottom as well.
:::

::: try-kid
The light should go up and down for ever.

It stops at the bottom. Make it turn round there too.
:::

```arduino {role=starter file=breathe.ino}
const int LED = 9;
int brightness = 0;
int step = 51;

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    analogWrite(LED, brightness);
    brightness += step;
    if (brightness >= 255) step = -step;
    delay(100);
}
```

```arduino {role=solution file=breathe.ino}
const int LED = 9;
int brightness = 0;
int step = 51;

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    analogWrite(LED, brightness);
    brightness += step;
    if (brightness <= 0 || brightness >= 255) step = -step;
    delay(100);
}
```
