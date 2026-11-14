// A lesson's circuit becomes its parts list, wiring table and specifications;
// every lesson's topics have an Extra info entry; lesson files sit
// where the course layout says.

import { describe, expect, it } from "vitest";
import { circuitDocs, resolveCircuitParts } from "../../src/content/circuit";
import { suggestPart } from "../../src/board3d/circuit-editor";
import { layoutProblems } from "../../src/content/disk";
import { TERMS, extraInfo } from "../../src/content/glossary";
import { loadLibraryFromDisk } from "../../src/content/disk";

describe("circuit docs", () => {
  it("lists parts, wiring and the LED current for an Uno traffic light", () => {
    const docs = circuitDocs({
      board: "uno",
      parts: [
        { part: "led", pin: 12, colour: "red", label: "Stop" },
        { part: "led", pin: 11, colour: "yellow" },
        { part: "led", pin: 10, colour: "green" },
      ],
    });
    expect(docs.parts).toContainEqual({ count: 3, name: "220 Ω resistor" });
    expect(docs.parts).toContainEqual({ count: 8, name: "jumper wires" });
    expect(docs.wiring[0]).toEqual({ pin: "D12", to: "220 Ω resistor → red LED (+, long leg)", does: "Stop: the sketch switches this pin HIGH and LOW." });
    expect(docs.wiring.at(-1)!.pin).toBe("GND");
    expect(docs.specs).toContainEqual({ name: "Red LED current", value: "(5 − 2) ÷ 220 ≈ 13.6 mA" });
  });

  it("uses 3V3, GPIO names and 5 V from VIN for a servo on an ESP32", () => {
    const docs = circuitDocs({
      board: "esp32",
      parts: [
        { part: "knob", pin: 34 },
        { part: "servo", pin: 18 },
      ],
    });
    expect(docs.wiring.map((row) => row.pin)).toEqual(["GPIO 34", "GPIO 18", "3V3", "5V (VIN)", "GND"]);
    expect(docs.specs).toContainEqual({ name: "analogRead", value: "12 bits: 0 to 4095, about 0.8 mV per step" });
  });
});

describe("sensors, motors and screens", () => {
  const parts = [
    { part: "ultrasonic", pins: [9, 10] },
    { part: "oled" },
    { part: "stepper", pins: [4, 5, 6, 7] },
    { part: "motor", pin: 3 },
    { part: "fsr", pin: "A0" },
  ] as const;

  it("wires an ultrasonic sensor, an OLED, a stepper, a motor and a force sensor on an Uno", () => {
    const { circuit, problems } = resolveCircuitParts(parts.map((part) => ({ ...part, pins: "pins" in part ? [...part.pins] : undefined })), "uno");
    expect(problems).toEqual([]);
    const docs = circuitDocs(circuit);
    const names = docs.parts.map((part) => part.name);
    expect(names).toEqual(expect.arrayContaining(["HC-SR04 ultrasonic distance sensor", "ULN2003 driver board", "TIP120 Darlington transistor", "1N4001 diode", "10 kΩ resistor"]));
    expect(docs.wiring.map((row) => `${row.pin} ${row.to}`)).toEqual(expect.arrayContaining(["D9 HC-SR04 Trig", "D10 HC-SR04 Echo", "A4 OLED SDA", "A5 OLED SCL", "D7 Driver IN4", "D3 1 kΩ → TIP120 base"]));
  });

  it("puts the OLED on the board's I²C pins and spots a clash", () => {
    expect(resolveCircuitParts([{ part: "oled" }, { part: "led", pin: "A4" }], "uno").problems).toEqual(["pin A4 is used twice (oled and led)"]);
    const esp = circuitDocs(resolveCircuitParts([{ part: "oled" }], "esp32").circuit);
    expect(esp.wiring.slice(0, 2).map((row) => row.pin)).toEqual(["GPIO 21", "GPIO 22"]);
  });
});

describe("circuit editor suggestions", () => {
  it("picks free pins of the right kind", () => {
    expect(suggestPart("knob", "uno", [{ part: "oled" }])).toEqual({ part: "knob", pin: "A0" });
    expect(suggestPart("oled", "esp32", [])).toEqual({ part: "oled" });
    const ping = suggestPart("ultrasonic", "uno", []);
    expect(ping.pins).toHaveLength(2);
    expect(new Set(ping.pins).size).toBe(2);
  });

  it("gives each new LED the next colour and skips pins in use", () => {
    const led = suggestPart("led", "esp32", [{ part: "led", pin: 2 }]);
    expect(led.colour).toBe("yellow");
    expect(led.pin).not.toBe(2);
    expect(resolveCircuitParts([{ part: "led", pin: 2 }, led], "esp32").problems).toEqual([]);
  });
});

describe("extra info", () => {
  const library = loadLibraryFromDisk();

  it("explains every topic of every lesson", () => {
    const missing = library.lessons.flatMap((lesson) => lesson.concepts.filter((id) => !TERMS[id]).map((id) => `${lesson.id}: ${id}`));
    expect(missing).toEqual([]);
  });

  it("adds the board and every part of a lesson's circuit", () => {
    const info = extraInfo(["pwm"], { board: "uno", parts: [{ part: "knob", pin: 14 }, { part: "led", pin: 9 }] });
    expect(info.terms.map((item) => item.id)).toEqual(["pwm"]);
    expect(info.components.map((item) => item.id)).toEqual(["board-uno", "breadboard", "jumper-wire", "knob", "led", "resistor"]);
  });
});

describe("course layout", () => {
  it("wants track, numbered unit and numbered lesson in the path", () => {
    expect(layoutProblems("embedded/b11-esp32-a-faster-connected-board/05-touch-pins.md", { track: "embedded", unit: "b11", order: 5 })).toEqual([]);
    expect(layoutProblems("embedded/b11/touch-pins.md", { track: "embedded", unit: "b11", order: 5 })[0]).toMatch(/should be at embedded\/b11-<unit name>\/05-<lesson name>\.md/);
  });
});
