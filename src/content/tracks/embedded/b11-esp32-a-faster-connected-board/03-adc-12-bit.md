---
id: embedded.esp32.adc-12-bit
kind: lesson
track: embedded
unit: b11
order: 3
title: 12-bit analogRead on the ESP32
titleKid: Finer steps, smaller volts
language: arduino
board: esp32
circuit:
  - { part: knob, pin: 34 }
concepts: [adc, resolution, analog-read-resolution, logic-levels, porting]
prereqs: [embedded.esp32.esp32-pinout, embedded.arduino.analog-read]
est_minutes: 14
checks:
  - type: stdout-equals
    ms: 900
    inputs: ["GPIO 34 2048 at 0"]
    expect: "Reading: 2048, voltage: 1.65 V\nReading: 2048, voltage: 1.65 V\n"
  - type: stdout-equals
    ms: 900
    inputs: ["GPIO 34 0 at 0", "GPIO 34 4095 at 400"]
    expect: "Reading: 0, voltage: 0.00 V\nReading: 4095, voltage: 3.30 V\n"
  - type: stdout-equals
    ms: 400
    inputs: ["GPIO 34 1000 at 0"]
    expect: "Reading: 1000, voltage: 0.81 V\n"
hints:
  - 'The knob is on GPIO 34 now, so read that pin: int reading = analogRead(POT_PIN); with const int POT_PIN = 34;'
  - 'The top of the range changed twice: full scale is 3.3 V, not 5 V, and the largest reading is 4095, not 1023.'
  - 'float volts = reading * 3.3 / 4095.0;'
hintsKid:
  - 'The knob is on pin 34.'
  - 'Use 3.3 and 4095 in the sum.'
  - 'Try `reading * 3.3 / 4095.0`.'
---
In unit B3 you turned an Uno reading into volts with `reading * 5.0 / 1023.0`. On an ESP32 both numbers in that formula change.

## 4096 steps over 3.3 V

The ESP32's analog-to-digital converter has **12 bits**: 2 to the power 12 is 4096 steps, so `analogRead` gives **0 to 4095**. And because the chip runs on 3.3 V, the top of the range is about **3.3 V**, not 5 V:

| Voltage on the pin | Uno (10 bits, 5 V) | ESP32 (12 bits, 3.3 V) |
|---|---|---|
| 0 V | 0 | 0 |
| 1.65 V | about 338 | about 2048 |
| 3.3 V | about 675 | 4095 |
| 5 V | 1023 | never: 5 V can damage the pin |

Each step is 3.3 V / 4095, about 0.8 mV, six times finer than the Uno's 4.9 mV. The formula becomes:

```arduino
float volts = reading * 3.3 / 4095.0;
```

## Choosing the resolution

If you would rather keep Uno-sized numbers, for example to reuse code that expects 0 to 1023, ask for fewer bits:

```arduino
analogReadResolution(10);   // analogRead now gives 0 to 1023
```

It accepts 9 to 12 bits. The voltage range does not change, only how finely it is divided.

## Which pins

Read analog sensors on **GPIO 32 to 39** (the ADC1 pins). GPIO 34 to 39 are input-only, which is no loss for a sensor. The ADC2 pins also read voltages, but stop working as soon as Wi-Fi starts, which catches out many projects later.

## Real boards are less tidy

A real ESP32's converter is not perfectly straight: readings bunch up near 0 V and near the top, so voltages below about 0.1 V and above about 3.1 V read less accurately. For careful measurements the Arduino-ESP32 core has `analogReadMilliVolts(pin)`, which corrects with the chip's own calibration. The simulator's converter is perfectly straight.

::: kid
The ESP32 measures in smaller steps than the Uno.

Its numbers go from 0 to 4095.

Its top voltage is 3.3 volts, not 5 volts.

So the sum uses 3.3 and 4095.
:::

```arduino {role=example file=adc_table.ino}
// The same voltages as Uno readings and as ESP32 readings.
void setup() {
    Serial.begin(115200);
    float volts[] = {0.0, 0.5, 1.65, 3.0, 3.3};
    for (int i = 0; i < 5; i++) {
        int esp32 = volts[i] / 3.3 * 4095;
        int uno = volts[i] / 5.0 * 1023;
        Serial.print(volts[i]);
        Serial.print(" V -> ESP32 ");
        Serial.print(esp32);
        Serial.print(", Uno ");
        Serial.println(uno);
    }
}

void loop() {
}
```

::: try
This is the voltmeter from unit B3, still written for an Uno. On the ESP32 the knob is wired to GPIO 34. Make it read GPIO 34 and print the voltage correctly for a 12-bit, 3.3 V converter, every 500 ms, as `Reading: 2048, voltage: 1.65 V`.
:::

::: try-kid
This voltmeter was made for the Uno.

The knob is on pin 34 now.

Fix the sum for 3.3 volts and 4095 steps.
:::

```arduino {role=starter file=voltmeter_esp32.ino}
const int POT_PIN = A0;

void setup() {
    Serial.begin(115200);
}

void loop() {
    int reading = analogRead(POT_PIN);
    float volts = reading * 5.0 / 1023.0;

    Serial.print("Reading: ");
    Serial.print(reading);
    Serial.print(", voltage: ");
    Serial.print(volts);
    Serial.println(" V");
    delay(500);
}
```

```arduino {role=solution file=voltmeter_esp32.ino}
const int POT_PIN = 34;

void setup() {
    Serial.begin(115200);
}

void loop() {
    int reading = analogRead(POT_PIN);
    float volts = reading * 3.3 / 4095.0;

    Serial.print("Reading: ");
    Serial.print(reading);
    Serial.print(", voltage: ");
    Serial.print(volts);
    Serial.println(" V");
    delay(500);
}
```
