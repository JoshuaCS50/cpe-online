---
id: embedded.projects.thermostat
kind: lesson
track: embedded
unit: b9
order: 10
title: "Project: a fan thermostat"
titleKid: A fan that switches on when it is hot
language: arduino
circuit:
  - { part: temp-sensor, pin: A0, label: Room }
  - { part: motor, pin: 6, label: Fan }
concepts: [temperature-sensor, hysteresis, on-off-control, transistor]
prereqs: [embedded.arduino.hysteresis, embedded.projects.motor-soft-start]
est_minutes: 18
checks:
  - type: pins
    ms: 3500
    inputs: ["A0 153 at 0", "A0 161 at 1000", "A0 156 at 2000", "A0 151 at 3000"]
    expect: "0 ms: pin 6 LOW\n1000 ms: pin 6 HIGH\n3000 ms: pin 6 LOW\n"
hints:
  - 'With one threshold, the fan switches off as soon as the temperature dips just below 28 °C.'
  - 'Use two: on above ON_ABOVE (28 °C), off below OFF_BELOW (25 °C), and leave it alone in between.'
  - 'if (celsius > ON_ABOVE) digitalWrite(FAN, HIGH); else if (celsius < OFF_BELOW) digitalWrite(FAN, LOW);'
hintsKid:
  - 'The fan turns off too soon.'
  - 'Turn on above 28. Turn off below 25.'
  - 'In between, leave the fan alone.'
---
A thermostat keeps a room near a temperature by switching a heater or a fan. This one switches a fan when a TMP36 sensor says it is getting warm, and uses **hysteresis** from unit B3 so the fan does not click on and off when the temperature hovers near the limit.

## What you build

A TMP36 temperature sensor (flat side towards you: 5 V, signal to A0, GND) and the fan from the last project, switched by a TIP120 on pin 6.

## From reading to degrees

The TMP36 gives 0.5 V at 0 °C and 10 mV more for every degree:

```arduino
float millivolts = analogRead(A0) * 5000.0 / 1023.0;
float celsius = (millivolts - 500.0) / 10.0;
```

| Reading | Millivolts | °C |
|---|---|---|
| 151 | 738 | 23.8 |
| 153 | 748 | 24.8 |
| 156 | 762 | 26.2 |
| 161 | 787 | 28.7 |

Each step of the reading is almost half a degree, so a temperature near a single threshold reads just over, then just under, and the fan chatters.

## Two thresholds

On above 28 °C, off below 25 °C, and in between the fan keeps doing what it was doing. The 3 °C gap is the hysteresis band: noise smaller than that cannot switch the fan.

## Try it live

Choose Live and press Run, then drag the temperature slider (or the sensor in the 3D view) up past about 161 and back down: the fan starts, and keeps running until the reading falls below about 153.

::: kid
This fan switches on when the room gets warm.

A sensor tells the board how hot it is.

On above 28 degrees. Off below 25 degrees.

In between, the fan keeps doing what it was doing.
:::

```arduino {role=example file=thermometer.ino}
// Print the TMP36's temperature every second.
void setup() {
    Serial.begin(9600);
}

void loop() {
    float millivolts = analogRead(A0) * 5000.0 / 1023.0;
    float celsius = (millivolts - 500.0) / 10.0;
    Serial.print(celsius, 1);
    Serial.println(" C");
    delay(1000);
}
```

::: try
The fan on pin 6 should switch on above `ON_ABOVE` (28 °C) and off below `OFF_BELOW` (25 °C), and do nothing in between. The sketch uses only one threshold, so the fan switches off as soon as the room dips below 28 °C. Give it hysteresis.
:::

::: try-kid
The fan turns off too soon.

Turn it on above 28 degrees.

Turn it off below 25 degrees.
:::

```arduino {role=starter file=thermostat.ino}
const int SENSOR = A0;
const int FAN = 6;
const float ON_ABOVE = 28.0;
const float OFF_BELOW = 25.0;

void setup() {
    pinMode(FAN, OUTPUT);
    digitalWrite(FAN, LOW);
}

void loop() {
    float millivolts = analogRead(SENSOR) * 5000.0 / 1023.0;
    float celsius = (millivolts - 500.0) / 10.0;
    if (celsius > ON_ABOVE) {
        digitalWrite(FAN, HIGH);
    } else {
        digitalWrite(FAN, LOW);
    }
    delay(200);
}
```

```arduino {role=solution file=thermostat.ino}
const int SENSOR = A0;
const int FAN = 6;
const float ON_ABOVE = 28.0;
const float OFF_BELOW = 25.0;

void setup() {
    pinMode(FAN, OUTPUT);
    digitalWrite(FAN, LOW);
}

void loop() {
    float millivolts = analogRead(SENSOR) * 5000.0 / 1023.0;
    float celsius = (millivolts - 500.0) / 10.0;
    if (celsius > ON_ABOVE) {
        digitalWrite(FAN, HIGH);
    } else if (celsius < OFF_BELOW) {
        digitalWrite(FAN, LOW);
    }
    delay(200);
}
```
