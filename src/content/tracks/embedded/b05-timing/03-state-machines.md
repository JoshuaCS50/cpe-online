---
id: embedded.arduino.state-machines
kind: lesson
track: embedded
unit: b5
order: 3
title: State machines
titleKid: A crossing that waits for you
language: arduino
circuit:
  - { part: led, pin: 12, colour: red, label: Red }
  - { part: led, pin: 11, colour: yellow, label: Yellow }
  - { part: led, pin: 10, colour: green, label: Green }
  - { part: button, pin: 2, wiring: pull-up, label: Cross }
concepts: [state-machine, enum, switch, millis]
prereqs: [embedded.arduino.two-blinkers, embedded.arduino.traffic-lights]
est_minutes: 18
checks:
  - type: pins
    ms: 6000
    inputs: ["2 LOW at 500", "2 HIGH at 600"]
    expect: "0 ms: pin 10 HIGH\n0 ms: pin 11 LOW\n0 ms: pin 12 LOW\n500 ms: pin 10 LOW\n500 ms: pin 11 HIGH\n2500 ms: pin 11 LOW\n2500 ms: pin 12 HIGH\n5500 ms: pin 10 HIGH\n5500 ms: pin 12 LOW\n"
hints:
  - 'Red lasts only 1 s instead of 3 s: its timer still counts from when yellow started.'
  - 'Every change of state must note the time it happened. enter() does both.'
  - 'Replace state = STOP; with enter(STOP);'
hintsKid:
  - 'Red is too short.'
  - 'Red uses the time yellow started.'
  - 'Use `enter(STOP)` to note the new time.'
---
A pedestrian crossing is green for cars until someone presses the button, then yellow for 2 s, then red for 3 s, then green again. At any moment it is in exactly one **state**, and something specific moves it to the next one: a press, or enough time passing.

## Draw it first

```
         button pressed          2 s passed            3 s passed
 GREEN ──────────────────▶ YELLOW ──────────▶ RED ──────────▶ GREEN
```

Each box is a state; each arrow is a **transition** with the event that causes it. Washing machines, lifts, vending machines, menus on a screen and robot behaviours are all designed this way.

## Code it

An `enum` gives the states names, a variable holds the current one, and a `switch` in `loop()` checks only the arrows that leave the current state:

```arduino
enum State { GO, SLOW, STOP };   // not RED and so on: those name the pins
State state = GO;
unsigned long stateStart = 0;

void enter(State next) {
    state = next;
    stateStart = millis();   // every state remembers when it began
}
```

Because `loop()` never waits, the button is read all the time, and adding more states or inputs never makes the timing worse.

::: kid
The crossing light is green until you press the button.

Then it goes yellow, then red, so you can cross.

Then it goes back to green.

Each colour is one step, called a state.
:::

```arduino {role=example file=two_states.ino}
// A light with two states: ON for 1 s, OFF for 3 s.
enum State { ON, OFF };
State state = ON;
unsigned long stateStart = 0;

void setup() {
    pinMode(13, OUTPUT);
    digitalWrite(13, HIGH);
}

void loop() {
    unsigned long now = millis();
    switch (state) {
        case ON:
            if (now - stateStart >= 1000) {
                state = OFF;
                stateStart = now;
                digitalWrite(13, LOW);
            }
            break;
        case OFF:
            if (now - stateStart >= 3000) {
                state = ON;
                stateStart = now;
                digitalWrite(13, HIGH);
            }
            break;
    }
}
```

::: try
The crossing should stay green until the button on pin 2 is pressed, then show yellow for 2 s, red for 3 s, and go back to green. Red only lasts 1 s, because the change from yellow to red does not note the time it happened. Use `enter()` for that change, as the others do.
:::

::: try-kid
Red should last 3 seconds. It only lasts 1.

Use `enter(STOP)` when the light turns red.
:::

```arduino {role=starter file=crossing.ino}
const int RED = 12;
const int YELLOW = 11;
const int GREEN = 10;
const int BUTTON = 2;

enum State { GO, SLOW, STOP };
State state = GO;
unsigned long stateStart = 0;

void show(int red, int yellow, int green) {
    digitalWrite(RED, red);
    digitalWrite(YELLOW, yellow);
    digitalWrite(GREEN, green);
}

void enter(State next) {
    state = next;
    stateStart = millis();
}

void setup() {
    pinMode(RED, OUTPUT);
    pinMode(YELLOW, OUTPUT);
    pinMode(GREEN, OUTPUT);
    pinMode(BUTTON, INPUT_PULLUP);
    show(LOW, LOW, HIGH);
}

void loop() {
    unsigned long now = millis();
    switch (state) {
        case GO:
            if (digitalRead(BUTTON) == LOW) {
                enter(SLOW);
                show(LOW, HIGH, LOW);
            }
            break;
        case SLOW:
            if (now - stateStart >= 2000) {
                state = STOP;
                show(HIGH, LOW, LOW);
            }
            break;
        case STOP:
            if (now - stateStart >= 3000) {
                enter(GO);
                show(LOW, LOW, HIGH);
            }
            break;
    }
}
```

```arduino {role=solution file=crossing.ino}
const int RED = 12;
const int YELLOW = 11;
const int GREEN = 10;
const int BUTTON = 2;

enum State { GO, SLOW, STOP };
State state = GO;
unsigned long stateStart = 0;

void show(int red, int yellow, int green) {
    digitalWrite(RED, red);
    digitalWrite(YELLOW, yellow);
    digitalWrite(GREEN, green);
}

void enter(State next) {
    state = next;
    stateStart = millis();
}

void setup() {
    pinMode(RED, OUTPUT);
    pinMode(YELLOW, OUTPUT);
    pinMode(GREEN, OUTPUT);
    pinMode(BUTTON, INPUT_PULLUP);
    show(LOW, LOW, HIGH);
}

void loop() {
    unsigned long now = millis();
    switch (state) {
        case GO:
            if (digitalRead(BUTTON) == LOW) {
                enter(SLOW);
                show(LOW, HIGH, LOW);
            }
            break;
        case SLOW:
            if (now - stateStart >= 2000) {
                enter(STOP);
                show(HIGH, LOW, LOW);
            }
            break;
        case STOP:
            if (now - stateStart >= 3000) {
                enter(GO);
                show(LOW, LOW, HIGH);
            }
            break;
    }
}
```
