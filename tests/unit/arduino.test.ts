// The virtual Arduino board with real sketches: pins over time, inputs,
// Serial, String, Servo, warnings and errors. Sketches are compiled by the
// real clang with the same Arduino.h as the browser.

import { describe, expect, it } from "vitest";
import { parseInput } from "../../src/runners/arduino/board";
import { runArduino } from "../helpers/arduino";

const T = 60_000;

describe("parseInput", () => {
  it("reads digital and analog inputs", () => {
    expect(parseInput("2 HIGH at 1200")).toEqual({ pin: 2, at: 1200, value: 1 });
    expect(parseInput("A0 512 at 0")).toEqual({ pin: 14, at: 0, value: 512 });
    expect(parseInput("7 low at 300 ms")).toEqual({ pin: 7, at: 300, value: 0 });
    expect(() => parseInput("pin 2 is high")).toThrow(/should look like/);
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
});
