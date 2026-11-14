---
id: embedded.arduino.pullups-debounce
kind: lesson
track: embedded
unit: b2
order: 3
title: Pull-ups and debouncing
titleKid: Counting presses properly
language: arduino
circuit:
  - { part: button, pin: 2, wiring: pull-up }
concepts: [input-pullup, active-low, contact-bounce, debouncing, edge-detection, millis]
prereqs: [embedded.arduino.buttons]
est_minutes: 18
checks:
  - type: stdout-equals
    ms: 1500
    inputs: ["2 LOW at 100", "2 HIGH at 102", "2 LOW at 104", "2 HIGH at 400", "2 LOW at 403", "2 HIGH at 405", "2 LOW at 800", "2 HIGH at 1100"]
    expect: "Presses: 1\nPresses: 2\n"
  - type: stdout-equals
    ms: 1500
    inputs: ["2 LOW at 200", "2 HIGH at 900"]
    expect: "Presses: 1\n"
  - type: stdout-equals
    ms: 1000
    inputs: ["2 LOW at 300", "2 HIGH at 320"]
    expect: ""
  - type: code-contains
    pattern: 'INPUT_PULLUP'
    message: 'Uses the built-in pull-up with INPUT_PULLUP'
hints:
  - 'Remember when the reading last changed: if (reading != lastReading) { lastChange = millis(); lastReading = reading; }'
  - 'Only believe a reading that has stayed the same for DEBOUNCE_MS: if (millis() - lastChange >= DEBOUNCE_MS && reading != stableState) { ... }'
  - 'Inside that if, set stableState = reading; and count a press only when the new stable state is LOW (pressed, with a pull-up).'
hintsKid:
  - 'Note the time each time the reading changes.'
  - 'Only trust a reading that stays the same for 50 ms.'
  - 'Count a press when the trusted reading becomes LOW.'
---
The button from the last lesson needed an extra resistor, and it has a hidden problem that makes a press-counter go wrong. This lesson fixes both.

## The built-in pull-up

The ATmega chip has a resistor inside each pin that can pull the pin up to 5 V. Switch it on with:

```arduino
pinMode(BUTTON, INPUT_PULLUP);
```

Now wire the button from the pin straight to **GND**, with no resistor at all. While released, the internal resistor holds the pin at 5 V: it reads `HIGH`. Pressed, the button connects the pin to GND: it reads `LOW`.

So with a pull-up, **pressed is LOW**. This "active low" logic looks backwards at first, but it is how most real machines wire their buttons and switches: one less part, and a broken wire reads as "not pressed", which is usually the safe side.

## Contact bounce

A button is two pieces of metal snapping together. Under a microscope, they hit, spring apart and hit again several times in the first few milliseconds. A microcontroller is fast enough to see every one of those touches, so a single press can read like this:

```
100 ms: LOW    (pressed)
102 ms: HIGH   (bounced apart)
104 ms: LOW    (touching again, now for good)
```

A sketch that counts every change from HIGH to LOW counts that press twice, and the release can bounce too. This is called **contact bounce**, and every mechanical switch does it.

## Debouncing

The cure is to only believe a reading that has stayed the same for a little while, typically 20 to 50 ms, longer than any bounce:

```arduino
int reading = digitalRead(BUTTON);
if (reading != lastReading) {          // it moved: start timing again
    lastChange = millis();
    lastReading = reading;
}
if (millis() - lastChange >= DEBOUNCE_MS && reading != stableState) {
    stableState = reading;             // it has held still long enough: believe it
    if (stableState == LOW) {
        // a real press
    }
}
```

`millis()` is the time in ms since the board started. Comparing "now minus then" with a limit is the standard way to measure time intervals without stopping the program (unit B5 builds on it). The same idea also ignores short electrical noise: a glitch that lasts less than `DEBOUNCE_MS` is never believed.

## Counting presses: edges

To count presses, look for the moment the stable state **changes** to pressed (an **edge**), not for "is pressed". Checking only `stableState == LOW` on every loop would count thousands of times while the button is held. PLC programmers meet the same idea as a positive-edge contact (track C).

::: kid
A button can be wired to use a helper inside the board.

Then the pin reads HIGH when you let go.

It reads LOW when you press.

When you press, the metal inside bounces for a moment.

The board sees many quick presses instead of one.

So we wait until the button is still before we count.
:::

```arduino {role=example file=bounce-demo.ino}
const int BUTTON = 2;
int lastReading = HIGH;
int changes = 0;

void setup() {
    pinMode(BUTTON, INPUT_PULLUP);
    Serial.begin(9600);
    Serial.println("Counting every change, with no debouncing");
}

void loop() {
    int reading = digitalRead(BUTTON);
    if (reading != lastReading) {
        changes++;
        Serial.print(millis());
        Serial.print(" ms: change ");
        Serial.println(changes);
        lastReading = reading;
    }
    if (millis() > 3000) {
        Serial.println("Done");
        delay(10000);
    }
}
```

::: try
A button on pin 2 is wired to GND and uses the built-in pull-up, so it reads LOW while pressed. Count the presses and print `Presses: 1`, `Presses: 2` and so on, once per press. The real button bounces, and the starter counts every bounce. Debounce it: only believe a reading that has stayed the same for `DEBOUNCE_MS`, so that bounces and short glitches are not counted.
:::

::: try-kid
Count how many times the button is pressed.

The button bounces, so it looks like many presses.

Only count a press once the button stays still for 50 ms.
:::

```arduino {role=starter file=press-counter.ino}
const int BUTTON = 2;
const unsigned long DEBOUNCE_MS = 50;

int presses = 0;
int lastReading = HIGH;

void setup() {
    pinMode(BUTTON, INPUT_PULLUP);
    Serial.begin(9600);
}

void loop() {
    int reading = digitalRead(BUTTON);
    // Counts every change to LOW, bounces included.
    if (reading == LOW && lastReading == HIGH) {
        presses++;
        Serial.print("Presses: ");
        Serial.println(presses);
    }
    lastReading = reading;
}
```

```arduino {role=solution file=press-counter.ino}
const int BUTTON = 2;
const unsigned long DEBOUNCE_MS = 50;

int presses = 0;
int lastReading = HIGH;
int stableState = HIGH;
unsigned long lastChange = 0;

void setup() {
    pinMode(BUTTON, INPUT_PULLUP);
    Serial.begin(9600);
}

void loop() {
    int reading = digitalRead(BUTTON);
    if (reading != lastReading) {
        lastChange = millis();
        lastReading = reading;
    }
    if (millis() - lastChange >= DEBOUNCE_MS && reading != stableState) {
        stableState = reading;
        if (stableState == LOW) {
            presses++;
            Serial.print("Presses: ");
            Serial.println(presses);
        }
    }
}
```
