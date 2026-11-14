---
id: embedded.arduino.delay-vs-millis
kind: lesson
track: embedded
unit: b5
order: 1
title: delay versus millis
titleKid: Do not fall asleep on the job
language: arduino
circuit:
  - { part: led, pin: 13, colour: red, label: Blinker }
  - { part: led, pin: 12, colour: green, label: Button light }
  - { part: button, pin: 2, wiring: pull-up, label: Button }
concepts: [delay, millis, blocking, non-blocking]
prereqs: [embedded.arduino.buttons, embedded.arduino.blink]
est_minutes: 16
checks:
  - type: pins
    ms: 1100
    inputs: ["2 LOW at 120", "2 HIGH at 300"]
    expect: "0 ms: pin 12 LOW\n120 ms: pin 12 HIGH\n300 ms: pin 12 LOW\n500 ms: pin 13 HIGH\n1000 ms: pin 13 LOW\n"
hints:
  - 'While delay(500) waits, nothing else runs, so a short press is missed completely.'
  - 'Remove the delays. Each time round, ask millis() whether 500 ms have passed since the last change of the blinking LED.'
  - 'if (now - lastToggle >= INTERVAL) { lastToggle = now; ledState = !ledState; digitalWrite(LED, ledState); }'
hintsKid:
  - 'While the board waits, it cannot see the button.'
  - 'Take out the waits.'
  - 'Look at the clock each time instead.'
---
`delay(500)` stops the whole sketch for half a second. Nothing else happens: no button is read, no sensor checked, no message answered. Code that waits like this is called **blocking**. It is fine for a sketch that does one thing, and a problem as soon as it does two.

## Look at the clock instead

`millis()` gives the number of milliseconds since the board started. Instead of waiting, a sketch can keep running round `loop()` and ask, each time, "is it time yet?":

```arduino
unsigned long now = millis();
if (now - lastToggle >= INTERVAL) {
    lastToggle = now;
    ledState = !ledState;
    digitalWrite(LED, ledState);
}
// ...and everything else carries on here, thousands of times a second
```

This is **non-blocking** code: `loop()` never stops, so the button is read all the time and reacts at once.

## Why `unsigned long`

`millis()` gives an `unsigned long`. On an Uno that is 32 bits, so it counts up to about 49.7 days and then starts again from 0. Writing the test as `now - lastToggle >= INTERVAL` keeps working even when the count starts again, because unsigned subtraction wraps the same way. Writing `now >= lastToggle + INTERVAL` does not.

::: kid
`delay` makes the board stop and wait.

While it waits, it cannot see the button.

Looking at the clock is better.

The board keeps working and checks the time again and again.
:::

```arduino {role=example file=uptime.ino}
// Print how long the board has been running, every second.
unsigned long lastPrint = 0;

void setup() {
    Serial.begin(9600);
}

void loop() {
    unsigned long now = millis();
    if (now - lastPrint >= 1000) {
        lastPrint = now;
        Serial.print("Running for ");
        Serial.print(now / 1000);
        Serial.println(" s");
    }
}
```

::: try
The LED on pin 13 should change every 500 ms (`INTERVAL`), and the LED on pin 12 should be on exactly while the button on pin 2 is held. Because the sketch uses `delay`, it only looks at the button once a second, and a short press is missed. Rewrite `loop()` without `delay`: use `millis()`, `lastToggle` and `ledState` to blink pin 13, and set pin 12 from the button every time round.
:::

::: try-kid
The button light misses quick presses.

The board is busy waiting.

Take out `delay` and use `millis` instead.
:::

```arduino {role=starter file=blink_and_button.ino}
const int LED = 13;
const int BUTTON_LED = 12;
const int BUTTON = 2;
const unsigned long INTERVAL = 500;

unsigned long lastToggle = 0;
int ledState = LOW;

void setup() {
    pinMode(LED, OUTPUT);
    pinMode(BUTTON_LED, OUTPUT);
    pinMode(BUTTON, INPUT_PULLUP);
}

void loop() {
    delay(INTERVAL);
    digitalWrite(LED, HIGH);
    delay(INTERVAL);
    digitalWrite(LED, LOW);
    digitalWrite(BUTTON_LED, digitalRead(BUTTON) == LOW ? HIGH : LOW);
}
```

```arduino {role=solution file=blink_and_button.ino}
const int LED = 13;
const int BUTTON_LED = 12;
const int BUTTON = 2;
const unsigned long INTERVAL = 500;

unsigned long lastToggle = 0;
int ledState = LOW;

void setup() {
    pinMode(LED, OUTPUT);
    pinMode(BUTTON_LED, OUTPUT);
    pinMode(BUTTON, INPUT_PULLUP);
}

void loop() {
    unsigned long now = millis();
    if (now - lastToggle >= INTERVAL) {
        lastToggle = now;
        ledState = !ledState;
        digitalWrite(LED, ledState);
    }
    digitalWrite(BUTTON_LED, digitalRead(BUTTON) == LOW ? HIGH : LOW);
}
```
