---
id: embedded.arduino.average-voltage
kind: lesson
track: embedded
unit: b4
order: 4
title: PWM frequency and average voltage
titleKid: How much power on average
language: arduino
circuit:
  - { part: led, pin: 9, colour: yellow, label: Lamp }
concepts: [pwm, average-voltage, frequency, integer-division]
prereqs: [embedded.arduino.analog-write]
est_minutes: 14
checks:
  - type: stdout-equals
    ms: 1500
    expect: "duty 0: 0.00 V\nduty 64: 1.25 V\nduty 128: 2.51 V\nduty 191: 3.75 V\nduty 255: 5.00 V\n"
hints:
  - 'duty and 255 are both whole numbers, so duty / 255 is 0 for every duty under 255.'
  - 'Make one side a decimal: 255.0 instead of 255.'
  - 'float volts = duty / 255.0 * 5.0;'
hintsKid:
  - 'Every answer is 0 except the last one.'
  - 'Whole numbers lose the part after the dot.'
  - 'Write `255.0` instead of `255`.'
---
## Average voltage

A PWM pin gives 5 V for part of each cycle and 0 V for the rest. Averaged over a cycle:

**average = duty ÷ 255 × 5 V**

| Duty | Share on | Average |
|---|---|---|
| 0 | 0% | 0 V |
| 64 | 25% | 1.25 V |
| 128 | 50% | 2.51 V |
| 255 | 100% | 5 V |

A multimeter on DC shows this average, and a motor turns about as fast as it would on that steady voltage. On an ESP32 the top is 3.3 V instead of 5 V.

## Frequency

The **frequency** is how many on-off cycles happen each second. On an Uno, pins 5 and 6 run at about 980 Hz, and 3, 9, 10 and 11 at about 490 Hz. The frequency does not change the average; it changes how smooth the result is:

- **LEDs:** anything over about 100 Hz looks steady (a camera may still show stripes).
- **Motors:** a few hundred Hz to a few kHz. In the audible range the motor can whine; 20 kHz and up is silent, but needs a driver fast enough to keep up.
- **Servos:** need their own 50 Hz pulses, made by the Servo library.

An ESP32 lets you choose both: `ledcAttach(pin, 5000, 8)` is 5 kHz with 8-bit steps (unit B11).

## Whole numbers and decimals

`duty / 255` with two `int`s throws away the fraction: 128 / 255 is 0. Make one of them a decimal, `duty / 255.0`, and the sum is done in decimals.

::: kid
The pin is on for part of the time.

Half the time on is like half the power.

Here the board works out the power for each number.
:::

```arduino {role=example file=duty_table.ino}
// Print the share of time on for a few duties.
void setup() {
    Serial.begin(9600);
    for (int duty = 0; duty <= 255; duty += 51) {
        Serial.print(duty);
        Serial.print(" -> ");
        Serial.print(duty * 100 / 255);
        Serial.println("% on");
    }
}

void loop() {
}
```

::: try
The sketch sets the LED on pin 9 to each duty in `DUTIES` and prints the average voltage, but every line under 255 says 0.00 V. Fix the calculation of `volts` so it prints the true average (duty ÷ 255 × 5 V).
:::

::: try-kid
Most lines say 0.00 V. That is wrong.

Fix the sum for `volts`.
:::

```arduino {role=starter file=average.ino}
const int LED = 9;
const int DUTIES[] = {0, 64, 128, 191, 255};

void setup() {
    Serial.begin(9600);
    pinMode(LED, OUTPUT);
    for (int i = 0; i < 5; i++) {
        int duty = DUTIES[i];
        analogWrite(LED, duty);
        float volts = duty / 255 * 5.0;
        Serial.print("duty ");
        Serial.print(duty);
        Serial.print(": ");
        Serial.print(volts);
        Serial.println(" V");
        delay(200);
    }
}

void loop() {
}
```

```arduino {role=solution file=average.ino}
const int LED = 9;
const int DUTIES[] = {0, 64, 128, 191, 255};

void setup() {
    Serial.begin(9600);
    pinMode(LED, OUTPUT);
    for (int i = 0; i < 5; i++) {
        int duty = DUTIES[i];
        analogWrite(LED, duty);
        float volts = duty / 255.0 * 5.0;
        Serial.print("duty ");
        Serial.print(duty);
        Serial.print(": ");
        Serial.print(volts);
        Serial.println(" V");
        delay(200);
    }
}

void loop() {
}
```
