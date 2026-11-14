---
id: embedded.projects.night-light
kind: lesson
track: embedded
unit: b9
order: 2
title: "Project: an automatic night light"
titleKid: A light that wakes up in the dark
language: arduino
circuit:
  - { part: ldr, pin: A0, label: Daylight }
  - { part: led, pin: 9, colour: white, label: Night light }
concepts: [ldr, voltage-divider, threshold, analog-input, if-else]
prereqs: [embedded.arduino.voltage-divider]
est_minutes: 15
checks:
  - type: pins
    ms: 1000
    inputs: ["A0 800 at 0", "A0 150 at 400", "A0 700 at 800"]
    expect: "0 ms: pin 9 LOW\n400 ms: pin 9 HIGH\n800 ms: pin 9 LOW\n"
  - type: pins
    ms: 300
    inputs: ["A0 299 at 0"]
    expect: "0 ms: pin 9 HIGH\n"
hints:
  - 'With the LDR on top of the divider, more light gives a higher reading. Dark means a low reading.'
  - 'The lamp should be on when the reading is below DARK, not above it.'
  - 'if (light < DARK) { digitalWrite(LAMP, HIGH); } else { digitalWrite(LAMP, LOW); }'
hintsKid:
  - 'A dark room gives a small number.'
  - 'The light goes on when the number is small.'
  - 'Use `<` instead of `>`.'
---
Street lights, garden lamps and phone screens all react to how bright it is. This project builds the simplest version: a lamp that switches itself on when the room gets dark.

## What you build

A light-dependent resistor (LDR) on top of a voltage divider with a 10 kΩ resistor, the middle point on A0, and a white LED on pin 9. See the Circuit tab for the wiring and the parts.

## How it works

1. In daylight the LDR's resistance is low (about 10 kΩ), so A0 sits near the middle or higher: readings of 500 or more.
2. In the dark its resistance rises to around 1 MΩ, so A0 drops close to 0 V: readings under 100.
3. The sketch compares the reading with a **threshold**, `DARK = 300`, and switches the lamp.

Pick the threshold from real readings: print the value in your room with the lights on and off, and choose a number between them.

## Make it your own

- Add **hysteresis** (unit B3): on below 250, off above 350, so the lamp does not flicker at dusk.
- Dim instead of switching: `analogWrite(LAMP, map(light, 0, 1023, 255, 0))`, brighter as it gets darker.
- Put the threshold on a knob so the user can set it.

::: kid
This light turns itself on when it gets dark.

A light sensor tells the board how bright it is.

A small number means the room is dark.

Then the board turns the lamp on.
:::

```arduino {role=example file=light_meter.ino}
// A light meter: print how bright it is, twice a second.
void setup() {
    Serial.begin(9600);
}

void loop() {
    int light = analogRead(A0);
    Serial.print("Light: ");
    Serial.print(light);
    Serial.println(light < 300 ? " (dark)" : " (bright)");
    delay(500);
}
```

::: try
The LDR divider is on A0 (brighter gives a higher reading) and the lamp on pin 9. The lamp comes on in daylight and goes off in the dark: the comparison is the wrong way round. Make it switch on when the reading is below `DARK`.
:::

::: try-kid
The lamp comes on in the day. That is wrong.

Make it come on when the number is small.
:::

```arduino {role=starter file=night_light.ino}
const int SENSOR = A0;
const int LAMP = 9;
const int DARK = 300;

void setup() {
    pinMode(LAMP, OUTPUT);
}

void loop() {
    int light = analogRead(SENSOR);
    if (light > DARK) {
        digitalWrite(LAMP, HIGH);
    } else {
        digitalWrite(LAMP, LOW);
    }
    delay(100);
}
```

```arduino {role=solution file=night_light.ino}
const int SENSOR = A0;
const int LAMP = 9;
const int DARK = 300;

void setup() {
    pinMode(LAMP, OUTPUT);
}

void loop() {
    int light = analogRead(SENSOR);
    if (light < DARK) {
        digitalWrite(LAMP, HIGH);
    } else {
        digitalWrite(LAMP, LOW);
    }
    delay(100);
}
```
