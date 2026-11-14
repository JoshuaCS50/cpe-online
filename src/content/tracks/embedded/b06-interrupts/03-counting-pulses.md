---
id: embedded.arduino.counting-pulses
kind: lesson
track: embedded
unit: b6
order: 3
title: Counting pulses from a wheel
titleKid: How fast is the wheel turning?
language: arduino
circuit:
  - { part: button, pin: 2, wiring: pull-up, label: Wheel sensor }
concepts: [interrupt-modes, hall-sensor, rpm, critical-section]
prereqs: [embedded.arduino.isr-rules]
est_minutes: 16
checks:
  - type: stdout-equals
    ms: 2100
    inputs: ["2 LOW at 100", "2 HIGH at 150", "2 LOW at 300", "2 HIGH at 350", "2 LOW at 500", "2 HIGH at 550", "2 LOW at 700", "2 HIGH at 750", "2 LOW at 900", "2 HIGH at 950", "2 LOW at 1100", "2 HIGH at 1150", "2 LOW at 1600", "2 HIGH at 1650"]
    expect: "Pulses: 5, 300 RPM\nPulses: 2, 120 RPM\n"
hints:
  - 'Every count is twice too high: CHANGE runs the routine when the magnet arrives and again when it leaves.'
  - 'Count only one edge of each pulse. The sensor pulls the pin LOW as the magnet passes, so count the fall.'
  - 'attachInterrupt(digitalPinToInterrupt(SENSOR), onMagnet, FALLING);'
hintsKid:
  - 'Every number is twice too big.'
  - 'Each pass of the magnet is counted twice.'
  - 'Use `FALLING` instead of `CHANGE`.'
---
Bike computers, car speedometers, fan speed monitors and water flow meters all count pulses: a magnet or a slot goes past a sensor once per turn, and the board counts how many go past each second.

## The sensor

A **Hall-effect sensor** (such as the A3144) switches when a magnet comes close. Its output is "open collector": it pulls the pin to GND while the magnet is near and lets go otherwise, so it needs a pull-up (`INPUT_PULLUP` will do). Each pass of the magnet is one short LOW pulse. An IR slot sensor with a slotted disc works the same way.

## Which edge?

| Mode | Runs the routine when the pin goes | Counts per pulse |
|---|---|---|
| `FALLING` | HIGH to LOW | 1 |
| `RISING` | LOW to HIGH | 1 |
| `CHANGE` | either way | 2 |

Pulses can be much too fast for `loop()` to poll reliably (a fan at 3000 RPM with two magnets gives 100 pulses a second, each a few milliseconds long), which is why counting is done in an interrupt.

## From pulses to RPM

Count for one second, then take the count and start again (with interrupts off for the copy):

**RPM = pulses per second × 60 ÷ magnets per turn**

With one magnet, 5 pulses in a second is 300 revolutions per minute.

::: kid
A magnet on the wheel passes a sensor once each turn.

Each pass makes one short pulse.

The board counts the pulses for one second.

More pulses means a faster wheel.
:::

```arduino {role=example file=pulse_led.ino}
// The LED follows the sensor: on while the magnet is near.
void onChange() {
    digitalWrite(13, digitalRead(2) == LOW);
}

void setup() {
    pinMode(13, OUTPUT);
    pinMode(2, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(2), onChange, CHANGE);
    Serial.begin(9600);
    Serial.println("Move the magnet past the sensor");
}

void loop() {
}
```

::: try
The sketch counts the magnet's pulses on pin 2 for a second at a time and prints the count and the speed in RPM (one magnet). Every count is twice what it should be. Fix the interrupt mode so each pass of the magnet counts once: the sensor pulls the pin LOW as the magnet passes.
:::

::: try-kid
Each pulse is counted twice.

Count only when the pin goes from HIGH to LOW.
:::

```arduino {role=starter file=tachometer.ino}
const int SENSOR = 2;
const int MAGNETS = 1;
volatile unsigned int pulses = 0;

void onMagnet() {
    pulses++;
}

void setup() {
    Serial.begin(9600);
    pinMode(SENSOR, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(SENSOR), onMagnet, CHANGE);
}

void loop() {
    delay(1000);
    noInterrupts();
    unsigned int count = pulses;
    pulses = 0;
    interrupts();
    Serial.print("Pulses: ");
    Serial.print(count);
    Serial.print(", ");
    Serial.print(count * 60 / MAGNETS);
    Serial.println(" RPM");
}
```

```arduino {role=solution file=tachometer.ino}
const int SENSOR = 2;
const int MAGNETS = 1;
volatile unsigned int pulses = 0;

void onMagnet() {
    pulses++;
}

void setup() {
    Serial.begin(9600);
    pinMode(SENSOR, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(SENSOR), onMagnet, FALLING);
}

void loop() {
    delay(1000);
    noInterrupts();
    unsigned int count = pulses;
    pulses = 0;
    interrupts();
    Serial.print("Pulses: ");
    Serial.print(count);
    Serial.print(", ");
    Serial.print(count * 60 / MAGNETS);
    Serial.println(" RPM");
}
```
