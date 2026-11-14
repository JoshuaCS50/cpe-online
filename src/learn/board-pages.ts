// Board reference pages for Learn: a drawn pinout with every pin's jobs,
// the pin groups explained, and the board's specifications. Pages live at
// #/learn/board.uno and #/learn/board.esp32.

import type { BoardId } from "../runners/arduino/profiles";
import { el } from "../shell/dom";

/** What a pin can do. Each has a colour in the drawing and a line in the key. */
export type PinRole =
  | "power"
  | "ground"
  | "digital"
  | "pwm"
  | "analog"
  | "i2c"
  | "spi"
  | "uart"
  | "interrupt"
  | "touch"
  | "dac"
  | "input-only"
  | "strapping"
  | "flash"
  | "control"
  | "led";

export const ROLE_TEXT: Record<PinRole, string> = {
  power: "Power",
  ground: "Ground (GND)",
  digital: "Digital in/out",
  pwm: "PWM (~): analogWrite dimming",
  analog: "Analog in (analogRead)",
  i2c: "I²C (SDA data, SCL clock)",
  spi: "SPI (MOSI, MISO, SCK, SS)",
  uart: "Serial (TX, RX): used by USB",
  interrupt: "External interrupt",
  touch: "Touch sensor (touchRead)",
  dac: "True analog out (dacWrite)",
  "input-only": "Input only: no output, no pull-up",
  strapping: "Strapping: read at start-up, use with care",
  flash: "Flash memory: never use",
  control: "Board control (reset, reference, enable)",
  led: "Built-in LED",
};

const ROLE_COLOUR: Record<PinRole, string> = {
  power: "#e0483a",
  ground: "#3a3e48",
  digital: "#2f76d2",
  pwm: "#8e5bd6",
  analog: "#2a9a6a",
  i2c: "#d68a1f",
  spi: "#c2477f",
  uart: "#6f7c93",
  interrupt: "#1f9fb0",
  touch: "#c4a21a",
  dac: "#5aa02c",
  "input-only": "#9a6b3a",
  strapping: "#e0702e",
  flash: "#7a1f1f",
  control: "#55627a",
  led: "#f0b429",
};

export interface PinInfo {
  /** As printed beside the pin. */
  label: string;
  roles: PinRole[];
  /** Extra words for the table, such as "SCK" or "T0". */
  note?: string;
}

export interface BoardPage {
  id: BoardId;
  title: string;
  intro: string;
  /** Header rows: where the first pin sits on the board (mm), the pins in order along the board (2.54 mm apart). */
  rows: { name: string; side: "top" | "bottom"; x0: number; y: number; pins: PinInfo[] }[];
  /** The Fusion top view (scripts/fusion/board-images.py) and the area of the board it covers, in mm. */
  image: { src: string; x0: number; y0: number; x1: number; y1: number; width: number; height: number };
  groups: { name: string; pins: string; text: string }[];
  specs: { name: string; value: string }[];
}

const p = (label: string, roles: PinRole[], note?: string): PinInfo => ({ label, roles, ...(note ? { note } : {}) });

export const BOARD_PAGES: Record<BoardId, BoardPage> = {
  uno: {
    id: "uno",
    title: "Arduino Uno pinout",
    intro:
      "The Uno's pins sit in four sockets: two along the top edge (digital pins 0 to 13 and a few extras) and two along the bottom (power, and analog inputs A0 to A5). Every pin works at 5 V. The virtual board in the lessons has exactly these pins.",
    rows: [
      {
        name: "Digital, and I²C",
        side: "top",
        x0: 17.8,
        y: 2.5,
        pins: [
          p("SCL", ["i2c"], "I²C clock (same as A5)"),
          p("SDA", ["i2c"], "I²C data (same as A4)"),
          p("AREF", ["control"], "Analog reference voltage"),
          p("GND", ["ground"]),
          p("13", ["digital", "spi", "led"], "SCK; the L LED"),
          p("12", ["digital", "spi"], "MISO"),
          p("~11", ["digital", "pwm", "spi"], "MOSI"),
          p("~10", ["digital", "pwm", "spi"], "SS"),
          p("~9", ["digital", "pwm"]),
          p("8", ["digital"]),
        ],
      },
      {
        name: "Digital",
        side: "top",
        x0: 45.0,
        y: 2.5,
        pins: [
          p("7", ["digital"]),
          p("~6", ["digital", "pwm"]),
          p("~5", ["digital", "pwm"]),
          p("4", ["digital"]),
          p("~3", ["digital", "pwm", "interrupt"], "INT1"),
          p("2", ["digital", "interrupt"], "INT0"),
          p("TX 1", ["digital", "uart"], "Serial out, shared with USB"),
          p("RX 0", ["digital", "uart"], "Serial in, shared with USB"),
        ],
      },
      {
        name: "Power",
        side: "bottom",
        x0: 27.0,
        y: 50.8,
        pins: [
          p("—", [], "Not connected"),
          p("IOREF", ["control"], "Tells shields the logic voltage (5 V)"),
          p("RESET", ["control"], "LOW restarts the sketch"),
          p("3.3V", ["power"], "3.3 V out, up to 50 mA"),
          p("5V", ["power"], "5 V out for your circuits"),
          p("GND", ["ground"]),
          p("GND", ["ground"]),
          p("VIN", ["power"], "The power jack's voltage (7 to 12 V)"),
        ],
      },
      {
        name: "Analog in",
        side: "bottom",
        x0: 50.0,
        y: 50.8,
        pins: [
          p("A0", ["analog", "digital"]),
          p("A1", ["analog", "digital"]),
          p("A2", ["analog", "digital"]),
          p("A3", ["analog", "digital"]),
          p("A4", ["analog", "digital", "i2c"], "SDA"),
          p("A5", ["analog", "digital", "i2c"], "SCL"),
        ],
      },
    ],
    image: { src: "boards/uno-top.png", x0: -7.22, y0: -1.02, x1: 69.72, y1: 54.32, width: 2400, height: 1726 },
    groups: [
      { name: "Digital pins", pins: "0 to 13 (and A0 to A5)", text: "pinMode, digitalWrite and digitalRead. Pins 0 and 1 carry Serial to the computer, so leave them free when you print." },
      { name: "PWM", pins: "3, 5, 6, 9, 10, 11 (marked ~)", text: "analogWrite(pin, 0..255) dims LEDs and sets motor speeds. About 490 Hz (980 Hz on 5 and 6)." },
      { name: "Analog in", pins: "A0 to A5", text: "analogRead gives 0 to 1023 for 0 to 5 V (10 bits, about 4.9 mV a step)." },
      { name: "Interrupts", pins: "2 and 3", text: "attachInterrupt runs a function the moment the pin changes." },
      { name: "I²C", pins: "A4 (SDA), A5 (SCL)", text: "Two wires for screens and sensors; also on the SDA and SCL pins by AREF." },
      { name: "SPI", pins: "10 (SS), 11 (MOSI), 12 (MISO), 13 (SCK)", text: "Fast four-wire bus for SD cards and displays." },
      { name: "Power", pins: "5V, 3.3V, VIN, GND", text: "5V and 3.3V feed small circuits; GND is the shared return for everything." },
    ],
    specs: [
      { name: "Microcontroller", value: "ATmega328P, 8-bit AVR" },
      { name: "Clock", value: "16 MHz" },
      { name: "Flash (program)", value: "32 KB (0.5 KB used by the bootloader)" },
      { name: "SRAM (variables)", value: "2 KB" },
      { name: "EEPROM", value: "1 KB" },
      { name: "Logic voltage", value: "5 V" },
      { name: "Input voltage", value: "7 to 12 V on the jack or VIN; 5 V over USB" },
      { name: "Digital pins", value: "14, six with PWM" },
      { name: "Analog inputs", value: "6, 10-bit" },
      { name: "Current per pin", value: "20 mA recommended, 40 mA absolute maximum" },
      { name: "int size", value: "16 bits (−32768 to 32767); the simulator's int is 32 bits" },
      { name: "Size", value: "68.6 × 53.4 mm" },
    ],
  },
  esp32: {
    id: "esp32",
    title: "ESP32 DevKit pinout",
    intro:
      "The DevKit (ESP32-WROOM-32, 38 pins) has two rows of pins named by GPIO number. Every pin works at 3.3 V: never connect 5 V to one. The virtual board in the ESP32 lessons follows this layout, with the USB socket at the left and the antenna at the right.",
    rows: [
      {
        name: "Top row (USB end on the left)",
        side: "top",
        x0: 4.6,
        y: 1.27,
        pins: [
          p("CLK", ["flash"], "GPIO 6"),
          p("SD0", ["flash"], "GPIO 7"),
          p("SD1", ["flash"], "GPIO 8"),
          p("15", ["digital", "pwm", "analog", "touch", "strapping"], "ADC2, T3"),
          p("2", ["digital", "pwm", "analog", "touch", "strapping", "led"], "ADC2, T2; blue LED"),
          p("0", ["digital", "pwm", "analog", "touch", "strapping"], "ADC2, T1; BOOT button"),
          p("4", ["digital", "pwm", "analog", "touch"], "ADC2, T0"),
          p("16", ["digital", "pwm"], "RX2"),
          p("17", ["digital", "pwm"], "TX2"),
          p("5", ["digital", "pwm", "spi", "strapping"], "SS"),
          p("18", ["digital", "pwm", "spi"], "SCK"),
          p("19", ["digital", "pwm", "spi"], "MISO"),
          p("GND", ["ground"]),
          p("21", ["digital", "pwm", "i2c"], "SDA"),
          p("RX 3", ["digital", "uart"], "Serial in, shared with USB"),
          p("TX 1", ["digital", "uart"], "Serial out, shared with USB"),
          p("22", ["digital", "pwm", "i2c"], "SCL"),
          p("23", ["digital", "pwm", "spi"], "MOSI"),
          p("GND", ["ground"]),
        ],
      },
      {
        name: "Bottom row (USB end on the left)",
        side: "bottom",
        x0: 4.6,
        y: 26.67,
        pins: [
          p("5V", ["power"], "From USB; also VIN"),
          p("CMD", ["flash"], "GPIO 11"),
          p("SD3", ["flash"], "GPIO 10"),
          p("SD2", ["flash"], "GPIO 9"),
          p("13", ["digital", "pwm", "analog", "touch"], "ADC2, T4"),
          p("GND", ["ground"]),
          p("12", ["digital", "pwm", "analog", "touch", "strapping"], "ADC2, T5; keep LOW at start-up"),
          p("14", ["digital", "pwm", "analog", "touch"], "ADC2, T6"),
          p("27", ["digital", "pwm", "analog", "touch"], "ADC2, T7"),
          p("26", ["digital", "pwm", "analog", "dac"], "ADC2, DAC2"),
          p("25", ["digital", "pwm", "analog", "dac"], "ADC2, DAC1"),
          p("33", ["digital", "pwm", "analog", "touch"], "ADC1, T8"),
          p("32", ["digital", "pwm", "analog", "touch"], "ADC1, T9"),
          p("35", ["input-only", "analog"], "ADC1"),
          p("34", ["input-only", "analog"], "ADC1"),
          p("VN 39", ["input-only", "analog"], "ADC1"),
          p("VP 36", ["input-only", "analog"], "ADC1"),
          p("EN", ["control"], "LOW resets the chip (EN button)"),
          p("3V3", ["power"], "3.3 V out for your circuits"),
        ],
      },
    ],
    image: { src: "boards/esp32-top.png", x0: -2.02, y0: -1.02, x1: 55.42, y1: 28.96, width: 2400, height: 1253 },
    groups: [
      { name: "Safe general pins", pins: "4, 13, 16 to 19, 21 to 23, 25 to 27, 32, 33", text: "Inputs and outputs with pull-ups. Start here." },
      { name: "Input only", pins: "34, 35, 36 (VP), 39 (VN)", text: "Read only, with no pull-up: good for analog sensors." },
      { name: "Analog in", pins: "ADC1: 32 to 39; ADC2: 0, 2, 4, 12 to 15, 25 to 27", text: "analogRead gives 0 to 4095 for 0 to 3.3 V. ADC2 stops working while Wi-Fi is on, so prefer ADC1." },
      { name: "PWM", pins: "any output pin", text: "ledcAttach(pin, frequency, bits) then ledcWrite(pin, duty); analogWrite works too, with 8 bits." },
      { name: "Touch", pins: "T0 4, T1 0, T2 2, T3 15, T4 13, T5 12, T6 14, T7 27, T8 33, T9 32", text: "touchRead falls from about 70 to 10 to 20 when touched." },
      { name: "DAC", pins: "25, 26", text: "dacWrite(pin, 0..255) gives a steady 0 to 3.3 V." },
      { name: "Strapping", pins: "0, 2, 5, 12, 15", text: "Read once at power-on. GPIO 0 LOW starts upload mode; GPIO 12 HIGH can stop the board booting." },
      { name: "Flash", pins: "6 to 11 (CLK, SD0 to SD3, CMD)", text: "Wired to the program memory. Never use them." },
      { name: "Serial, I²C, SPI", pins: "TX 1 / RX 3; SDA 21 / SCL 22; MOSI 23, MISO 19, SCK 18, SS 5", text: "The default pins for each bus; the ESP32 can move most of them." },
    ],
    specs: [
      { name: "Chip", value: "ESP32 (Xtensa LX6), two cores" },
      { name: "Clock", value: "up to 240 MHz" },
      { name: "Flash (program)", value: "4 MB on most DevKits" },
      { name: "SRAM (variables)", value: "about 520 KB, plus 8 KB of RTC memory kept in deep sleep" },
      { name: "Logic voltage", value: "3.3 V (5 V on a pin can damage it)" },
      { name: "Power", value: "5 V over micro-USB or the 5V pin" },
      { name: "Wireless", value: "Wi-Fi 802.11 b/g/n (2.4 GHz), Bluetooth 4.2 and BLE" },
      { name: "Analog inputs", value: "18 channels, 12-bit (0 to 4095)" },
      { name: "Analog outputs", value: "2 DAC channels (8-bit), 16 PWM channels" },
      { name: "Touch pins", value: "10" },
      { name: "Current per pin", value: "about 12 mA recommended, 40 mA absolute maximum" },
      { name: "Deep sleep", value: "about 10 µA; wakes on a timer, a pin or a touch" },
      { name: "int size", value: "32 bits, the same as the simulator" },
      { name: "Size", value: "54.4 × 27.9 mm (38-pin DevKit)" },
    ],
  },
};

const SVG = "http://www.w3.org/2000/svg";

function svg(tag: string, attributes: Record<string, string | number>, children: (Node | string)[] = []): SVGElement {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
  for (const child of children) node.append(child);
  return node;
}

/** Short labels for a pin: its name first, then one chip per extra job, each in the job's colour. */
export function pinChips(page: BoardPage, pin: PinInfo): { text: string; role: PinRole }[] {
  const esp32 = page.id === "esp32";
  const note = `${pin.note ?? ""} ${pin.label}`;
  const number = pin.label.match(/\d+/)?.[0];
  const primary: PinRole =
    (["power", "ground", "flash", "input-only", "control"] as const).find((role) => pin.roles.includes(role)) ??
    (pin.roles.includes("analog") && !esp32 ? "analog" : "digital");
  let name = pin.label;
  if (primary === "digital" || (primary === "analog" && esp32) || primary === "input-only") {
    if (esp32 && number) name = `GPIO${number}`;
    else if (!esp32 && number && !pin.label.startsWith("A")) name = `D${number}`;
  }
  if (primary === "flash" && number === undefined) name = pin.label;
  const chips: { text: string; role: PinRole }[] = [{ text: name, role: primary }];
  const find = (pattern: RegExp): string | undefined => note.match(pattern)?.[0];
  for (const role of pin.roles) {
    if (role === primary || role === "digital") continue;
    let text: string | undefined;
    switch (role) {
      case "pwm":
        text = "PWM";
        break;
      case "analog":
        text = esp32 ? (find(/ADC\d/) ?? "ADC") : "ADC";
        break;
      case "touch":
        text = find(/\bT\d\b/) ?? "TOUCH";
        break;
      case "dac":
        text = find(/DAC\d/) ?? "DAC";
        break;
      case "i2c":
        text = find(/SDA|SCL/) ?? "I²C";
        break;
      case "spi":
        text = find(/SCK|MISO|MOSI|SS/) ?? "SPI";
        break;
      case "uart":
        text = pin.label.startsWith("TX") ? (esp32 ? "TX0" : "TX") : esp32 ? "RX0" : "RX";
        break;
      case "interrupt":
        text = find(/INT\d/) ?? "INT";
        break;
      case "strapping":
        text = "STRAP";
        break;
      case "input-only":
        text = "IN ONLY";
        break;
      case "led":
        text = "LED";
        break;
      default:
        text = undefined;
    }
    // A job already in the name (an SCL pin is I²C SCL) needs no chip of its own.
    if (text && text !== name) chips.push({ text, role });
  }
  if (primary === "input-only") chips.push({ text: "IN ONLY", role: "input-only" });
  return chips;
}

/** Light colours get dark text on their chips. */
const DARK_TEXT = new Set<PinRole>(["touch", "led", "i2c", "strapping", "dac"]);

/**
 * The pinout drawing: the board's Fusion top view standing upright (USB at
 * the top), a small ring on every pin, and a row of label chips beside each
 * pin, lined up in columns on both sides.
 */
export function pinoutDrawing(page: BoardPage): SVGElement {
  const { image } = page;
  const scale = 7; // drawing units per millimetre
  const boardWidth = (image.y1 - image.y0) * scale;
  const boardHeight = (image.x1 - image.x0) * scale;
  const side = 300;
  const ox = side;
  const oy = 24;
  const width = boardWidth + side * 2;
  const height = boardHeight + oy * 2;
  // A board point (x along the board, y across it, mm) in the drawing.
  const at = (x: number, y: number): [number, number] => [ox + scale * (image.y1 - y), oy + scale * (x - image.x0)];

  const drawing = svg("svg", { viewBox: `0 0 ${width} ${height}`, class: "pinout-drawing", role: "img", "aria-label": `${page.title}: drawing` });
  // The render is a top view with y up; standing it upright swaps its axes.
  const k = (scale * (image.x1 - image.x0)) / image.width;
  drawing.append(
    svg("image", {
      href: new URL(image.src, document.baseURI).href,
      width: image.width,
      height: image.height,
      transform: `matrix(0 ${k} ${k} 0 ${ox} ${oy})`,
      class: "pinout-image",
    }),
  );

  const chipHeight = 13;
  const charWidth = 6.3;
  for (const row of page.rows) {
    const right = row.y < (image.y0 + image.y1) / 2;
    const columnX = right ? ox + boardWidth + 22 : ox - 22;
    row.pins.forEach((pin, index) => {
      if (pin.label === "—") return;
      const [px, py] = at(row.x0 + index * 2.54, row.y);
      drawing.append(svg("circle", { cx: px, cy: py, r: 5.5, class: "pinout-ring" }));
      drawing.append(svg("line", { x1: px + (right ? 6 : -6), y1: py, x2: columnX, y2: py, class: "pinout-leader" }));
      let x = columnX;
      for (const chip of pinChips(page, pin)) {
        const chipWidth = chip.text.length * charWidth + 10;
        const left = right ? x : x - chipWidth;
        const group = svg("g", { class: "pinout-chip" }, [
          svg("title", {}, [`${pin.label}: ${ROLE_TEXT[chip.role]}${pin.note ? ` (${pin.note})` : ""}`]),
          svg("rect", { x: left, y: py - chipHeight / 2, width: chipWidth, height: chipHeight, rx: 3, fill: ROLE_COLOUR[chip.role] }),
          svg("text", { x: left + chipWidth / 2, y: py + 0.5, "text-anchor": "middle", "dominant-baseline": "middle", fill: DARK_TEXT.has(chip.role) ? "#1b1d22" : "#ffffff" }, [chip.text]),
        ]);
        drawing.append(group);
        x = right ? x + chipWidth + 3 : x - chipWidth - 3;
      }
    });
  }
  return drawing;
}

/** The legend, grouped: what each colour means, with a sample chip and a sentence. */
const LEGEND_GROUPS: { title: string; roles: PinRole[] }[] = [
  { title: "Power", roles: ["power", "ground"] },
  { title: "Inputs and outputs", roles: ["digital", "pwm", "analog", "dac", "touch"] },
  { title: "Communication", roles: ["i2c", "spi", "uart", "interrupt"] },
  { title: "Take care", roles: ["input-only", "strapping", "flash", "control", "led"] },
];

const ROLE_SAMPLE: Record<PinRole, string> = {
  power: "5V",
  ground: "GND",
  digital: "D7",
  pwm: "PWM",
  analog: "ADC",
  i2c: "SDA",
  spi: "SCK",
  uart: "TX",
  interrupt: "INT0",
  touch: "T0",
  dac: "DAC1",
  "input-only": "IN ONLY",
  strapping: "STRAP",
  flash: "FLASH",
  control: "RESET",
  led: "LED",
};

function roleKey(page: BoardPage): HTMLElement {
  const used = new Set(page.rows.flatMap((row) => row.pins.flatMap((pin) => pin.roles)));
  const groups = LEGEND_GROUPS.map((group) => ({ ...group, roles: group.roles.filter((role) => used.has(role)) })).filter((group) => group.roles.length > 0);
  return el(
    "div",
    { class: "pinout-legend" },
    groups.map((group) =>
      el("section", { class: "pinout-legend-group" }, [
        el("h3", {}, [group.title]),
        el(
          "dl",
          {},
          group.roles.flatMap((role) => {
            const [title, detail] = ROLE_TEXT[role].split(/: (.*)/s);
            return [
              el("dt", {}, [
                el("span", { class: "pinout-sample", style: `background:${ROLE_COLOUR[role]};color:${DARK_TEXT.has(role) ? "#1b1d22" : "#fff"}` }, [ROLE_SAMPLE[role]]),
                title ?? "",
              ]),
              el("dd", {}, [detail ?? ""]),
            ];
          }),
        ),
      ]),
    ),
  );
}

function table(headings: string[], rows: string[][]): HTMLElement {
  return el("div", { class: "table-scroll" }, [
    el("table", {}, [
      el("thead", {}, [el("tr", {}, headings.map((heading) => el("th", {}, [heading])))]),
      el("tbody", {}, rows.map((row) => el("tr", {}, row.map((cell) => el("td", {}, [cell]))))),
    ]),
  ]);
}

/** The whole page for one board. */
export function boardPage(id: BoardId): HTMLElement {
  const page = BOARD_PAGES[id];
  const other: BoardId = id === "uno" ? "esp32" : "uno";
  return el("article", { class: "lesson board-page" }, [
    el("a", { class: "lesson-back", href: "#/learn" }, ["← All lessons"]),
    el("p", { class: "eyebrow" }, ["Board reference"]),
    el("h1", {}, [page.title]),
    el("p", { class: "board-page-intro" }, [page.intro]),
    el("div", { class: "pinout-scroll" }, [pinoutDrawing(page)]),
    roleKey(page),
    el("h2", {}, ["Every pin"]),
    table(
      ["Pin", "Jobs", "Notes"],
      page.rows.flatMap((row) => row.pins.filter((pin) => pin.label !== "—").map((pin) => [pin.label, pin.roles.map((role) => ROLE_TEXT[role].split(":")[0]!.split(" (")[0]!).join(", "), pin.note ?? ""])),
    ),
    el("h2", {}, ["Pin groups"]),
    table(["Group", "Pins", "What to know"], page.groups.map((group) => [group.name, group.pins, group.text])),
    el("h2", {}, ["Specifications"]),
    table(["", ""], page.specs.map((spec) => [spec.name, spec.value])),
    el("p", {}, [el("a", { class: "btn btn-outline", href: `#/learn/board.${other}` }, [`See the ${BOARD_PAGES[other].title}`])]),
  ]);
}
