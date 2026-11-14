---
id: embedded.arduino.timers-and-drift
kind: lesson
track: embedded
unit: b5
order: 4
title: Timers and drift
titleKid: A clock that keeps good time
language: arduino
concepts: [timer, drift, millis, timing]
prereqs: [embedded.arduino.two-blinkers]
est_minutes: 14
checks:
  - type: stdout-equals
    ms: 3500
    expect: "1020\n2010\n3000\n"
hints:
  - 'lastReport = now starts the next second from whenever the check happened to run, so every late check pushes all later ones back.'
  - 'Move lastReport on by exactly one interval instead, so the reports stay on the 1000 ms grid.'
  - 'lastReport += INTERVAL;'
hintsKid:
  - 'Each report is a little later than the one before.'
  - 'Add exactly 1000 to the time note.'
  - 'Try `lastReport += INTERVAL;`.'
---
## Where millis() comes from

A microcontroller has **timers**: counters that tick along with the clock on their own, whatever the program is doing. An Uno's ATmega328P has three (Timer0, Timer1 and Timer2).

- **Timer0** counts all the time. Each time it overflows (about every 1.024 ms) it adds to a counter, and `millis()` reads that counter. Timer0 also makes PWM on pins 5 and 6.
- **Timer1** makes PWM on pins 9 and 10, and the Servo library borrows it.
- **Timer2** makes PWM on pins 3 and 11, and `tone()` borrows it.

That is why `tone()` can upset PWM on pin 3 or 11, and the Servo library on 9 or 10: two jobs want the same timer. Unit B6 uses a timer to run code at exact intervals.

## Drift

A job that should run every second often runs a little late: `loop()` was busy elsewhere when the second came up. If the sketch then counts the next second from *that* moment, the lateness adds up:

| Code | Reports at |
|---|---|
| `lastReport = now;` | 1020, 2040, 3060 ... (20 ms later every time) |
| `lastReport += INTERVAL;` | 1020, 2010, 3000 ... (stays on time on average) |

Over a day, 20 ms a second becomes almost half an hour. A clock, a data logger or a sampling loop must not **drift**, so it moves its "last" time on by exactly one interval. A blink that only needs to look regular can use either.

::: kid
This sketch should report once every second.

Sometimes it is a little late.

If a late report moves the next one, they drift later.

So we add exactly one second each time.
:::

```arduino {role=example file=late_checks.ino}
// The loop is busy for 30 ms at a time, so checks come up to 30 ms late.
unsigned long lastReport = 0;

void setup() {
    Serial.begin(9600);
}

void loop() {
    unsigned long now = millis();
    if (now - lastReport >= 1000) {
        Serial.print("Late by ");
        Serial.print(now - lastReport - 1000);
        Serial.println(" ms");
        lastReport = now;
    }
    delay(30);
}
```

::: try
The sketch should report the time every second (`INTERVAL`). The loop also does 30 ms of other work, so each report is a little late, and because `lastReport` is set to `now`, every later report is pushed back too: it prints 1020, 2040, 3060. Make it keep to the 1000 ms grid (1020, 2010, 3000) by moving `lastReport` on by exactly one interval.
:::

::: try-kid
The reports get later and later.

Add exactly `INTERVAL` to `lastReport` each time.
:::

```arduino {role=starter file=no_drift.ino}
const unsigned long INTERVAL = 1000;
unsigned long lastReport = 0;

void setup() {
    Serial.begin(9600);
}

void loop() {
    unsigned long now = millis();
    if (now - lastReport >= INTERVAL) {
        lastReport = now;
        Serial.println(now);
    }
    delay(30);   // other work: reading sensors, updating a screen
}
```

```arduino {role=solution file=no_drift.ino}
const unsigned long INTERVAL = 1000;
unsigned long lastReport = 0;

void setup() {
    Serial.begin(9600);
}

void loop() {
    unsigned long now = millis();
    if (now - lastReport >= INTERVAL) {
        lastReport += INTERVAL;
        Serial.println(now);
    }
    delay(30);   // other work: reading sensors, updating a screen
}
```
