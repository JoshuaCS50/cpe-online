---
id: embedded.projects.distance-sensor
kind: lesson
track: embedded
unit: b9
order: 7
title: "Project: measure distance with sound"
titleKid: A sensor that hears echoes
language: arduino
circuit:
  - { part: ultrasonic, pins: [9, 10], label: Distance }
concepts: [ultrasonic-sensor, pulse-in, frequency, timing]
prereqs: [embedded.arduino.serial-monitor]
est_minutes: 16
checks:
  - type: stdout-equals
    ms: 500
    inputs: ["10 30 at 0", "10 150 at 300"]
    expect: "Distance: 30 cm\nDistance: 30 cm\nDistance: 150 cm\n"
hints:
  - 'pulseIn gives the time for the sound to go to the obstacle and come back: twice the distance.'
  - 'Sound takes about 29 µs to travel 1 cm, so 1 cm of distance takes about 58 µs there and back.'
  - 'long cm = micros / 58;'
hintsKid:
  - 'The sound goes there and comes back.'
  - 'So the trip is twice as long as the distance.'
  - 'Divide by 58, not 29.'
---
Bats and dolphins find their way by shouting and listening for the echo. The HC-SR04 ultrasonic sensor does the same with a click of sound far too high to hear (40 kHz), and it is how many robots, parking sensors and tank level meters measure distance.

## What you build

An HC-SR04 with VCC to 5 V, GND to GND, **Trig** to pin 9 and **Echo** to pin 10.

## How it works

1. The sketch holds Trig HIGH for 10 microseconds: the sensor sends out eight pulses of ultrasound.
2. The sensor sets Echo HIGH, and keeps it HIGH until the echo comes back.
3. `pulseIn(ECHO, HIGH, 30000)` measures how long Echo stayed HIGH, in microseconds (0 if nothing came back within 30 ms).
4. Sound travels about 343 m/s, or 1 cm in 29 µs. The pulse covers the trip **there and back**, so 1 cm of distance is about 58 µs: `cm = micros / 58`.

The sensor works from about 2 cm to 4 m. Soft things (curtains, a jumper) and surfaces at an angle may not echo back at all.

## In the simulator

The checks put an obstacle in front of the sensor: `10 30 at 0` means 30 cm away from the start. Run it live and drag the yellow wall in the 3D view, or use the distance slider.

::: kid
This sensor sends out a click of sound.

The sound bounces off a wall and comes back.

The board times how long the echo takes.

A longer wait means the wall is further away.
:::

```arduino {role=example file=ping.ino}
// Print the raw echo time in microseconds.
const int TRIG = 9;
const int ECHO = 10;

void setup() {
    Serial.begin(9600);
    pinMode(TRIG, OUTPUT);
    pinMode(ECHO, INPUT);
    Serial.println("Echo times:");
}

void loop() {
    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG, LOW);
    Serial.println(pulseIn(ECHO, HIGH, 30000));
    delay(500);
}
```

::: try
The sketch pings and prints the distance every 200 ms, but every distance comes out twice as big as it really is. Fix the conversion from microseconds to centimetres.
:::

::: try-kid
Every distance is twice too big.

Remember the sound goes there and back.

Fix the sum.
:::

```arduino {role=starter file=distance.ino}
const int TRIG = 9;
const int ECHO = 10;

void setup() {
    Serial.begin(9600);
    pinMode(TRIG, OUTPUT);
    pinMode(ECHO, INPUT);
}

void loop() {
    digitalWrite(TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG, LOW);

    long micros = pulseIn(ECHO, HIGH, 30000);
    long cm = micros / 29;
    Serial.print("Distance: ");
    Serial.print(cm);
    Serial.println(" cm");
    delay(200);
}
```

```arduino {role=solution file=distance.ino}
const int TRIG = 9;
const int ECHO = 10;

void setup() {
    Serial.begin(9600);
    pinMode(TRIG, OUTPUT);
    pinMode(ECHO, INPUT);
}

void loop() {
    digitalWrite(TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG, LOW);

    long micros = pulseIn(ECHO, HIGH, 30000);
    long cm = micros / 58;
    Serial.print("Distance: ");
    Serial.print(cm);
    Serial.println(" cm");
    delay(200);
}
```
