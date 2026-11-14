---
id: embedded.arduino.isr-rules
kind: lesson
track: embedded
unit: b6
order: 2
title: Rules for interrupt routines
titleKid: Be quick at the door
language: arduino
circuit:
  - { part: button, pin: 2, wiring: pull-up, label: Doorbell }
concepts: [isr, volatile, critical-section, flag]
prereqs: [embedded.arduino.interrupts]
est_minutes: 16
checks:
  - type: stdout-equals
    ms: 1500
    inputs: ["2 LOW at 300", "2 HIGH at 350", "2 LOW at 1200", "2 HIGH at 1250"]
    expect: "Pressed at 300 ms\nPressed at 1200 ms\n"
  - type: no-board-notes
    ms: 1500
    inputs: ["2 LOW at 300", "2 HIGH at 350"]
    message: "The routine does no printing and no waiting"
hints:
  - 'The output is right, but the routine prints and waits, and the simulator notes both. On a real board this can freeze.'
  - 'In the routine, only note what happened: set pressed = true and pressedAt = millis(). Print from loop() when pressed is true.'
  - 'In loop(): if (pressed) { noInterrupts(); unsigned long at = pressedAt; pressed = false; interrupts(); ...print at... }'
hintsKid:
  - 'The door job is too slow.'
  - 'Just make a note in the door job.'
  - 'Print the note later, in `loop`.'
---
An interrupt routine stops everything else, including the timer interrupt behind `millis()` and the one that sends Serial text. So routines follow a few rules.

## 1. Be short

Do the least you can: count, note a time, set a **flag** (a `bool` that says "this happened"). Do the real work in `loop()` when it sees the flag.

## 2. No delay(), and no Serial

- `delay()` waits for `millis()` to move on, but `millis()` stands still while a routine runs. It hangs or does nothing.
- `Serial.print` puts text in a buffer that an interrupt empties. A short message may get through; a long one can freeze the board.

The simulator notes both if it sees them.

## 3. Mark shared variables `volatile`

The compiler may keep a variable in a register while `loop()` runs, and never notice that a routine changed it in memory. `volatile` tells it to read the variable from memory every time.

## 4. Copy shared values with interrupts off

On an Uno, an `unsigned long` is four bytes, read one byte at a time. If the routine changes it halfway through a read, `loop()` gets half old, half new. Turning interrupts off for the copy makes it safe; an interrupt that comes in meanwhile waits and runs as soon as they are back on:

```arduino
noInterrupts();
unsigned long at = pressedAt;
pressed = false;
interrupts();
```

This short protected stretch is a **critical section**. Keep it as short as the routine itself.

::: kid
When the doorbell rings, you go to the door fast.

You do not stop to write a long letter.

The door job just makes a note.

The board reads the note later, when it has time.
:::

```arduino {role=example file=flag.ino}
// The routine only sets a flag; loop() does the slow part.
volatile bool rang = false;

void doorbell() {
    rang = true;
}

void setup() {
    Serial.begin(9600);
    pinMode(2, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(2), doorbell, FALLING);
    Serial.println("Waiting for the doorbell");
}

void loop() {
    if (rang) {
        rang = false;
        Serial.println("Ding dong!");
    }
}
```

::: try
Each press of the button on pin 2 should print `Pressed at N ms`. The sketch does that, but inside the interrupt routine, and it waits there too, which breaks the rules. Make `onPress` only set `pressed` and `pressedAt`, and print from `loop()`: copy `pressedAt` and clear `pressed` with interrupts turned off, then print.
:::

::: try-kid
The door job prints and waits. It should only make a note.

Print the message in `loop` instead.
:::

```arduino {role=starter file=doorbell.ino}
const int BUTTON = 2;
volatile bool pressed = false;
volatile unsigned long pressedAt = 0;

void onPress() {
    Serial.print("Pressed at ");
    Serial.print(millis());
    Serial.println(" ms");
    delay(50);
}

void setup() {
    Serial.begin(9600);
    pinMode(BUTTON, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(BUTTON), onPress, FALLING);
}

void loop() {
}
```

```arduino {role=solution file=doorbell.ino}
const int BUTTON = 2;
volatile bool pressed = false;
volatile unsigned long pressedAt = 0;

void onPress() {
    pressed = true;
    pressedAt = millis();
}

void setup() {
    Serial.begin(9600);
    pinMode(BUTTON, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(BUTTON), onPress, FALLING);
}

void loop() {
    if (pressed) {
        noInterrupts();
        unsigned long at = pressedAt;
        pressed = false;
        interrupts();
        Serial.print("Pressed at ");
        Serial.print(at);
        Serial.println(" ms");
    }
}
```
