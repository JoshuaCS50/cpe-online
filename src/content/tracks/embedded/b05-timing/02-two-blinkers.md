---
id: embedded.arduino.two-blinkers
kind: lesson
track: embedded
unit: b5
order: 2
title: Several things at once
titleKid: Two lights, two speeds
language: arduino
circuit:
  - { part: led, pin: 13, colour: red, label: Fast }
  - { part: led, pin: 12, colour: yellow, label: Slow }
concepts: [millis, non-blocking, multitasking, rollover]
prereqs: [embedded.arduino.delay-vs-millis]
est_minutes: 14
checks:
  - type: pins
    ms: 1300
    expect: "300 ms: pin 13 HIGH\n500 ms: pin 12 HIGH\n600 ms: pin 13 LOW\n900 ms: pin 13 HIGH\n1000 ms: pin 12 LOW\n1200 ms: pin 13 LOW\n"
hints:
  - 'Both blinkers share one lastToggle, so the fast one keeps resetting the clock the slow one is waiting on.'
  - 'Give each blinker its own lastToggle: lastFast and lastSlow.'
  - 'if (now - lastSlow >= SLOW_MS) { lastSlow = now; ... }'
hintsKid:
  - 'The slow light never blinks.'
  - 'Both lights share one clock note.'
  - 'Give each light its own.'
---
With `delay`, two LEDs blinking at different speeds is a puzzle. With `millis`, it is easy: give each job its own "last time I did this" and its own interval, and check them one after another in `loop()`.

```arduino
if (now - lastFast >= FAST_MS) { lastFast = now; /* fast job */ }
if (now - lastSlow >= SLOW_MS) { lastSlow = now; /* slow job */ }
```

Each check takes a few microseconds, so `loop()` runs thousands of times a second and every job gets its turn on time. This is how one small board can blink a status light, read sensors, update a screen and answer buttons all "at once": it is really doing a little of each, very often. It is called cooperative **multitasking**; each job must give the others a turn by never waiting.

## Rules that keep it working

- One `last...` variable per job, never shared.
- No `delay()` anywhere in `loop()` (or in anything it calls).
- Keep each job short; a slow job (such as a long calculation) delays all the others.
- Use `unsigned long` and `now - last >= interval`, so it survives the counter going back to 0 after 49.7 days (**rollover**).

::: kid
Two lights blink at two speeds.

Each light keeps its own note of the time.

The board checks both notes, again and again.
:::

```arduino {role=example file=three_jobs.ino}
// Three jobs at three speeds, with no delay.
unsigned long lastBlink = 0;
unsigned long lastPrint = 0;
unsigned long lastCount = 0;
int count = 0;

void setup() {
    Serial.begin(9600);
    pinMode(13, OUTPUT);
}

void loop() {
    unsigned long now = millis();
    if (now - lastBlink >= 250) {
        lastBlink = now;
        digitalWrite(13, !digitalRead(13));
    }
    if (now - lastCount >= 100) {
        lastCount = now;
        count++;
    }
    if (now - lastPrint >= 1000) {
        lastPrint = now;
        Serial.println(count);
    }
}
```

::: try
The LED on pin 13 should change every 300 ms (`FAST_MS`) and the LED on pin 12 every 500 ms (`SLOW_MS`). The two blinkers share one `lastToggle`, so the slow one never gets its turn. Give each blinker its own variable, `lastFast` and `lastSlow`.
:::

::: try-kid
The slow light never blinks.

Give each light its own time note.
:::

```arduino {role=starter file=two_blinkers.ino}
const int FAST = 13;
const int SLOW = 12;
const unsigned long FAST_MS = 300;
const unsigned long SLOW_MS = 500;

unsigned long lastToggle = 0;
int fastState = LOW;
int slowState = LOW;

void setup() {
    pinMode(FAST, OUTPUT);
    pinMode(SLOW, OUTPUT);
}

void loop() {
    unsigned long now = millis();
    if (now - lastToggle >= FAST_MS) {
        lastToggle = now;
        fastState = !fastState;
        digitalWrite(FAST, fastState);
    }
    if (now - lastToggle >= SLOW_MS) {
        lastToggle = now;
        slowState = !slowState;
        digitalWrite(SLOW, slowState);
    }
}
```

```arduino {role=solution file=two_blinkers.ino}
const int FAST = 13;
const int SLOW = 12;
const unsigned long FAST_MS = 300;
const unsigned long SLOW_MS = 500;

unsigned long lastFast = 0;
unsigned long lastSlow = 0;
int fastState = LOW;
int slowState = LOW;

void setup() {
    pinMode(FAST, OUTPUT);
    pinMode(SLOW, OUTPUT);
}

void loop() {
    unsigned long now = millis();
    if (now - lastFast >= FAST_MS) {
        lastFast = now;
        fastState = !fastState;
        digitalWrite(FAST, fastState);
    }
    if (now - lastSlow >= SLOW_MS) {
        lastSlow = now;
        slowState = !slowState;
        digitalWrite(SLOW, slowState);
    }
}
```
