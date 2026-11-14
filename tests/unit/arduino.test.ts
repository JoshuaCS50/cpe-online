// The virtual Arduino board with real sketches: pins over time, inputs,
// Serial, String, Servo, warnings and errors. Sketches are compiled by the
// real clang with the same Arduino.h as the browser.

import { describe, expect, it } from "vitest";
import { parseInput } from "../../src/runners/arduino/board";
import { createLiveChannel, setLiveInput } from "../../src/runners/arduino/live";
import { ESP32 } from "../../src/runners/arduino/profiles";
import { runArduino } from "../helpers/arduino";

const T = 60_000;

describe("parseInput", () => {
  it("reads digital and analog inputs", () => {
    expect(parseInput("2 HIGH at 1200")).toEqual({ pin: 2, at: 1200, value: 1 });
    expect(parseInput("A0 512 at 0")).toEqual({ pin: 14, at: 0, value: 512 });
    expect(parseInput("7 low at 300 ms")).toEqual({ pin: 7, at: 300, value: 0 });
    expect(() => parseInput("pin 2 is high")).toThrow(/should look like/);
    expect(parseInput("GPIO 34 2048 at 0", ESP32)).toEqual({ pin: 34, at: 0, value: 2048 });
    expect(parseInput("A0 100 at 5", ESP32)).toEqual({ pin: 36, at: 5, value: 100 });
    expect(() => parseInput("GPIO 7 HIGH at 0", ESP32)).toThrow(/has no pin/);
  });
});

describe("sketches on the virtual board", () => {
  it("blinks pin 13 on a virtual clock", async () => {
    const result = await runArduino(
      `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}
`,
      { runMs: 2000 },
    );
    expect(result.error).toBeNull();
    expect(result.timeline).toEqual(["0 ms: pin 13 HIGH", "500 ms: pin 13 LOW", "1000 ms: pin 13 HIGH", "1500 ms: pin 13 LOW"]);
    expect(result.warnings).toEqual([]);
  }, T);

  it("prints to Serial and formats numbers like Arduino", async () => {
    const result = await runArduino(
      `void setup() {
  Serial.begin(9600);
  Serial.println("Hello");
  Serial.print("Value: ");
  Serial.println(42);
  Serial.println(3.14159);
  Serial.println(2.5, 1);
  Serial.println(255, HEX);
  Serial.println(5, BIN);
  String name = "Pump";
  name += " ";
  name += 2;
  Serial.println(name + "!");
  Serial.println(name.length());
}

void loop() {
}
`,
      { runMs: 50 },
    );
    expect(result.error).toBeNull();
    expect(result.serial).toBe("Hello\nValue: 42\n3.14\n2.5\nFF\n101\nPump 2!\n6\n");
  }, T);

  it("reads a scheduled button press with digitalRead", async () => {
    const result = await runArduino(
      `const int BUTTON = 2;
const int LED = 13;

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
}

void loop() {
  if (digitalRead(BUTTON) == LOW) {
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(LED, LOW);
  }
}
`,
      { runMs: 2000, inputs: [parseInput("2 LOW at 500"), parseInput("2 HIGH at 800")] },
    );
    expect(result.error).toBeNull();
    expect(result.timeline).toEqual(["0 ms: pin 13 LOW", "500 ms: pin 13 HIGH", "800 ms: pin 13 LOW"]);
  }, T);

  it("reads analog inputs, maps them and drives PWM and a servo", async () => {
    const result = await runArduino(
      `#include <Servo.h>
Servo arm;

void setup() {
  arm.attach(9);
}

void loop() {
  int raw = analogRead(A0);
  int angle = map(raw, 0, 1023, 0, 180);
  arm.write(angle);
  analogWrite(5, constrain(raw / 4, 0, 255));
  delay(100);
}
`,
      { runMs: 150, inputs: [parseInput("A0 1023 at 0"), parseInput("A0 512 at 100")] },
    );
    expect(result.error).toBeNull();
    // Changes in the same millisecond are listed by pin number.
    expect(result.timeline).toEqual([
      "0 ms: pin 5 PWM 255",
      "0 ms: servo on pin 9 at 180 degrees",
      "100 ms: pin 5 PWM 128",
      "100 ms: servo on pin 9 at 90 degrees",
    ]);
  }, T);

  it("records a servo or PWM value only when it changes", async () => {
    const result = await runArduino(
      `#include <Servo.h>
Servo arm;

void setup() {
  arm.attach(9);
}

void loop() {
  arm.write(map(analogRead(A0), 0, 1023, 0, 180));
  analogWrite(6, 100);
  delay(100);
}
`,
      { runMs: 700, inputs: [parseInput("A0 0 at 0"), parseInput("A0 1023 at 400")] },
    );
    expect(result.error).toBeNull();
    expect(result.timeline).toEqual(["0 ms: pin 6 PWM 100", "0 ms: servo on pin 9 at 0 degrees", "400 ms: servo on pin 9 at 180 degrees"]);
  }, T);

  it("keeps Serial text printed just before the run time ends", async () => {
    const result = await runArduino(
      `void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.print("tick ");
  Serial.println(millis() / 500);
  delay(500);
}
`,
      { runMs: 900 },
    );
    expect(result.error).toBeNull();
    expect(result.serial).toBe("tick 0\ntick 1\n");
  }, T);

  it("lets millis() drive a blink without delay", async () => {
    const result = await runArduino(
      `unsigned long last = 0;
int state = LOW;

void setup() {
  pinMode(8, OUTPUT);
}

void loop() {
  if (millis() - last >= 250) {
    last = millis();
    state = state == LOW ? HIGH : LOW;
    digitalWrite(8, state);
  }
}
`,
      { runMs: 800 },
    );
    expect(result.error).toBeNull();
    expect(result.timeline).toEqual(["250 ms: pin 8 HIGH", "500 ms: pin 8 LOW", "750 ms: pin 8 HIGH"]);
  }, T);

  it("warns about classic mistakes", async () => {
    const result = await runArduino(
      `void setup() {
  Serial.println("no begin");
}

void loop() {
  digitalWrite(13, HIGH);
  analogWrite(7, 200);
  delay(100);
}
`,
      { runMs: 200 },
    );
    expect(result.error).toBeNull();
    expect(result.warnings.join("\n")).toMatch(/Serial.begin/);
    expect(result.warnings.join("\n")).toMatch(/never set as an output/);
    expect(result.warnings.join("\n")).toMatch(/only has PWM on pins/);
  }, T);

  it("reports compile errors at the sketch's own line numbers", async () => {
    const result = await runArduino(`void setup() {
  pinMode(13, OUTPUT)
}

void loop() {
}
`);
    expect(result.error).toMatch(/^sketch\.ino:2:22: error: expected ';'/m);
  }, T);

  it("runs on an ESP32: GPIO names, LED_BUILTIN on GPIO 2", async () => {
    const result = await runArduino(
      `void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.println(LED_BUILTIN);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(250);
  digitalWrite(LED_BUILTIN, LOW);
  delay(250);
}
`,
      { runMs: 900, board: "esp32" },
    );
    expect(result.error).toBeNull();
    expect(result.serial).toBe("2\n");
    expect(result.timeline).toEqual(["0 ms: GPIO 2 HIGH", "250 ms: GPIO 2 LOW", "500 ms: GPIO 2 HIGH", "750 ms: GPIO 2 LOW"]);
  }, T);

  it("refuses outputs on the ESP32's input-only pins and has no pull-ups there", async () => {
    const result = await runArduino(
      `void setup() {
  pinMode(34, OUTPUT);
  pinMode(35, INPUT_PULLUP);
}

void loop() {
  digitalWrite(34, HIGH);
  delay(100);
}
`,
      { runMs: 300, board: "esp32" },
    );
    expect(result.error).toBeNull();
    expect(result.timeline).toEqual([]);
    expect(result.warnings.join("\n")).toMatch(/can only read/);
    expect(result.warnings.join("\n")).toMatch(/no pull-up resistor/);
  }, T);

  it("reads 12 bits on an ESP32, or fewer after analogReadResolution", async () => {
    const result = await runArduino(
      `void setup() {
  Serial.begin(115200);
  Serial.println(analogRead(34));
  analogReadResolution(10);
  Serial.println(analogRead(34));
}

void loop() {
}
`,
      { runMs: 50, board: "esp32", inputs: [parseInput("GPIO 34 2048 at 0", ESP32)] },
    );
    expect(result.error).toBeNull();
    expect(result.serial).toBe("2048\n512\n");
  }, T);

  it("dims with LEDC on an ESP32 and shows the duty at its resolution", async () => {
    const result = await runArduino(
      `void setup() {
  ledcAttach(18, 5000, 10);
}

void loop() {
  ledcWrite(18, 256);
  delay(100);
  ledcWrite(18, 1023);
  delay(100);
}
`,
      { runMs: 150, board: "esp32" },
    );
    expect(result.error).toBeNull();
    expect(result.timeline).toEqual(["0 ms: GPIO 18 PWM 256 of 1023", "100 ms: GPIO 18 PWM 1023 of 1023"]);
  }, T);

  it("wakes an ESP32 from deep sleep with only RTC variables kept", async () => {
    const result = await runArduino(
      `RTC_DATA_ATTR int boots = 0;
int plain = 0;

void setup() {
  Serial.begin(115200);
  boots++;
  plain++;
  Serial.print(boots);
  Serial.print(" ");
  Serial.print(plain);
  Serial.print(" ");
  Serial.println(esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_TIMER ? "timer" : "power");
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(100);
  esp_sleep_enable_timer_wakeup(1000000);
  esp_deep_sleep_start();
}

void loop() {
}
`,
      { runMs: 2500, board: "esp32" },
    );
    expect(result.error).toBeNull();
    expect(result.serial).toBe("1 1 power\n2 1 timer\n3 1 timer\n");
    // The LED goes dark while the board sleeps: pins stop being driven.
    expect(result.timeline).toEqual(["0 ms: GPIO 2 HIGH", "100 ms: GPIO 2 LOW", "1100 ms: GPIO 2 HIGH", "1200 ms: GPIO 2 LOW", "2200 ms: GPIO 2 HIGH", "2300 ms: GPIO 2 LOW"]);
  }, T);

  it("reads touch pins: about 70 untouched, lower when touched", async () => {
    const result = await runArduino(
      `void setup() {
  Serial.begin(115200);
}

void loop() {
  Serial.println(touchRead(4));
  delay(100);
}
`,
      { runMs: 250, board: "esp32", inputs: [parseInput("GPIO 4 12 at 100", ESP32)] },
    );
    expect(result.error).toBeNull();
    expect(result.serial).toBe("70\n12\n12\n");
  }, T);

  it("runs live: inputs from the page reach the sketch and changes stream out", async () => {
    const channel = createLiveChannel();
    setLiveInput(channel, 2, 0); // the button on pin 2 is held down
    const streamed: string[] = [];
    let flushes = 0;
    const result = await runArduino(
      `void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, digitalRead(2) == LOW ? HIGH : LOW);
  delay(10);
}
`,
      {
        runMs: 150,
        live: {
          channel,
          onChanges: (events) => {
            flushes += 1;
            streamed.push(...events.map((event) => `${event.pin}:${event.value}`));
          },
        },
      },
    );
    expect(result.error).toBeNull();
    expect(result.timeline[0]).toMatch(/^\d+ ms: pin 13 HIGH$/);
    expect(streamed).toContain("13:1");
    expect(flushes).toBeGreaterThan(1);
  }, T);

  it("runs an interrupt in a live run while the sketch sits in a long delay", async () => {
    const channel = createLiveChannel();
    const result = await runArduino(
      `void onPress() {
  digitalWrite(13, HIGH);
}

void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(13, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(2), onPress, FALLING);
}

void loop() {
  delay(1000);
}
`,
      {
        runMs: 300,
        // The page presses the button as soon as the first changes arrive, about 30 ms in.
        live: { channel, onChanges: () => setLiveInput(channel, 2, 0) },
      },
    );
    expect(result.error).toBeNull();
    const [line] = result.timeline;
    expect(line).toMatch(/^\d+ ms: pin 13 HIGH$/);
    expect(Number(line!.split(" ")[0])).toBeLessThan(150);
  }, T);

  it("measures distance with an ultrasonic sensor through pulseIn", async () => {
    const result = await runArduino(
      `const int TRIG = 9;
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
  Serial.println(micros / 58);
  delay(200);
}
`,
      { runMs: 450, inputs: [parseInput("10 25 at 0"), parseInput("10 120 at 200")] },
    );
    expect(result.error).toBeNull();
    expect(result.serial).toBe("25\n120\n120\n");
  }, T);

  it("shows text on an OLED screen and records it in the timeline", async () => {
    const result = await runArduino(
      `#include <Wire.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Soil");
  display.setTextSize(2);
  display.print(42);
  display.print("%");
  display.display();
}

void loop() {
}
`,
      { runMs: 50 },
    );
    expect(result.error).toBeNull();
    expect(result.timeline).toEqual(['0 ms: screen shows "Soil / 42%"']);
  }, T);

  it("has no ESP32 functions on an Uno, as on a real one", async () => {
    const result = await runArduino(`void setup() {
  ledcAttach(9, 5000, 8);
}

void loop() {
}
`);
    expect(result.error).toMatch(/use of undeclared identifier 'ledcAttach'/);
  }, T);

  it("stops a sketch that waits forever in setup when the time is up", async () => {
    const result = await runArduino(
      `void setup() {
  pinMode(13, OUTPUT);
  while (true) {
    digitalWrite(13, HIGH);
    delay(1000);
    digitalWrite(13, LOW);
    delay(1000);
  }
}

void loop() {
}
`,
      { runMs: 3000 },
    );
    expect(result.error).toBeNull();
    expect(result.timeline).toEqual(["0 ms: pin 13 HIGH", "1000 ms: pin 13 LOW", "2000 ms: pin 13 HIGH"]);
  }, T);
  it("runs an interrupt routine the moment a button is pressed, even during a long delay", async () => {
    const result = await runArduino(
      `const int BUTTON = 2;
const int LED = 13;
volatile int presses = 0;

void onPress() {
  presses++;
  digitalWrite(LED, presses % 2);
}

void setup() {
  Serial.begin(9600);
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(BUTTON), onPress, FALLING);
}

void loop() {
  delay(5000);
  Serial.println(presses);
}
`,
      { runMs: 5500, inputs: [parseInput("2 LOW at 300"), parseInput("2 HIGH at 400"), parseInput("2 LOW at 1250"), parseInput("2 HIGH at 1300"), parseInput("2 LOW at 2000")] },
    );
    expect(result.error).toBeNull();
    expect(result.timeline).toEqual(["300 ms: pin 13 HIGH", "1250 ms: pin 13 LOW", "2000 ms: pin 13 HIGH"]);
    expect(result.serial).toBe("3\n");
  }, T);

  it("holds interrupts while they are off, and warns about the wrong interrupt number and delay in a routine", async () => {
    const result = await runArduino(
      `volatile int count = 0;

void onEdge() {
  count++;
  delay(10);
}

void setup() {
  Serial.begin(9600);
  pinMode(3, INPUT_PULLUP);
  attachInterrupt(2, onEdge, CHANGE);
  attachInterrupt(digitalPinToInterrupt(3), onEdge, CHANGE);
  noInterrupts();
  delay(500);
  Serial.println(count);
  interrupts();
  Serial.println(count);
}

void loop() {
}
`,
      { runMs: 1000, inputs: [parseInput("3 LOW at 100"), parseInput("3 HIGH at 200")] },
    );
    expect(result.error).toBeNull();
    // Two changes while off are latched as one, as a real interrupt flag is.
    expect(result.serial).toBe("0\n1\n");
    expect(result.warnings.join("\n")).toMatch(/attachInterrupt\(2, \.\.\.\): an Uno has interrupt 0 \(pin 2\) and interrupt 1 \(pin 3\).*digitalPinToInterrupt\(2\)/);
    expect(result.warnings.join("\n")).toMatch(/delay\(\) was called inside an interrupt routine/);
  }, T);

  it("runs a TimerOne interrupt on an Uno and a hardware timer on an ESP32", async () => {
    const uno = await runArduino(
      `#include <TimerOne.h>
volatile bool on = false;

void tick() {
  on = !on;
  digitalWrite(13, on);
}

void setup() {
  pinMode(13, OUTPUT);
  Timer1.initialize(250000);
  Timer1.attachInterrupt(tick);
}

void loop() {
}
`,
      { runMs: 1100 },
    );
    expect(uno.error).toBeNull();
    expect(uno.timeline).toEqual(["250 ms: pin 13 HIGH", "500 ms: pin 13 LOW", "750 ms: pin 13 HIGH", "1000 ms: pin 13 LOW"]);

    const esp = await runArduino(
      `hw_timer_t *timer = nullptr;
volatile int ticks = 0;

void IRAM_ATTR onTimer() {
  ticks++;
}

void setup() {
  Serial.begin(115200);
  timer = timerBegin(1000000);
  timerAttachInterrupt(timer, &onTimer);
  timerAlarm(timer, 100000, true, 0);
  delay(1050);
  Serial.println(ticks);
}

void loop() {
}
`,
      { runMs: 1200, board: "esp32" },
    );
    expect(esp.error).toBeNull();
    expect(esp.serial).toBe("10\n");
  }, T);
});
