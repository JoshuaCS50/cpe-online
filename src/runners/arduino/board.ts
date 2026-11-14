// A virtual Arduino Uno: pin modes and values, a virtual clock, servos and
// tones, with every change of an output recorded. The C++ side of a sketch
// (Arduino.h) reaches it through the functions in `imports()`.
//
// Time: delay() moves the clock forward at once. A loop() that never waits
// still advances time by LOOP_STEP_MS, and each millis() call by
// MILLIS_STEP_MS, so code that waits by watching millis() also moves on.
// When the run time is used up, the board ends the program.

import { WasiExit } from "../cpp/wasi";

export const DIGITAL_PINS = 14;
/** A0 to A5 are pins 14 to 19, as on the Uno. */
export const ANALOG_FIRST = 14;
const PIN_COUNT = 20;
const PWM_PINS = new Set([3, 5, 6, 9, 10, 11]);
const LOOP_STEP_MS = 0.01;
const MILLIS_STEP_MS = 0.001;

// INPUT is 0; a pin that is not OUTPUT or INPUT_PULLUP is treated as a plain input.
const OUTPUT = 1;
const INPUT_PULLUP = 2;

/** One change on the board, at a time in ms. */
export interface BoardEvent {
  t: number;
  pin: number;
  kind: "digital" | "pwm" | "servo" | "tone";
  value: number;
}

/** A value applied to an input pin from a time on: digital 0/1, or 0-1023 for an analog pin. */
export interface ScheduledInput {
  pin: number;
  at: number;
  value: number;
}

export interface BoardOptions {
  /** How much board time to run, in ms. */
  runMs: number;
  inputs?: readonly ScheduledInput[];
}

export function pinName(pin: number): string {
  return pin >= ANALOG_FIRST && pin < PIN_COUNT ? `A${pin - ANALOG_FIRST}` : String(pin);
}

/** "2 HIGH at 1200", "A0 512 at 0" -> a scheduled input. */
export function parseInput(text: string): ScheduledInput {
  const match = /^\s*(A?\d+)\s+(HIGH|LOW|\d+)\s+at\s+(\d+(?:\.\d+)?)\s*(?:ms)?\s*$/i.exec(text);
  if (!match) throw new Error(`input "${text}" should look like "2 HIGH at 1200" or "A0 512 at 0"`);
  const name = match[1]!.toUpperCase();
  const pin = name.startsWith("A") ? ANALOG_FIRST + Number(name.slice(1)) : Number(name);
  const word = match[2]!.toUpperCase();
  const value = word === "HIGH" ? 1 : word === "LOW" ? 0 : Number(word);
  return { pin, at: Number(match[3]), value };
}

/** One event as a line of the timeline, for people and for checks. */
export function describeEvent(event: BoardEvent): string {
  const time = `${Math.round(event.t)} ms`;
  const pin = pinName(event.pin);
  switch (event.kind) {
    case "digital":
      return `${time}: pin ${pin} ${event.value ? "HIGH" : "LOW"}`;
    case "pwm":
      return `${time}: pin ${pin} PWM ${event.value}`;
    case "servo":
      return `${time}: servo on pin ${pin} at ${event.value} degrees`;
    case "tone":
      return event.value ? `${time}: tone on pin ${pin} at ${event.value} Hz` : `${time}: tone on pin ${pin} off`;
  }
}

export class VirtualBoard {
  readonly runMs: number;
  readonly events: BoardEvent[] = [];
  /** Things a real board would do differently or that look like mistakes, each said once. */
  readonly warnings: string[] = [];
  private time = 0;
  private timeAtLoopStart = 0;
  private readonly modes: number[] = new Array<number>(PIN_COUNT).fill(-1);
  private readonly outputs: number[] = new Array<number>(PIN_COUNT).fill(0);
  private readonly inputs: ScheduledInput[];
  private serialBegun = false;
  private readonly said = new Set<string>();

  constructor(options: BoardOptions) {
    this.runMs = options.runMs;
    this.inputs = [...(options.inputs ?? [])].sort((a, b) => a.at - b.at);
  }

  get now(): number {
    return this.time;
  }

  /**
   * The changes as timeline lines, up to `untilMs` (all of them by default).
   * Changes in the same millisecond happen together, so they are listed by
   * pin number: the order the sketch wrote them in does not matter.
   */
  timeline(untilMs = Infinity): string[] {
    return this.events
      .filter((event) => event.t <= untilMs)
      .map((event, index) => ({ event, index }))
      .sort((a, b) => Math.round(a.event.t) - Math.round(b.event.t) || a.event.pin - b.event.pin || a.index - b.index)
      .map(({ event }) => describeEvent(event));
  }

  private warn(key: string, text: string): void {
    if (this.said.has(key)) return;
    this.said.add(key);
    this.warnings.push(text);
  }

  private checkPin(pin: number, what: string): boolean {
    if (Number.isInteger(pin) && pin >= 0 && pin < PIN_COUNT) return true;
    this.warn(`bad-pin-${pin}`, `${what}(${pin}): an Uno has pins 0 to 13 and A0 to A5 (14 to 19).`);
    return false;
  }

  /** Last value recorded per pin and kind: writing the same value again is not a change. */
  private readonly lastValues = new Map<string, number>();

  private record(pin: number, kind: BoardEvent["kind"], value: number): void {
    const key = `${kind}:${pin}`;
    if (kind !== "digital" && this.lastValues.get(key) === value) return;
    this.lastValues.set(key, value);
    this.events.push({ t: this.time, pin, kind, value });
  }

  /** Moves the clock; ends the program when the run time is used up. */
  private advance(ms: number): void {
    this.time += ms;
    if (this.time >= this.runMs) {
      this.time = this.runMs;
      throw new WasiExit(0);
    }
  }

  private inputValue(pin: number): number | undefined {
    let value: number | undefined;
    for (const input of this.inputs) {
      if (input.pin !== pin) continue;
      if (input.at > this.time) break;
      value = input.value;
    }
    return value;
  }

  /** Functions for the "arduino" import module of a compiled sketch. */
  imports(): Record<string, (...args: never[]) => unknown> {
    return {
      pin_mode: (pin: number, mode: number) => {
        if (!this.checkPin(pin, "pinMode")) return;
        this.modes[pin] = mode;
      },
      digital_write: (pin: number, value: number) => {
        if (!this.checkPin(pin, "digitalWrite")) return;
        if (this.modes[pin] !== OUTPUT) {
          this.warn(`write-${pin}`, `Pin ${pinName(pin)} is written with digitalWrite but was never set as an output with pinMode(${pinName(pin)}, OUTPUT). On a real board an LED there would only glow faintly.`);
        }
        const next = value ? 1 : 0;
        if (this.outputs[pin] === next && this.events.some((event) => event.pin === pin)) return;
        this.outputs[pin] = next;
        this.record(pin, "digital", next);
      },
      digital_read: (pin: number) => {
        if (!this.checkPin(pin, "digitalRead")) return 0;
        const scheduled = this.inputValue(pin);
        if (scheduled !== undefined) return scheduled ? 1 : 0;
        if (this.modes[pin] === OUTPUT) return this.outputs[pin] ?? 0;
        // Nothing connected: a pull-up reads HIGH; a plain input floats, read here as LOW.
        return this.modes[pin] === INPUT_PULLUP ? 1 : 0;
      },
      analog_read: (pin: number) => {
        const real = pin < ANALOG_FIRST && pin >= 0 && pin <= 5 ? pin + ANALOG_FIRST : pin;
        if (real < ANALOG_FIRST || real >= PIN_COUNT) {
          this.warn(`analog-${pin}`, `analogRead(${pin}): only A0 to A5 can read voltages.`);
          return 0;
        }
        const value = this.inputValue(real) ?? 0;
        return Math.max(0, Math.min(1023, Math.round(value)));
      },
      analog_write: (pin: number, value: number) => {
        if (!this.checkPin(pin, "analogWrite")) return;
        if (!PWM_PINS.has(pin)) {
          this.warn(`pwm-${pin}`, `analogWrite on pin ${pinName(pin)}: an Uno only has PWM on pins 3, 5, 6, 9, 10 and 11, so this pin is just switched fully on (128 or more) or off.`);
          this.record(pin, "digital", value >= 128 ? 1 : 0);
          return;
        }
        this.record(pin, "pwm", value);
      },
      servo_write: (pin: number, angle: number) => {
        if (!this.checkPin(pin, "Servo.attach")) return;
        this.record(pin, "servo", angle);
      },
      tone: (pin: number, frequency: number) => {
        if (!this.checkPin(pin, "tone")) return;
        this.record(pin, "tone", frequency);
      },
      millis: () => {
        this.advance(MILLIS_STEP_MS);
        return this.time;
      },
      delay: (ms: number) => {
        this.advance(Math.max(0, ms));
      },
      loop_end: () => {
        // A loop that waited for nothing still takes a little time.
        if (this.time === this.timeAtLoopStart) this.advance(LOOP_STEP_MS);
        this.timeAtLoopStart = this.time;
      },
      serial_begin: () => {
        this.serialBegun = true;
      },
      serial_used: () => {
        if (!this.serialBegun) this.warn("serial", "Serial is printed to before Serial.begin(9600) was called. On a real board nothing would appear in the Serial Monitor.");
      },
    };
  }
}
