---
id: embedded.projects.plant-monitor
kind: lesson
track: embedded
unit: b9
order: 12
title: "Project: a smart plant monitor"
titleKid: A plant that tells you it is thirsty
language: arduino
circuit:
  - { part: soil-sensor, pin: A0, label: Soil }
  - { part: oled }
concepts: [soil-moisture, i2c, oled-display, map]
prereqs: [embedded.projects.knob-dimmer]
est_minutes: 18
checks:
  - type: pins
    ms: 2500
    inputs: ["A0 520 at 0", "A0 390 at 1000", "A0 260 at 2000"]
    expect: "0 ms: screen shows \"Soil: 0% / Thirsty!\"\n1000 ms: screen shows \"Soil: 50% / Happy\"\n2000 ms: screen shows \"Soil: 100% / Happy\"\n"
hints:
  - 'A capacitive sensor reads lower the wetter the soil is: about 520 in dry soil, 260 in water.'
  - 'So DRY should become 0% and WET 100%: map(raw, DRY, WET, 0, 100).'
  - 'int percent = constrain(map(raw, DRY, WET, 0, 100), 0, 100);'
hintsKid:
  - 'Wet soil gives a smaller number.'
  - 'Dry should be 0%. Wet should be 100%.'
  - 'Swap the order in `map`.'
---
A plant cannot say it is thirsty, but a soil sensor can. This project reads how wet the soil is and shows it on a small OLED screen, with a mood: happy, or thirsty.

## What you build

- A capacitive soil-moisture sensor pushed into a pot: VCC, GND, and AOUT to A0.
- A 0.96″ OLED screen on the **I²C** bus: VCC, GND, SDA to A4 and SCL to A5.

## I²C: two wires, many devices

I²C uses two shared wires: **SDA** carries the data and **SCL** the clock that times it. Each device has an address (this screen is 0x3C), so screens, sensors and clocks can share the same two pins. On an Uno they are A4 and A5; on an ESP32, GPIO 21 and 22.

## The screen

The Adafruit_SSD1306 library draws text; nothing appears until `display()` sends it:

```arduino
display.clearDisplay();
display.setCursor(0, 0);
display.println("Soil: 45%");
display.display();
```

## Calibrating the sensor

A capacitive sensor reads **lower** the wetter the soil is. Measure it yourself: dry soil (about 520 here) and a glass of water (about 260). `map(raw, DRY, WET, 0, 100)` turns that into a percentage, and `constrain` keeps it between 0 and 100 when a reading goes past either end.

::: kid
This project helps you look after a plant.

A sensor in the soil tells how wet it is.

A little screen shows the number.

When the soil is dry, it says Thirsty!
:::

```arduino {role=example file=hello_screen.ino}
// Show a greeting on the OLED.
#include <Wire.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
    display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
    display.clearDisplay();
    display.setTextSize(2);
    display.setCursor(0, 0);
    display.println("Hello,");
    display.println("plant!");
    display.display();
}

void loop() {
}
```

::: try
The monitor reads the soil sensor on A0 every 500 ms and shows `Soil: N%` and a mood (`Thirsty!` below 30%, otherwise `Happy`) on the OLED. But dry soil shows 100% and wet soil 0%. Fix the conversion so dry (`DRY`) is 0% and wet (`WET`) is 100%.
:::

::: try-kid
Dry soil shows 100%. That is upside down.

Make dry soil 0% and wet soil 100%.
:::

```arduino {role=starter file=plant.ino}
#include <Wire.h>
#include <Adafruit_SSD1306.h>

const int SENSOR = A0;
const int DRY = 520;
const int WET = 260;

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
    display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
}

void loop() {
    int raw = analogRead(SENSOR);
    int percent = constrain(map(raw, WET, DRY, 0, 100), 0, 100);

    display.clearDisplay();
    display.setCursor(0, 0);
    display.print("Soil: ");
    display.print(percent);
    display.println("%");
    display.println(percent < 30 ? "Thirsty!" : "Happy");
    display.display();
    delay(500);
}
```

```arduino {role=solution file=plant.ino}
#include <Wire.h>
#include <Adafruit_SSD1306.h>

const int SENSOR = A0;
const int DRY = 520;
const int WET = 260;

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
    display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
}

void loop() {
    int raw = analogRead(SENSOR);
    int percent = constrain(map(raw, DRY, WET, 0, 100), 0, 100);

    display.clearDisplay();
    display.setCursor(0, 0);
    display.print("Soil: ");
    display.print(percent);
    display.println("%");
    display.println(percent < 30 ? "Thirsty!" : "Happy");
    display.display();
    delay(500);
}
```
