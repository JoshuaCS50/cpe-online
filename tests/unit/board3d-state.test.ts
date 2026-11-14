// The rules behind the 3D board view: what each part shows at a moment of a run.

import { describe, expect, it } from "vitest";
import { brightness, buttonPressed, colourHints, describeMoment, inputAt, outputsAt, planParts } from "../../src/board3d/state";
import type { BoardReport } from "../../src/runners/arduino/board";

function report(partial: Partial<BoardReport>): BoardReport {
  return { board: "uno", runMs: 1000, timeline: [], warnings: [], events: [], inputs: [], touchPins: [], reads: { digital: [], analog: [] }, modes: new Array<number>(20).fill(-1), ...partial };
}

describe("board view state", () => {
  const traffic = report({
    events: [
      { t: 0, pin: 12, kind: "digital", value: 1 },
      { t: 0, pin: 11, kind: "digital", value: 0 },
      { t: 0, pin: 10, kind: "digital", value: 0 },
      { t: 0, pin: 13, kind: "digital", value: 1 },
      { t: 500, pin: 12, kind: "digital", value: 0 },
      { t: 500, pin: 10, kind: "pwm", value: 51 },
      { t: 600, pin: 9, kind: "servo", value: 90 },
      { t: 700, pin: 8, kind: "tone", value: 440 },
      { t: 800, pin: 8, kind: "tone", value: 0 },
    ],
  });

  it("applies every change up to a moment", () => {
    expect(outputsAt(traffic, 0).get(12)).toEqual({ level: 1 });
    expect(outputsAt(traffic, 499).get(12)).toEqual({ level: 1 });
    expect(outputsAt(traffic, 500).get(12)).toEqual({ level: 0 });
    expect(outputsAt(traffic, 500).get(10)).toEqual({ pwm: 51, pwmMax: 255 });
    expect(brightness(outputsAt(traffic, 500).get(10))).toBeCloseTo(0.2);
    expect(outputsAt(traffic, 750).get(8)).toEqual({ tone: 440 });
    expect(outputsAt(traffic, 900).get(8)).toEqual({ tone: 0 });
  });

  it("plans LEDs in first-use order, leaving pin 13 to the board", () => {
    const plan = planParts(traffic);
    expect(plan.leds).toEqual([
      { pin: 12, colour: "red" },
      { pin: 11, colour: "yellow" },
      { pin: 10, colour: "green" },
    ]);
    expect(plan.servos).toEqual([9]);
    expect(plan.buzzers).toEqual([8]);
  });

  it("takes LED colours from the names a sketch gives its pins", () => {
    const hints = colourHints("const int RED = 12;\nconst int GREEN_LED = 10;\n#define AMBER 11\nint buttonPin = 2;\n");
    expect([...hints]).toEqual([
      [12, "red"],
      [10, "green"],
      [11, "yellow"],
    ]);
    const crossing = report({
      events: [
        { t: 0, pin: 12, kind: "digital", value: 0 },
        { t: 0, pin: 10, kind: "digital", value: 1 },
      ],
    });
    expect(planParts(crossing, colourHints("const int RED = 12;\nconst int GREEN = 10;")).leds).toEqual([
      { pin: 12, colour: "red" },
      { pin: 10, colour: "green" },
    ]);
  });

  it("shows inputs as knobs and buttons, pressed by the pin's wiring", () => {
    const modes = new Array<number>(20).fill(-1);
    modes[2] = 2;
    modes[3] = 0;
    const run = report({
      modes,
      inputs: [
        { pin: 14, at: 0, value: 512 },
        { pin: 2, at: 100, value: 0 },
        { pin: 2, at: 300, value: 1 },
        { pin: 3, at: 100, value: 1 },
      ],
    });
    const plan = planParts(run);
    expect(plan.knobs).toEqual([14]);
    expect(plan.buttons).toEqual([2, 3]);
    expect(inputAt(run, 14, 0)).toBe(512);
    expect(buttonPressed(run, 2, 50)).toBe(false);
    expect(buttonPressed(run, 2, 200)).toBe(true);
    expect(buttonPressed(run, 2, 300)).toBe(false);
    expect(buttonPressed(run, 3, 200)).toBe(true);
    expect(describeMoment(run, plan, 200)).toBe("knob on A0 reads 512 · button on pin 2 pressed · button on pin 3 pressed");
  });

  it("describes a moment in words", () => {
    expect(describeMoment(traffic, planParts(traffic), 650)).toBe(
      "built-in LED on · red LED (pin 12) off · yellow LED (pin 11) off · green LED (pin 10) 20% · servo (pin 9) at 90° · buzzer (pin 8) quiet",
    );
  });
});
