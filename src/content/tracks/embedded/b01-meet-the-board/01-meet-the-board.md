---
id: embedded.arduino.meet-the-board
kind: lesson
track: embedded
unit: b1
order: 1
title: Meet the Arduino
titleKid: A tiny computer you can program
language: arduino
concepts: [microcontroller, arduino-uno, sketch, setup, loop, simulation]
prereqs: [core.c.functions]
links:
  - to: core.c.while
    kind: same-idea
    note: loop() is the while (1) of a microcontroller, run for you.
est_minutes: 12
checks:
  - type: pins
    ms: 1000
    expect: "0 ms: pin 13 HIGH\n"
  - type: code-contains
    pattern: 'pinMode\s*\(\s*(13|LED_BUILTIN)\s*,\s*OUTPUT\s*\)'
    message: 'Sets pin 13 as an output with pinMode'
hints:
  - 'Pin 13 must first be made an output, in setup: pinMode(LED_BUILTIN, OUTPUT); (LED_BUILTIN is another name for 13).'
  - 'Then switch it on, also in setup: digitalWrite(LED_BUILTIN, HIGH);'
  - 'loop() can stay empty: the LED stays on because nothing switches it off.'
hintsKid:
  - 'Tell pin 13 it will send power out: `pinMode(LED_BUILTIN, OUTPUT);`'
  - 'Then switch it on: `digitalWrite(LED_BUILTIN, HIGH);`'
  - 'Both lines go inside `setup()`.'
---
A **microcontroller** is a whole small computer on one chip: a processor, memory for the program, a little memory for variables, and **pins** that connect it to the outside world. Microcontrollers are in washing machines, car doors, toys, 3D printers and almost every machine a mechatronics engineer builds. They are cheap, use little power, and run one program from the moment they get power.

The **Arduino Uno** is a board built around one such chip, the ATmega328P, with everything needed to use it: a USB connection to the computer, a power socket, and labelled pin headers. It is the most common board for learning, and what this track uses.

## The parts of an Uno

| Part | What it does |
|---|---|
| ATmega328P chip | the microcontroller: runs your program at 16 MHz |
| USB socket | power, and the link to the computer for uploading programs and for Serial messages |
| Power jack and regulator | power from a 7 to 12 V supply, turned into the 5 V the chip needs |
| Digital pins 0 to 13 | each can be an output (on or off) or an input (is it on?) |
| Analog pins A0 to A5 | measure voltages, for example from sensors |
| Power pins: 5V, 3.3V, GND, Vin | power for small parts you connect |
| LED marked "L" | a built-in LED on pin 13, handy for tests |
| Reset button | starts the program again from the beginning |

## A sketch: setup and loop

An Arduino program is called a **sketch**. It is C++, and instead of `main` it has two functions:

```arduino
void setup() {
    // runs once, when the board starts
}

void loop() {
    // runs again and again, for as long as the board has power
}
```

The Arduino system writes the `main` for you: it calls `setup()` once and then calls `loop()` forever, which is what a machine controller does: start up, then keep checking and acting until it is switched off. There is no "end" to a sketch.

`pinMode(13, OUTPUT)` tells the chip that pin 13 will send power out; `digitalWrite(13, HIGH)` switches it on (5 V) and `digitalWrite(13, LOW)` off (0 V). Both are covered properly in the next lessons.

## Upload or simulate

With a real board, the Arduino IDE compiles the sketch on your computer and **uploads** it over USB into the chip's memory, where it stays even without power. Here, the sketch runs on a **simulated** Uno instead: the code is compiled by a real C++ compiler, and a virtual board plays the part of the chip and its pins.

Board time is simulated too. When the sketch waits with `delay(1000)`, the virtual clock jumps forward a second at once, so ten seconds of board time take a moment to run. After the run you see:

- whatever the sketch printed with `Serial` (lesson 3), and
- **the pins over time**: every change of an output pin, with the board time when it happened, such as `500 ms: pin 13 LOW`.

The checks in this track look at those pin changes. Everything you learn here works the same on a real Uno.

::: kid
An Arduino is a tiny computer on a small board.

It has pins along the sides, like little sockets.

Wires and lights plug into the pins.

Your program has two parts.

`setup()` runs once at the start.

`loop()` runs again and again, for ever.
:::

```arduino {role=example file=hello-board.ino}
void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
    Serial.begin(9600);
    Serial.println("Board started");
}

void loop() {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(1000);
    digitalWrite(LED_BUILTIN, LOW);
    delay(1000);
}
```

::: try
Make the board's built-in LED on pin 13 switch on when the board starts, and stay on. Set the pin as an output and switch it on, both in `setup()`.
:::

::: try-kid
Make the little light on the board turn on.

It should stay on.

Put your lines inside `setup()`.
:::

```arduino {role=starter file=led-on.ino}
void setup() {
    // Make pin 13 an output and switch it on.
}

void loop() {
}
```

```arduino {role=solution file=led-on.ino}
void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, HIGH);
}

void loop() {
}
```
