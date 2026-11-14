---
id: embedded.projects.melody
kind: lesson
track: embedded
unit: b9
order: 4
title: "Project: play a melody"
titleKid: Making music with a buzzer
language: arduino
circuit:
  - { part: buzzer, pin: 8, label: Speaker }
concepts: [tone, frequency, arrays, timing]
prereqs: [embedded.arduino.blink]
est_minutes: 14
checks:
  - type: pins
    ms: 1800
    expect: "0 ms: tone on pin 8 at 262 Hz\n300 ms: tone on pin 8 off\n350 ms: tone on pin 8 at 294 Hz\n650 ms: tone on pin 8 off\n700 ms: tone on pin 8 at 330 Hz\n1000 ms: tone on pin 8 off\n1050 ms: tone on pin 8 at 349 Hz\n1350 ms: tone on pin 8 off\n1400 ms: tone on pin 8 at 392 Hz\n1700 ms: tone on pin 8 off\n"
hints:
  - 'Notes that follow each other with no silence run together into one long sound.'
  - 'After each note, stop the buzzer with noTone and wait GAP_MS before the next.'
  - 'tone(BUZZER, NOTES[i]); delay(NOTE_MS); noTone(BUZZER); delay(GAP_MS);'
hintsKid:
  - 'The notes run into each other.'
  - 'Stop the sound after each note.'
  - 'Use `noTone(BUZZER);` and a short wait.'
---
A passive piezo buzzer clicks every time its pin flips between HIGH and LOW. Flip it 440 times a second and you hear the note A. The function `tone()` does the flipping for you, so a melody is just a list of frequencies and how long to play each one.

## What you build

A passive buzzer between pin 8 and GND. That is the whole circuit.

## Notes are frequencies

| Note | C4 | D4 | E4 | F4 | G4 | A4 | B4 | C5 |
|---|---|---|---|---|---|---|---|---|
| Hz | 262 | 294 | 330 | 349 | 392 | 440 | 494 | 523 |

Each octave up doubles the frequency: C5 is 523 Hz, twice C4.

## The code

The tune lives in an **array**, and a `for` loop plays it:

```arduino
const int NOTES[] = {262, 294, 330, 349, 392};
for (int i = 0; i < 5; i++) {
    tone(BUZZER, NOTES[i]);   // start the note
    delay(NOTE_MS);           // let it sound
    noTone(BUZZER);           // stop it
    delay(GAP_MS);            // a short silence
}
```

The short silence matters: without it the notes slur into one wobbling sound, like holding a piano key down while pressing the next.

`tone(pin, frequency, duration)` can also stop a note by itself after `duration` ms, but it does not wait, so a `delay` is still needed before the next note.

## Make it your own

- Add durations in a second array, for a real tune with long and short notes.
- A `0` in the notes array can mean a rest: skip `tone` for it.
- Play the tune when a button is pressed, like a door bell.

::: kid
A buzzer can play music.

Each note is a number that says how high it sounds.

The board plays one note, waits, then stops.

Then it plays the next note.
:::

```arduino {role=example file=siren.ino}
// A two-tone siren.
const int BUZZER = 8;

void setup() {
}

void loop() {
    tone(BUZZER, 660);
    delay(400);
    tone(BUZZER, 440);
    delay(400);
}
```

::: try
The sketch plays the first five notes of a C major scale (C, D, E, F, G), 300 ms each. But there is no silence between the notes, so they run together. After each note, stop the buzzer and wait `GAP_MS` (50 ms) before the next one.
:::

::: try-kid
The notes run into each other.

Stop the buzzer after each note.

Then wait a little before the next note.
:::

```arduino {role=starter file=melody.ino}
const int BUZZER = 8;
const int NOTES[] = {262, 294, 330, 349, 392};
const int NOTE_MS = 300;
const int GAP_MS = 50;

void setup() {
}

void loop() {
    for (int i = 0; i < 5; i++) {
        tone(BUZZER, NOTES[i]);
        delay(NOTE_MS);
    }
    noTone(BUZZER);
    delay(1000);
}
```

```arduino {role=solution file=melody.ino}
const int BUZZER = 8;
const int NOTES[] = {262, 294, 330, 349, 392};
const int NOTE_MS = 300;
const int GAP_MS = 50;

void setup() {
}

void loop() {
    for (int i = 0; i < 5; i++) {
        tone(BUZZER, NOTES[i]);
        delay(NOTE_MS);
        noTone(BUZZER);
        delay(GAP_MS);
    }
    delay(1000);
}
```
