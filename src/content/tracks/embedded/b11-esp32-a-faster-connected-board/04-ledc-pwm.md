---
id: embedded.esp32.ledc-pwm
kind: lesson
track: embedded
unit: b11
order: 4
title: PWM with LEDC
titleKid: Dimming with finer steps
language: arduino
board: esp32
circuit:
  - { part: led, pin: 18, colour: red }
concepts: [pwm, ledc, duty-cycle, resolution, frequency, arrays]
prereqs: [embedded.esp32.esp32-pinout, embedded.arduino.blink]
est_minutes: 16
checks:
  - type: pins
    ms: 2400
    expect: "0 ms: GPIO 18 PWM 256 of 1023\n500 ms: GPIO 18 PWM 512 of 1023\n1000 ms: GPIO 18 PWM 767 of 1023\n1500 ms: GPIO 18 PWM 1023 of 1023\n2000 ms: GPIO 18 PWM 0 of 1023\n"
  - type: code-contains
    pattern: 'ledcAttach\s*\('
    message: 'Sets the pin up with ledcAttach'
hints:
  - 'In setup(), give the pin a frequency and a resolution: ledcAttach(LED, FREQ, BITS);'
  - 'With 10 bits the duty goes from 0 to 1023, so a quarter is 256, a half 512, three quarters 767 and full 1023.'
  - 'In loop(), use ledcWrite(LED, LEVELS[i]); instead of analogWrite.'
hintsKid:
  - 'Start with `ledcAttach(LED, FREQ, BITS);`'
  - 'With 10 bits, full is 1023.'
  - 'Use `ledcWrite` instead of `analogWrite`.'
---
On the Uno, `analogWrite(pin, 0..255)` dims an LED on six fixed pins with a fixed frequency. The ESP32 has a much more flexible PWM unit called **LEDC** (LED control, though it drives anything that takes PWM): 16 channels, almost any output pin, and a frequency and resolution you choose.

## Setting a pin up

With the Arduino-ESP32 core (version 3 and later) a pin needs one line in `setup()`:

```arduino
ledcAttach(pin, frequency, resolutionBits);
```

and then, whenever the brightness changes:

```arduino
ledcWrite(pin, duty);
```

- **Frequency** is how many PWM cycles happen each second. 5000 Hz is a good choice for LEDs: far too fast to see flicker.
- **Resolution** is how many steps the duty has: with 8 bits the duty goes from 0 to 255 (like the Uno); with 10 bits from 0 to 1023; with 12 bits from 0 to 4095. The largest duty is always 2 to the power of the bits, minus one, and means fully on.

Older sketches use `ledcSetup(channel, frequency, bits)` and `ledcAttachPin(pin, channel)`, the version 2 way of saying the same thing. `analogWrite` also works on an ESP32, with 8 bits.

## Frequency and resolution trade off

The PWM unit counts with an 80 MHz clock, and each cycle needs one count per step. So frequency × 2^bits cannot go past 80 000 000:

| Resolution | Steps | Fastest frequency |
|---|---|---|
| 8 bits | 256 | about 312 kHz |
| 10 bits | 1024 | about 78 kHz |
| 13 bits | 8192 | about 9.7 kHz |

Fine steps matter for smooth fades at low brightness, where the eye is most sensitive; high frequencies matter for motors and sound. The simulator notes a combination that is too fast.

## Reading the timeline

With 8 bits the timeline shows `PWM 128`, as on the Uno. With any other resolution it adds the top of the range, such as `GPIO 18 PWM 512 of 1023`, so you can see the fraction at a glance: 512 of 1023 is half brightness.

::: kid
The ESP32 can dim lights on almost any pin.

First you tell the pin how to dim. That is `ledcAttach`.

Then `ledcWrite` sets how bright it is.

With 10 bits, full brightness is 1023.
:::

```arduino {role=example file=breathe.ino}
// A slow "breathing" LED on GPIO 18, with 8-bit steps.
const int LED = 18;

void setup() {
    ledcAttach(LED, 5000, 8);
}

void loop() {
    for (int duty = 0; duty <= 255; duty += 5) {
        ledcWrite(LED, duty);
        delay(20);
    }
    for (int duty = 255; duty >= 0; duty -= 5) {
        ledcWrite(LED, duty);
        delay(20);
    }
}
```

::: try
This sketch steps an LED on GPIO 18 through a quarter, a half, three quarters and full brightness, then off, every 500 ms. It still uses the Uno's 8-bit `analogWrite`. Change it to use LEDC with a 5000 Hz frequency and **10-bit** resolution, with the levels 256, 512, 767, 1023 and 0.
:::

::: try-kid
This code dims a light in four steps, then turns it off.

Change it to use `ledcAttach` and `ledcWrite`.

Use 10 bits, so full is 1023.
:::

```arduino {role=starter file=levels.ino}
const int LED = 18;
const int LEVELS[] = {64, 128, 191, 255, 0};

void setup() {
    pinMode(LED, OUTPUT);
}

void loop() {
    for (int i = 0; i < 5; i++) {
        analogWrite(LED, LEVELS[i]);
        delay(500);
    }
}
```

```arduino {role=solution file=levels.ino}
const int LED = 18;
const int FREQ = 5000;
const int BITS = 10;
const int LEVELS[] = {256, 512, 767, 1023, 0};

void setup() {
    ledcAttach(LED, FREQ, BITS);
}

void loop() {
    for (int i = 0; i < 5; i++) {
        ledcWrite(LED, LEVELS[i]);
        delay(500);
    }
}
```
