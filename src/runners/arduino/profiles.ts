// The boards a sketch can run on, as data: which pins exist, what each can
// do, and how pins are named. The virtual board, the Arduino layer, the
// lesson compiler and the 3D view all read these.

export const BOARD_IDS = ["uno", "esp32"] as const;
export type BoardId = (typeof BOARD_IDS)[number];

export interface BoardProfile {
  id: BoardId;
  /** The board's name for people. */
  name: string;
  /** Pins a sketch may use. */
  pins: ReadonlySet<number>;
  /** Pins that can only read (no output, no pull-up). */
  inputOnly: ReadonlySet<number>;
  /** Pins analogRead works on. */
  analogPins: ReadonlySet<number>;
  /** Pins analogWrite can dim; null means any output pin. */
  pwmPins: ReadonlySet<number> | null;
  /** Pins with a touch sensor (touchRead). */
  touchPins: ReadonlySet<number>;
  /** Pins with a true analog output (dacWrite). */
  dacPins: ReadonlySet<number>;
  /** analogRead's resolution when nothing changes it. */
  adcBits: number;
  builtInLed: number;
  volts: number;
  /** Names like A0 that a sketch and lesson inputs can use. */
  aliases: Readonly<Record<string, number>>;
  /** Why a pin is unusable, for pins that exist on the chip but must not be used. */
  reserved: Readonly<Record<number, string>>;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

const UNO_ALIASES = { A0: 14, A1: 15, A2: 16, A3: 17, A4: 18, A5: 19 };

export const UNO: BoardProfile = {
  id: "uno",
  name: "Arduino Uno",
  pins: new Set(range(0, 19)),
  inputOnly: new Set(),
  analogPins: new Set(range(14, 19)),
  pwmPins: new Set([3, 5, 6, 9, 10, 11]),
  touchPins: new Set(),
  dacPins: new Set(),
  adcBits: 10,
  builtInLed: 13,
  volts: 5,
  aliases: UNO_ALIASES,
  reserved: {},
};

/** An ESP32 DevKit (ESP32-WROOM-32): the GPIOs it breaks out, minus the flash pins. */
export const ESP32: BoardProfile = {
  id: "esp32",
  name: "ESP32 DevKit",
  pins: new Set([0, 1, 2, 3, 4, 5, ...range(12, 19), 21, 22, 23, 25, 26, 27, ...range(32, 39)]),
  inputOnly: new Set(range(34, 39)),
  analogPins: new Set([...range(32, 39), 0, 2, 4, 12, 13, 14, 15, 25, 26, 27]),
  pwmPins: null,
  touchPins: new Set([4, 0, 2, 15, 13, 12, 14, 27, 33, 32]),
  dacPins: new Set([25, 26]),
  adcBits: 12,
  builtInLed: 2,
  volts: 3.3,
  aliases: { A0: 36, A3: 39, A4: 32, A5: 33, A6: 34, A7: 35, VP: 36, VN: 39 },
  reserved: Object.fromEntries(range(6, 11).map((pin) => [pin, "is wired to the ESP32's flash memory; using it stops the board"])),
};

export const PROFILES: Record<BoardId, BoardProfile> = { uno: UNO, esp32: ESP32 };

export function profileOf(id: BoardId | undefined): BoardProfile {
  return PROFILES[id ?? "uno"];
}

/** A pin as people write it: "13" or "A0" on an Uno, "GPIO 34" on an ESP32. */
export function pinName(pin: number, profile: BoardProfile = UNO): string {
  if (profile.id === "esp32") return `GPIO ${pin}`;
  const alias = Object.entries(profile.aliases).find(([, value]) => value === pin);
  return alias ? alias[0] : String(pin);
}

/** A pin as an author writes it (13, "13", "A0", "GPIO 23", "VP") as a pin number, or undefined if the board has no such pin. */
export function resolvePin(name: number | string, profile: BoardProfile): number | undefined {
  const text = String(name).trim().toUpperCase().replace(/^GPIO\s*/, "");
  const pin = /^\d+$/.test(text) ? Number(text) : profile.aliases[text];
  return pin !== undefined && profile.pins.has(pin) ? pin : undefined;
}

/** "pin 13" or "GPIO 2", for timeline lines and labels. */
export function pinLabel(pin: number, profile: BoardProfile = UNO): string {
  return profile.id === "esp32" ? pinName(pin, profile) : `pin ${pinName(pin, profile)}`;
}

/** ADC2 pins stop working while Wi-Fi is on. */
export const ESP32_ADC2 = new Set([0, 2, 4, 12, 13, 14, 15, 25, 26, 27]);
