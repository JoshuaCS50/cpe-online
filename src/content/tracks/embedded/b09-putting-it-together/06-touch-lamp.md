---
id: embedded.projects.touch-lamp
kind: lesson
track: embedded
unit: b9
order: 6
title: "Project: an ESP32 touch lamp"
titleKid: Tap to switch on, tap to switch off
language: arduino
board: esp32
circuit:
  - { part: touch-pad, pin: 4, label: Lamp switch }
  - { part: led, pin: 23, colour: white, label: Lamp }
concepts: [capacitive-touch, touch-read, edge-detection, threshold]
prereqs: [embedded.esp32.touch-pins]
est_minutes: 15
checks:
  - type: pins
    ms: 1500
    inputs: ["GPIO 4 12 at 200", "GPIO 4 70 at 400", "GPIO 4 12 at 800", "GPIO 4 70 at 1000"]
    expect: "0 ms: GPIO 23 LOW\n200 ms: GPIO 23 HIGH\n800 ms: GPIO 23 LOW\n"
  - type: pins
    ms: 600
    inputs: ["GPIO 4 12 at 100"]
    expect: "0 ms: GPIO 23 LOW\n100 ms: GPIO 23 HIGH\n"
hints:
  - 'The lamp should change only at the moment a touch starts, not for as long as the finger stays.'
  - 'Remember whether the pad was touched last time round (wasTouched). A touch starts when it is touched now but was not before.'
  - 'if (touched && !wasTouched) { lampOn = !lampOn; digitalWrite(LAMP, lampOn ? HIGH : LOW); } wasTouched = touched;'
hintsKid:
  - 'The lamp should change once per tap.'
  - 'Remember if the pad was touched last time.'
  - 'Change the lamp only when a new touch starts.'
---
Touch lamps switch on with a tap anywhere on their metal body, and off with another tap. The ESP32's touch pins make one with no button at all: a coin, a strip of foil or the lamp's metal base wired to GPIO 4.

## What you build

A touch pad on GPIO 4 (T0) and a white LED with its resistor on GPIO 23, the ESP32 sitting on a full-size breadboard. The Circuit tab lists the parts and the wiring.

## From "touched" to "tapped"

`touchRead(4)` falls from about 70 to 10 to 20 while a finger is on the pad, so `touchRead(4) < THRESHOLD` says **touched**. But a lamp that follows "touched" is only on while your finger stays there. A switch needs the **moment** a touch begins: an **edge**.

```arduino
bool touched = touchRead(TOUCH) < THRESHOLD;
if (touched && !wasTouched) {   // touched now, not a moment ago
    lampOn = !lampOn;           // flip the lamp
}
wasTouched = touched;           // remember for next time
```

Each tap flips `lampOn` exactly once, however long the finger stays.

## Make it your own

- Hold for one second to dim: count how long `touched` stays true.
- Add a second pad for brightness up and down with LEDC.
- Save the lamp state in `RTC_DATA_ATTR` and sleep between taps, waking on touch.

::: kid
This lamp has no button.

You tap a metal pad to switch it on.

Tap again to switch it off.

The board notices the moment your finger lands.
:::

```arduino {role=example file=tap_counter.ino}
// Count taps on the pad and print the count.
const int TOUCH = 4;
const int THRESHOLD = 30;
bool wasTouched = false;
int taps = 0;

void setup() {
    Serial.begin(115200);
    Serial.println("Tap the pad on GPIO 4");
}

void loop() {
    bool touched = touchRead(TOUCH) < THRESHOLD;
    if (touched && !wasTouched) {
        taps++;
        Serial.print("Taps: ");
        Serial.println(taps);
    }
    wasTouched = touched;
    delay(20);
}
```

::: try
The lamp on GPIO 23 follows the touch pad on GPIO 4: it is on only while a finger stays on the pad. Make it a real touch switch: each new touch flips the lamp, on then off, and letting go changes nothing.
:::

::: try-kid
The lamp is only on while you touch the pad.

Make each tap switch it on or off.
:::

```arduino {role=starter file=touch_lamp.ino}
const int TOUCH = 4;
const int LAMP = 23;
const int THRESHOLD = 30;

bool lampOn = false;
bool wasTouched = false;

void setup() {
    pinMode(LAMP, OUTPUT);
    digitalWrite(LAMP, LOW);
}

void loop() {
    bool touched = touchRead(TOUCH) < THRESHOLD;
    digitalWrite(LAMP, touched ? HIGH : LOW);
    delay(20);
}
```

```arduino {role=solution file=touch_lamp.ino}
const int TOUCH = 4;
const int LAMP = 23;
const int THRESHOLD = 30;

bool lampOn = false;
bool wasTouched = false;

void setup() {
    pinMode(LAMP, OUTPUT);
    digitalWrite(LAMP, LOW);
}

void loop() {
    bool touched = touchRead(TOUCH) < THRESHOLD;
    if (touched && !wasTouched) {
        lampOn = !lampOn;
        digitalWrite(LAMP, lampOn ? HIGH : LOW);
    }
    wasTouched = touched;
    delay(20);
}
```
