---
id: embedded.arduino.hysteresis
kind: lesson
track: embedded
unit: b3
order: 4
title: Thresholds and hysteresis
titleKid: A fan that does not flicker
language: arduino
concepts: [threshold, hysteresis, noise, on-off-control, temperature-sensor]
prereqs: [embedded.arduino.analog-read, embedded.arduino.buttons]
est_minutes: 16
checks:
  - type: pins
    ms: 5500
    inputs: ["A0 50 at 0", "A0 62 at 1000", "A0 60 at 2000", "A0 56 at 3000", "A0 54 at 4000", "A0 60 at 5000"]
    expect: "0 ms: pin 8 LOW\n1000 ms: pin 8 HIGH\n4000 ms: pin 8 LOW\n"
  - type: pins
    ms: 2000
    inputs: ["A0 61 at 0", "A0 62 at 400", "A0 61 at 800", "A0 62 at 1200", "A0 61 at 1600"]
    expect: "0 ms: pin 8 LOW\n400 ms: pin 8 HIGH\n"
hints:
  - 'Use two thresholds: switch the fan on when temp > ON_ABOVE, and off when temp < OFF_BELOW.'
  - 'Between the two thresholds, do nothing: the fan keeps whatever state it already had.'
  - 'if (temp > ON_ABOVE) { digitalWrite(FAN, HIGH); } else if (temp < OFF_BELOW) { digitalWrite(FAN, LOW); }'
hintsKid:
  - 'Turn on above 30. Turn off below 27.'
  - 'In between, leave the fan alone.'
  - 'Use `if` and then `else if`.'
---
An on/off controller compares a measurement with a **threshold**: heater on below 20 °C, pump on when the tank is above 80%, fan on above 30 °C. With a single threshold there is a problem.

## Chattering

Real readings are never perfectly steady. Electrical noise, air currents and the ADC's own steps make a reading wobble by a few counts. When the temperature sits right at the threshold, the reading crosses it again and again:

```text
30.2 °C  fan on
29.9 °C  fan off
30.1 °C  fan on
29.8 °C  fan off
```

The fan relay clicks on and off many times a second. That wears out relays and motors, and it is useless: the fan never runs long enough to cool anything. This is called **chattering**.

## Hysteresis: two thresholds

The fix is to switch on and off at **different** values:

- Fan **on** when the temperature rises above 30 °C.
- Fan **off** when it falls below 27 °C.
- Between 27 and 30, leave the fan as it is.

The gap between the thresholds is the **hysteresis band**. Noise smaller than the band can no longer flip the output. A home thermostat does exactly this, which is why the heating runs for a while and then rests.

```arduino
if (temp > ON_ABOVE) {
    digitalWrite(FAN, HIGH);
} else if (temp < OFF_BELOW) {
    digitalWrite(FAN, LOW);
}
// otherwise: no change
```

A wider band means fewer switches but a bigger swing in temperature. Choosing it is a trade-off between wear and accuracy.

## The sensor

An LM35 temperature sensor gives 10 mV per °C, so 0 to 5 V covers 0 to 500 °C. The conversion is:

```arduino
float temp = reading * 500.0 / 1023.0;
```

A reading of 62 is 30.3 °C, 60 is 29.3 °C, and 54 is 26.4 °C. Each ADC step is almost half a degree, which is another reason a reading near the threshold jumps back and forth.

::: kid
A fan should turn on when it gets hot.

But the number from a sensor wobbles a little.

Near the line, the fan would flick on and off.

So we use two lines instead of one.

Turn on above 30. Turn off below 27.

In between, leave the fan as it is.
:::

```arduino {role=example file=thermometer.ino}
// LM35 temperature sensor on A0.
void setup() {
    Serial.begin(9600);
}

void loop() {
    int reading = analogRead(A0);
    float temp = reading * 500.0 / 1023.0;
    Serial.print("Temperature: ");
    Serial.print(temp, 1);
    Serial.println(" C");
    delay(1000);
}
```

::: try
A fan on pin 8 cools a box with an LM35 on A0. The sketch switches the fan at a single threshold, so it chatters. Give it hysteresis: on when the temperature is above `ON_ABOVE`, off when it is below `OFF_BELOW`, and unchanged in between. The fan starts off.
:::

::: try-kid
The fan flicks on and off too much.

Turn it on above 30. Turn it off below 27.

In between, leave it alone.
:::

```arduino {role=starter file=fan.ino}
const int FAN = 8;
const float ON_ABOVE = 30.0;
const float OFF_BELOW = 27.0;

void setup() {
    pinMode(FAN, OUTPUT);
    digitalWrite(FAN, LOW);
}

void loop() {
    int reading = analogRead(A0);
    float temp = reading * 500.0 / 1023.0;

    if (temp > ON_ABOVE) {
        digitalWrite(FAN, HIGH);
    } else {
        digitalWrite(FAN, LOW);
    }
    delay(200);
}
```

```arduino {role=solution file=fan.ino}
const int FAN = 8;
const float ON_ABOVE = 30.0;
const float OFF_BELOW = 27.0;

void setup() {
    pinMode(FAN, OUTPUT);
    digitalWrite(FAN, LOW);
}

void loop() {
    int reading = analogRead(A0);
    float temp = reading * 500.0 / 1023.0;

    if (temp > ON_ABOVE) {
        digitalWrite(FAN, HIGH);
    } else if (temp < OFF_BELOW) {
        digitalWrite(FAN, LOW);
    }
    delay(200);
}
```
