---
id: embedded.arduino.power-and-pins
kind: lesson
track: embedded
unit: b1
order: 2
title: Power, pins and breadboards
titleKid: Wiring a light safely
language: arduino
concepts: [voltage, current, resistor, ohms-law, breadboard, ground, digital-pins]
prereqs: [embedded.arduino.meet-the-board]
est_minutes: 15
checks:
  - type: pins
    ms: 2000
    expect: "0 ms: pin 2 HIGH\n300 ms: pin 3 HIGH\n600 ms: pin 4 HIGH\n"
hints:
  - 'All three pins are already outputs. Switch pin 2 on, wait, switch pin 3 on, wait, switch pin 4 on.'
  - 'delay(300); between two digitalWrite lines makes the second one happen 300 ms after the first.'
  - 'The order in setup is: digitalWrite(2, HIGH); delay(300); digitalWrite(3, HIGH); delay(300); digitalWrite(4, HIGH);'
hintsKid:
  - 'Turn on pin 2, then pin 3, then pin 4.'
  - 'Wait with `delay(300);` between them.'
  - 'Leave them all on.'
---
Before writing more code, it helps to know what a pin really does, because a wiring mistake can damage a pin for good.

## HIGH and LOW are voltages

An Uno works at **5 volts**. When a pin is an output:

- `digitalWrite(pin, HIGH)` connects it to 5 V,
- `digitalWrite(pin, LOW)` connects it to 0 V, called **ground** or **GND**.

Current flows from a HIGH pin, through whatever is connected, back to GND. Every circuit needs that return path: the part's other leg goes to a GND pin. When several boards or supplies work together, their GNDs must be connected (a **common ground**), or their voltages mean nothing to each other.

## Current limits

A pin can safely supply about **20 mA** (milliamps), and must never be asked for more than 40 mA. The whole chip should stay under about 200 mA in total. That is enough for an LED, but not for a motor, a relay coil or a long LED strip: those need a transistor or driver board between the pin and the load (later units).

## The LED and its resistor

An LED connected straight between a pin and GND would draw far too much current and burn out, perhaps taking the pin with it. A **resistor** in series limits the current. Ohm's law gives its size:

```
R = (supply voltage - LED voltage) / current
  = (5 V - 2 V) / 0.015 A
  = 200 ohms   ->  use the next standard value up, 220 ohms
```

The LED voltage (about 2 V for red, 3 V for blue or white) is on its datasheet. An LED only works one way round: its longer leg (the **anode**) goes towards the pin, the shorter leg (the **cathode**, flat side of the rim) towards GND.

## Breadboards

A **breadboard** lets you build circuits without soldering. Under the holes are metal strips:

- In the middle, each short row of five holes is connected together. Parts placed in the same row are joined.
- The long rails along the edges, marked + and -, run the length of the board and carry power and GND.
- The gap down the middle separates the two halves, so a chip placed across it has each leg in its own row.

A typical LED circuit: a wire from pin 2 to a row; the resistor from that row to a second row; the LED's long leg in the second row and its short leg in a third; a wire from the third row to the GND rail; and a wire from the GND rail to a GND pin on the Uno.

## Which pins to use

- Pins **0 and 1** carry the USB Serial link (RX and TX). Avoid them while you use Serial.
- Pins marked **~** (3, 5, 6, 9, 10, 11) can also dim LEDs and set motor speeds (unit B4).
- **A0 to A5** measure voltages, and can also be used as ordinary digital pins.

::: kid
A pin can send power out, like a tap you turn on.

HIGH means the power is on. LOW means it is off.

An LED needs a resistor. It holds back some of the power.

Without it, the LED gets too much and breaks.

A breadboard holds the parts. Holes in the same row are joined.
:::

```arduino {role=example file=two-leds.ino}
const int RED = 2;
const int GREEN = 3;

void setup() {
    pinMode(RED, OUTPUT);
    pinMode(GREEN, OUTPUT);
}

void loop() {
    digitalWrite(RED, HIGH);
    digitalWrite(GREEN, LOW);
    delay(1000);
    digitalWrite(RED, LOW);
    digitalWrite(GREEN, HIGH);
    delay(1000);
}
```

::: try
Three LEDs, each with its 220-ohm resistor, are wired to pins 2, 3 and 4. When the board starts, switch them on one after another, 300 ms apart (pin 2 at once, pin 3 after 300 ms, pin 4 after 600 ms), and leave them all on. The pins are already set as outputs.
:::

::: try-kid
Three lights are on pins 2, 3 and 4.

Turn them on one by one, with a short wait between.

Then leave them all on.
:::

```arduino {role=starter file=three-leds.ino}
void setup() {
    pinMode(2, OUTPUT);
    pinMode(3, OUTPUT);
    pinMode(4, OUTPUT);

    digitalWrite(2, HIGH);
    // Switch on pins 3 and 4, 300 ms apart.
}

void loop() {
}
```

```arduino {role=solution file=three-leds.ino}
void setup() {
    pinMode(2, OUTPUT);
    pinMode(3, OUTPUT);
    pinMode(4, OUTPUT);

    digitalWrite(2, HIGH);
    delay(300);
    digitalWrite(3, HIGH);
    delay(300);
    digitalWrite(4, HIGH);
}

void loop() {
}
```
