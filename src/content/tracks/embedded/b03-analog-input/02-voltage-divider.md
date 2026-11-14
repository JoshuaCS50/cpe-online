---
id: embedded.arduino.voltage-divider
kind: lesson
track: embedded
unit: b3
order: 2
title: Voltage dividers and light sensors
titleKid: Measuring light
language: arduino
circuit:
  - { part: ldr, pin: A0 }
concepts: [voltage-divider, ldr, ohms-law, long, integer-overflow]
prereqs: [embedded.arduino.analog-read]
est_minutes: 18
checks:
  - type: stdout-equals
    ms: 400
    inputs: ["A0 512 at 0"]
    expect: "LDR: 9980 ohms\n"
  - type: stdout-equals
    ms: 900
    inputs: ["A0 100 at 0", "A0 1000 at 500"]
    expect: "LDR: 92300 ohms\nLDR: 230 ohms\n"
  - type: stdout-equals
    ms: 400
    inputs: ["A0 0 at 0"]
    expect: "Too dark to measure\n"
hints:
  - 'Solve the divider for the top resistor: R_LDR = R_FIXED * (1023 - reading) / reading.'
  - 'Do the multiplication with long numbers so it cannot overflow: long ohms = R_FIXED * (1023 - reading) / reading; with R_FIXED declared as const long R_FIXED = 10000;'
  - 'Check for a reading of 0 before dividing: if (reading == 0) { Serial.println("Too dark to measure"); } else { ... }'
hintsKid:
  - 'Use `R_FIXED * (1023 - reading) / reading`.'
  - 'Keep the answer in a `long`.'
  - 'If the reading is 0, print "Too dark to measure".'
---
Many sensors are not voltage sources at all: they are **resistors whose resistance changes**. A light-dependent resistor (LDR) is a few hundred ohms in bright light and a few hundred thousand ohms in the dark. A thermistor changes with temperature. The board can only measure voltage, so a small circuit turns resistance into voltage.

## The voltage divider

Two resistors in series between 5 V and GND share the voltage. The voltage at the point between them is:

```text
Vout = Vin * R2 / (R1 + R2)
```

R1 is the top resistor (to 5 V) and R2 is the bottom one (to GND). Equal resistors give half: 2.5 V. A bigger R1 pulls Vout down; a bigger R2 pulls it up.

## A light sensor

Put the LDR on top and a fixed 10 kΩ resistor below, and connect the middle to A0:

```text
5V ── LDR ──┬── 10k ── GND
            │
            A0
```

In bright light the LDR is small, so A0 is near 5 V and reads high. In the dark the LDR is large and A0 reads low. For many projects the raw reading is enough: "is it darker than 300?".

## Working back to ohms

Sometimes you need the sensor's actual resistance, for example to look up a temperature in a thermistor's data sheet. Using readings instead of volts (1023 stands for 5 V), solve the divider for R1:

```text
R_LDR = 10000 * (1023 - reading) / reading
```

For a reading of 512 that is 10000 × 511 / 512, about 9980 Ω: the LDR and the fixed resistor are nearly equal, as you would expect at half voltage.

## Two traps

**Dividing by zero.** A reading of 0 means the LDR is so large (or disconnected) that no voltage reaches A0. Dividing by `reading` then crashes the calculation. Check for 0 first.

**Overflow.** On an Arduino Uno an `int` is only 16 bits: it holds −32768 to 32767. `10000 * 511` is 5,110,000, far too big, and the result silently wraps to nonsense. A `long` is 32 bits and holds about ±2 billion. Make the 10000 a `long` and the whole calculation is done in `long`. (The simulator's `int` is 32 bits, so it will not show this bug, but a real Uno will.)

::: kid
Some sensors change how hard it is for power to flow.

A light sensor lets more power through when it is bright.

We pair it with a normal part that never changes.

The pin between them sees more volts when it is bright.

The board can then work out the light sensor's value.

If the reading is 0, it is too dark to measure.
:::

```arduino {role=example file=night-light.ino}
// LDR on top, 10k below, middle to A0. LED on pin 13.
const int DARK_BELOW = 300;

void setup() {
    pinMode(13, OUTPUT);
    Serial.begin(9600);
}

void loop() {
    int light = analogRead(A0);
    if (light < DARK_BELOW) {
        digitalWrite(13, HIGH);
        Serial.println("Dark: light on");
    } else {
        digitalWrite(13, LOW);
        Serial.println("Bright: light off");
    }
    delay(1000);
}
```

::: try
The LDR is on top of the divider and a 10 kΩ resistor is below it, with the middle on A0. Every 500 ms, print the LDR's resistance as `LDR: 9980 ohms` (a whole number, rounded down). If the reading is 0, print `Too dark to measure` instead.
:::

::: try-kid
Work out the light sensor's value from the reading.

Print it like `LDR: 9980 ohms`.

If the reading is 0, print `Too dark to measure`.
:::

```arduino {role=starter file=ldr.ino}
const long R_FIXED = 10000;

void setup() {
    Serial.begin(9600);
}

void loop() {
    int reading = analogRead(A0);

    // Print "LDR: <ohms> ohms", or "Too dark to measure" when reading is 0.

    delay(500);
}
```

```arduino {role=solution file=ldr.ino}
const long R_FIXED = 10000;

void setup() {
    Serial.begin(9600);
}

void loop() {
    int reading = analogRead(A0);

    if (reading == 0) {
        Serial.println("Too dark to measure");
    } else {
        long ohms = R_FIXED * (1023 - reading) / reading;
        Serial.print("LDR: ");
        Serial.print(ohms);
        Serial.println(" ohms");
    }

    delay(500);
}
```
