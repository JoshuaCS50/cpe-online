---
id: embedded.arduino.interrupts
kind: lesson
track: embedded
unit: b6
order: 1
title: What an interrupt is
titleKid: Drop everything, the doorbell rang!
language: arduino
circuit:
  - { part: button, pin: 2, wiring: pull-up, label: Counter }
concepts: [interrupt, polling, isr, attach-interrupt]
prereqs: [embedded.arduino.delay-vs-millis]
est_minutes: 16
checks:
  - type: stdout-equals
    ms: 4500
    inputs: ["2 LOW at 300", "2 HIGH at 400", "2 LOW at 900", "2 HIGH at 1000", "2 LOW at 2500", "2 HIGH at 2600"]
    expect: "Presses: 2\nPresses: 3\n"
hints:
  - 'loop() only looks at the button between two-second waits, so presses during the wait are never seen.'
  - 'Let the hardware watch the pin: move the counting into a function and attach it to the button with attachInterrupt.'
  - 'attachInterrupt(digitalPinToInterrupt(BUTTON), countPress, FALLING); and in countPress: presses++;'
hintsKid:
  - 'The board misses presses while it waits.'
  - 'Ask the board to tap you when the button is pressed.'
  - 'Use `attachInterrupt`.'
---
There are two ways to notice a button.

- **Polling:** keep looking. `loop()` reads the pin again and again. It works while `loop()` is quick, and misses anything that happens while the sketch is busy or waiting.
- **Interrupts:** let the hardware watch. When the pin changes, the processor stops what it is doing (even in the middle of `delay()`), runs a short function you gave it, then carries on exactly where it was.

That function is an **interrupt service routine (ISR)**. It is like a doorbell: you do not stand at the door all day; you get on with things and go to the door when it rings.

## Attaching one

```arduino
volatile int presses = 0;

void countPress() {        // the ISR: no parameters, returns nothing
    presses++;
}

void setup() {
    pinMode(2, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(2), countPress, FALLING);
}
```

- An Uno can only do this on **pins 2 and 3** (interrupt numbers 0 and 1); `digitalPinToInterrupt(pin)` gives the number. An ESP32 can use any GPIO.
- The mode says which change counts: `FALLING` (HIGH to LOW, a press with a pull-up), `RISING` (LOW to HIGH, a release), or `CHANGE` (both).
- A variable an ISR changes must be marked `volatile` (the next lesson explains why).

Interrupts are how boards catch fast or rare events: wheel and flow sensor pulses, a rotary knob turning, an emergency stop, a byte arriving on Serial, a timer coming due.

A real button bounces, so one press can run the routine several times. The simulator's button does not bounce; on a real board, ignore presses that come within about 50 ms of the last one (see the debouncing lesson in B2).

::: kid
The board can be busy and still notice the button.

You tell it which job to do when the button is pressed.

The board stops, does that job, then carries on.

It is like a doorbell: you do not wait at the door.
:::

```arduino {role=example file=interrupt_led.ino}
// The LED changes the moment the button is pressed, even during a long delay.
volatile bool lit = false;

void toggle() {
    lit = !lit;
    digitalWrite(13, lit);
}

void setup() {
    pinMode(13, OUTPUT);
    pinMode(2, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(2), toggle, FALLING);
    Serial.begin(9600);
    Serial.println("Press the button at any time");
}

void loop() {
    delay(10000);   // very busy doing nothing
}
```

::: try
The sketch should count every press of the button on pin 2 and print the total every two seconds. It reads the button only between the two-second waits, so it misses the presses. Count them with an interrupt instead: attach `countPress` to the button (pressed is a fall from HIGH to LOW), make it add one to `presses`, and take the polling out of `loop()`.
:::

::: try-kid
The counter misses presses while the board waits.

Use `attachInterrupt` so the board counts every press.
:::

```arduino {role=starter file=press_counter.ino}
const int BUTTON = 2;
volatile int presses = 0;

void countPress() {
}

void setup() {
    Serial.begin(9600);
    pinMode(BUTTON, INPUT_PULLUP);
}

void loop() {
    if (digitalRead(BUTTON) == LOW) presses++;
    delay(2000);
    Serial.print("Presses: ");
    Serial.println(presses);
}
```

```arduino {role=solution file=press_counter.ino}
const int BUTTON = 2;
volatile int presses = 0;

void countPress() {
    presses++;
}

void setup() {
    Serial.begin(9600);
    pinMode(BUTTON, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(BUTTON), countPress, FALLING);
}

void loop() {
    delay(2000);
    Serial.print("Presses: ");
    Serial.println(presses);
}
```
