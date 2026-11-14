---
id: embedded.esp32.esp32-pinout
kind: lesson
track: embedded
unit: b11
order: 2
title: The ESP32 pinout
titleKid: Which pins to use
language: arduino
board: esp32
circuit:
  - { part: led, pin: 23, colour: red }
  - { part: button, pin: 4, wiring: pull-up }
concepts: [pinout, input-only-pins, strapping-pins, flash-pins, pull-up, adc1-adc2]
prereqs: [embedded.esp32.meet-the-esp32, embedded.arduino.pullups-debounce]
est_minutes: 16
checks:
  - type: pins
    ms: 1000
    inputs: ["GPIO 4 LOW at 300", "GPIO 4 HIGH at 700"]
    expect: "0 ms: GPIO 23 LOW\n300 ms: GPIO 23 HIGH\n700 ms: GPIO 23 LOW\n"
  - type: pins
    ms: 500
    expect: "0 ms: GPIO 23 LOW\n"
hints:
  - 'Run the starter and read the notes under the output: GPIO 34 to 39 can only read, and they have no pull-up resistor.'
  - 'Move the LED to a pin that can drive an output, such as GPIO 23: const int LED_PIN = 23;'
  - 'Move the button to a pin with a built-in pull-up, such as GPIO 4: const int BUTTON_PIN = 4;'
hintsKid:
  - 'Read the notes after you press Run.'
  - 'Put the light on pin 23.'
  - 'Put the button on pin 4.'
---
An ESP32 DevKit has 38 pins, but they are not all alike. Some can only read, some are already used inside the board, and some decide how the chip starts. Picking the wrong one is the most common ESP32 wiring mistake, and on a real board it fails silently or stops the board from starting.

## The pin groups

| Group | GPIO | What to know |
|---|---|---|
| Good general pins | 4, 13, 16 to 19, 21 to 23, 25 to 27, 32, 33 | Inputs and outputs, with pull-ups. Start here. |
| **Input only** | **34, 35, 36 (VP), 39 (VN)** | Can read, can never drive an output, and have **no internal pull-up**. Good for analog sensors. |
| Flash | 6 to 11 | Wired to the memory chip that holds the program. Never use them. |
| Strapping | 0, 2, 5, 12, 15 | Read once at power-on to choose how the chip starts. Usable, with care: GPIO 12 held HIGH at start-up can stop the board booting, and GPIO 0 held LOW starts the upload mode (that is what the BOOT button does). |
| USB serial | 1 (TX), 3 (RX) | Carry Serial to the computer. Leave them alone. |

Two more details for later lessons: only some pins can read voltages, and of those, the **ADC1** pins (32 to 39) keep working while Wi-Fi is on, while the **ADC2** pins (0, 2, 4, 12 to 15, 25 to 27) do not. And GPIO 25 and 26 are the only pins with a true analog output.

## Current and voltage

A HIGH pin gives 3.3 V. Keep the current of each pin small, about 12 mA or less: an LED needs its resistor (220 to 330 Ω is a good start), and motors, relays and buzzers louder than a beep need a transistor or a driver board between them and the pin.

## The pull-up surprise

`pinMode(pin, INPUT_PULLUP)` works on most pins, exactly as on the Uno. On GPIO 34 to 39 there is no pull-up resistor inside the chip, so a button there, with nothing else connected, leaves the pin floating: it reads HIGH or LOW at random, and the sketch sees phantom presses. Either move the button, or add your own 10 kΩ resistor from the pin to 3.3 V.

The simulator notes both mistakes after a run: an output on an input-only pin, and a pull-up that does not exist.

::: kid
Not every pin on the ESP32 can do every job.

Pins 34 to 39 can only listen. They cannot light an LED.

Pins 6 to 11 are busy inside the board. Never use them.

Pins like 4 and 23 are safe for most jobs.
:::

```arduino {role=example file=two_lights.ino}
// Two LEDs on safe output pins, taking turns.
const int LEFT = 22;
const int RIGHT = 23;

void setup() {
    pinMode(LEFT, OUTPUT);
    pinMode(RIGHT, OUTPUT);
}

void loop() {
    digitalWrite(LEFT, HIGH);
    digitalWrite(RIGHT, LOW);
    delay(400);
    digitalWrite(LEFT, LOW);
    digitalWrite(RIGHT, HIGH);
    delay(400);
}
```

::: try
This sketch should light an LED while a button is held, using the button pin's built-in pull-up (pressed reads LOW). It was wired to the wrong pins: the LED is on GPIO 34 and the button on GPIO 35. Run it and read the notes, then move the LED to GPIO 23 and the button to GPIO 4.
:::

::: try-kid
The light should be on while the button is pressed.

The pins are wrong. Press Run and read the notes.

Move the light to pin 23 and the button to pin 4.
:::

```arduino {role=starter file=button_light.ino}
const int LED_PIN = 34;
const int BUTTON_PIN = 35;

void setup() {
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
    if (digitalRead(BUTTON_PIN) == LOW) {
        digitalWrite(LED_PIN, HIGH);
    } else {
        digitalWrite(LED_PIN, LOW);
    }
    delay(10);
}
```

```arduino {role=solution file=button_light.ino}
const int LED_PIN = 23;
const int BUTTON_PIN = 4;

void setup() {
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
    if (digitalRead(BUTTON_PIN) == LOW) {
        digitalWrite(LED_PIN, HIGH);
    } else {
        digitalWrite(LED_PIN, LOW);
    }
    delay(10);
}
```
