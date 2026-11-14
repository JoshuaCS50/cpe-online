// A virtual board (an Arduino Uno or an ESP32 DevKit, see profiles.ts): pin
// modes and values, a virtual clock, servos, tones and PWM, with every change
// of an output recorded. The C++ side of a sketch (Arduino.h) reaches it
// through the functions in `imports()`.
//
// Time: delay() moves the clock forward at once. A loop() that never waits
// still advances time by LOOP_STEP_MS, and each millis() call by
// MILLIS_STEP_MS, so code that waits by watching millis() also moves on.
// When the run time is used up, the board ends the program.

import { WasiExit } from "../cpp/wasi";
import { liveInput, liveSleep, liveStopped } from "./live";
import { UNO, pinLabel, pinName, profileOf } from "./profiles";
import type { BoardId, BoardProfile } from "./profiles";

export { pinName } from "./profiles";

/** A0 to A5 are pins 14 to 19 on the Uno. */
export const ANALOG_FIRST = 14;
const LOOP_STEP_MS = 0.01;
const MILLIS_STEP_MS = 0.001;
/** What touchRead gives on an ESP32 when nobody touches the pin. */
const TOUCH_IDLE = 70;

// INPUT is 0; a pin that is not OUTPUT or INPUT_PULLUP is treated as a plain input.
const OUTPUT = 1;
const INPUT_PULLUP = 2;

/**
 * Thrown when a sketch goes into deep sleep with a wake-up timer set. The
 * runner catches it, moves the clock on and starts the program again, as a
 * real ESP32 restarts from setup() when it wakes.
 */
export class DeepSleepWake extends Error {
  constructor(readonly sleepMs: number) {
    super(`deep sleep for ${sleepMs} ms`);
    this.name = "DeepSleepWake";
  }
}

/** esp_sleep_get_wakeup_cause(): 0 after power-on, 4 after a timer wake-up. */
const WAKE_TIMER = 4;

/** One change on the board, at a time in ms. */
export interface BoardEvent {
  t: number;
  pin: number;
  kind: "digital" | "pwm" | "servo" | "tone" | "dac" | "screen";
  value: number;
  /** PWM only: the largest duty at the pin's resolution, when it is not 255. */
  max?: number;
  /** Screen only: what an I²C OLED shows, one line per text row, each starting with its size (1 or 2). */
  text?: string;
}

/** A screen's text as people read it: its rows, without the size marks, joined by " / ". */
export function screenText(text: string): string {
  return text
    .split("\n")
    .filter((line) => line.length > 1)
    .map((line) => line.slice(1).trimEnd())
    .join(" / ");
}

/** A value applied to an input pin from a time on: digital 0/1, an analog reading, or a touch reading. */
export interface ScheduledInput {
  pin: number;
  at: number;
  value: number;
}

/** Everything a run left behind, for the terminal, the checker and the board view. */
export interface BoardReport {
  board: BoardId;
  runMs: number;
  /** The changes as lines, as timeline() gives them. */
  timeline: string[];
  warnings: string[];
  /** The changes themselves, in the order they happened. */
  events: BoardEvent[];
  /** The inputs the run was given. */
  inputs: ScheduledInput[];
  /** Each pin's mode when the run ended: 0 INPUT, 1 OUTPUT, 2 INPUT_PULLUP, -1 never set. */
  modes: number[];
  /** ESP32: pins the sketch read with touchRead. */
  touchPins: number[];
  /** Pins the sketch read with digitalRead and analogRead, so a live view can offer buttons and knobs for them. */
  reads: PinReads;
}

export interface PinReads {
  digital: number[];
  analog: number[];
}

export interface BoardOptions {
  /** How much board time to run, in ms. */
  runMs: number;
  inputs?: readonly ScheduledInput[];
  /** The board to be (default: the Uno). */
  board?: BoardId;
  /**
   * A live run: board time follows real time, inputs come from the page
   * through `channel` (see live.ts), and changes are sent with `onChanges`
   * as they happen, with the pin modes so the page knows how buttons are wired.
   */
  live?: { channel: SharedArrayBuffer; onChanges(events: BoardEvent[], t: number, modes: number[], reads: PinReads): void };
}

/** How often a live run sends its changes, in ms of real time. */
const LIVE_FLUSH_MS = 30;

/** "2 HIGH at 1200", "A0 512 at 0", "GPIO 34 2048 at 0" -> a scheduled input. */
export function parseInput(text: string, profile: BoardProfile = UNO): ScheduledInput {
  const match = /^\s*(?:GPIO\s*)?([A-Z]+\d*|\d+)\s+(HIGH|LOW|\d+)\s+at\s+(\d+(?:\.\d+)?)\s*(?:ms)?\s*$/i.exec(text);
  const example = profile.id === "esp32" ? '"GPIO 4 LOW at 500" or "GPIO 34 2048 at 0"' : '"2 HIGH at 1200" or "A0 512 at 0"';
  if (!match) throw new Error(`input "${text}" should look like ${example}`);
  const name = match[1]!.toUpperCase();
  const pin = /^\d+$/.test(name) ? Number(name) : profile.aliases[name];
  if (pin === undefined || !profile.pins.has(pin)) throw new Error(`input "${text}": the ${profile.name} has no pin ${match[1]}`);
  const word = match[2]!.toUpperCase();
  const value = word === "HIGH" ? 1 : word === "LOW" ? 0 : Number(word);
  return { pin, at: Number(match[3]), value };
}

/** One event as a line of the timeline, for people and for checks. */
export function describeEvent(event: BoardEvent, profile: BoardProfile = UNO): string {
  const time = `${Math.round(event.t)} ms`;
  const pin = pinLabel(event.pin, profile);
  switch (event.kind) {
    case "digital":
      return `${time}: ${pin} ${event.value ? "HIGH" : "LOW"}`;
    case "pwm":
      return `${time}: ${pin} PWM ${event.value}${event.max !== undefined ? ` of ${event.max}` : ""}`;
    case "dac":
      return `${time}: ${pin} DAC ${event.value}`;
    case "servo":
      return `${time}: servo on ${pin} at ${event.value} degrees`;
    case "tone":
      return event.value ? `${time}: tone on ${pin} at ${event.value} Hz` : `${time}: tone on ${pin} off`;
    case "screen":
      return `${time}: screen shows "${screenText(event.text ?? "")}"`;
  }
}

/** Sound travels about 0.0343 cm per microsecond, there and back: 58.3 µs of echo per cm. */
export const ECHO_MICROS_PER_CM = 58.3;

export class VirtualBoard {
  readonly runMs: number;
  readonly profile: BoardProfile;
  readonly events: BoardEvent[] = [];
  /** Things a real board would do differently or that look like mistakes, each said once. */
  readonly warnings: string[] = [];
  private time = 0;
  private timeAtLoopStart = 0;
  private readonly modes: number[];
  private readonly outputs: number[];
  private readonly inputs: ScheduledInput[];
  private serialBegun = false;
  private readonly said = new Set<string>();
  /** analogRead's resolution now (ESP32: analogReadResolution changes it). */
  private adcBits: number;
  /** ESP32 LEDC: the resolution each attached pin was given. */
  private readonly ledcBits = new Map<number, number>();
  /** Last value recorded per pin and kind: writing the same value again is not a change. */
  private readonly lastValues = new Map<string, number>();
  private readonly touched = new Set<number>();
  /** The last thing an OLED screen showed, so showing it again is not a change. */
  private lastScreen: string | null = null;
  private readonly digitalReads = new Set<number>();
  private readonly analogReads = new Set<number>();
  /** ESP32 deep sleep: the wake-up timer, the RTC memory kept while asleep, and how many times the board woke. */
  private sleepTimerMs: number | null = null;
  private rtcMemory: Uint8Array | null = null;
  private memory: WebAssembly.Memory | null = null;
  private wakes = 0;
  /** Live runs: the shared inputs, real-time start, changes not yet sent, and the last value seen on each pin. */
  private readonly live: { view: Int32Array; start: number; sent: number; lastFlush: number; onChanges: NonNullable<BoardOptions["live"]>["onChanges"] } | null;
  private readonly liveSeen = new Map<number, number>();

  constructor(options: BoardOptions) {
    this.runMs = options.runMs;
    this.profile = profileOf(options.board);
    const size = Math.max(...this.profile.pins) + 1;
    this.modes = new Array<number>(size).fill(-1);
    this.outputs = new Array<number>(size).fill(0);
    this.adcBits = this.profile.adcBits;
    this.inputs = [...(options.inputs ?? [])].sort((a, b) => a.at - b.at);
    this.live = options.live
      ? { view: new Int32Array(options.live.channel), start: performance.now(), sent: 0, lastFlush: 0, onChanges: options.live.onChanges }
      : null;
  }

  /** Live runs: board time is real time since the start; changes go to the page every LIVE_FLUSH_MS. */
  private liveTick(): void {
    const live = this.live!;
    this.time = Math.min(this.runMs, performance.now() - live.start);
    if (this.time - live.lastFlush >= LIVE_FLUSH_MS) this.flushLive();
    if (liveStopped(live.view) || this.time >= this.runMs) {
      this.flushLive();
      throw new WasiExit(0);
    }
  }

  /** Sends the changes since the last flush. */
  flushLive(): void {
    const live = this.live;
    if (!live) return;
    live.lastFlush = this.time;
    const fresh = this.events.slice(live.sent);
    live.sent = this.events.length;
    live.onChanges(fresh, this.time, [...this.modes], this.readPins());
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
      .map(({ event }) => describeEvent(event, this.profile));
  }

  report(): BoardReport {
    return {
      board: this.profile.id,
      runMs: this.runMs,
      timeline: this.timeline(),
      warnings: [...this.warnings],
      events: this.events.map((event) => ({ ...event })),
      inputs: this.inputs.map((input) => ({ ...input })),
      modes: [...this.modes],
      touchPins: [...this.touched].sort((a, b) => a - b),
      reads: this.readPins(),
    };
  }

  private readPins(): PinReads {
    return { digital: [...this.digitalReads].sort((a, b) => a - b), analog: [...this.analogReads].sort((a, b) => a - b) };
  }

  /** The running program's memory, for RTC variables kept through deep sleep. */
  useMemory(memory: WebAssembly.Memory): void {
    this.memory = memory;
  }

  /**
   * After a deep sleep: moves the clock past the sleep. Returns false when the
   * run time ends first, so the program is not started again.
   */
  wakeAfterSleep(sleepMs: number): boolean {
    if (this.live) {
      this.flushLive();
      liveSleep(this.live.view, sleepMs);
      this.time = Math.min(this.runMs, performance.now() - this.live.start);
      if (liveStopped(this.live.view)) return false;
    } else this.time = Math.min(this.runMs, this.time + sleepMs);
    if (this.time >= this.runMs) return false;
    this.timeAtLoopStart = this.time;
    this.wakes += 1;
    if (this.wakes === 1) {
      this.warn("woke", "The board woke from deep sleep and started setup() again. Only RTC_DATA_ATTR variables kept their values; everything else started fresh.");
    }
    return true;
  }

  /** Deep sleep: outputs stop driving their pins and the board forgets its settings. */
  private fallAsleep(): void {
    for (const event of [...this.events].reverse()) {
      const key = `${event.kind}:${event.pin}`;
      if (!this.lastValues.has(key)) continue;
      if (event.kind === "digital" && this.outputs[event.pin]) {
        this.outputs[event.pin] = 0;
        this.record(event.pin, "digital", 0);
      } else if ((event.kind === "pwm" || event.kind === "dac") && this.lastValues.get(key)) {
        this.record(event.pin, event.kind, 0, event.max);
      }
    }
    this.modes.fill(-1);
    this.ledcBits.clear();
    this.adcBits = this.profile.adcBits;
    this.serialBegun = false;
  }

  private warn(key: string, text: string): void {
    if (this.said.has(key)) return;
    this.said.add(key);
    this.warnings.push(text);
  }

  private name(pin: number): string {
    return pinName(pin, this.profile);
  }

  private checkPin(pin: number, what: string): boolean {
    if (Number.isInteger(pin) && this.profile.pins.has(pin)) return true;
    const reason = this.profile.reserved[pin];
    if (reason) this.warn(`bad-pin-${pin}`, `${what}(${pin}): ${this.name(pin)} ${reason}. Pick another pin.`);
    else if (this.profile.id === "esp32") this.warn(`bad-pin-${pin}`, `${what}(${pin}): an ESP32 DevKit has no GPIO ${pin}.`);
    else this.warn(`bad-pin-${pin}`, `${what}(${pin}): an Uno has pins 0 to 13 and A0 to A5 (14 to 19).`);
    return false;
  }

  /** False, with a note, for a pin that cannot drive anything. */
  private checkOutput(pin: number, what: string): boolean {
    if (!this.checkPin(pin, what)) return false;
    if (!this.profile.inputOnly.has(pin)) return true;
    this.warn(`input-only-${pin}`, `${what} on ${this.name(pin)}: GPIO 34 to 39 can only read, so nothing connected there will change. Use an output pin such as GPIO 23.`);
    return false;
  }

  private record(pin: number, kind: BoardEvent["kind"], value: number, max?: number): void {
    const key = `${kind}:${pin}`;
    if (kind !== "digital" && this.lastValues.get(key) === value) return;
    this.lastValues.set(key, value);
    this.events.push({ t: this.time, pin, kind, value, ...(max !== undefined ? { max } : {}) });
  }

  /** Moves the clock; ends the program when the run time is used up. */
  private advance(ms: number): void {
    if (this.live) {
      // A live delay really waits, but wakes at once if the page presses Stop.
      if (ms >= 1) liveSleep(this.live.view, ms);
      this.liveTick();
      return;
    }
    this.time += ms;
    if (this.time >= this.runMs) {
      this.time = this.runMs;
      throw new WasiExit(0);
    }
  }

  private inputValue(pin: number): number | undefined {
    if (this.live) {
      const given = liveInput(this.live.view, pin);
      if (given !== undefined) {
        // Keep what the page did as an input, so the run can be replayed afterwards.
        if (this.liveSeen.get(pin) !== given) {
          this.liveSeen.set(pin, given);
          this.inputs.push({ pin, at: this.time, value: given });
        }
        return given;
      }
    }
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
    const esp32 = this.profile.id === "esp32";
    return {
      pin_mode: (pin: number, mode: number) => {
        if (!this.checkPin(pin, "pinMode")) return;
        if (mode === OUTPUT && !this.checkOutput(pin, "pinMode")) return;
        if (mode === INPUT_PULLUP && this.profile.inputOnly.has(pin)) {
          this.warn(`pullup-${pin}`, `pinMode(${pin}, INPUT_PULLUP): GPIO 34 to 39 have no pull-up resistor, so an unpressed button there reads at random. Use a pin like GPIO 4, or add a 10 kΩ resistor to 3.3 V.`);
          this.modes[pin] = 0;
          return;
        }
        this.modes[pin] = mode;
      },
      digital_write: (pin: number, value: number) => {
        if (!this.checkOutput(pin, "digitalWrite")) return;
        if (this.modes[pin] !== OUTPUT) {
          this.warn(`write-${pin}`, `${this.name(pin)} is written with digitalWrite but was never set as an output with pinMode(${pin}, OUTPUT). On a real board an LED there would only glow faintly.`);
        }
        const next = value ? 1 : 0;
        if (this.outputs[pin] === next && this.events.some((event) => event.pin === pin)) return;
        this.outputs[pin] = next;
        this.record(pin, "digital", next);
      },
      digital_read: (pin: number) => {
        if (!this.checkPin(pin, "digitalRead")) return 0;
        this.digitalReads.add(pin);
        const scheduled = this.inputValue(pin);
        if (scheduled !== undefined) return scheduled ? 1 : 0;
        if (this.modes[pin] === OUTPUT) return this.outputs[pin] ?? 0;
        // Nothing connected: a pull-up reads HIGH; a plain input floats, read here as LOW.
        return this.modes[pin] === INPUT_PULLUP ? 1 : 0;
      },
      analog_read: (pin: number) => {
        // On an Uno, analogRead(0) means A0.
        const real = !esp32 && pin >= 0 && pin <= 5 ? pin + ANALOG_FIRST : pin;
        if (!this.profile.analogPins.has(real)) {
          const which = esp32 ? "the ADC pins (GPIO 32 to 39 are the safest)" : "A0 to A5";
          this.warn(`analog-${pin}`, `analogRead(${pin}): only ${which} can read voltages.`);
          return 0;
        }
        this.analogReads.add(real);
        // Inputs are given at the board's own resolution; scale them to the one the sketch chose.
        const full = this.inputValue(real) ?? 0;
        const scaled = Math.round(full * 2 ** (this.adcBits - this.profile.adcBits));
        return Math.max(0, Math.min(2 ** this.adcBits - 1, scaled));
      },
      analog_write: (pin: number, value: number) => {
        if (!this.checkOutput(pin, "analogWrite")) return;
        if (this.profile.pwmPins && !this.profile.pwmPins.has(pin)) {
          this.warn(`pwm-${pin}`, `analogWrite on pin ${this.name(pin)}: an Uno only has PWM on pins 3, 5, 6, 9, 10 and 11, so this pin is just switched fully on (128 or more) or off.`);
          this.record(pin, "digital", value >= 128 ? 1 : 0);
          return;
        }
        this.record(pin, "pwm", value);
      },
      servo_write: (pin: number, angle: number) => {
        if (!this.checkOutput(pin, "Servo.attach")) return;
        this.record(pin, "servo", angle);
      },
      tone: (pin: number, frequency: number) => {
        if (!this.checkOutput(pin, "tone")) return;
        this.record(pin, "tone", frequency);
      },
      // ───── ESP32 only (Arduino.h declares these only for the ESP32) ─────
      ledc_attach: (pin: number, frequency: number, bits: number) => {
        if (!this.checkOutput(pin, "ledcAttach")) return 0;
        if (bits < 1 || bits > 20) {
          this.warn(`ledc-bits-${pin}`, `ledcAttach(${pin}, ${frequency}, ${bits}): the resolution must be 1 to 20 bits.`);
          return 0;
        }
        // The PWM clock is 80 MHz: frequency × 2^bits cannot go past it.
        if (frequency * 2 ** bits > 80_000_000) {
          this.warn(`ledc-freq-${pin}`, `ledcAttach(${pin}, ${frequency}, ${bits}): ${frequency} Hz is too fast for ${bits}-bit steps (frequency × 2^bits must stay under 80 MHz). Use fewer bits or a lower frequency.`);
          return 0;
        }
        this.ledcBits.set(pin, bits);
        return 1;
      },
      ledc_write: (pin: number, duty: number) => {
        const bits = this.ledcBits.get(pin);
        if (bits === undefined) {
          this.warn(`ledc-${pin}`, `ledcWrite(${pin}, ...) before ledcAttach(${pin}, frequency, bits): the pin has no PWM set up, so nothing happens.`);
          return 0;
        }
        const max = 2 ** bits - 1;
        this.record(pin, "pwm", Math.max(0, Math.min(max, duty)), max === 255 ? undefined : max);
        return 1;
      },
      analog_resolution: (bits: number) => {
        this.adcBits = Math.max(9, Math.min(12, bits));
      },
      touch_read: (pin: number) => {
        if (!this.profile.touchPins.has(pin)) {
          this.warn(`touch-${pin}`, `touchRead(${pin}): GPIO ${pin} has no touch sensor. The touch pins are 0, 2, 4, 12, 13, 14, 15, 27, 32 and 33.`);
          return 0;
        }
        this.touched.add(pin);
        return this.inputValue(pin) ?? TOUCH_IDLE;
      },
      dac_write: (pin: number, value: number) => {
        if (!this.profile.dacPins.has(pin)) {
          this.warn(`dac-${pin}`, `dacWrite(${pin}, ...): only GPIO 25 and 26 have a DAC.`);
          return;
        }
        this.record(pin, "dac", Math.max(0, Math.min(255, value)));
      },
      sleep_timer: (ms: number) => {
        this.sleepTimerMs = Math.max(0, ms);
      },
      wake_cause: () => (this.wakes > 0 ? WAKE_TIMER : 0),
      /** Keeps the RTC variables (start address and length in memory) and sleeps. */
      deep_sleep: (rtcStart: number, rtcLength: number) => {
        if (this.memory && rtcLength > 0) this.rtcMemory = new Uint8Array(this.memory.buffer, rtcStart, rtcLength).slice();
        this.fallAsleep();
        if (this.sleepTimerMs === null) {
          this.warn("deep-sleep", `The board went into deep sleep at ${Math.round(this.time)} ms with no wake-up set, so it sleeps until it is reset. Call esp_sleep_enable_timer_wakeup() first.`);
          throw new WasiExit(0);
        }
        throw new DeepSleepWake(this.sleepTimerMs);
      },
      /** At start-up: puts the RTC variables back after a wake-up. */
      rtc_restore: (rtcStart: number, rtcLength: number) => {
        if (!this.memory || !this.rtcMemory || rtcLength !== this.rtcMemory.length) return;
        new Uint8Array(this.memory.buffer, rtcStart, rtcLength).set(this.rtcMemory);
      },
      millis: () => {
        this.advance(MILLIS_STEP_MS);
        return this.time;
      },
      delay: (ms: number) => {
        this.advance(Math.max(0, ms));
      },
      loop_end: () => {
        if (this.live) {
          this.liveTick();
          return;
        }
        // A loop that waited for nothing still takes a little time.
        if (this.time === this.timeAtLoopStart) this.advance(LOOP_STEP_MS);
        this.timeAtLoopStart = this.time;
      },
      serial_begin: () => {
        this.serialBegun = true;
      },
      /** An ultrasonic sensor's echo: the distance given on the pin (cm) as microseconds of HIGH. */
      pulse_in: (pin: number, state: number, timeoutMicros: number) => {
        if (!this.checkPin(pin, "pulseIn")) return 0;
        const distance = this.inputValue(pin);
        const micros = distance !== undefined && state === 1 ? Math.round(distance * ECHO_MICROS_PER_CM) : 0;
        const waited = micros > 0 && micros <= timeoutMicros ? micros : timeoutMicros;
        this.advance(waited / 1000);
        return micros > 0 && micros <= timeoutMicros ? micros : 0;
      },
      /** An OLED screen's display(): what it shows, read from the sketch's memory. */
      screen_show: (pointer: number, length: number) => {
        if (!this.memory) return;
        const text = new TextDecoder().decode(new Uint8Array(this.memory.buffer, pointer, length).slice());
        const pin = this.profile.id === "esp32" ? 21 : 18;
        if (this.lastScreen === text) return;
        this.lastScreen = text;
        this.events.push({ t: this.time, pin, kind: "screen", value: 0, text });
      },
      serial_used: () => {
        const speed = esp32 ? "115200" : "9600";
        if (!this.serialBegun) this.warn("serial", `Serial is printed to before Serial.begin(${speed}) was called. On a real board nothing would appear in the Serial Monitor.`);
      },
    };
  }
}
