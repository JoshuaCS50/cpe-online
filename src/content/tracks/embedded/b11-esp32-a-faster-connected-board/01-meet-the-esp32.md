---
id: embedded.esp32.meet-the-esp32
kind: lesson
track: embedded
unit: b11
order: 1
title: Meet the ESP32
titleKid: A tiny computer with Wi-Fi
language: arduino
board: esp32
concepts: [esp32, microcontroller-comparison, logic-levels, porting, baud-rate]
prereqs: [embedded.arduino.blink]
est_minutes: 14
checks:
  - type: pins
    ms: 1900
    expect: "0 ms: GPIO 2 HIGH\n500 ms: GPIO 2 LOW\n1000 ms: GPIO 2 HIGH\n1500 ms: GPIO 2 LOW\n"
  - type: stdout-equals
    ms: 100
    expect: "ESP32 ready\n"
  - type: code-contains
    pattern: '115200'
    message: 'Starts Serial at 115200, the speed ESP32 boards use'
hints:
  - 'The DevKit has no LED on GPIO 13. Its built-in LED is on GPIO 2, and LED_BUILTIN already means 2 on this board.'
  - 'ESP32 boards print their start-up messages at 115200 baud, so use the same speed: Serial.begin(115200);'
  - 'Change the message to Serial.println("ESP32 ready");'
hintsKid:
  - 'The light on this board is on pin 2.'
  - 'Use `Serial.begin(115200);`'
  - 'Print `ESP32 ready`.'
---
The Uno has carried you through the basics. The **ESP32** is the board many real projects move to next: it is far faster, has far more memory, and has **Wi-Fi and Bluetooth** built in, for about the same price. It is made by Espressif, and you program it with the same Arduino functions you already know.

## Uno and ESP32 side by side

| | Arduino Uno | ESP32 DevKit |
|---|---|---|
| Processor | 8-bit, 16 MHz, one core | 32-bit, up to 240 MHz, two cores |
| Memory for variables (RAM) | 2 KB | about 520 KB |
| Memory for the program (flash) | 32 KB | usually 4 MB |
| **Logic voltage** | **5 V** | **3.3 V** |
| analogRead | 10 bits (0 to 1023) | 12 bits (0 to 4095) |
| Analog outputs | PWM on 6 pins | PWM on almost any output pin, plus 2 true analog outputs |
| `int` | 16 bits | 32 bits |
| Wireless | none | Wi-Fi and Bluetooth |

The line in bold matters most when you wire things. An ESP32 pin gives out 3.3 V for HIGH and must never be connected to 5 V: a 5 V signal can damage it. Sensors and modules made for the Uno may need a level shifter, or a version made for 3.3 V.

## What stays the same

`setup()` and `loop()`, `pinMode`, `digitalWrite`, `digitalRead`, `delay`, `millis` and `Serial` all work as on the Uno. Moving a sketch over is mostly a matter of changing **pin numbers** and a few board facts:

- Pins are named by their **GPIO number** (general-purpose input/output), such as GPIO 23. In code you write just the number: `pinMode(23, OUTPUT);`.
- The DevKit's built-in LED is on **GPIO 2**, and `LED_BUILTIN` means 2. (Some ESP32 boards have no built-in LED at all.)
- ESP32 boards print their own start-up messages at **115200 baud**, so sketches use `Serial.begin(115200)` to match the Serial Monitor.

## In the simulator

Lessons in this unit run on a virtual ESP32 DevKit. The pin timeline names pins the ESP32 way, such as `500 ms: GPIO 2 LOW`, and inputs are written the same way: `GPIO 4 LOW at 500`. The simulator's `int` is 32 bits, exactly like a real ESP32, so the overflow trap from the voltage-divider lesson does not happen here.

::: kid
The ESP32 is another tiny computer.

It is much faster than the Uno, and it has Wi-Fi.

Its pins use 3.3 volts, not 5 volts.

Never connect 5 volts to an ESP32 pin.

Its own light is on pin 2.
:::

```arduino {role=example file=hello_esp32.ino}
void setup() {
    Serial.begin(115200);
    Serial.print("Built-in LED is on GPIO ");
    Serial.println(LED_BUILTIN);
    Serial.print("An int here has ");
    Serial.print(sizeof(int) * 8);
    Serial.println(" bits");
    long big = 40000 * 3;
    Serial.print("40000 * 3 = ");
    Serial.println(big);
}

void loop() {
}
```

::: try
This blink sketch was written for an Uno. Make it run on the ESP32 DevKit: blink the built-in LED (GPIO 2, or `LED_BUILTIN`) on for 500 ms and off for 500 ms, start Serial at 115200, and print `ESP32 ready` once at the start.
:::

::: try-kid
This code was made for the Uno.

Make it blink the ESP32 light on pin 2.

Use 115200 for Serial.

Print `ESP32 ready`.
:::

```arduino {role=starter file=blink_esp32.ino}
const int LED = 13;

void setup() {
    Serial.begin(9600);
    Serial.println("Uno ready");
    pinMode(LED, OUTPUT);
}

void loop() {
    digitalWrite(LED, HIGH);
    delay(500);
    digitalWrite(LED, LOW);
    delay(500);
}
```

```arduino {role=solution file=blink_esp32.ino}
const int LED = LED_BUILTIN;

void setup() {
    Serial.begin(115200);
    Serial.println("ESP32 ready");
    pinMode(LED, OUTPUT);
}

void loop() {
    digitalWrite(LED, HIGH);
    delay(500);
    digitalWrite(LED, LOW);
    delay(500);
}
```
