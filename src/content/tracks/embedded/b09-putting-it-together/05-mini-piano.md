---
id: embedded.projects.mini-piano
kind: lesson
track: embedded
unit: b9
order: 5
title: "Project: a four-key piano"
titleKid: Press a key, play a note
language: arduino
circuit:
  - { part: button, pin: 2, wiring: pull-up, label: C key }
  - { part: button, pin: 3, wiring: pull-up, label: D key }
  - { part: button, pin: 4, wiring: pull-up, label: E key }
  - { part: button, pin: 5, wiring: pull-up, label: F key }
  - { part: buzzer, pin: 8, label: Speaker }
concepts: [arrays, input-pullup, tone, digital-input]
prereqs: [embedded.projects.melody, embedded.arduino.pullups-debounce]
est_minutes: 16
checks:
  - type: pins
    ms: 1000
    inputs: ["2 LOW at 100", "2 HIGH at 300", "4 LOW at 500", "4 HIGH at 700"]
    expect: "0 ms: tone on pin 8 off\n100 ms: tone on pin 8 at 262 Hz\n300 ms: tone on pin 8 off\n500 ms: tone on pin 8 at 330 Hz\n700 ms: tone on pin 8 off\n"
  - type: pins
    ms: 400
    inputs: ["5 LOW at 100"]
    expect: "0 ms: tone on pin 8 off\n100 ms: tone on pin 8 at 349 Hz\n"
hints:
  - 'KEYS[i] and NOTES[i] belong together: the key in position i plays the note in position i.'
  - 'The loop plays NOTES[0] for every key. It should play the note that matches the key that is down.'
  - 'Inside the if, use tone(BUZZER, NOTES[i]);'
hintsKid:
  - 'Every key plays the same note. That is the bug.'
  - 'Key number i should play note number i.'
  - 'Use `NOTES[i]` in the `tone` line.'
---
Four buttons and a buzzer make a small piano. It brings together reading inputs, arrays and `tone()`, and needs no resistors at all: the buttons use the Uno's built-in pull-ups.

## What you build

Four push buttons on pins 2, 3, 4 and 5, each between its pin and GND, and a passive buzzer on pin 8. With `INPUT_PULLUP`, a key reads HIGH when it is up and LOW while it is pressed.

## Two arrays that match

The keys and their notes sit in two arrays of the same length, so position `i` of one belongs to position `i` of the other:

| i | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| KEYS[i] | 2 | 3 | 4 | 5 |
| NOTES[i] | 262 (C) | 294 (D) | 330 (E) | 349 (F) |

Each time round `loop()`, the sketch looks for the first key that is down and plays its note. If no key is down, it stops the sound.

## Why a variable for "playing"?

`tone` is only called when a key is found; after the loop, `noTone` runs only if none was. Calling `noTone` first and `tone` again every 10 ms would make the sound stutter.

## Make it your own

- Eight keys for a whole octave (pins 2 to 9; move the buzzer to pin 10).
- Show the note's name on the Serial Monitor.
- Record what was played into an array, then play it back.

::: kid
This piano has four buttons.

Each button plays its own note.

Hold a button down to hear its note.

Let go, and the sound stops.
:::

```arduino {role=example file=which_key.ino}
// Print which of the four keys is down.
const int KEYS[] = {2, 3, 4, 5};

void setup() {
    Serial.begin(9600);
    for (int i = 0; i < 4; i++) pinMode(KEYS[i], INPUT_PULLUP);
    Serial.println("Press a key (pins 2 to 5)");
}

void loop() {
    for (int i = 0; i < 4; i++) {
        if (digitalRead(KEYS[i]) == LOW) {
            Serial.print("Key ");
            Serial.println(i + 1);
        }
    }
    delay(200);
}
```

::: try
Four keys on pins 2 to 5 should play C, D, E and F on the buzzer while they are held. The sketch finds the key that is down, but always plays the first note. Make each key play its own note.
:::

::: try-kid
Every key plays the same note.

Make each key play its own note.
:::

```arduino {role=starter file=piano.ino}
const int BUZZER = 8;
const int KEYS[] = {2, 3, 4, 5};
const int NOTES[] = {262, 294, 330, 349};

void setup() {
    for (int i = 0; i < 4; i++) {
        pinMode(KEYS[i], INPUT_PULLUP);
    }
}

void loop() {
    bool playing = false;
    for (int i = 0; i < 4; i++) {
        if (digitalRead(KEYS[i]) == LOW) {
            tone(BUZZER, NOTES[0]);
            playing = true;
            break;
        }
    }
    if (!playing) {
        noTone(BUZZER);
    }
    delay(10);
}
```

```arduino {role=solution file=piano.ino}
const int BUZZER = 8;
const int KEYS[] = {2, 3, 4, 5};
const int NOTES[] = {262, 294, 330, 349};

void setup() {
    for (int i = 0; i < 4; i++) {
        pinMode(KEYS[i], INPUT_PULLUP);
    }
}

void loop() {
    bool playing = false;
    for (int i = 0; i < 4; i++) {
        if (digitalRead(KEYS[i]) == LOW) {
            tone(BUZZER, NOTES[i]);
            playing = true;
            break;
        }
    }
    if (!playing) {
        noTone(BUZZER);
    }
    delay(10);
}
```
