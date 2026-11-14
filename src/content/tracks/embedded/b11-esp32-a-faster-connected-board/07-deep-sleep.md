---
id: embedded.esp32.deep-sleep
kind: lesson
track: embedded
unit: b11
order: 7
title: Deep sleep and waking up
titleKid: Sleeping to save the battery
language: arduino
board: esp32
concepts: [deep-sleep, low-power, rtc-memory, wake-up-timer, wake-cause]
prereqs: [embedded.esp32.meet-the-esp32]
est_minutes: 16
checks:
  - type: stdout-equals
    ms: 7000
    expect: "Boot 1\nBoot 2\nBoot 3\nBoot 4\n"
  - type: pins
    ms: 7000
    expect: "0 ms: GPIO 2 HIGH\n100 ms: GPIO 2 LOW\n2100 ms: GPIO 2 HIGH\n2200 ms: GPIO 2 LOW\n4200 ms: GPIO 2 HIGH\n4300 ms: GPIO 2 LOW\n6300 ms: GPIO 2 HIGH\n6400 ms: GPIO 2 LOW\n"
hints:
  - 'Run the starter: every wake-up prints Boot 1. Deep sleep loses all ordinary variables, so bootCount starts at 0 again each time.'
  - 'A variable that must survive deep sleep has to live in the RTC memory, which stays powered while the chip sleeps.'
  - 'Mark it like this: RTC_DATA_ATTR int bootCount = 0;'
hintsKid:
  - 'The count starts again after each sleep.'
  - 'Some memory stays awake while the board sleeps.'
  - 'Write `RTC_DATA_ATTR` before `int bootCount = 0;`'
---
A weather station on a fence post wakes up, measures, sends one reading and goes back to sleep, for months on one battery. The trick is **deep sleep**: almost the whole ESP32 switches off.

## How much it saves

| State | Typical current |
|---|---|
| Awake, Wi-Fi on | 80 to 240 mA |
| Awake, Wi-Fi off | about 30 to 50 mA |
| Deep sleep | about 10 µA (0.01 mA) |

A 2000 mAh battery lasts about a day awake, and years in deep sleep, if the board only wakes for a moment now and then.

## What sleeps and what stays awake

During deep sleep the processors, the main memory (RAM) and the pins all switch off. A tiny corner of the chip, the **RTC** (real-time clock) part, stays powered: a timer that can wake the chip, and **8 KB of RTC memory**.

So when the ESP32 wakes, it does not carry on where it stopped. It **starts again from `setup()`**, like after pressing reset:

- Ordinary variables start from their first values again.
- Variables marked `RTC_DATA_ATTR` keep their values: `RTC_DATA_ATTR int bootCount = 0;` is set to 0 only at the very first power-on.
- Pins lose their state: an LED left on goes dark while the board sleeps.

Because every wake-up runs `setup()`, sleepy sketches do all their work in `setup()` and leave `loop()` empty.

## Going to sleep

```arduino
esp_sleep_enable_timer_wakeup(2000000);   // wake after 2 000 000 µs = 2 s
esp_deep_sleep_start();                   // nothing after this line runs
```

The timer takes **microseconds**. Other wake sources exist too: a pin changing (a button) or a touch pad. After waking, `esp_sleep_get_wakeup_cause()` says why: `ESP_SLEEP_WAKEUP_TIMER` after the timer, `ESP_SLEEP_WAKEUP_UNDEFINED` after a normal power-on.

## In the simulator

The board keeps the clock running through the sleep, starts the program again with fresh memory when it wakes, and puts back only the `RTC_DATA_ATTR` variables, just like the real chip. The timeline shows outputs going LOW when the board falls asleep.

::: kid
The ESP32 can fall into a deep sleep to save its battery.

While it sleeps, it forgets almost everything.

When it wakes, it starts again from the beginning.

Only a few special things are kept.

You mark those with `RTC_DATA_ATTR`.
:::

```arduino {role=example file=why_awake.ino}
// Says why the board woke, then sleeps for one second.
void setup() {
    Serial.begin(115200);
    if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_TIMER) {
        Serial.println("Woke up: the timer");
    } else {
        Serial.println("Woke up: power on");
    }
    esp_sleep_enable_timer_wakeup(1000000);
    esp_deep_sleep_start();
}

void loop() {
}
```

::: try
This sketch should count how many times the board has started: print `Boot 1`, `Boot 2` and so on, flash the built-in LED for 100 ms, then sleep for 2 seconds. But it prints `Boot 1` every time. Make the count survive deep sleep.
:::

::: try-kid
The board should count how many times it woke up.

But it always says `Boot 1`.

Make the count stay when the board sleeps.
:::

```arduino {role=starter file=boot_counter.ino}
const uint64_t SLEEP_US = 2000000;

int bootCount = 0;

void setup() {
    Serial.begin(115200);
    bootCount++;
    Serial.print("Boot ");
    Serial.println(bootCount);

    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, HIGH);
    delay(100);
    digitalWrite(LED_BUILTIN, LOW);

    esp_sleep_enable_timer_wakeup(SLEEP_US);
    esp_deep_sleep_start();
}

void loop() {
}
```

```arduino {role=solution file=boot_counter.ino}
const uint64_t SLEEP_US = 2000000;

RTC_DATA_ATTR int bootCount = 0;

void setup() {
    Serial.begin(115200);
    bootCount++;
    Serial.print("Boot ");
    Serial.println(bootCount);

    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, HIGH);
    delay(100);
    digitalWrite(LED_BUILTIN, LOW);

    esp_sleep_enable_timer_wakeup(SLEEP_US);
    esp_deep_sleep_start();
}

void loop() {
}
```
