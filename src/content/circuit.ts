// A lesson's circuit: the parts on the breadboard and the pins they use.
// From it come the "Circuit" tab (what you need, how it is wired, the
// numbers behind it) and the 3D scene, so the words and the picture always
// describe the same circuit.

import { pinName, profileOf, resolvePin } from "../runners/arduino/profiles";
import type { BoardId, BoardProfile } from "../runners/arduino/profiles";

export const CIRCUIT_PARTS = [
  "led",
  "rgb-led",
  "button",
  "knob",
  "ldr",
  "fsr",
  "temp-sensor",
  "soil-sensor",
  "ultrasonic",
  "servo",
  "buzzer",
  "motor",
  "stepper",
  "oled",
  "touch-pad",
] as const;

/** Parts the sketch reads; the rest are driven by it. */
export const INPUT_PARTS = new Set<CircuitPartKind>(["button", "knob", "ldr", "fsr", "temp-sensor", "soil-sensor", "touch-pad"]);
/** Parts that need an analog pin. */
export const ANALOG_PARTS = new Set<CircuitPartKind>(["knob", "ldr", "fsr", "temp-sensor", "soil-sensor"]);
/** How many pins a part takes in `pins` (the others take one `pin`, and the OLED uses the board's I²C pins). */
export const PIN_COUNTS: Partial<Record<CircuitPartKind, number>> = { "rgb-led": 3, ultrasonic: 2, stepper: 4 };
export type CircuitPartKind = (typeof CIRCUIT_PARTS)[number];

export const LED_COLOURS = ["red", "yellow", "green", "blue", "white"] as const;
export type LedColour = (typeof LED_COLOURS)[number];

/** One part, with its pins already resolved to numbers. */
export interface CircuitPart {
  part: CircuitPartKind;
  /** The signal pin (every part but the RGB LED). */
  pin?: number;
  /** Several pins: RGB LED red, green, blue; ultrasonic trig, echo; stepper IN1 to IN4; OLED SDA, SCL. */
  pins?: number[];
  /** LEDs: the colour (default red). */
  colour?: LedColour;
  /** Buttons: a pull-up (pressed reads LOW, no resistor) or a pull-down resistor (pressed reads HIGH). */
  wiring?: "pull-up" | "pull-down";
  /** LEDs: the series resistor; LDRs: the fixed resistor of the divider. */
  ohms?: number;
  /** What this part is for in the project, such as "Stop light". */
  label?: string;
}

export interface Circuit {
  board: BoardId;
  parts: CircuitPart[];
}

export interface CircuitDocs {
  /** What you need: count and name. */
  parts: { count: number; name: string }[];
  /** How it is wired: one row per board pin. */
  wiring: { pin: string; to: string; does: string }[];
  /** The numbers behind the circuit. */
  specs: { name: string; value: string }[];
}

/** About how many volts each LED colour needs (its forward voltage). */
export const LED_FORWARD_VOLTS: Record<LedColour, number> = { red: 2.0, yellow: 2.1, green: 2.2, blue: 3.0, white: 3.0 };

const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

function ohmsText(ohms: number): string {
  return ohms >= 1000 ? `${ohms / 1000} kΩ` : `${ohms} Ω`;
}

/** The power pin for parts: 5V on an Uno, 3V3 on an ESP32 (servos take 5V from VIN there). */
export function powerPin(profile: BoardProfile): string {
  return profile.id === "esp32" ? "3V3" : "5V";
}

export function circuitDocs(circuit: Circuit): CircuitDocs {
  const profile = profileOf(circuit.board);
  const volts = profile.volts;
  const power = powerPin(profile);
  const name = (pin: number): string => (profile.id === "esp32" ? pinName(pin, profile) : /^\d+$/.test(pinName(pin, profile)) ? `D${pin}` : pinName(pin, profile));

  const parts = new Map<string, number>();
  const need = (what: string, count = 1): void => void parts.set(what, (parts.get(what) ?? 0) + count);
  const signals: { pin: string; to: string; does: string }[] = [];
  const powered = new Map<string, string[]>();
  const grounded: string[] = [];
  const specs: { name: string; value: string }[] = [];
  const spec = (key: string, value: string): void => {
    if (!specs.some((item) => item.name === key)) specs.push({ name: key, value });
  };
  const toPower = (pin: string, what: string): void => void powered.set(pin, [...(powered.get(pin) ?? []), what]);

  need(profile.id === "esp32" ? "ESP32 DevKit (38 pins)" : "Arduino Uno (or an UNO-style board)");
  need(profile.id === "esp32" ? "breadboard, full size (830 holes)" : "breadboard, half size (400 holes)");

  for (const part of circuit.parts) {
    const why = (fallback: string): string => (part.label ? `${part.label}: ${fallback.charAt(0).toLowerCase()}${fallback.slice(1)}` : fallback);
    switch (part.part) {
      case "led": {
        const colour = part.colour ?? "red";
        const ohms = part.ohms ?? 220;
        need(`5 mm LED, ${colour}`);
        need(`${ohmsText(ohms)} resistor`);
        signals.push({ pin: name(part.pin!), to: `${ohmsText(ohms)} resistor → ${colour} LED (+, long leg)`, does: why("The sketch switches this pin HIGH and LOW.") });
        grounded.push(`${colour} LED (−, short leg)`);
        const forward = LED_FORWARD_VOLTS[colour];
        const milliamps = ((volts - forward) / ohms) * 1000;
        spec(`${capital(colour)} LED`, `5 mm, about ${forward} V forward, 20 mA at most`);
        spec(`${capital(colour)} LED current`, `(${volts} − ${forward}) ÷ ${ohms} ≈ ${milliamps.toFixed(1)} mA`);
        break;
      }
      case "rgb-led": {
        need("RGB LED, common cathode (4 legs)");
        need("220 Ω resistor", 3);
        const [red, green, blue] = part.pins!;
        signals.push({ pin: name(red!), to: "220 Ω → RGB LED red leg", does: why("Brightness of red (PWM).") });
        signals.push({ pin: name(green!), to: "220 Ω → RGB LED green leg", does: why("Brightness of green (PWM).") });
        signals.push({ pin: name(blue!), to: "220 Ω → RGB LED blue leg", does: why("Brightness of blue (PWM).") });
        grounded.push("RGB LED common leg (the longest)");
        spec("RGB LED", "common cathode; about 2.0 V red, 3.0 V green and blue");
        spec("Colours", "256 × 256 × 256 ≈ 16.7 million mixes");
        break;
      }
      case "button": {
        need("push button (tactile switch)");
        if ((part.wiring ?? "pull-up") === "pull-up") {
          signals.push({ pin: name(part.pin!), to: "Button (one leg)", does: why("Reads LOW while the button is held (INPUT_PULLUP: no resistor needed).") });
          grounded.push("Button (other leg)");
        } else {
          need("10 kΩ resistor");
          toPower(power, "Button (one leg)");
          signals.push({ pin: name(part.pin!), to: "Button (other leg) + 10 kΩ to GND", does: why("Reads HIGH while the button is held.") });
          grounded.push("10 kΩ pull-down resistor");
          spec("Pull-down", "10 kΩ to GND keeps the pin LOW while the button is up");
        }
        spec("Button", "contacts bounce for about 5 ms when pressed");
        break;
      }
      case "knob": {
        need("10 kΩ potentiometer (knob)");
        toPower(power, "Potentiometer (left leg)");
        signals.push({ pin: name(part.pin!), to: "Potentiometer (middle leg, the wiper)", does: why(`0 to ${volts} V as you turn it.`) });
        grounded.push("Potentiometer (right leg)");
        const steps = 2 ** profile.adcBits - 1;
        spec("Potentiometer", "10 kΩ, linear, about 270° of travel");
        spec("analogRead", `${profile.adcBits} bits: 0 to ${steps}, about ${((volts / steps) * 1000).toFixed(1)} mV per step`);
        break;
      }
      case "ldr": {
        const ohms = part.ohms ?? 10000;
        need("light-dependent resistor (LDR)");
        need(`${ohmsText(ohms)} resistor`);
        toPower(power, "LDR (one leg)");
        signals.push({ pin: name(part.pin!), to: `LDR + ${ohmsText(ohms)} (the middle of the divider)`, does: why("Higher when brighter.") });
        grounded.push(`${ohmsText(ohms)} resistor`);
        spec("LDR", "about 10 to 20 kΩ in daylight, about 1 MΩ in the dark");
        break;
      }
      case "servo": {
        need("SG90 micro servo");
        const servoPower = profile.id === "esp32" ? "5V (VIN)" : "5V";
        toPower(servoPower, "Servo + (red wire)");
        signals.push({ pin: name(part.pin!), to: "Servo signal (orange wire)", does: why("A pulse every 20 ms sets the angle.") });
        grounded.push("Servo − (brown wire)");
        spec("Servo", "SG90, 0 to 180°, about 0.1 s per 60°");
        spec("Servo signal", "50 Hz, pulses of 0.5 to 2.4 ms");
        break;
      }
      case "buzzer": {
        need("passive piezo buzzer");
        signals.push({ pin: name(part.pin!), to: "Buzzer (+)", does: why("tone() flips the pin at the note's frequency.") });
        grounded.push("Buzzer (−)");
        spec("Buzzer", "passive piezo, about 100 Hz to 10 kHz; middle A is 440 Hz");
        break;
      }
      case "fsr": {
        need("force-sensing resistor (FSR 402)");
        need("10 kΩ resistor");
        toPower(power, "Force sensor (one leg)");
        signals.push({ pin: name(part.pin!), to: "Force sensor + 10 kΩ to GND", does: why("Higher the harder you press.") });
        grounded.push("10 kΩ pull-down resistor");
        spec("Force sensor", "FSR 402: over 1 MΩ untouched, a few hundred Ω pressed hard; about 0.2 to 20 N");
        break;
      }
      case "temp-sensor": {
        need("TMP36 temperature sensor");
        toPower(power, "TMP36 +Vs (left leg, flat side towards you)");
        signals.push({ pin: name(part.pin!), to: "TMP36 Vout (middle leg)", does: why("0.5 V at 0 °C, plus 10 mV for every degree.") });
        grounded.push("TMP36 GND (right leg)");
        spec("TMP36", "−40 to 125 °C, ±2 °C; °C = (millivolts − 500) ÷ 10");
        break;
      }
      case "soil-sensor": {
        need("capacitive soil-moisture sensor (v1.2)");
        toPower(power, "Soil sensor VCC");
        signals.push({ pin: name(part.pin!), to: "Soil sensor AOUT", does: why("Lower the wetter the soil is.") });
        grounded.push("Soil sensor GND");
        spec("Soil sensor", "capacitive, 3.3 to 5.5 V; about 2.5 V in dry air, 1.3 V in water");
        break;
      }
      case "ultrasonic": {
        const [trig, echo] = part.pins!;
        need("HC-SR04 ultrasonic distance sensor");
        toPower(profile.id === "esp32" ? "5V (VIN)" : "5V", "HC-SR04 VCC");
        signals.push({ pin: name(trig!), to: "HC-SR04 Trig", does: why("A 10 µs HIGH pulse sends a ping.") });
        signals.push({ pin: name(echo!), to: profile.id === "esp32" ? "HC-SR04 Echo (through a 1 kΩ / 2 kΩ divider)" : "HC-SR04 Echo", does: why("Stays HIGH while the sound travels: 58 µs per cm.") });
        grounded.push("HC-SR04 GND");
        if (profile.id === "esp32") need("1 kΩ and 2 kΩ resistors (to bring Echo down to 3.3 V)");
        spec("HC-SR04", "2 to 400 cm, about 3 mm resolution, 40 kHz, 15° beam");
        break;
      }
      case "motor": {
        need("small DC motor or fan, 3 to 6 V");
        need("TIP120 Darlington transistor");
        need("1 kΩ resistor");
        need("1N4001 diode");
        const motorPower = profile.id === "esp32" ? "5V (VIN)" : "5V";
        signals.push({ pin: name(part.pin!), to: "1 kΩ → TIP120 base", does: why("PWM sets the motor's speed through the transistor.") });
        toPower(motorPower, "Motor (+) and the diode's striped end");
        grounded.push("TIP120 emitter");
        spec("Motor", "switched by a TIP120 (5 A); the motor's (−) goes to the collector");
        spec("Diode", "across the motor, stripe to +, to catch the kick when it switches off");
        break;
      }
      case "stepper": {
        need("28BYJ-48 stepper motor (5 V)");
        need("ULN2003 driver board");
        part.pins!.forEach((pin, index) => signals.push({ pin: name(pin), to: `Driver IN${index + 1}`, does: why(`Coil ${index + 1}: the sketch switches the coils in turn.`) }));
        toPower(profile.id === "esp32" ? "5V (VIN)" : "5V", "Driver board +");
        grounded.push("Driver board −");
        spec("Stepper", "28BYJ-48: 2048 steps per turn (64:1 gearbox), about 15 RPM");
        break;
      }
      case "oled": {
        need("0.96″ OLED screen, 128 × 64, SSD1306, I²C");
        const [sda, scl] = part.pins!;
        toPower(power, "OLED VCC");
        signals.push({ pin: name(sda!), to: "OLED SDA", does: why("I²C data.") });
        signals.push({ pin: name(scl!), to: "OLED SCL", does: why("I²C clock.") });
        grounded.push("OLED GND");
        spec("OLED", "SSD1306, I²C address 0x3C, 21 × 8 characters of text");
        break;
      }
      case "touch-pad": {
        need("touch pad (a coin, foil or a bare wire end)");
        signals.push({ pin: name(part.pin!), to: "Touch pad", does: why("touchRead() falls when a finger touches the pad.") });
        spec("Touch pad", "reads about 70 untouched, 10 to 20 touched");
        break;
      }
    }
  }

  const wiring = [...signals];
  for (const [pin, things] of powered) wiring.push({ pin, to: things.join(", "), does: pin === "3V3" ? "Power for the parts (3.3 V)." : "Power for the parts (5 V)." });
  if (grounded.length > 0) wiring.push({ pin: "GND", to: grounded.join(", "), does: "Shared ground: every part returns its current here." });
  // Jumpers as the circuit is built: each part's own wires, plus the board's power and ground to the rails.
  const perPart: Record<CircuitPartKind, (part: CircuitPart) => number> = {
    led: () => 2,
    "rgb-led": () => 4,
    button: (part) => ((part.wiring ?? "pull-up") === "pull-up" ? 2 : 3),
    knob: () => 3,
    ldr: () => 3,
    buzzer: () => 2,
    servo: () => 3,
    "touch-pad": () => 1,
    fsr: () => 3,
    "temp-sensor": () => 3,
    "soil-sensor": () => 3,
    ultrasonic: () => 4,
    motor: () => 4,
    stepper: () => 6,
    oled: () => 4,
  };
  const onRails = circuit.parts.some((part) => part.part !== "touch-pad");
  const jumpers = circuit.parts.reduce((sum, part) => sum + perPart[part.part](part), 0) + (onRails ? (profile.id === "esp32" ? 4 : 2) : 0);
  need("jumper wires", jumpers);

  spec(
    "Pin current",
    profile.id === "esp32" ? "keep each pin under about 12 mA (40 mA absolute maximum); 3.3 V logic" : "keep each pin under 20 mA (40 mA absolute maximum); 5 V logic",
  );
  return { parts: [...parts].map(([partName, count]) => ({ count, name: partName })), wiring, specs };
}

/** A part as an author writes it: pins as on the board (13, "A0", "GPIO 23"), not yet checked. */
export interface CircuitPartInput {
  part: CircuitPartKind;
  pin?: number | string;
  pins?: (number | string)[];
  colour?: LedColour;
  wiring?: "pull-up" | "pull-down";
  ohms?: number;
  label?: string;
}

/**
 * Checks a circuit against its board and turns its pins into numbers. Used by
 * the lesson compiler and by the circuit editor. Problems are plain sentences.
 */
export function resolveCircuitParts(inputs: readonly CircuitPartInput[], board: BoardId): { circuit: Circuit; problems: string[] } {
  const profile = profileOf(board);
  const problems: string[] = [];
  const used = new Map<number, string>();
  const pinOf = (input: CircuitPartInput, ref: number | string | undefined, read: boolean): number | undefined => {
    if (ref === undefined || ref === "") {
      problems.push(`a ${input.part} needs a pin`);
      return undefined;
    }
    const pin = resolvePin(ref, profile);
    if (pin === undefined) {
      problems.push(`the ${profile.name} has no pin ${ref}`);
      return undefined;
    }
    if (!read && profile.inputOnly.has(pin)) problems.push(`a ${input.part} on GPIO ${pin} cannot work; GPIO 34 to 39 are input only`);
    if (input.part === "touch-pad" && !profile.touchPins.has(pin)) problems.push(`GPIO ${pin} has no touch sensor`);
    if (ANALOG_PARTS.has(input.part) && !profile.analogPins.has(pin)) problems.push(`a ${input.part} needs an analog pin, not ${ref}`);
    if (input.part === "rgb-led" && profile.pwmPins && !profile.pwmPins.has(pin)) problems.push(`the RGB LED needs PWM pins; ${ref} has none`);
    if (used.has(pin)) problems.push(`pin ${ref} is used twice (${used.get(pin)} and ${input.part})`);
    used.set(pin, input.part);
    return pin;
  };
  const parts: CircuitPart[] = [];
  for (const input of inputs) {
    const part: CircuitPart = { part: input.part };
    const count = PIN_COUNTS[input.part];
    if (input.part === "oled") {
      // The screen sits on the board's I²C pins.
      const pins = (profile.id === "esp32" ? [21, 22] : [18, 19]).map((pin) => pinOf(input, pin, false));
      if (pins.every((pin) => pin !== undefined)) part.pins = pins as number[];
    } else if (count) {
      if (!input.pins || input.pins.length !== count) problems.push(`a ${input.part} needs ${count} pins`);
      else {
        // An ultrasonic sensor's second pin (Echo) is read; every other multi-pin part drives its pins.
        const pins = input.pins.map((ref, index) => pinOf(input, ref, input.part === "ultrasonic" && index === 1));
        if (pins.every((pin) => pin !== undefined)) part.pins = pins as number[];
      }
    } else {
      const pin = pinOf(input, input.pin, INPUT_PARTS.has(input.part));
      if (pin !== undefined) part.pin = pin;
    }
    if (input.colour) part.colour = input.colour;
    if (input.wiring) part.wiring = input.wiring;
    if (input.ohms) part.ohms = input.ohms;
    if (input.label) part.label = input.label;
    parts.push(part);
  }
  return { circuit: { board: profile.id, parts }, problems };
}
