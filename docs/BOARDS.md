# Boards and the simulator

The two boards CPE Online simulates, how the simulator behaves, and where each piece lives. For learners the same facts are in Learn mode: **Uno pinout** and **ESP32 pinout** above the Arduino lessons (`#/learn/board.uno`, `#/learn/board.esp32`), drawn from Fusion renders of the board models.

## Arduino Uno

| | |
|---|---|
| Microcontroller | ATmega328P, 8-bit, 16 MHz |
| Memory | 32 KB flash, 2 KB SRAM, 1 KB EEPROM |
| Logic | 5 V; about 20 mA per pin (40 mA absolute maximum) |
| Digital pins | 0 to 13 (A0 to A5 also work as 14 to 19) |
| PWM (`analogWrite`) | 3, 5, 6, 9, 10, 11 |
| Analog in | A0 to A5, 10 bits (0 to 1023 for 0 to 5 V) |
| Interrupts | 2 (INT0), 3 (INT1) |
| I²C / SPI / Serial | A4 SDA, A5 SCL / 10 SS, 11 MOSI, 12 MISO, 13 SCK / 0 RX, 1 TX |
| Built-in LED | 13 |

### Header layout (board millimetres, as modelled)

| Header | First pin (x, y) | Pins, in order along the board |
|---|---|---|
| Digital high | 17.8, 2.5 | SCL, SDA, AREF, GND, 13, 12, ~11, ~10, ~9, 8 |
| Digital low | 45.0, 2.5 | 7, ~6, ~5, 4, ~3, 2, TX 1, RX 0 |
| Power | 27.0, 50.8 | (NC), IOREF, RESET, 3.3V, 5V, GND, GND, VIN |
| Analog | 50.0, 50.8 | A0, A1, A2, A3, A4, A5 |

Pins are 2.54 mm apart.

## ESP32 DevKit (38 pins)

| | |
|---|---|
| Chip | ESP32-WROOM-32: two Xtensa LX6 cores, up to 240 MHz |
| Memory | 4 MB flash, about 520 KB SRAM, 8 KB RTC memory |
| Logic | 3.3 V (never 5 V on a pin); about 12 mA per pin |
| Analog in | ADC1: GPIO 32 to 39; ADC2: 0, 2, 4, 12 to 15, 25 to 27 (not with Wi-Fi); 12 bits |
| Analog out | DAC on GPIO 25, 26 (8 bits); LEDC PWM on any output pin |
| Touch | T0 4, T1 0, T2 2, T3 15, T4 13, T5 12, T6 14, T7 27, T8 33, T9 32 |
| Input only | 34, 35, 36 (VP), 39 (VN): no output, no pull-up |
| Do not use | 6 to 11 (flash) |
| Strapping | 0, 2, 5, 12, 15 |
| I²C / SPI / Serial | 21 SDA, 22 SCL / 23 MOSI, 19 MISO, 18 SCK, 5 SS / 1 TX, 3 RX |
| Built-in LED | GPIO 2 |

### Header layout (board millimetres, USB end at x = 0)

| Row | y | Pins from the USB end |
|---|---|---|
| Top | 1.27 | CLK, SD0, SD1, 15, 2, 0, 4, 16, 17, 5, 18, 19, GND, 21, RX 3, TX 1, 22, 23, GND |
| Bottom | 26.67 | 5V, CMD, SD3, SD2, 13, GND, 12, 14, 27, 26, 25, 33, 32, 35, 34, VN 39, VP 36, EN, 3V3 |

The first pin is at x = 4.6 mm; pins are 2.54 mm apart. On the breadboard the DevKit sits across the centre channel with its pins in rows a and i, columns 2 to 20.

## The simulator

| Piece | File |
|---|---|
| Pin facts for each board | `src/runners/arduino/profiles.ts` |
| The virtual board (clock, pins, PWM, servo, tone, touch, DAC, deep sleep, warnings) | `src/runners/arduino/board.ts` |
| The Arduino layer the sketch is compiled with (ESP32 part behind `CPE_BOARD_ESP32`) | `src/runners/arduino/Arduino.h` |
| Live (interactive) runs: shared-memory inputs and Stop | `src/runners/arduino/live.ts` |
| Compiling and running, deep-sleep restarts | `src/runners/arduino/sketch.ts`, `src/runners/cpp/cpp-worker.ts` |
| The 3D view (replay, live mode, wiring, sketchbook style) | `src/board3d/` |
| Board and part models (Autodesk Fusion) | `scripts/fusion/cpe-parts.py` → `scripts/pack-models.mjs` → `public/models/` |
| Pinout renders (Autodesk Fusion) | `scripts/fusion/board-images.py` → `public/boards/` |
| Circuits in lessons and your own (parts list, wiring table, specs, pin checks) | `src/content/circuit.ts` |
| Building your own circuit in Code mode | `src/board3d/circuit-editor.ts` |
| Components catalogue (Learn) | `src/learn/components-page.ts` |
| Board reference pages | `src/learn/board-pages.ts` |

### Parts

led, rgb-led, button, knob, ldr, fsr (force), temp-sensor (TMP36), soil-sensor, ultrasonic (HC-SR04), servo, buzzer, motor (TIP120 + diode), stepper (28BYJ-48 + ULN2003), oled (SSD1306 on I²C: A4/A5 on the Uno, GPIO 21/22 on the ESP32) and touch-pad (ESP32). The same list serves lesson circuits and the circuit editor; the Components page in Learn (`#/learn/components`) explains each one. In the 3D view, clicking an LED changes its colour and clicking its resistor steps it through 220 Ω, 470 Ω, 1 kΩ and 10 kΩ; the brightness follows the current.

### Two ways to run

- **Replay (virtual time).** Used by Check, and by Run with one of a lesson's check inputs. `delay()` jumps the clock, so ten seconds of board time take a moment and every run gives exactly the same timeline.
- **Live (real time).** Run with "Live" chosen (Learn) or any `.ino` file (Code mode), when the browser allows shared memory (cross-origin isolation). The sketch runs in real time; holding a button, dragging a knob or light slider, or touching a pad, in the 3D view or with the controls under it, changes the pin the sketch reads. Pin changes and Serial text stream back as they happen. After Stop, the whole session (with every input given) can be replayed.

### What the simulator notes

Output on an input-only pin, a pull-up on GPIO 34 to 39, the flash pins, `analogWrite` on a non-PWM Uno pin, `digitalWrite` without `pinMode(OUTPUT)`, Serial before `Serial.begin`, `ledcWrite` before `ledcAttach`, a PWM frequency too fast for its resolution, `touchRead` or `dacWrite` on the wrong pin, deep sleep without a wake-up, `attachInterrupt` with a pin number instead of `digitalPinToInterrupt` (Uno), `delay` or `Serial` inside an interrupt routine, a timer faster than 100 µs.

### Interrupts and timers

`attachInterrupt` (RISING, FALLING, CHANGE; LOW runs once per fall), `detachInterrupt`, `noInterrupts`/`interrupts` (an edge while they are off is held and runs when they come back on, as a real interrupt flag does), `TimerOne.h` on the Uno and `timerBegin`/`timerAttachInterrupt`/`timerAlarm` on the ESP32. The board calls the sketch's routine (an exported `cpe_isr`) whenever the clock moves past an input change on an attached pin or a timer tick, at that exact board time, even inside `delay()`. In live runs it looks at the pins every 2 ms during a delay. While a routine runs the clock stands still, as `millis()` does on a real board. A press from the page lasts at least 40 ms, so a quick tap is never missed.

### Known differences from real boards

- `int` is 32 bits (a real Uno's is 16). ESP32 behaviour matches.
- Analog readings are perfectly linear (a real ESP32's ADC bunches up near 0 V and 3.3 V).
- No Wi-Fi or Bluetooth yet. The only I²C device is the SSD1306 OLED, and it shows text only (21 × 8 characters, sizes 1 and 2; no graphics). `Serial.read()` gets nothing.
- The HC-SR04's echo time comes from the distance input (58.3 µs per cm), with no noise or missed echoes.
- Motors and steppers turn by the pins' timing, without load, inertia or skipped steps.
- Touch readings come from inputs (70 untouched by default), not from real capacitance.
