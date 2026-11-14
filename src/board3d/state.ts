// What the board looks like at a moment of a finished run, and which parts
// to draw around it. Pure functions over a BoardReport, so the 3D scene only
// draws and these rules can be tested without WebGL.

import { screenText } from "../runners/arduino/board";
import type { BoardReport } from "../runners/arduino/board";
import { LED_COLOURS } from "../content/circuit";
import type { Circuit, LedColour } from "../content/circuit";
import { pinName, profileOf } from "../runners/arduino/profiles";

export type { LedColour } from "../content/circuit";

/** The built-in LED of the report's board: 13 on the Uno, GPIO 2 on an ESP32 DevKit. */
export function builtInLedOf(report: Pick<BoardReport, "board"> | null): number {
  return profileOf(report?.board).builtInLed;
}
const OUTPUT = 1;
const INPUT_PULLUP = 2;

/** One output pin at a moment. Missing fields were never written. */
export interface PinState {
  /** 0 or 1 from digitalWrite. */
  level?: number;
  /** Duty from analogWrite (0-255), ledcWrite (0 to pwmMax) or an ESP32 DAC (0-255). */
  pwm?: number;
  /** The largest duty at the pin's PWM resolution (255 unless ledcAttach chose another). */
  pwmMax?: number;
  /** Degrees from Servo.write. */
  angle?: number;
  /** Hz from tone(); 0 after noTone(). */
  tone?: number;
  /** What an OLED on this pin's bus shows. */
  screen?: string;
}

/** The outputs at time `t` (ms): every change at or before it applied in order. */
export function outputsAt(report: Pick<BoardReport, "events">, t: number): Map<number, PinState> {
  const pins = new Map<number, PinState>();
  for (const event of report.events) {
    if (event.t > t) break;
    const state = pins.get(event.pin) ?? {};
    switch (event.kind) {
      case "digital":
        state.level = event.value;
        delete state.pwm;
        break;
      case "pwm":
      case "dac":
        state.pwm = event.value;
        state.pwmMax = event.max ?? 255;
        delete state.level;
        break;
      case "servo":
        state.angle = event.value;
        break;
      case "tone":
        state.tone = event.value;
        break;
      case "screen":
        state.screen = event.text ?? "";
        break;
    }
    pins.set(event.pin, state);
  }
  return pins;
}

/** How bright an LED on this pin is, 0 to 1. */
export function brightness(state: PinState | undefined): number {
  if (!state) return 0;
  if (state.pwm !== undefined) return state.pwm / (state.pwmMax ?? 255);
  return state.level ? 1 : 0;
}

/** The value an input pin reads at time `t`, or undefined if nothing was scheduled yet. */
export function inputAt(report: Pick<BoardReport, "inputs">, pin: number, t: number): number | undefined {
  let value: number | undefined;
  for (const input of report.inputs) {
    if (input.pin === pin && input.at <= t) value = input.value;
  }
  return value;
}

/** Whether a button on `pin` is held down at `t`: LOW with a pull-up, HIGH otherwise. */
export function buttonPressed(report: Pick<BoardReport, "inputs" | "modes">, pin: number, t: number): boolean {
  const value = inputAt(report, pin, t);
  if (value === undefined) return false;
  return report.modes[pin] === INPUT_PULLUP ? value === 0 : value !== 0;
}


/** The parts a run needs around the board, each tied to its pin. */
export interface PartPlan {
  /** External LEDs (with a resistor), in the order the sketch first used their pins. Pin 13 uses the board's own LED. */
  leds: { pin: number; colour: LedColour }[];
  servos: number[];
  buzzers: number[];
  /** Knobs on analog pins that were given values. */
  knobs: number[];
  /** Buttons on digital pins that were given values. */
  buttons: number[];
  /** ESP32 touch pads: pins the sketch read with touchRead. */
  touchPads: number[];
  /** How each button is wired: to GND with the pin's pull-up, or to power with a pull-down resistor. */
  buttonWiring: Record<number, "pull-up" | "pull-down">;
  /** Light sensors (LDR in a divider) on analog pins. */
  ldrs: number[];
  /** RGB LEDs: red, green and blue pins. */
  rgbLeds: [number, number, number][];
  /** What each part is for, from the lesson's circuit, by pin. */
  labels: Record<number, string>;
  /** Analog sensors besides knobs and LDRs: force, temperature (TMP36), soil moisture. */
  fsrs: number[];
  temps: number[];
  soils: number[];
  /** Ultrasonic sensors: [trig, echo]. */
  ultrasonics: number[][];
  /** Motors (or fans) driven through a transistor. */
  motors: number[];
  /** Steppers: IN1 to IN4. */
  steppers: number[][];
  /** OLED screens: [SDA, SCL]. */
  oleds: number[][];
}

/** A plan with nothing in it. */
export function emptyPlan(): PartPlan {
  return {
    leds: [], servos: [], buzzers: [], knobs: [], buttons: [], touchPads: [], buttonWiring: {}, ldrs: [], rgbLeds: [], labels: {},
    fsrs: [], temps: [], soils: [], ultrasonics: [], motors: [], steppers: [], oleds: [],
  };
}

/** The parts of a lesson's circuit, as the scene draws them. */
export function planFromCircuit(circuit: Circuit): PartPlan {
  const plan = emptyPlan();
  for (const part of circuit.parts) {
    const pin = part.pin;
    if (part.label && pin !== undefined) plan.labels[pin] = part.label;
    switch (part.part) {
      case "led":
        plan.leds.push({ pin: pin!, colour: part.colour ?? "red" });
        break;
      case "rgb-led":
        plan.rgbLeds.push(part.pins! as [number, number, number]);
        break;
      case "button":
        plan.buttons.push(pin!);
        plan.buttonWiring[pin!] = part.wiring ?? "pull-up";
        break;
      case "knob":
        plan.knobs.push(pin!);
        break;
      case "ldr":
        plan.ldrs.push(pin!);
        break;
      case "servo":
        plan.servos.push(pin!);
        break;
      case "buzzer":
        plan.buzzers.push(pin!);
        break;
      case "touch-pad":
        plan.touchPads.push(pin!);
        break;
      case "fsr":
        plan.fsrs.push(pin!);
        break;
      case "temp-sensor":
        plan.temps.push(pin!);
        break;
      case "soil-sensor":
        plan.soils.push(pin!);
        break;
      case "ultrasonic":
        plan.ultrasonics.push(part.pins!);
        break;
      case "motor":
        plan.motors.push(pin!);
        break;
      case "stepper":
        plan.steppers.push(part.pins!);
        break;
      case "oled":
        plan.oleds.push(part.pins!);
        break;
    }
  }
  return plan;
}

/** touchRead with nobody touching; a reading below half of it counts as touched. */
export const TOUCH_IDLE = 70;

/** Whether the touch pad on `pin` is touched at `t`, and what it reads. */
export function touchAt(report: Pick<BoardReport, "inputs">, pin: number, t: number): { reading: number; touched: boolean } {
  const reading = inputAt(report, pin, t) ?? TOUCH_IDLE;
  return { reading, touched: reading < TOUCH_IDLE / 2 };
}

/**
 * LED colours a sketch names: `const int RED = 12;` or `#define GREEN_LED 10`
 * makes pin 12 red and pin 10 green.
 */
export function colourHints(code: string): Map<number, LedColour> {
  const hints = new Map<number, LedColour>();
  const pattern = /(?:#define\s+(\w+)\s+|\b(?:const\s+)?(?:int|byte|uint8_t|short|long)\s+(\w+)\s*=\s*)(\d+)\b/g;
  for (const match of code.matchAll(pattern)) {
    const name = (match[1] ?? match[2] ?? "").toLowerCase();
    const colour = LED_COLOURS.find((candidate) => name.includes(candidate)) ?? (name.includes("amber") || name.includes("orange") ? "yellow" : undefined);
    if (colour && !hints.has(Number(match[3]))) hints.set(Number(match[3]), colour);
  }
  return hints;
}

export function planParts(report: Pick<BoardReport, "events" | "inputs" | "modes" | "board" | "touchPins"> & { reads?: BoardReport["reads"] }, hints: ReadonlyMap<number, LedColour> = new Map()): PartPlan {
  const profile = profileOf(report.board);
  const builtIn = profile.builtInLed;
  const leds: number[] = [];
  const servos: number[] = [];
  const buzzers: number[] = [];
  const add = (list: number[], pin: number): void => {
    if (!list.includes(pin)) list.push(pin);
  };
  for (const event of report.events) {
    if (event.kind === "servo") add(servos, event.pin);
    else if (event.kind === "tone") add(buzzers, event.pin);
    else if (event.kind === "screen") continue;
    else if (event.pin !== builtIn) add(leds, event.pin);
  }
  // A pin that drives a servo or a buzzer is not also an LED.
  const ledPins = leds.filter((pin) => !servos.includes(pin) && !buzzers.includes(pin));
  const knobs: number[] = [];
  const buttons: number[] = [];
  // An analog pin given readings (not just 0 and 1) is a knob; other inputs are buttons.
  const analog = new Set(report.inputs.filter((input) => input.value > 1 && profile.analogPins.has(input.pin)).map((input) => input.pin));
  const touchPads = [...(report.touchPins ?? [])];
  // Pins the sketch reads get a part even before anything is given to them (for live runs).
  for (const pin of report.reads?.analog ?? []) if (!touchPads.includes(pin)) add(knobs, pin);
  for (const pin of report.reads?.digital ?? []) if (report.modes[pin] !== OUTPUT && pin !== builtIn) add(buttons, pin);
  for (const input of report.inputs) {
    if (touchPads.includes(input.pin)) continue;
    if (analog.has(input.pin)) add(knobs, input.pin);
    else if (report.modes[input.pin] !== OUTPUT) add(buttons, input.pin);
  }
  return {
    leds: ledPins.map((pin, index) => ({ pin, colour: hints.get(pin) ?? LED_COLOURS[index % LED_COLOURS.length]! })),
    servos,
    buzzers,
    knobs: knobs.sort((a, b) => a - b),
    buttons: buttons.sort((a, b) => a - b),
    touchPads,
    buttonWiring: Object.fromEntries(buttons.map((pin) => [pin, report.modes[pin] === INPUT_PULLUP ? "pull-up" : "pull-down"])),
    ldrs: [],
    rgbLeds: [],
    labels: {},
    fsrs: [],
    temps: [],
    soils: [],
    ultrasonics: [],
    motors: [],
    steppers: [],
    oleds: report.events.some((event) => event.kind === "screen") ? [[profile.id === "esp32" ? 21 : 18, profile.id === "esp32" ? 22 : 19]] : [],
  };
}

/** The moment in words, for the status line and screen readers. */
export function describeMoment(report: Pick<BoardReport, "events" | "inputs" | "modes" | "board" | "touchPins"> & { reads?: BoardReport["reads"] }, plan: PartPlan, t: number): string {
  const profile = profileOf(report.board);
  const name = (pin: number): string => pinName(pin, profile);
  const outputs = outputsAt(report, t);
  const parts: string[] = [];
  const led = outputs.get(profile.builtInLed);
  if (led) parts.push(`built-in LED ${brightness(led) > 0 ? "on" : "off"}`);
  for (const { pin, colour } of plan.leds) {
    const state = outputs.get(pin);
    const level = brightness(state);
    const text = state?.pwm !== undefined ? `${Math.round(level * 100)}%` : level > 0 ? "on" : "off";
    parts.push(`${colour} LED (${profile.id === "esp32" ? "" : "pin "}${name(pin)}) ${text}`);
  }
  for (const pin of plan.servos) parts.push(`servo (${profile.id === "esp32" ? "" : "pin "}${name(pin)}) at ${outputs.get(pin)?.angle ?? 0}°`);
  for (const pin of plan.buzzers) {
    const hz = outputs.get(pin)?.tone ?? 0;
    parts.push(`buzzer (${profile.id === "esp32" ? "" : "pin "}${name(pin)}) ${hz ? `${hz} Hz` : "quiet"}`);
  }
  for (const pin of plan.knobs) parts.push(`knob on ${name(pin)} reads ${inputAt(report, pin, t) ?? 0}`);
  for (const pins of plan.rgbLeds) {
    const [r, g, b] = pins.map((pin) => Math.round(brightness(outputs.get(pin)) * 255));
    parts.push(`RGB LED red ${r}, green ${g}, blue ${b}`);
  }
  for (const pin of plan.ldrs) parts.push(`light sensor on ${name(pin)} reads ${inputAt(report, pin, t) ?? 0}`);
  for (const pin of plan.fsrs) parts.push(`force sensor on ${name(pin)} reads ${inputAt(report, pin, t) ?? 0}`);
  for (const pin of plan.temps) {
    const reading = inputAt(report, pin, t) ?? 0;
    parts.push(`temperature sensor on ${name(pin)} reads ${reading} (about ${tmp36Celsius(reading, report.board).toFixed(1)} °C)`);
  }
  for (const pin of plan.soils) parts.push(`soil sensor on ${name(pin)} reads ${inputAt(report, pin, t) ?? 0}`);
  for (const [, echo] of plan.ultrasonics) parts.push(`obstacle ${inputAt(report, echo!, t) ?? "out of range"} cm away`);
  for (const pin of plan.motors) parts.push(`motor (${name(pin)}) ${Math.round(brightness(outputs.get(pin)) * 100)}%`);
  for (const pins of plan.steppers) parts.push(`stepper at ${Math.round(((stepperTurnsAt(report, pins, t) % 1) + 1) % 1 * 360)}°`);
  if (plan.oleds.length > 0) {
    const shown = screenAt(report, t);
    parts.push(shown ? `screen shows "${screenText(shown)}"` : "screen blank");
  }
  for (const pin of plan.touchPads) {
    const { reading, touched } = touchAt(report, pin, t);
    parts.push(`touch pad on ${name(pin)} ${touched ? "touched" : "not touched"} (reads ${reading})`);
  }
  for (const pin of plan.buttons) parts.push(`button on ${profile.id === "esp32" ? "" : "pin "}${name(pin)} ${buttonPressed(report, pin, t) ? "pressed" : "up"}`);
  return parts.length ? parts.join(" · ") : "Nothing connected has changed yet";
}

/** TMP36: a reading as degrees Celsius (0.5 V at 0 °C, 10 mV per degree). */
export function tmp36Celsius(reading: number, board: BoardReport["board"]): number {
  const profile = profileOf(board);
  const millivolts = (reading / (2 ** profile.adcBits - 1)) * profile.volts * 1000;
  return (millivolts - 500) / 10;
}

/** Half-step coil patterns of a 4-wire stepper (IN1 is bit 0); full steps use every other one. */
const STEP_PATTERNS = [0b0001, 0b0011, 0b0010, 0b0110, 0b0100, 0b1100, 0b1000, 0b1001];
/** A 28BYJ-48 turns once in 4096 half steps. */
const HALF_STEPS_PER_TURN = 4096;
const stepperCache = new WeakMap<object, Map<string, { t: number; turns: number }[]>>();

/** How far a stepper has turned at `t`, in turns, from the order its coils were switched. */
export function stepperTurnsAt(report: Pick<BoardReport, "events">, pins: readonly number[], t: number): number {
  let byPins = stepperCache.get(report.events);
  if (!byPins) stepperCache.set(report.events, (byPins = new Map()));
  const key = pins.join(",");
  let track = byPins.get(key);
  if (!track) {
    track = [{ t: 0, turns: 0 }];
    let coils = 0;
    let phase = -1;
    let halfSteps = 0;
    const events = report.events.filter((event) => event.kind === "digital" && pins.includes(event.pin));
    for (let i = 0; i < events.length; i++) {
      const event = events[i]!;
      const bit = 1 << pins.indexOf(event.pin);
      coils = event.value ? coils | bit : coils & ~bit;
      // Changes at the same moment form one step.
      if (i + 1 < events.length && events[i + 1]!.t === event.t) continue;
      const next = STEP_PATTERNS.indexOf(coils);
      if (next < 0) continue;
      if (phase >= 0) {
        let delta = (next - phase + 8) % 8;
        if (delta > 4) delta -= 8;
        halfSteps += delta;
      }
      phase = next;
      track.push({ t: event.t, turns: halfSteps / HALF_STEPS_PER_TURN });
    }
    byPins.set(key, track);
  }
  let turns = 0;
  for (const point of track) {
    if (point.t > t) break;
    turns = point.turns;
  }
  return turns;
}

/** How many turns a motor has made by `t`: its speed (0 to 1 from the pin) times time, at `turnsPerSecond` when full. */
export function motorTurnsAt(report: Pick<BoardReport, "events">, pin: number, t: number, turnsPerSecond = 4): number {
  let turns = 0;
  let speed = 0;
  let since = 0;
  for (const event of report.events) {
    if (event.pin !== pin || (event.kind !== "digital" && event.kind !== "pwm")) continue;
    if (event.t > t) break;
    turns += speed * ((event.t - since) / 1000) * turnsPerSecond;
    speed = event.kind === "pwm" ? event.value / (event.max ?? 255) : event.value ? 1 : 0;
    since = event.t;
  }
  return turns + speed * ((t - since) / 1000) * turnsPerSecond;
}

/** What the OLED shows at `t`, or "" before it shows anything. */
export function screenAt(report: Pick<BoardReport, "events">, t: number): string {
  let text = "";
  for (const event of report.events) {
    if (event.t > t) break;
    if (event.kind === "screen") text = event.text ?? "";
  }
  return text;
}
