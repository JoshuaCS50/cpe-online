---
id: embedded.arduino.analog-read
kind: lesson
track: embedded
unit: b3
order: 1
title: Reading a voltage with analogRead
titleKid: How much, not just on or off
language: arduino
circuit:
  - { part: knob, pin: A0 }
concepts: [analog-input, adc, resolution, integer-division, float]
prereqs: [embedded.arduino.serial-monitor]
est_minutes: 14
checks:
  - type: stdout-equals
    ms: 900
    inputs: ["A0 512 at 0"]
    expect: "Reading: 512, voltage: 2.50 V\nReading: 512, voltage: 2.50 V\n"
  - type: stdout-equals
    ms: 900
    inputs: ["A0 0 at 0", "A0 1023 at 400"]
    expect: "Reading: 0, voltage: 0.00 V\nReading: 1023, voltage: 5.00 V\n"
  - type: stdout-equals
    ms: 400
    inputs: ["A0 300 at 0"]
    expect: "Reading: 300, voltage: 1.47 V\n"
hints:
  - 'Work it out by hand for 512: 512 * 5 is 2560, and 2560 / 1023 in whole numbers is 2. The fraction is thrown away before it reaches volts.'
  - 'If one number in a division has a decimal point, C++ does the division with decimals. Write 5.0 instead of 5.'
  - 'float volts = reading * 5.0 / 1023.0;'
hintsKid:
  - 'The board cuts off the part after the dot.'
  - 'Write `5.0` instead of `5`.'
  - 'Try `reading * 5.0 / 1023.0`.'
---
A button is either pressed or not. Most things a machine needs to know are amounts: how warm, how bright, how far a knob is turned, how full a tank is. Sensors report these as a **voltage** between 0 V and 5 V, and the analog pins A0 to A5 can measure it.

## The analog-to-digital converter

`analogRead(A0)` measures the voltage on A0 and gives back a whole number from **0 to 1023**. The part of the chip that does this is the **ADC** (analog-to-digital converter). It has 10 bits, and 2 to the power 10 is 1024 steps:

| Voltage on A0 | analogRead gives |
|---|---|
| 0 V | 0 |
| 1.25 V | about 256 |
| 2.5 V | about 512 |
| 5 V | 1023 |

Each step is 5 V / 1023, about 4.9 mV. That is the **resolution**: two voltages closer together than that read the same.

## From reading to volts

To turn a reading back into volts, scale it:

```arduino
float volts = reading * 5.0 / 1023.0;
```

The `.0` matters. In C++, `reading * 5 / 1023` uses whole numbers only, so 2560 / 1023 is 2, not 2.502. If either side of a division is a decimal number, the division keeps the fraction. Store the result in a `float`.

`Serial.print` of a `float` shows two decimal places, so 2.502 prints as `2.50`.

## In the simulator

The checks set the voltage on A0 at given times, such as "A0 512 at 0" (half of 5 V from the start). A pin with nothing scheduled reads 0. On a real board an unconnected analog pin floats and gives random-looking readings, so always connect a sensor before trusting a value.

::: kid
Some pins can tell how much, not just yes or no.

`analogRead` gives a number from 0 to 1023.

0 means no power. 1023 means full power, which is 5 volts.

512 is about half way.

To get volts, the board does a sum.

Write `5.0`, not `5`. Then the part after the dot stays.
:::

```arduino {role=example file=knob.ino}
// A knob (potentiometer) on A0. Turning it changes the voltage.
void setup() {
    Serial.begin(9600);
}

void loop() {
    int reading = analogRead(A0);
    int percent = map(reading, 0, 1023, 0, 100);
    Serial.print("Knob at ");
    Serial.print(percent);
    Serial.println("%");
    delay(1000);
}
```

::: try
This sketch prints the reading on A0 and its voltage every 500 ms, but the voltage is wrong: for a reading of 512 it prints 2.00 V instead of 2.50 V. Fix the voltage calculation.
:::

::: try-kid
The volts come out wrong.

512 should give 2.50 volts.

Fix the sum so it keeps the part after the dot.
:::

```arduino {role=starter file=voltmeter.ino}
void setup() {
    Serial.begin(9600);
}

void loop() {
    int reading = analogRead(A0);
    float volts = reading * 5 / 1023;

    Serial.print("Reading: ");
    Serial.print(reading);
    Serial.print(", voltage: ");
    Serial.print(volts);
    Serial.println(" V");
    delay(500);
}
```

```arduino {role=solution file=voltmeter.ino}
void setup() {
    Serial.begin(9600);
}

void loop() {
    int reading = analogRead(A0);
    float volts = reading * 5.0 / 1023.0;

    Serial.print("Reading: ");
    Serial.print(reading);
    Serial.print(", voltage: ");
    Serial.print(volts);
    Serial.println(" V");
    delay(500);
}
```
