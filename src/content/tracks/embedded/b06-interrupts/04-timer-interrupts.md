---
id: embedded.arduino.timer-interrupts
kind: lesson
track: embedded
unit: b6
order: 4
title: Timer interrupts
titleKid: An alarm clock inside the chip
language: arduino
circuit:
  - { part: led, pin: 13, colour: red, label: Heartbeat }
concepts: [timer-interrupt, timer, microseconds, isr]
prereqs: [embedded.arduino.isr-rules, embedded.arduino.timers-and-drift]
est_minutes: 16
checks:
  - type: pins
    ms: 1100
    expect: "250 ms: pin 13 HIGH\n500 ms: pin 13 LOW\n750 ms: pin 13 HIGH\n1000 ms: pin 13 LOW\n"
hints:
  - 'Timer1.initialize takes microseconds, not milliseconds: 250 is a quarter of a millisecond.'
  - '250 ms is 250 000 µs.'
  - 'Timer1.initialize(250000);'
hintsKid:
  - 'The light flickers far too fast.'
  - 'The timer counts in millionths of a second.'
  - 'A quarter second is 250000.'
---
A pin interrupt runs a routine when something happens outside. A **timer interrupt** runs one when a hardware timer comes due: every 250 ms, say, exactly, whatever `loop()` is busy with. Even `delay()` does not hold it up.

## On an Uno: TimerOne

Timer1 can count to a chosen period and raise an interrupt each time. The `TimerOne` library sets it up in **microseconds** (millionths of a second):

```arduino
#include <TimerOne.h>

void tick() {          // runs every 250 000 µs = 250 ms
    // ...
}

void setup() {
    Timer1.initialize(250000);
    Timer1.attachInterrupt(tick);
}
```

Timer1 is also what makes PWM on pins 9 and 10 and what the Servo library uses, so a sketch cannot use TimerOne together with them.

## On an ESP32: hardware timers

```arduino
hw_timer_t *timer = timerBegin(1000000);         // 1 000 000 ticks per second
timerAttachInterrupt(timer, &tick);
timerAlarm(timer, 250000, true, 0);              // every 250 000 ticks, repeating
```

Mark ESP32 routines `IRAM_ATTR` (`void IRAM_ATTR tick()`), so they are kept in fast memory.

## What they are used for

Sampling a sensor at exactly 100 times a second (needed for filters and audio), stepping a motor at an exact speed, multiplexing a display, a watchdog that notices a stuck program, or a heartbeat LED that shows the board is alive. The routine rules from the last lessons still apply: short, no `delay`, no `Serial`, `volatile` for shared variables.

::: kid
The chip has a little alarm clock inside.

It can ring every quarter of a second.

Each ring makes the light change.

The rest of the sketch keeps working at the same time.
:::

```arduino {role=example file=sample_rate.ino}
// Take a reading 10 times a second with a timer, and print the count.
#include <TimerOne.h>

volatile unsigned int samples = 0;

void takeSample() {
    samples++;
}

void setup() {
    Serial.begin(9600);
    Timer1.initialize(100000);
    Timer1.attachInterrupt(takeSample);
}

void loop() {
    delay(1000);
    noInterrupts();
    unsigned int count = samples;
    interrupts();
    Serial.print("Samples so far: ");
    Serial.println(count);
}
```

::: try
The LED on pin 13 should change every 250 ms, driven by a Timer1 interrupt, while `loop()` does its own slow work. It flickers thousands of times a second instead, because the period is given in the wrong unit. Fix the call to `Timer1.initialize`.
:::

::: try-kid
The light should change four times a second.

It flickers much too fast. Fix the number for the timer.
:::

```arduino {role=starter file=heartbeat.ino}
#include <TimerOne.h>

const int LED = 13;
volatile bool on = false;

void heartbeat() {
    on = !on;
    digitalWrite(LED, on);
}

void setup() {
    Serial.begin(9600);
    pinMode(LED, OUTPUT);
    Timer1.initialize(250);
    Timer1.attachInterrupt(heartbeat);
}

void loop() {
    Serial.println("Working...");
    delay(400);
}
```

```arduino {role=solution file=heartbeat.ino}
#include <TimerOne.h>

const int LED = 13;
volatile bool on = false;

void heartbeat() {
    on = !on;
    digitalWrite(LED, on);
}

void setup() {
    Serial.begin(9600);
    pinMode(LED, OUTPUT);
    Timer1.initialize(250000);
    Timer1.attachInterrupt(heartbeat);
}

void loop() {
    Serial.println("Working...");
    delay(400);
}
```
