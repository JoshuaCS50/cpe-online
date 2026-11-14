---
id: embedded.arduino.buttons
kind: lesson
track: embedded
unit: b2
order: 2
title: Reading a button
titleKid: Is the button pressed?
language: arduino
circuit:
  - { part: button, pin: 2, wiring: pull-down }
  - { part: led, pin: 13, colour: green }
concepts: [digital-input, digitalRead, pull-down-resistor, if-else]
prereqs: [embedded.arduino.blink, core.c.if-else]
links:
  - to: core.c.if-else
    kind: same-idea
    note: The same if/else decides what the board does with an input.
est_minutes: 14
checks:
  - type: pins
    ms: 1000
    inputs: ["2 HIGH at 300", "2 LOW at 700"]
    expect: "0 ms: pin 13 LOW\n300 ms: pin 13 HIGH\n700 ms: pin 13 LOW\n"
  - type: pins
    ms: 1000
    inputs: ["2 HIGH at 100", "2 LOW at 150", "2 HIGH at 600"]
    expect: "0 ms: pin 13 LOW\n100 ms: pin 13 HIGH\n150 ms: pin 13 LOW\n600 ms: pin 13 HIGH\n"
  - type: pins
    ms: 500
    expect: "0 ms: pin 13 LOW\n"
hints:
  - 'In loop, read the button into a variable: int pressed = digitalRead(BUTTON);'
  - 'With this wiring, a pressed button reads HIGH. Compare: if (pressed == HIGH) { ... } else { ... }'
  - 'Switch the LED to match: digitalWrite(LED, HIGH); in the if part, digitalWrite(LED, LOW); in the else part.'
hintsKid:
  - 'Read the button with `digitalRead(BUTTON)`.'
  - 'Pressed reads HIGH.'
  - 'If pressed, turn the light on. If not, turn it off.'
---
An output pin sends a voltage out. An **input** pin does the opposite: it looks at the voltage arriving from outside and reports it as `HIGH` (near 5 V) or `LOW` (near 0 V). Buttons, limit switches, door sensors and proximity sensors all give a machine digital inputs like this.

## Reading a pin

```arduino
const int BUTTON = 2;

void setup() {
    pinMode(BUTTON, INPUT);
}

void loop() {
    int state = digitalRead(BUTTON);   // HIGH or LOW
}
```

`pinMode(pin, INPUT)` makes the pin listen (it is also the default after power-up). `digitalRead(pin)` returns `HIGH` or `LOW`. The program reads the button every time `loop()` runs, thousands of times a second, so it notices a press almost at once.

## Wiring a button: the pull-down resistor

A push button just connects its two legs while pressed. Wired between 5 V and the pin, a pressed button gives the pin 5 V. But when the button is released, the pin is connected to nothing at all: it **floats**, and picks up stray electrical noise, reading HIGH and LOW at random.

The fix is a **pull-down resistor** (typically 10 kilohms) from the pin to GND. While the button is released, the resistor gently pulls the pin to 0 V, so it reads `LOW`. When the button is pressed, the direct connection to 5 V wins over the weak resistor, so it reads `HIGH`.

```
5V ---[button]---+--- pin 2
                 |
               [10k]
                 |
GND -------------+
```

Next lesson shows a way to wire a button with no extra resistor at all.

## In the simulator

The checks press buttons at chosen moments, written like `2 HIGH at 300`: from 300 ms of board time on, pin 2 reads HIGH. A pin nobody drives reads LOW, as if a pull-down resistor were fitted.

## Common mistakes

- **No resistor.** A floating input switches on and off by itself, often when a hand comes near.
- **Writing instead of reading.** `digitalWrite` on a button pin does not read it.
- **Comparing with `=`.** `if (state = HIGH)` sets `state`; use `==` (unit A3).

::: kid
A button is like a door for electricity.

Press it and the door opens. The pin feels the power.

`digitalRead` asks the pin: do you feel power?

The answer is HIGH for yes, or LOW for no.

Then `if` decides what to do.
:::

```arduino {role=example file=door-sensor.ino}
const int DOOR = 4;
const int BUZZER_LED = 12;

void setup() {
    pinMode(DOOR, INPUT);
    pinMode(BUZZER_LED, OUTPUT);
    Serial.begin(9600);
    Serial.println("Watching the door switch on pin 4");
}

void loop() {
    if (digitalRead(DOOR) == HIGH) {
        digitalWrite(BUZZER_LED, HIGH);
    } else {
        digitalWrite(BUZZER_LED, LOW);
    }
}
```

::: try
A button on pin 2 is wired with a pull-down resistor, so it reads HIGH while pressed and LOW otherwise. Make the LED on pin 13 shine exactly while the button is held down.
:::

::: try-kid
The button is on pin 2. The light is on pin 13.

The light should shine while the button is held down.
:::

```arduino {role=starter file=button-led.ino}
const int BUTTON = 2;
const int LED = 13;

void setup() {
    pinMode(BUTTON, INPUT);
    pinMode(LED, OUTPUT);
}

void loop() {
    // Read the button and switch the LED to match.
}
```

```arduino {role=solution file=button-led.ino}
const int BUTTON = 2;
const int LED = 13;

void setup() {
    pinMode(BUTTON, INPUT);
    pinMode(LED, OUTPUT);
}

void loop() {
    int pressed = digitalRead(BUTTON);
    if (pressed == HIGH) {
        digitalWrite(LED, HIGH);
    } else {
        digitalWrite(LED, LOW);
    }
}
```
