// The 3D board: an original UNO-style board built from simple shapes (no
// model files), the parts a run used (LEDs on a breadboard, servos, buzzers,
// knobs, buttons), labels that follow the parts, and orbit controls.
// Loaded only when a board is shown, so three.js stays out of the main bundle.
//
// Units are millimetres. The board lies in the XZ plane with its corner at
// the origin: x along the long edge, z from the digital header (z = 0) to
// the power and analog headers (z = 53), y up.

import {
  AdditiveBlending,
  Box3,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  Object3D,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  RingGeometry,
  Scene,
  Shape,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Texture,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { pinName, profileOf } from "../runners/arduino/profiles";
import type { BoardId } from "../runners/arduino/profiles";
import type { BoardReport } from "../runners/arduino/board";
import { MATERIAL_COLOURS, loadPartModels } from "./models";
import type { PartModels, PartName } from "./models";
import { brightness, inputAt, motorTurnsAt, outputsAt, screenAt, stepperTurnsAt, tmp36Celsius, touchAt } from "./state";
import { LED_FORWARD_VOLTS } from "../content/circuit";
import { createSketchStyle, toon } from "./style";
import type { SketchStyle } from "./style";
import type { LedColour, PartPlan } from "./state";

export interface BoardScene {
  /** Draws the parts for a run (or none), and resets the view to fit them. */
  setRun(report: BoardReport | null, plan: PartPlan | null, board?: BoardId): void;
  /** Shows the board at a moment of the run, in ms. */
  setTime(t: number): void;
  setLabels(visible: boolean): void;
  /** Turns the view around the board, in degrees. */
  rotate(degrees: number): void;
  /** Moves closer (factor below 1) or further away. */
  zoom(factor: number): void;
  resetView(): void;
  /** What pressing, holding and dragging the parts does (live runs), or null to make them inert. */
  setInteraction(handlers: PartHandlers | null): void;
  dispose(): void;
}

export interface PartHandlers {
  /** A button or touch pad pressed (down) or let go. */
  press(pin: number, down: boolean, kind: "button" | "touch"): void;
  /** A knob or light sensor dragged by `delta`, a fraction of its full range. */
  turn(pin: number, delta: number): void;
}

/** A part the pointer can press or drag. */
interface Target {
  object: Object3D;
  kind: "button" | "touch" | "knob" | "ldr" | "distance" | "led" | "resistor";
  pin: number;
}

// ───── Board geometry (mm) ─────

const BOARD_W = 68.6;
const BOARD_D = 53.3;
const PCB_T = 1.6;
const TOP = PCB_T;
const PITCH = 2.54;
const HEADER_H = 8.5;
const HEADER_TOP = TOP + HEADER_H;
const DIGITAL_Z = 2.5;
const BOTTOM_Z = 50.8;
const MOUNT_HOLES: [number, number][] = [
  [14, 2.6],
  [15.3, 50.7],
  [66.1, 7.6],
  [66.1, 35.5],
];

/** Header slots from left to right: pin numbers, or names for the others. */
const HEADER_HIGH = { x0: 17.8, z: DIGITAL_Z, slots: ["SCL", "SDA", "AREF", "GND", 13, 12, 11, 10, 9, 8] as (number | string)[] };
const HEADER_LOW = { x0: 45.0, z: DIGITAL_Z, slots: [7, 6, 5, 4, 3, 2, 1, 0] as (number | string)[] };
const HEADER_POWER = { x0: 27.0, z: BOTTOM_Z, slots: ["", "IOREF", "RESET", "3.3V", "5V", "GND", "GND", "VIN"] as (number | string)[] };
const HEADER_ANALOG = { x0: 50.0, z: BOTTOM_Z, slots: [14, 15, 16, 17, 18, 19] as (number | string)[] };
const HEADERS = [HEADER_HIGH, HEADER_LOW, HEADER_POWER, HEADER_ANALOG];
const PWM = new Set([3, 5, 6, 9, 10, 11]);

/**
 * What the builders below draw with. A scene sets it before each build;
 * builds are synchronous, so two scenes on a page never mix.
 */
const build: { style: SketchStyle | null; board: BoardId } = { style: null, board: "uno" };

function currentStyle(): SketchStyle {
  if (!build.style) throw new Error("board3d: no style set for this build");
  return build.style;
}

/** "pin 9" on an Uno, "GPIO 9" on an ESP32, for part labels. */
function pinWord(pin: number): string {
  return build.board === "esp32" ? `GPIO ${pin}` : `pin ${pinName(pin)}`;
}

// ───── ESP32 DevKit geometry (mm), matching scripts/fusion/cpe-parts.py ─────

const ESP_W = 54.4;
const ESP_D = 27.9;
const ESP_TOP = 10.1;
const ESP_BACK_Z = 1.27;
const ESP_FRONT_Z = 26.67;
/** Pin names from the antenna end. */
const ESP_BACK = ["GND", "23", "22", "TX", "RX", "21", "GND", "19", "18", "5", "17", "16", "4", "0", "2", "15", "SD1", "SD0", "CLK"];
const ESP_FRONT = ["3V3", "EN", "VP", "VN", "34", "35", "32", "33", "25", "26", "27", "14", "12", "GND", "13", "SD2", "SD3", "CMD", "5V"];
const ESP_GPIO_NAMES: Record<number, string> = { 1: "TX", 3: "RX", 36: "VP", 39: "VN" };

function espPinX(index: number): number {
  return 4.6 + (18 - index) * PITCH;
}

/**
 * The ESP32 sits across a full breadboard with its pins in rows a and i. A
 * front-row pin has one free hole beside it (row j), where its wire goes;
 * a back-row pin has none (the board covers rows b to e), so its wire clips
 * onto the top of the pin, as people do with a real DevKit.
 */
function espSocketOf(pin: number | string): Vector3 {
  const name = typeof pin === "number" ? (ESP_GPIO_NAMES[pin] ?? String(pin)) : pin;
  const front = ESP_FRONT.indexOf(name);
  if (front >= 0) return ESP_BREADBOARD.hole(espColumn(front), "j");
  const back = Math.max(0, ESP_BACK.indexOf(name));
  return new Vector3(espPinX(back), ESP_LIFT + ESP_TOP + 1, ESP_BACK_Z);
}

/** Where a wire for a pin starts, on the board being drawn. */
function socketOf(pin: number | string): Vector3 {
  return build.board === "esp32" ? espSocketOf(pin) : unoSocketOf(pin);
}

/** The top of a pin's header socket on the Uno, where a wire plugs in. */
function unoSocketOf(pin: number | string): Vector3 {
  for (const header of HEADERS) {
    const index = header.slots.indexOf(pin);
    if (index >= 0) return new Vector3(header.x0 + index * PITCH, HEADER_TOP, header.z);
  }
  return new Vector3(BOARD_W / 2, HEADER_TOP, DIGITAL_Z);
}

// ───── Colours ─────

const PCB_BLUE = 0x1d5aa6;
const LED_GLOW: Record<LedColour, number> = { red: 0xff3b2f, yellow: 0xffc928, green: 0x35e06b, blue: 0x3f8cff, white: 0xf4f7ff };
const LED_BODY: Record<LedColour, number> = { red: 0xb3271f, yellow: 0xc9a227, green: 0x2a9a4f, blue: 0x2b62b8, white: 0xd8dde6 };
const WIRE_COLOURS = [0xf28c28, 0x2fa65a, 0x2f7dd1, 0x9b59b6, 0xe74c3c, 0x16a5a5];

// ───── Small builders ─────


/** A solid with dark outlines, for the drawn look. */
function solid(geometry: BufferGeometry, color: number, outline = true): Mesh {
  const mesh = new Mesh(geometry, toon(color));
  if (outline) currentStyle().outline(mesh);
  return mesh;
}

function box(w: number, h: number, d: number, color: number, x: number, y: number, z: number, outline = true): Mesh {
  const mesh = solid(new BoxGeometry(w, h, d), color, outline);
  mesh.position.set(x, y, z);
  return mesh;
}

function cylinder(r: number, h: number, color: number, x: number, y: number, z: number, segments = 24, outline = true): Mesh {
  const mesh = solid(new CylinderGeometry(r, r, h, segments), color, outline);
  mesh.position.set(x, y, z);
  return mesh;
}

function canvasTexture(width: number, height: number, draw: (g: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  draw(g);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** A soft round light, used for LED glows and the shadow under the board. */
function radialTexture(inner: string, outer: string): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    const gradient = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(1, outer);
    g.fillStyle = gradient;
    g.fillRect(0, 0, 128, 128);
  });
}

function roundedRect(w: number, d: number, r: number): Shape {
  const shape = new Shape();
  shape.moveTo(r, 0);
  shape.lineTo(w - r, 0);
  shape.quadraticCurveTo(w, 0, w, r);
  shape.lineTo(w, d - r);
  shape.quadraticCurveTo(w, d, w - r, d);
  shape.lineTo(r, d);
  shape.quadraticCurveTo(0, d, 0, d - r);
  shape.lineTo(0, r);
  shape.quadraticCurveTo(0, 0, r, 0);
  return shape;
}

/** A flat label texture laid on a surface: `draw` gets a canvas at `scale` px per mm. */
function decal(w: number, d: number, scale: number, draw: (g: CanvasRenderingContext2D, mm: (v: number) => number) => void): Mesh {
  const texture = canvasTexture(Math.round(w * scale), Math.round(d * scale), (g) => draw(g, (v) => v * scale));
  const plane = new Mesh(new PlaneGeometry(w, d), new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
  plane.rotation.x = -Math.PI / 2;
  return plane;
}

// ───── The board ─────

interface Glow {
  material: MeshToonMaterial;
  halo: Sprite;
  size: number;
}

function glowingLed(mesh: Mesh, glowColor: number, haloSize: number, haloTexture: Texture, at?: Vector3): Glow {
  const material = mesh.material as MeshToonMaterial;
  material.emissive = new Color(glowColor);
  material.emissiveIntensity = 0;
  const halo = new Sprite(new SpriteMaterial({ map: haloTexture, color: glowColor, blending: AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
  halo.scale.setScalar(haloSize);
  halo.position.copy(at ?? mesh.position);
  return { material, halo, size: haloSize };
}

function setGlow(glow: Glow, level: number): void {
  glow.material.emissiveIntensity = level * 1.4;
  (glow.halo.material as SpriteMaterial).opacity = level * 0.85;
  glow.halo.scale.setScalar(glow.size * (0.6 + 0.4 * level));
}

function silkscreen(): Mesh {
  return decal(BOARD_W, BOARD_D, 12, (g, mm) => {
    // Copper traces under the solder mask: faint lighter lines.
    g.strokeStyle = "rgba(140, 190, 245, 0.28)";
    g.lineWidth = mm(0.35);
    g.lineCap = "round";
    const traces: [number, number][][] = [
      [[24, 12], [30, 18], [44, 18], [50, 31]],
      [[20, 20], [20, 30], [26, 34]],
      [[12, 24], [24, 24], [28, 28], [40, 28]],
      [[56, 8], [56, 16], [62, 22], [62, 30]],
      [[34, 8], [36, 14], [52, 14], [60, 20]],
      [[10, 36], [18, 40], [30, 40]],
      [[48, 44], [56, 44], [60, 40]],
      [[36, 46], [42, 44], [44, 42]],
    ];
    for (const trace of traces) {
      g.beginPath();
      trace.forEach(([x, z], i) => (i ? g.lineTo(mm(x), mm(z)) : g.moveTo(mm(x), mm(z))));
      g.stroke();
    }
    g.fillStyle = "#f4f7ff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const small = `600 ${mm(1.25)}px system-ui, sans-serif`;
    // Pin names next to each header.
    for (const header of HEADERS) {
      const below = header.z === DIGITAL_Z;
      header.slots.forEach((slot, index) => {
        if (slot === "") return;
        const x = header.x0 + index * PITCH;
        let text = typeof slot === "number" ? (slot >= 14 ? pinName(slot) : String(slot)) : slot;
        if (typeof slot === "number" && PWM.has(slot)) text = `~${text}`;
        g.save();
        g.translate(mm(x), mm(below ? DIGITAL_Z + 3.6 : BOTTOM_Z - 3.6));
        if (text.length > 3) {
          g.rotate(-Math.PI / 2);
          g.textAlign = below ? "right" : "left";
          g.translate(below ? mm(1.4) : -mm(1.4), 0);
        }
        g.font = small;
        g.fillText(text, 0, 0);
        g.restore();
      });
    }
    g.font = `700 ${mm(1.5)}px system-ui, sans-serif`;
    g.fillText("DIGITAL (PWM ~)", mm(44), mm(9.6));
    g.fillText("POWER", mm(36), mm(43.6));
    g.fillText("ANALOG IN", mm(56.4), mm(43.6));
    g.font = small;
    g.fillText("L", mm(33.2), mm(8.6));
    g.fillText("TX", mm(33.6), mm(11.1));
    g.fillText("RX", mm(33.6), mm(13.5));
    g.fillText("ON", mm(60.6), mm(22));
    g.fillText("RESET", mm(6), mm(8.8));
    // Our own name and mark: a terminal prompt in a rounded box.
    g.lineWidth = mm(0.45);
    g.strokeStyle = "#f4f7ff";
    g.beginPath();
    g.roundRect(mm(37), mm(19), mm(9), mm(6.5), mm(1.4));
    g.stroke();
    g.font = `800 ${mm(3.4)}px ui-monospace, monospace`;
    g.fillText(">_", mm(41.5), mm(22.4));
    g.textAlign = "left";
    g.font = `800 ${mm(4.2)}px system-ui, sans-serif`;
    g.fillText("CPE UNO", mm(48), mm(22.4));
    g.font = `600 ${mm(1.3)}px system-ui, sans-serif`;
    g.fillText("VIRTUAL BOARD · 5 V · 16 MHz", mm(48.2), mm(26.2));
  });
}

interface BoardParts {
  group: Group;
  builtIn: Glow;
}

/** The board being drawn (build.board), from the Fusion model or, without it, from simple shapes. */
function buildBoard(haloTexture: Texture, models: PartModels | null): BoardParts {
  if (build.board === "esp32") return buildEsp32(haloTexture, models);
  if (!models) return buildBoardShapes(haloTexture);
  const group = new Group();
  const uno = models.make("uno", currentStyle());
  group.add(uno);
  const screen = silkscreen();
  screen.position.set(BOARD_W / 2, TOP + 0.03, BOARD_D / 2);
  group.add(screen, chipLabel());
  const builtIn = glowingLed(meshNamed(uno, "led-l"), 0xffb627, 9, haloTexture, new Vector3(31, TOP + 0.8, 8.6));
  const power = glowingLed(meshNamed(uno, "led-on"), 0x35e06b, 7, haloTexture, new Vector3(58, TOP + 0.8, 22));
  setGlow(power, 1);
  group.add(builtIn.halo, power.halo);
  return { group, builtIn };
}

/** Pin names beside both rows, our name, and the module's markings. */
function esp32Markings(): Mesh[] {
  const screen = decal(ESP_W, ESP_D, 14, (g, mm) => {
    g.fillStyle = "#f4f7ff";
    g.textBaseline = "middle";
    g.font = `700 ${mm(1.15)}px system-ui, sans-serif`;
    for (const [row, z, align] of [
      [ESP_BACK, ESP_BACK_Z + 1.9, "left"],
      [ESP_FRONT, ESP_FRONT_Z - 1.9, "right"],
    ] as const) {
      row.forEach((name, index) => {
        g.save();
        g.translate(mm(espPinX(index)), mm(z));
        g.rotate(-Math.PI / 2);
        g.textAlign = align === "left" ? "right" : "left";
        g.fillText(name, 0, 0);
        g.restore();
      });
    }
    g.save();
    g.translate(mm(27), mm(ESP_D / 2));
    g.rotate(-Math.PI / 2);
    g.textAlign = "center";
    g.font = `800 ${mm(1.6)}px system-ui, sans-serif`;
    g.fillText("CPE ESP32", 0, 0);
    g.restore();
    g.textAlign = "center";
    g.font = `700 ${mm(1.1)}px system-ui, sans-serif`;
    g.fillText("EN", mm(10), mm(5.2));
    g.fillText("BOOT", mm(10.6), mm(22.8));
    g.fillText("IO2", mm(24.2), mm(18.9));
    g.fillText("PWR", mm(24.6), mm(21.7));
  });
  screen.position.set(ESP_W / 2, ESP_TOP + 0.03, ESP_D / 2);
  // The printed antenna: a meander line on the end of the module.
  const antenna = decal(7, 18, 20, (g, mm) => {
    g.strokeStyle = "#e8b93a";
    g.lineWidth = mm(0.45);
    g.beginPath();
    g.moveTo(mm(0.6), mm(1));
    for (let i = 0; i < 8; i++) {
      const z = mm(1 + i * 2);
      g.lineTo(mm(6.2), z);
      g.lineTo(mm(6.2), z + mm(1));
      g.lineTo(mm(1.4), z + mm(1));
      g.lineTo(mm(1.4), z + mm(2));
    }
    g.stroke();
  });
  antenna.position.set(50.9, ESP_TOP + 0.83, 13.95);
  const can = decal(17.9, 16.9, 14, (g, mm) => {
    g.fillStyle = "#7d8592";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `800 ${mm(1.9)}px system-ui, sans-serif`;
    g.fillText("CPE RADIO", mm(8.95), mm(6.6));
    g.font = `600 ${mm(1.3)}px system-ui, sans-serif`;
    g.fillText("Wi-Fi + Bluetooth LE", mm(8.95), mm(9.4));
    g.fillText("2.4 GHz", mm(8.95), mm(11.4));
  });
  can.position.set(38.45, ESP_TOP + 3.13, 13.95);
  return [screen, antenna, can];
}

/** The ESP32 DevKit across a full breadboard: the Fusion model, or a simple stand-in when the models did not load. */
function buildEsp32(haloTexture: Texture, models: PartModels | null): BoardParts {
  const group = new Group();
  const dev = new Group();
  dev.position.y = ESP_LIFT;
  group.add(dev);
  group.add(breadboardMesh(models, ESP_BREADBOARD));
  let led: Mesh;
  let power: Mesh;
  const model = models?.make("esp32", currentStyle());
  if (model) {
    dev.add(model);
    led = meshNamed(model, "led-l");
    power = meshNamed(model, "led-on");
    (led.material as MeshToonMaterial).color.setHex(0x4f78b8);
    (power.material as MeshToonMaterial).color.setHex(0xb84a44);
  } else {
    dev.add(box(ESP_W, 1.6, ESP_D, MATERIAL_COLOURS["pcb-black"]!, ESP_W / 2, ESP_TOP - 0.8, ESP_D / 2));
    dev.add(box(25.4, 0.8, 18, MATERIAL_COLOURS["module-pcb"]!, 41.7, ESP_TOP + 0.4, 13.95));
    dev.add(box(17.9, 2.3, 16.9, MATERIAL_COLOURS.metal!, 38.45, ESP_TOP + 1.95, 13.95));
    for (const z of [ESP_BACK_Z, ESP_FRONT_Z]) dev.add(box(19 * PITCH, 2.5, PITCH, MATERIAL_COLOURS["plastic-black"]!, 27.5, 7.25, z));
    led = box(1.6, 0.6, 0.8, 0x4f78b8, 21.8, ESP_TOP + 0.3, 18.9, false);
    power = box(1.6, 0.6, 0.8, 0xb84a44, 21.8, ESP_TOP + 0.3, 21.7, false);
    dev.add(led, power);
  }
  dev.add(...esp32Markings());
  const builtIn = glowingLed(led, 0x3f8cff, 9, haloTexture, new Vector3(21.8, ESP_TOP + 0.7, 18.9));
  const powerGlow = glowingLed(power, 0xff3b2f, 7, haloTexture, new Vector3(21.8, ESP_TOP + 0.7, 21.7));
  setGlow(powerGlow, 1);
  dev.add(builtIn.halo, powerGlow.halo);
  // The board powers the bottom rails from its 3V3 and GND pins, and the top rails are joined to them.
  const bb = ESP_BREADBOARD;
  const threeVolt = espColumn(ESP_FRONT.indexOf("3V3"));
  const ground = espColumn(ESP_FRONT.indexOf("GND"));
  group.add(wire(bb.hole(threeVolt, "j"), bb.rail("+", "bottom", threeVolt), POWER_WIRE, 3));
  group.add(wire(bb.hole(ground, "j"), bb.rail("-", "bottom", ground), GROUND_WIRE, 3));
  const end = bb.columns - 1;
  group.add(wire(bb.rail("+", "bottom", end), bb.rail("+", "top", end), POWER_WIRE, 10));
  group.add(wire(bb.rail("-", "bottom", end - 1), bb.rail("-", "top", end - 1), GROUND_WIRE, 12));
  return { group, builtIn };
}

function chipLabel(): Mesh {
  const label = decal(30, 6, 14, (g, mm) => {
    g.fillStyle = "#9aa1ab";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `600 ${mm(1.7)}px system-ui, sans-serif`;
    g.fillText("ATMEGA328P", mm(15), mm(3));
    g.beginPath();
    g.arc(mm(1.2), mm(3), mm(1), -Math.PI / 2, Math.PI / 2);
    g.fill();
  });
  label.position.set(47, TOP + 4.42, 37);
  return label;
}

function buildBoardShapes(haloTexture: Texture): BoardParts {
  const group = new Group();

  // The circuit board, with mounting holes.
  const outline = roundedRect(BOARD_W, BOARD_D, 2.6);
  for (const [x, z] of MOUNT_HOLES) {
    const hole = new Path();
    hole.absarc(x, z, 1.6, 0, Math.PI * 2, false);
    outline.holes.push(hole);
  }
  const pcbGeometry = new ExtrudeGeometry(outline, { depth: PCB_T, bevelEnabled: false, curveSegments: 10 });
  pcbGeometry.rotateX(Math.PI / 2);
  pcbGeometry.translate(0, PCB_T, 0);
  group.add(solid(pcbGeometry, PCB_BLUE));
  for (const [x, z] of MOUNT_HOLES) {
    const ring = new Mesh(new RingGeometry(1.6, 2.6, 24), toon(0xd9dde3, { side: DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, TOP + 0.02, z);
    group.add(ring);
  }
  const screen = silkscreen();
  screen.position.set(BOARD_W / 2, TOP + 0.03, BOARD_D / 2);
  group.add(screen);

  // Female headers with their sockets.
  for (const header of HEADERS) {
    const length = header.slots.length * PITCH;
    group.add(box(length, HEADER_H, PITCH, 0x1c1d22, header.x0 - PITCH / 2 + length / 2, TOP + HEADER_H / 2, header.z));
    header.slots.forEach((_slot, index) => {
      group.add(box(1, 0.06, 1, 0x050506, header.x0 + index * PITCH, HEADER_TOP + 0.03, header.z, false));
    });
  }

  // USB socket and power jack on the left edge.
  group.add(box(16, 11, 12, 0xc9ccd1, 2, TOP + 5.5, 14));
  group.add(box(0.4, 6.5, 8, 0x2a2c31, -6.1, TOP + 5.5, 14, false));
  group.add(box(14, 11, 9, 0x1d1e23, 3, TOP + 5.5, 43));
  const jackHole = cylinder(3, 0.5, 0x050506, -4.2, TOP + 5.8, 43, 20, false);
  jackHole.rotation.z = Math.PI / 2;
  group.add(jackHole);

  // Reset button.
  group.add(box(6, 2, 6, 0xd3d6db, 6, TOP + 1, 4.6));
  group.add(cylinder(1.8, 1.6, 0xd8392b, 6, TOP + 2.8, 4.6));

  // The microcontroller in its socket, with legs and a label.
  group.add(box(36.5, 1.2, 9, 0x24252b, 47, TOP + 0.6, 37));
  group.add(box(35, 3.2, 7.4, 0x17181c, 47, TOP + 2.8, 37));
  for (let i = 0; i < 14; i++) {
    const x = 47 - 16.5 + i * PITCH;
    group.add(box(0.5, 2.2, 0.7, 0xb9bec6, x, TOP + 2.1, 37 - 4.05, false));
    group.add(box(0.5, 2.2, 0.7, 0xb9bec6, x, TOP + 2.1, 37 + 4.05, false));
  }
  group.add(chipLabel());

  // Crystal, USB chip, regulator, capacitors and a 2x3 programming header.
  const crystal = cylinder(1, 3.4, 0x9ea4ad, 20, TOP + 1.7, 28);
  crystal.scale.set(4.6, 1, 1.9);
  group.add(crystal);
  group.add(box(7, 1.2, 7, 0x1f2025, 19, TOP + 0.6, 15));
  group.add(box(6.5, 2.4, 6, 0x1f2025, 9.5, TOP + 1.2, 32));
  group.add(box(6.5, 0.5, 3, 0xb9bec6, 9.5, TOP + 0.25, 28.2, false));
  for (const x of [15.5, 22]) {
    group.add(cylinder(3, 7, 0x2a2b31, x, TOP + 3.5, 47.6));
    group.add(cylinder(2.6, 0.2, 0xc4c8ce, x, TOP + 7.05, 47.6, 24, false));
  }
  group.add(box(5.08, 2.5, 7.62, 0x1c1d22, 64.4, TOP + 1.25, 27.2));
  for (let c = 0; c < 2; c++) {
    for (let r = 0; r < 3; r++) group.add(box(0.64, 6, 0.64, 0xd4af37, 63.13 + c * PITCH, TOP + 3, 24.66 + r * PITCH, false));
  }

  // Small surface LEDs: L (pin 13), TX, RX and ON.
  const lMesh = box(1.6, 0.8, 0.9, 0xb9822a, 31, TOP + 0.4, 8.6, false);
  const builtIn = glowingLed(lMesh, 0xffb627, 9, haloTexture);
  group.add(lMesh, builtIn.halo);
  group.add(box(1.6, 0.8, 0.9, 0xa38a3a, 31, TOP + 0.4, 11.1, false), box(1.6, 0.8, 0.9, 0xa38a3a, 31, TOP + 0.4, 13.5, false));
  const onMesh = box(1.6, 0.8, 0.9, 0x2a7a3f, 58, TOP + 0.4, 22, false);
  const power = glowingLed(onMesh, 0x35e06b, 7, haloTexture);
  setGlow(power, 1);
  group.add(onMesh, power.halo);

  return { group, builtIn };
}

// ───── Parts around the board ─────

interface Label {
  element: HTMLElement;
  text: HTMLElement;
  position: Vector3;
}

interface RunParts {
  group: Group;
  /** External LEDs; a click on the LED changes its colour, a click on its resistor changes the resistor. */
  leds: { pin: number; glow: Glow; body: Mesh; colour: LedColour; ohms: number; label: Label | null; base: string }[];
  servos: { pin: number; horn: Object3D }[];
  buzzers: { pin: number; ring: Mesh; label: Label | null }[];
  knobs: { pin: number; shaft: Object3D; label: Label | null }[];
  buttons: { pin: number; cap: Object3D; baseY: number; pullUp: boolean }[];
  touchPads: { pin: number; finger: Object3D; pad: Mesh; label: Label | null }[];
  rgbLeds: { pins: [number, number, number]; glow: Glow }[];
  ldrs: { pin: number; label: Label | null }[];
  /** Analog sensors whose label shows the reading. */
  sensors: { pin: number; label: Label | null; kind: "fsr" | "temp" | "soil" }[];
  ultrasonics: { echo: number; wall: Object3D; baseZ: number; label: Label | null }[];
  motors: { pin: number; blades: Object3D }[];
  steppers: { pins: number[]; wheel: Object3D; leds: Glow[] }[];
  oleds: { screen: Mesh; texture: CanvasTexture; shown: string | null }[];
  targets: Target[];
}

function wire(from: Vector3, to: Vector3, color: number, lift = 16): Mesh {
  const mid = from.clone().lerp(to, 0.5);
  const curve = new CatmullRomCurve3([
    from,
    new Vector3(from.x, from.y + lift * 0.6, from.z),
    new Vector3(mid.x, Math.max(from.y, to.y) + lift, mid.z),
    new Vector3(to.x, to.y + lift * 0.6, to.z),
    to,
  ]);
  const tube = new Mesh(new TubeGeometry(curve, 48, 0.6, 8, false), toon(color));
  currentStyle().outline(tube, false);
  return tube;
}

// ───── Breadboards ─────
// Holes are 2.54 mm apart. Each column of five holes (a to e, and f to j) is
// joined underneath; the rails along both edges run the whole length.

const BB_H = 8.5;
const BB_D = 54.6;
const HOLE_X0 = 3;
const ROWS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;
type Row = (typeof ROWS)[number];
/** Row positions across the board, as on a real breadboard: a to e, a 7.62 mm channel, f to j. */
const ROW_Z: Record<Row, number> = { a: 13.33, b: 15.87, c: 18.41, d: 20.95, e: 23.49, f: 31.11, g: 33.65, h: 36.19, i: 38.73, j: 41.27 };
/** The two rails on each side: + next to the red line, − next to the blue one. */
const RAIL_Z = { top: { "+": 2.2, "-": 4.74 }, bottom: { "+": BB_D - 4.74, "-": BB_D - 2.2 } };
const POWER_WIRE = 0xd63a2f;
const GROUND_WIRE = 0x2a2d35;

interface Breadboard {
  x0: number;
  z0: number;
  columns: number;
  width: number;
  part: PartName;
  hole(column: number, row: Row): Vector3;
  rail(sign: "+" | "-", side: "top" | "bottom", column: number): Vector3;
}

function breadboard(x0: number, z0: number, columns: number, width: number, part: PartName): Breadboard {
  const x = (column: number): number => x0 + HOLE_X0 + column * PITCH;
  return {
    x0,
    z0,
    columns,
    width,
    part,
    hole: (column, row) => new Vector3(x(column), BB_H, z0 + ROW_Z[row]),
    rail: (sign, side, column) => new Vector3(x(column), BB_H, z0 + RAIL_Z[side][sign]),
  };
}

/** The half breadboard beside an Uno, and the full one an ESP32 sits on (its pins in rows a and i, columns 2 to 20). */
const UNO_BREADBOARD = breadboard(82, 0, 30, 82.5, "breadboard");
const ESP_LIFT = BB_H - 6;
const ESP_BREADBOARD = breadboard(4.6 - HOLE_X0 - 2 * PITCH, ESP_BACK_Z - ROW_Z.a, 63, 165.1, "breadboard-full");
/** The breadboard column of the ESP32 pin at this position in a row (counted from the antenna end). */
function espColumn(index: number): number {
  return 2 + (18 - index);
}

function breadboardTop(w: number, columns: number): Mesh {
  return decal(w, BB_D, 10, (g, mm) => {
    g.fillStyle = "#3b3f46";
    for (let c = 0; c < columns; c++) {
      const x = HOLE_X0 + c * PITCH;
      for (const z of [RAIL_Z.top["+"], RAIL_Z.top["-"], RAIL_Z.bottom["+"], RAIL_Z.bottom["-"]]) {
        if (c % 6 !== 5) g.fillRect(mm(x - 0.45), mm(z - 0.45), mm(0.9), mm(0.9));
      }
      for (const row of ROWS) g.fillRect(mm(x - 0.45), mm(ROW_Z[row] - 0.45), mm(0.9), mm(0.9));
    }
    g.lineWidth = mm(0.35);
    for (const [z, color] of [
      [0.9, "#d6453a"],
      [6.0, "#3a6fd6"],
      [BB_D - 6.0, "#d6453a"],
      [BB_D - 0.9, "#3a6fd6"],
    ] as const) {
      g.strokeStyle = color;
      g.beginPath();
      g.moveTo(mm(1.5), mm(z));
      g.lineTo(mm(w - 1.5), mm(z));
      g.stroke();
    }
    // Row letters at both ends, as printed on real boards.
    g.fillStyle = "#8a8f98";
    g.font = `600 ${mm(1.4)}px system-ui, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (const row of ROWS) {
      g.fillText(row, mm(1.2), mm(ROW_Z[row]));
      g.fillText(row, mm(w - 1.2), mm(ROW_Z[row]));
    }
  });
}

/** A breadboard: the Fusion model (or a plain block) with its holes and markings on top. */
function breadboardMesh(models: PartModels | null, bb: Breadboard): Group {
  const group = new Group();
  group.add(placed(models, bb.part, bb.x0, 0, bb.z0) ?? box(bb.width, BB_H, BB_D, MATERIAL_COLOURS.breadboard!, bb.x0 + bb.width / 2, BB_H / 2, bb.z0 + BB_D / 2));
  const top = breadboardTop(bb.width, bb.columns);
  top.position.set(bb.x0 + bb.width / 2, BB_H + 0.02, bb.z0 + BB_D / 2);
  group.add(top);
  return group;
}

/** A part from the Fusion models, placed; or null when the models did not load. */
function placed(models: PartModels | null, part: PartName, x: number, y: number, z: number): Group | null {
  if (!models) return null;
  const group = models.make(part, currentStyle());
  group.position.set(x, y, z);
  return group;
}

function meshNamed(group: Group, name: string): Mesh {
  // Only the meshes inside: the part's own group carries the part's name, which can match.
  const mesh = group.children.find((child) => child.name === name && child instanceof Mesh);
  if (!(mesh instanceof Mesh)) throw new Error(`model part has no "${name}" body`);
  return mesh;
}

/**
 * Where parts go on the breadboard: two lanes (the a-e half and the f-j half),
 * each filled from left to right. Rows are named from a lane's own edge:
 * outer(0) is a or j, next to the rails; outer(4) is e or f, beside the channel.
 */
class Lanes {
  private readonly next: { top: number; bottom: number };
  private usedBottom = false;
  constructor(
    readonly bb: Breadboard,
    first: number,
  ) {
    this.next = { top: first, bottom: first };
  }

  row(side: "top" | "bottom", step: number): Row {
    return side === "top" ? ROWS[step]! : ROWS[9 - step]!;
  }

  /** Room for `width` columns in the emptier lane: that lane and the first column. */
  take(width: number): { side: "top" | "bottom"; column: number } {
    const side = this.next.top <= this.next.bottom ? "top" : "bottom";
    const column = this.next[side];
    this.next[side] += width + 1;
    if (side === "bottom") this.usedBottom = true;
    return { side, column };
  }

  /** The same columns in both lanes, for a part across the channel. */
  takeBoth(width: number): number {
    const column = Math.max(this.next.top, this.next.bottom);
    this.next.top = column + width + 1;
    this.next.bottom = column + width + 1;
    this.usedBottom = true;
    return column;
  }

  get bottomUsed(): boolean {
    return this.usedBottom;
  }
}

/** A resistor lying along the board between two columns of one row. */
function resistorAcross(models: PartModels | null, bb: Breadboard, row: Row, fromColumn: number, toColumn: number): Object3D {
  const a = bb.hole(fromColumn, row);
  const b = bb.hole(toColumn, row);
  const mid = a.clone().lerp(b, 0.5);
  const length = a.distanceTo(b);
  const model = placed(models, "resistor", mid.x, BB_H, mid.z);
  if (model) {
    model.rotation.y = Math.PI / 2;
    // The model's leads are 12 mm apart; stretch them to the holes.
    model.scale.z = length / 12;
    return model;
  }
  const body = cylinder(0.9, length * 0.5, MATERIAL_COLOURS.resistor!, mid.x, BB_H + 2, mid.z, 16);
  body.rotation.z = Math.PI / 2;
  return body;
}

function buildParts(
  plan: PartPlan,
  haloTexture: Texture,
  addLabel: (text: string, position: Vector3) => Label | null,
  models: PartModels | null,
): RunParts {
  const group = new Group();
  const parts: RunParts = { group, leds: [], servos: [], buzzers: [], knobs: [], buttons: [], touchPads: [], rgbLeds: [], ldrs: [], sensors: [], ultrasonics: [], motors: [], steppers: [], oleds: [], targets: [] };
  let wireIndex = 0;
  const nextWire = (): number => WIRE_COLOURS[wireIndex++ % WIRE_COLOURS.length]!;
  const esp32 = build.board === "esp32";
  const titled = (pin: number, what: string): string => `${plan.labels[pin] ? `${plan.labels[pin]} · ` : ""}${what} · ${pinWord(pin)}`;

  // An Uno gets a half breadboard, powered from its 5V and GND pins; an ESP32 already sits on one.
  const onBoard =
    plan.leds.length + plan.rgbLeds.length + plan.buttons.length + plan.knobs.length + plan.ldrs.length + plan.buzzers.length + plan.temps.length + plan.fsrs.length + plan.motors.length > 0 ||
    plan.ultrasonics.length + plan.steppers.length + plan.soils.length + plan.oleds.length > 0;
  const bb = esp32 ? ESP_BREADBOARD : UNO_BREADBOARD;
  const lanes = new Lanes(bb, esp32 ? 23 : 1);
  if (!esp32 && onBoard) {
    group.add(breadboardMesh(models, bb));
    group.add(wire(unoSocketOf("5V"), bb.rail("+", "top", 0), POWER_WIRE, 18));
    group.add(wire(unoSocketOf("GND"), bb.rail("-", "top", 0), GROUND_WIRE, 16));
  }
  const toRail = (sign: "+" | "-", side: "top" | "bottom", column: number, row: Row): void => {
    group.add(wire(bb.hole(column, row), bb.rail(sign, side, column), sign === "+" ? POWER_WIRE : GROUND_WIRE, 3));
  };
  const signal = (pin: number, to: Vector3, lift = 18): void => void group.add(wire(socketOf(pin), to, nextWire(), lift));

  // LED: pin -> resistor -> anode; cathode -> ground rail.
  for (const { pin, colour } of plan.leds) {
    const { side, column: c } = lanes.take(7);
    const row = (step: number): Row => lanes.row(side, step);
    signal(pin, bb.hole(c, row(0)));
    const resistor = resistorAcross(models, bb, row(1), c, c + 5);
    group.add(resistor);
    const anode = bb.hole(c + 5, row(3));
    const x = anode.x + PITCH / 2;
    const y = BB_H + 3;
    let glow: Glow;
    let ledBody: Mesh;
    const led = placed(models, "led", x, y, anode.z);
    if (led) {
      const body = meshNamed(led, "led");
      const material = body.material as MeshToonMaterial;
      material.color.setHex(LED_BODY[colour]);
      material.transparent = true;
      material.opacity = 0.9;
      group.add(led);
      glow = glowingLed(body, LED_GLOW[colour], 16, haloTexture, new Vector3(x, y + 6, anode.z));
      ledBody = body;
      parts.targets.push({ object: led, kind: "led", pin });
    } else {
      const body = new Mesh(new CylinderGeometry(2.5, 2.7, 6, 24), toon(LED_BODY[colour], { transparent: true, opacity: 0.92 }));
      body.position.set(x, y + 3, anode.z);
      currentStyle().outline(body);
      group.add(body);
      glow = glowingLed(body, LED_GLOW[colour], 16, haloTexture, new Vector3(x, y + 6, anode.z));
      ledBody = body;
      parts.targets.push({ object: body, kind: "led", pin });
    }
    group.add(glow.halo);
    parts.targets.push({ object: resistor, kind: "resistor", pin });
    toRail("-", side, c + 6, row(0));
    const label = addLabel(titled(pin, `${colour} LED`), new Vector3(x, y + 11 + ((parts.leds.length + 1) % 2) * 7, anode.z));
    parts.leds.push({ pin, glow, body: ledBody, colour, ohms: 220, label, base: plan.labels[pin] ? `${plan.labels[pin]} · ` : "" });
  }

  // RGB LED: three pins, each through its own resistor; the common leg to ground.
  for (const pins of plan.rgbLeds) {
    const { side, column: c } = lanes.take(9);
    const row = (step: number): Row => lanes.row(side, step);
    const leg = c + 5;
    const legs = [leg, leg + 2, leg + 3];
    pins.forEach((pin, index) => {
      const start = legs[index]! - 5;
      signal(pin, bb.hole(start, row(0)), 18 + index * 3);
      group.add(resistorAcross(models, bb, row(1 + index), start, legs[index]!));
    });
    const centre = bb.hole(leg, row(4));
    const x = centre.x + 1.5 * PITCH;
    const y = BB_H + 3;
    const model = placed(models, "rgb-led", x, y, centre.z);
    let body: Mesh;
    if (model) {
      body = meshNamed(model, "led-milky");
      const material = body.material as MeshToonMaterial;
      material.transparent = true;
      material.opacity = 0.85;
      group.add(model);
    } else {
      body = new Mesh(new CylinderGeometry(2.5, 2.7, 6, 24), toon(0xf2f2ee, { transparent: true, opacity: 0.85 }));
      body.position.set(x, y + 3, centre.z);
      group.add(body);
    }
    const glow = glowingLed(body, 0xffffff, 18, haloTexture, new Vector3(x, y + 6, centre.z));
    group.add(glow.halo);
    parts.rgbLeds.push({ pins, glow });
    toRail("-", side, leg + 1, row(0));
    addLabel(`RGB LED · ${pins.map((pin) => pinWord(pin)).join(", ")}`, new Vector3(x, y + 13, centre.z));
  }

  // Button across the channel: to ground with the pin's pull-up, or to power with a 10 kΩ pull-down.
  for (const pin of plan.buttons) {
    const pullUp = (plan.buttonWiring[pin] ?? "pull-up") === "pull-up";
    const c = lanes.takeBoth(pullUp ? 4 : 9);
    const centre = bb.hole(c + 2, "e").lerp(bb.hole(c + 2, "f"), 0.5);
    const baseY = BB_H + 3.6;
    group.add(placed(models, "button", centre.x, BB_H, centre.z) ?? box(12, 3.8, 12, MATERIAL_COLOURS["plastic-black"]!, centre.x, BB_H + 1.9, centre.z));
    const cap = placed(models, "button-cap", centre.x, baseY, centre.z) ?? cylinder(3.5, 3.2, MATERIAL_COLOURS["button-red"]!, centre.x, baseY + 1.6, centre.z);
    group.add(cap);
    if (pullUp) {
      signal(pin, bb.hole(c, "a"));
      toRail("-", "top", c + 4, "a");
    } else {
      toRail("+", "top", c, "a");
      signal(pin, bb.hole(c + 4, "j"));
      group.add(resistorAcross(models, bb, "i", c + 4, c + 9));
      toRail("-", "bottom", c + 9, "j");
    }
    parts.buttons.push({ pin, cap, baseY: cap.position.y, pullUp });
    parts.targets.push({ object: cap, kind: "button", pin });
    addLabel(titled(pin, "button"), new Vector3(centre.x, BB_H + 14, centre.z));
  }

  // Knob (potentiometer): power, wiper to the pin, ground.
  for (const pin of plan.knobs) {
    const { side, column: c } = lanes.take(5);
    const row = (step: number): Row => lanes.row(side, step);
    toRail("+", side, c, row(0));
    signal(pin, bb.hole(c + 2, row(0)));
    toRail("-", side, c + 4, row(0));
    const centre = bb.hole(c + 2, row(3));
    let shaft: Object3D;
    const base = placed(models, "knob", centre.x, BB_H, centre.z);
    if (base) {
      group.add(base);
      shaft = placed(models, "knob-cap", centre.x, BB_H + 8, centre.z)!;
    } else {
      group.add(box(10, 6, 10, MATERIAL_COLOURS.pot!, centre.x, BB_H + 3, centre.z));
      shaft = new Group();
      shaft.position.set(centre.x, BB_H + 8, centre.z);
      shaft.add(cylinder(6, 7, MATERIAL_COLOURS["plastic-black"]!, 0, 3.5, 0));
    }
    group.add(shaft);
    parts.targets.push({ object: shaft, kind: "knob", pin });
    parts.knobs.push({ pin, shaft, label: addLabel(titled(pin, "knob"), new Vector3(centre.x, BB_H + 20, centre.z)) });
  }

  // Light sensor: LDR from power to the pin's column, 10 kΩ from there to ground.
  for (const pin of plan.ldrs) {
    const { side, column: c } = lanes.take(7);
    const row = (step: number): Row => lanes.row(side, step);
    toRail("+", side, c, row(0));
    signal(pin, bb.hole(c + 1, row(0)));
    group.add(resistorAcross(models, bb, row(1), c + 1, c + 6));
    toRail("-", side, c + 6, row(0));
    const legs = bb.hole(c, row(3));
    const x = legs.x + PITCH / 2;
    const ldr = placed(models, "ldr", x, BB_H + 4, legs.z) ?? cylinder(2.6, 2, MATERIAL_COLOURS.ldr!, x, BB_H + 5, legs.z);
    group.add(ldr);
    parts.targets.push({ object: ldr, kind: "ldr", pin });
    const squiggle = decal(5, 5, 24, (g, mm) => {
      g.strokeStyle = "#7a3b12";
      g.lineWidth = mm(0.35);
      g.beginPath();
      g.moveTo(mm(0.8), mm(1.2));
      for (let i = 0; i < 4; i++) {
        g.lineTo(mm(4.2), mm(1.2 + i * 0.9));
        g.lineTo(mm(0.8), mm(1.65 + i * 0.9));
      }
      g.stroke();
    });
    squiggle.position.set(x, BB_H + 6.05, legs.z);
    group.add(squiggle);
    parts.ldrs.push({ pin, label: addLabel(titled(pin, "light sensor"), new Vector3(x, BB_H + 14, legs.z)) });
  }

  // TMP36: power, Vout to the pin, ground; flat side to the front.
  for (const pin of plan.temps) {
    const { side, column: c } = lanes.take(3);
    const row = (step: number): Row => lanes.row(side, step);
    toRail("+", side, c, row(0));
    signal(pin, bb.hole(c + 1, row(0)));
    toRail("-", side, c + 2, row(0));
    const centre = bb.hole(c + 1, row(3));
    const sensor = placed(models, "tmp36", centre.x, BB_H + 3, centre.z) ?? cylinder(2.4, 4.7, MATERIAL_COLOURS["plastic-black"]!, centre.x, BB_H + 5.4, centre.z);
    group.add(sensor);
    parts.targets.push({ object: sensor, kind: "knob", pin });
    parts.sensors.push({ pin, kind: "temp", label: addLabel(titled(pin, "temperature sensor"), new Vector3(centre.x, BB_H + 14, centre.z)) });
  }

  // Force sensor: power to one lead, the other lead to the pin with 10 kΩ to ground; the pad lies in front.
  const fsrPads: { pin: number; from: Vector3[] }[] = [];
  for (const pin of plan.fsrs) {
    const { side, column: c } = lanes.take(7);
    const row = (step: number): Row => lanes.row(side, step);
    toRail("+", side, c, row(0));
    signal(pin, bb.hole(c + 1, row(0)));
    group.add(resistorAcross(models, bb, row(1), c + 1, c + 6));
    toRail("-", side, c + 6, row(0));
    fsrPads.push({ pin, from: [bb.hole(c, row(3)), bb.hole(c + 1, row(3))] });
  }

  // Motor driver: pin -> 1 kΩ -> TIP120 base; emitter to ground; the collector runs the motor in front.
  const motorLeads: { pin: number; collector: Vector3 }[] = [];
  for (const pin of plan.motors) {
    const { side, column: c } = lanes.take(8);
    const row = (step: number): Row => lanes.row(side, step);
    signal(pin, bb.hole(c, row(0)));
    group.add(resistorAcross(models, bb, row(1), c, c + 5));
    const middle = bb.hole(c + 6, row(3));
    group.add(placed(models, "tip120", middle.x, BB_H + 3, middle.z) ?? box(10, 9, 4.5, MATERIAL_COLOURS["plastic-black"]!, middle.x, BB_H + 7.5, middle.z));
    toRail("-", side, c + 7, row(0));
    motorLeads.push({ pin, collector: bb.hole(c + 6, row(0)) });
    addLabel(titled(pin, "transistor (TIP120)"), new Vector3(middle.x, BB_H + 22, middle.z));
  }

  // Buzzer: pin to +, − to ground.
  for (const pin of plan.buzzers) {
    const { side, column: c } = lanes.take(4);
    const row = (step: number): Row => lanes.row(side, step);
    signal(pin, bb.hole(c, row(0)));
    toRail("-", side, c + 3, row(0));
    const centre = bb.hole(c, row(3)).lerp(bb.hole(c + 3, row(3)), 0.5);
    group.add(placed(models, "buzzer", centre.x, BB_H, centre.z) ?? cylinder(6, 7.5, MATERIAL_COLOURS["plastic-black"]!, centre.x, BB_H + 3.75, centre.z, 32));
    const ring = new Mesh(new RingGeometry(6.5, 7.5, 40), new MeshBasicMaterial({ color: 0x5fd38d, transparent: true, opacity: 0, side: DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(centre.x, BB_H + 7.8, centre.z);
    group.add(ring);
    parts.buzzers.push({ pin, ring, label: addLabel(titled(pin, "buzzer"), new Vector3(centre.x, BB_H + 14, centre.z)) });
  }

  // Off the breadboard, in a row in front: servos and touch pads.
  let slot = 0;
  const frontZ = bb.z0 + BB_D + 18;
  const slotX = (): number => bb.x0 + 14 + slot++ * 30;

  for (const pin of plan.servos) {
    const x = slotX();
    const servo = placed(models, "servo", x, 0, frontZ);
    let horn: Object3D;
    if (servo) {
      group.add(servo);
      horn = placed(models, "servo-horn", x + 5.5, 29.7, frontZ)!;
    } else {
      group.add(box(22.8, 22.7, 12.2, MATERIAL_COLOURS.servo!, x, 11.35, frontZ), box(32.3, 2.5, 12.2, MATERIAL_COLOURS.servo!, x, 17.15, frontZ));
      horn = new Group();
      horn.position.set(x + 5.5, 29.7, frontZ);
      horn.add(box(4.4, 1.6, 17, MATERIAL_COLOURS.white!, 0, 0.8, 7.5));
    }
    group.add(horn);
    // Three wires: signal (orange), power (red; 5 V, from VIN on an ESP32) and ground (brown).
    const plug = new Vector3(x - 11.4, 10, frontZ);
    group.add(wire(socketOf(pin), plug, 0xf28c28, 22));
    const servoPower = esp32 ? espSocketOf("5V") : bb.rail("+", "bottom", 0);
    group.add(wire(servoPower, plug.clone().add(new Vector3(0, 0, 1.4)), POWER_WIRE, 14));
    group.add(wire(bb.rail("-", "bottom", 1), plug.clone().add(new Vector3(0, 0, -1.4)), 0x6b3f22, 12));
    parts.servos.push({ pin, horn });
    addLabel(titled(pin, "servo"), new Vector3(x, 34, frontZ));
  }

  for (const pin of plan.touchPads) {
    const x = slotX();
    group.add(box(16, 1.6, 16, MATERIAL_COLOURS.pcb!, x, 0.8, frontZ));
    const pad = cylinder(5.5, 0.4, MATERIAL_COLOURS.gold!, x, 1.8, frontZ, 32);
    group.add(pad);
    const finger = new Group();
    const skin = new Mesh(new CapsuleGeometry(3.4, 12, 6, 16), toon(0xf5c7a0));
    currentStyle().outline(skin);
    const nail = new Mesh(new CapsuleGeometry(1.8, 2.4, 4, 10), toon(0xfbe3d3));
    nail.position.set(1.6, -4.6, 0);
    nail.rotation.z = 0.1;
    skin.add(nail);
    skin.rotation.z = 0.5;
    finger.add(skin);
    finger.position.set(x + 4, FINGER_UP, frontZ);
    group.add(finger);
    parts.targets.push({ object: pad, kind: "touch", pin }, { object: finger, kind: "touch", pin });
    group.add(wire(socketOf(pin), new Vector3(x - 8, 1.6, frontZ), nextWire(), 16));
    parts.touchPads.push({ pin, finger, pad, label: addLabel(titled(pin, "touch pad"), new Vector3(x, 26, frontZ)) });
  }

  // Power for parts in front: the + rail (5 V on an Uno), or the ESP32's 5V pin for 5 V parts.
  const fivePower = (): Vector3 => (esp32 ? espSocketOf("5V") : bb.rail("+", "bottom", 0));
  const groundRail = (): Vector3 => bb.rail("-", "bottom", 1);

  for (const { pin, from } of fsrPads) {
    const x = slotX();
    const pad = placed(models, "fsr", x, 0.2, frontZ) ?? cylinder(9.5, 0.5, MATERIAL_COLOURS.fsr!, x, 0.45, frontZ, 32);
    group.add(pad);
    const tail = new Vector3(x, 0.4, frontZ - 46);
    group.add(wire(from[0]!, tail.clone().setX(x - 1.7), 0x9aa0a8, 10));
    group.add(wire(from[1]!, tail.clone().setX(x + 1.7), 0x9aa0a8, 10));
    parts.targets.push({ object: pad, kind: "knob", pin });
    parts.sensors.push({ pin, kind: "fsr", label: addLabel(titled(pin, "force sensor"), new Vector3(x, 10, frontZ)) });
  }

  for (const pin of plan.soils) {
    const x = slotX();
    // A flower pot with soil, the probe standing in it.
    const pot = new Mesh(new CylinderGeometry(14, 10, 34, 32), toon(0xc8693c));
    pot.position.set(x, 17, frontZ);
    currentStyle().outline(pot);
    const soil = new Mesh(new CylinderGeometry(13, 13, 1, 32), toon(0x5a3b22));
    soil.position.set(x, 32, frontZ);
    group.add(pot, soil);
    const holder = new Group();
    holder.position.set(x, 74, frontZ);
    holder.rotation.x = -Math.PI / 2;
    holder.add(placed(models, "soil-sensor", 0, 0, 0) ?? box(23, 98, 1.6, MATERIAL_COLOURS["pcb-black"]!, 0, -31, 0));
    group.add(holder);
    const top = new Vector3(x, 88, frontZ);
    group.add(wire(fivePower(), top.clone().setX(x - 3), POWER_WIRE, 20));
    group.add(wire(groundRail(), top.clone().setX(x + 3), GROUND_WIRE, 20));
    group.add(wire(socketOf(pin), top, nextWire(), 24));
    parts.targets.push({ object: soil, kind: "knob", pin }, { object: holder, kind: "knob", pin });
    parts.sensors.push({ pin, kind: "soil", label: addLabel(titled(pin, "soil sensor"), new Vector3(x, 96, frontZ)) });
  }

  for (const [trig, echo] of plan.ultrasonics) {
    const x = slotX();
    const turn = new Group();
    turn.position.set(x, 0, frontZ);
    turn.rotation.y = Math.PI;
    const stand = new Group();
    stand.rotation.x = -Math.PI / 2;
    stand.position.y = 22;
    stand.add(placed(models, "hc-sr04", 0, 0, 0) ?? box(45, 20, 1.6, MATERIAL_COLOURS.pcb!, 0, 0, 0.8));
    turn.add(stand);
    group.add(turn);
    // The obstacle: a wall in front of the sensor that moves with the distance.
    const wall = box(40, 34, 4, 0xf3c55a, x, 17, frontZ + 30);
    group.add(wall);
    const pinsAt = new Vector3(x, 5, frontZ + 1);
    group.add(wire(fivePower(), pinsAt.clone().setX(x - 3.8), POWER_WIRE, 16));
    group.add(wire(socketOf(trig!), pinsAt.clone().setX(x - 1.3), nextWire(), 20));
    group.add(wire(socketOf(echo!), pinsAt.clone().setX(x + 1.3), nextWire(), 22));
    group.add(wire(groundRail(), pinsAt.clone().setX(x + 3.8), GROUND_WIRE, 14));
    parts.targets.push({ object: wall, kind: "distance", pin: echo! });
    parts.ultrasonics.push({ echo: echo!, wall, baseZ: frontZ + 14, label: addLabel(`Ultrasonic sensor · trig ${pinWord(trig!)}, echo ${pinWord(echo!)}`, new Vector3(x, 40, frontZ)) });
  }

  for (const { pin, collector } of motorLeads) {
    const x = slotX();
    group.add(placed(models, "motor", x, 3, frontZ) ?? cylinder(10, 25, MATERIAL_COLOURS.metal!, x, 15.5, frontZ));
    const blades = placed(models, "fan", x, 35, frontZ) ?? box(40, 1.4, 6, MATERIAL_COLOURS.fan!, x, 35.7, frontZ);
    group.add(blades);
    group.add(wire(collector, new Vector3(x + 3, 1, frontZ), 0x6b7380, 18));
    group.add(wire(fivePower(), new Vector3(x - 3, 1, frontZ), POWER_WIRE, 16));
    parts.motors.push({ pin, blades });
    addLabel(titled(pin, "motor"), new Vector3(x, 46, frontZ));
  }

  for (const pins of plan.steppers) {
    const x = slotX();
    // The driver board, flat, and the motor beside it with a prize wheel on its shaft.
    group.add(placed(models, "uln2003", x - 18, 0, frontZ - 16) ?? box(35, 1.6, 32, MATERIAL_COLOURS["pcb-green"]!, x, 0.8, frontZ));
    const leds = pins.map((_, index) => {
      const led = box(2.4, 1, 2, 0x8a2a22, x - 8 + index * 4.6 + 1.2, 2.1, frontZ - 16 + 23, false);
      group.add(led);
      const glow = glowingLed(led, 0xff3b2f, 6, haloTexture, led.position.clone().setY(3));
      group.add(glow.halo);
      return glow;
    });
    const motorX = x + 34;
    group.add(placed(models, "stepper", motorX, 0, frontZ) ?? cylinder(14, 19, MATERIAL_COLOURS.metal!, motorX, 9.5, frontZ));
    const wheel = new Group();
    wheel.position.set(motorX, 29, frontZ);
    wheel.add(placed(models, "wheel", 0, 0, 0) ?? cylinder(26, 2, MATERIAL_COLOURS.white!, 0, 1, 0, 48));
    const segments = decal(52, 52, 10, (g, mm) => {
      const colours = ["#e0483a", "#f0c552", "#49b86a", "#3f8cf0", "#e0483a", "#f0c552", "#49b86a", "#3f8cf0"];
      colours.forEach((colour, index) => {
        g.fillStyle = colour;
        g.beginPath();
        g.moveTo(mm(26), mm(26));
        g.arc(mm(26), mm(26), mm(25), (index * Math.PI) / 4, ((index + 1) * Math.PI) / 4);
        g.closePath();
        g.fill();
      });
      g.fillStyle = "#fdfdfd";
      g.font = `800 ${mm(5)}px system-ui, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      for (let index = 0; index < 8; index++) {
        const angle = ((index + 0.5) * Math.PI) / 4;
        g.fillText(String(index + 1), mm(26 + Math.cos(angle) * 17), mm(26 + Math.sin(angle) * 17));
      }
    });
    segments.position.y = 2.05;
    wheel.add(segments);
    group.add(wheel);
    // A fixed pointer above the wheel shows where it stops.
    group.add(box(2, 2, 8, 0x25262b, motorX, 34, frontZ - 30));
    pins.forEach((pin, index) => group.add(wire(socketOf(pin), new Vector3(x - 15 + index * 2.54, 8, frontZ - 13.5), nextWire(), 22 + index * 2)));
    group.add(wire(fivePower(), new Vector3(x - 15 + 4 * 2.54, 8, frontZ - 13.5), POWER_WIRE, 18));
    group.add(wire(groundRail(), new Vector3(x - 15 + 5 * 2.54, 8, frontZ - 13.5), GROUND_WIRE, 16));
    parts.steppers.push({ pins, wheel, leds });
    addLabel(`Stepper · ${pins.map((pin) => pinWord(pin)).join(", ")}`, new Vector3(motorX, 46, frontZ));
  }

  for (const [sda, scl] of plan.oleds) {
    const x = slotX();
    const tilt = new Group();
    tilt.position.set(x, 10, frontZ);
    tilt.rotation.x = 0.9;
    tilt.add(placed(models, "oled", 0, 0, 0) ?? box(27, 1.6, 27.5, MATERIAL_COLOURS.pcb!, 0, 0.8, 0));
    // The glass: a texture the sketch's text is drawn on.
    const texture = canvasTexture(256, 188, (g) => {
      g.fillStyle = "#05070b";
      g.fillRect(0, 0, 256, 188);
    });
    const screen = new Mesh(new PlaneGeometry(26, 19), new MeshBasicMaterial({ map: texture }));
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = 2.85;
    tilt.add(screen);
    group.add(tilt);
    const pinsAt = new Vector3(x, 2, frontZ - 9);
    group.add(wire(esp32 ? espSocketOf("3V3") : bb.rail("+", "bottom", 0), pinsAt.clone().setX(x - 3.8), POWER_WIRE, 14));
    group.add(wire(groundRail(), pinsAt.clone().setX(x - 1.3), GROUND_WIRE, 14));
    group.add(wire(socketOf(sda!), pinsAt.clone().setX(x + 1.3), 0x2f7dd1, 20));
    group.add(wire(socketOf(scl!), pinsAt.clone().setX(x + 3.8), 0xf2c94c, 22));
    parts.oleds.push({ screen, texture, shown: null });
    addLabel(`OLED screen · SDA ${pinWord(sda!)}, SCL ${pinWord(scl!)}`, new Vector3(x, 30, frontZ));
  }

  // On an Uno, parts in the lower half need the lower rails: join them to the upper ones.
  const inFront = plan.servos.length + plan.fsrs.length + plan.soils.length + plan.ultrasonics.length + plan.motors.length + plan.steppers.length + plan.oleds.length > 0;
  if (!esp32 && onBoard && (lanes.bottomUsed || inFront)) {
    const end = bb.columns - 1;
    group.add(wire(bb.rail("+", "top", end), bb.rail("+", "bottom", end), POWER_WIRE, 10));
    group.add(wire(bb.rail("-", "top", end - 1), bb.rail("-", "bottom", end - 1), GROUND_WIRE, 12));
  }
  // A servo on an Uno with nothing else on the breadboard still needs the breadboard's rails.
  if (!esp32 && !onBoard && plan.servos.length > 0) {
    group.add(breadboardMesh(models, bb));
    group.add(wire(unoSocketOf("5V"), bb.rail("+", "bottom", 0), POWER_WIRE, 18));
    group.add(wire(unoSocketOf("GND"), bb.rail("-", "bottom", 1), GROUND_WIRE, 16));
  }

  return parts;
}

/** Draws what an OLED shows onto its texture: one line per row, each starting with its size. */
function drawScreen(texture: CanvasTexture, shown: string): void {
  const canvas = texture.image as HTMLCanvasElement;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#05070b";
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = "#bfe3ff";
  g.textBaseline = "top";
  let y = 8;
  for (const line of shown.split("\n")) {
    if (line.length < 2) continue;
    const size = line[0] === "2" ? 2 : 1;
    g.font = `700 ${16 * size}px ui-monospace, monospace`;
    g.fillText(line.slice(1), 8, y);
    y += 20 * size;
  }
  texture.needsUpdate = true;
}

const LED_COLOUR_ORDER: LedColour[] = ["red", "yellow", "green", "blue", "white"];
const RESISTOR_VALUES = [220, 470, 1000, 10000];

/** How bright an LED is with `ohms` compared with the 220 Ω it is drawn for: the ratio of the currents. */
function ledCurrentRatio(colour: LedColour, ohms: number, board: BoardId): number {
  const volts = profileOf(board).volts;
  const forward = LED_FORWARD_VOLTS[colour];
  const current = (volts - forward) / ohms;
  const reference = (volts - forward) / 220;
  return reference > 0 ? Math.max(0.04, current / reference) : 0;
}

/** Heights of the finger's centre above a touch pad: hovering, and touching. */
const FINGER_UP = 20;
const FINGER_DOWN = 11;

// ───── The scene ─────

const UNO_LABELS: [string, Vector3][] = [
  ["USB port", new Vector3(2, TOP + 11.5, 14)],
  ["Power jack", new Vector3(3, TOP + 11.5, 43)],
  ["Digital pins", new Vector3(40, HEADER_TOP + 1, DIGITAL_Z)],
  ["Power pins", new Vector3(36, HEADER_TOP + 1, BOTTOM_Z)],
  ["Analog pins", new Vector3(56.5, HEADER_TOP + 1, BOTTOM_Z)],
  ["Microcontroller", new Vector3(47, TOP + 4.6, 37)],
  ["Reset", new Vector3(6, TOP + 3.8, 4.6)],
  ["Built-in LED (pin 13)", new Vector3(31, TOP + 1, 8.6)],
];

const ESP32_LABELS: [string, Vector3][] = [
  ["Radio module (Wi-Fi + Bluetooth)", new Vector3(38.4, ESP_TOP + 3.3, 13.95)],
  ["Antenna", new Vector3(51, ESP_TOP + 1, 13.95)],
  ["USB port", new Vector3(1.7, ESP_TOP + 2.9, 13.95)],
  ["EN (reset)", new Vector3(6.9, ESP_TOP + 2.4, 5.15)],
  ["BOOT", new Vector3(6.9, ESP_TOP + 2.4, 22.75)],
  ["GPIO pins", new Vector3(27, ESP_TOP + 1.2, ESP_BACK_Z)],
  ["Power and GPIO pins", new Vector3(27, ESP_TOP + 1.2, ESP_FRONT_Z)],
  ["Built-in LED (GPIO 2)", new Vector3(21.8, ESP_TOP + 0.7, 18.9)],
];

function boardLabels(board: BoardId): [string, Vector3][] {
  return board === "esp32" ? ESP32_LABELS.map(([text, position]) => [text, position.clone().setY(position.y + ESP_LIFT)]) : UNO_LABELS;
}

/** Viewing direction from the scene's centre: in front, to the left, above. */
const VIEW_DIRECTION = new Vector3(-0.3, 1.05, 1).normalize();
/** How much of the view the scene fills, as a fraction of the half-width. */
const FILL = 0.88;
/** The floor: a square of this many mm, with a line every 10 mm and a stronger one every 50. */
const FLOOR_SIZE = 640;

/** Loads the Fusion models for the board and parts (shared by every board on the page). */
export function loadModels(): Promise<PartModels> {
  return loadPartModels();
}

/** A sketchbook page in the theme's colours: paper grain, a dot grid, fading out at the edges. */
function floorTexture(fill: string, ink: string): CanvasTexture {
  return canvasTexture(2048, 2048, (g) => {
    const mm = 2048 / FLOOR_SIZE;
    g.fillStyle = fill;
    g.fillRect(0, 0, 2048, 2048);
    // Paper grain: faint specks, the same every time.
    g.fillStyle = ink;
    let seed = 7;
    const next = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 9000; i++) {
      g.globalAlpha = 0.015 + next() * 0.035;
      g.fillRect(next() * 2048, next() * 2048, 1 + next() * 2, 1 + next() * 2);
    }
    // A dot every 10 mm, a bigger one every 50.
    for (let x = 0; x <= FLOOR_SIZE; x += 10) {
      for (let z = 0; z <= FLOOR_SIZE; z += 10) {
        const major = x % 50 === 0 && z % 50 === 0;
        g.globalAlpha = major ? 0.32 : 0.16;
        g.beginPath();
        g.arc(x * mm, z * mm, major ? 3.2 : 2, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = "destination-in";
    const fade = g.createRadialGradient(1024, 1024, 0, 1024, 1024, 1024);
    fade.addColorStop(0, "rgba(0,0,0,1)");
    fade.addColorStop(0.55, "rgba(0,0,0,0.9)");
    fade.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = fade;
    g.fillRect(0, 0, 2048, 2048);
  });
}

export function createBoardScene(host: HTMLElement, labelLayer: HTMLElement, models: PartModels | null = null, initialBoard: BoardId = "uno"): BoardScene {
  const style = createSketchStyle();
  let boardId = initialBoard;
  /** Points the builders at this scene's style and board for one build. */
  const using = <T>(make: () => T): T => {
    build.style = style;
    build.board = boardId;
    return make();
  };
  const renderer = new WebGLRenderer({ antialias: window.devicePixelRatio < 2, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.classList.add("board3d-canvas");
  host.prepend(renderer.domElement);

  const scene = new Scene();
  // Light from above and the front left, so the cartoon tones fall in clear bands.
  scene.add(new HemisphereLight(0xffffff, 0x6f7a8c, 1.25));
  const sun = new DirectionalLight(0xffffff, 2.1);
  sun.position.set(-60, 120, 90);
  scene.add(sun);

  const camera = new PerspectiveCamera(30, 1, 1, 4000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.screenSpacePanning = true;
  controls.maxPolarAngle = Math.PI * 0.47;

  const haloTexture = radialTexture("rgba(255,255,255,1)", "rgba(255,255,255,0)");
  const shadow = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: radialTexture("rgba(5,10,20,0.35)", "rgba(5,10,20,0)"), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = -1;
  scene.add(shadow);

  // The floor the board stands on, in the theme's colours.
  const floorMaterial = new MeshBasicMaterial({ transparent: true, depthWrite: false });
  const floor = new Mesh(new PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.2;
  floor.renderOrder = -2;
  scene.add(floor);
  function paintFloor(): void {
    const style = getComputedStyle(host);
    floorMaterial.map?.dispose();
    floorMaterial.map = floorTexture(style.getPropertyValue("--bg-3").trim() || "#ece3cd", style.getPropertyValue("--ink").trim() || "#14233f");
    floorMaterial.needsUpdate = true;
    requestRender();
  }
  const themeObserver = new MutationObserver(paintFloor);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-mode"] });

  let board = using(() => buildBoard(haloTexture, models));
  scene.add(board.group);

  let labels: Label[] = [];
  let labelsVisible = true;
  function addLabel(text: string, position: Vector3): Label | null {
    const textEl = document.createElement("span");
    textEl.className = "board3d-label-text";
    textEl.textContent = text;
    const element = document.createElement("span");
    element.className = "board3d-label";
    element.append(Object.assign(document.createElement("span"), { className: "board3d-label-dot" }), textEl);
    labelLayer.append(element);
    const label = { element, text: textEl, position };
    labels.push(label);
    return label;
  }

  let report: BoardReport | null = null;
  let parts: RunParts | null = null;
  let fitDistance = 200;
  const fitTarget = new Vector3();

  function disposeTree(root: Object3D): void {
    root.traverse((node) => {
      const mesh = node as Mesh;
      // Outlines and ink use the style's shared materials and cached geometry.
      if (mesh.userData.styled) return;
      if (!mesh.userData.shared) mesh.geometry?.dispose();
      const materials = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
      for (const material of materials as Material[]) {
        const map = (material as MeshBasicMaterial).map;
        if (map && map !== haloTexture) map.dispose();
        material.dispose();
      }
    });
  }

  function fit(): void {
    const bounds = new Box3().setFromObject(board.group);
    if (parts) bounds.expandByObject(parts.group);
    const size = bounds.getSize(new Vector3());
    bounds.getCenter(fitTarget);
    // Place the camera on the view line and move it until the box's corners
    // just fill the view. A few rounds settle the perspective.
    const corners: Vector3[] = [];
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) corners.push(new Vector3(x, y, z));
    const probe = camera.clone();
    let distance = size.length() * 1.5;
    for (let round = 0; round < 4; round++) {
      probe.position.copy(fitTarget).addScaledVector(VIEW_DIRECTION, distance);
      probe.lookAt(fitTarget);
      probe.updateMatrixWorld();
      let reach = 0;
      for (const corner of corners) {
        const point = corner.clone().project(probe);
        reach = Math.max(reach, Math.abs(point.x), Math.abs(point.y));
      }
      distance *= reach / FILL;
    }
    fitDistance = distance;
    shadow.position.set(fitTarget.x, -0.05, fitTarget.z);
    // Snap the floor to its own grid, so its lines stay put when parts come and go.
    floor.position.set(Math.round(fitTarget.x / 50) * 50, -0.2, Math.round(fitTarget.z / 50) * 50);
    shadow.scale.set(size.x * 1.5, size.z * 1.6, 1);
    controls.minDistance = fitDistance * 0.3;
    controls.maxDistance = fitDistance * 2.5;
  }

  function resetView(): void {
    fit();
    controls.target.copy(fitTarget);
    camera.position.copy(fitTarget).addScaledVector(VIEW_DIRECTION, fitDistance);
    controls.update();
    requestRender();
  }

  let frame = 0;
  function requestRender(): void {
    if (!frame) frame = requestAnimationFrame(renderNow);
  }
  const projected = new Vector3();
  function renderNow(): void {
    frame = 0;
    const moving = controls.update();
    renderer.render(scene, camera);
    const width = host.clientWidth;
    const height = host.clientHeight;
    for (const label of labels) {
      projected.copy(label.position).project(camera);
      const hidden = !labelsVisible || projected.z > 1 || Math.abs(projected.x) > 1.05 || Math.abs(projected.y) > 1.05;
      label.element.hidden = hidden;
      if (!hidden) label.element.style.transform = `translate(${((projected.x + 1) / 2) * width}px, ${((1 - projected.y) / 2) * height}px)`;
    }
    if (moving) requestRender();
  }
  controls.addEventListener("change", requestRender);

  // ───── Pressing and dragging parts (live runs) ─────
  let handlers: PartHandlers | null = null;
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let held: { target: Target; x: number; y: number } | null = null;

  function targetAt(event: PointerEvent): Target | null {
    if (!parts || parts.targets.length === 0) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObjects(parts.targets.map((target) => target.object), true)) {
      let node: Object3D | null = hit.object;
      while (node) {
        const found = parts.targets.find((target) => target.object === node);
        if (found && (handlers || found.kind === "led" || found.kind === "resistor")) return found;
        node = node.parent;
      }
    }
    return null;
  }

  function release(): void {
    if (!held) return;
    if (held.target.kind === "button" || held.target.kind === "touch") handlers?.press(held.target.pin, false, held.target.kind);
    held = null;
    controls.enabled = true;
  }

  /** A click on an LED tries the next colour; a click on its resistor tries the next value. */
  function changeLed(pin: number, what: "led" | "resistor"): void {
    const led = parts?.leds.find((item) => item.pin === pin);
    if (!led) return;
    if (what === "led") {
      led.colour = LED_COLOUR_ORDER[(LED_COLOUR_ORDER.indexOf(led.colour) + 1) % LED_COLOUR_ORDER.length]!;
      (led.body.material as MeshToonMaterial).color.setHex(LED_BODY[led.colour]);
      led.glow.material.emissive.setHex(LED_GLOW[led.colour]);
      (led.glow.halo.material as SpriteMaterial).color.setHex(LED_GLOW[led.colour]);
    } else {
      led.ohms = RESISTOR_VALUES[(RESISTOR_VALUES.indexOf(led.ohms) + 1) % RESISTOR_VALUES.length]!;
    }
    if (led.label) {
      led.label.text.dataset.base = `${led.base}${led.colour} LED · ${pinWord(pin)}${led.ohms === 220 ? "" : ` · ${led.ohms >= 1000 ? `${led.ohms / 1000} kΩ` : `${led.ohms} Ω`}`}`;
      led.label.text.textContent = led.label.text.dataset.base;
    }
    setTime(lastTime);
  }

  // Capture: runs before the orbit controls, so grabbing a part does not turn the view.
  renderer.domElement.addEventListener(
    "pointerdown",
    (event) => {
      const target = targetAt(event);
      if (!target) return;
      if (target.kind === "led" || target.kind === "resistor") {
        changeLed(target.pin, target.kind);
        event.stopPropagation();
        return;
      }
      controls.enabled = false;
      held = { target, x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
      if (target.kind === "button" || target.kind === "touch") handlers?.press(target.pin, true, target.kind);
    },
    { capture: true },
  );
  renderer.domElement.addEventListener("pointermove", (event) => {
    if (held && (held.target.kind === "knob" || held.target.kind === "ldr" || held.target.kind === "distance")) {
      // Right or up turns it up.
      const delta = (event.clientX - held.x - (event.clientY - held.y)) / 240;
      held.x = event.clientX;
      held.y = event.clientY;
      if (delta) handlers?.turn(held.target.pin, delta);
      return;
    }
    if (!held) renderer.domElement.style.cursor = targetAt(event) ? "pointer" : "";
  });
  renderer.domElement.addEventListener("pointerup", release);
  renderer.domElement.addEventListener("pointercancel", release);

  let sized = false;
  const resizeObserver = new ResizeObserver(() => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    style.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (!sized) {
      sized = true;
      resetView();
    }
    else {
      fit();
      requestRender();
    }
  });
  resizeObserver.observe(host);

  /** The board's own labels when exploring; during a run only the parts that matter. */
  function rebuildLabels(plan: PartPlan | null = null, usesBuiltIn = false): void {
    for (const label of labels) label.element.remove();
    labels = [];
    for (const [text, position] of boardLabels(boardId)) {
      if (plan && !(usesBuiltIn && text.startsWith("Built-in"))) continue;
      addLabel(text, position);
    }
  }
  rebuildLabels();

  /** A label's own text, with something about the moment after it. */
  function relabel(label: Label | null, extra: string): void {
    if (!label) return;
    const base = (label.text.dataset.base ??= label.text.textContent ?? "");
    label.text.textContent = extra ? `${base} · ${extra}` : base;
  }

  let lastTime = 0;
  function setTime(t: number): void {
    lastTime = t;
    build.board = boardId;
    // Before any run, a lesson's circuit is shown as it stands: nothing on, nothing pressed.
    const run: Pick<BoardReport, "events" | "inputs"> = report ?? { events: [], inputs: [] };
    const outputs = outputsAt(run, t);
    setGlow(board.builtIn, brightness(outputs.get(profileOf(boardId).builtInLed)));
    if (parts) {
      for (const led of parts.leds) setGlow(led.glow, Math.min(1, brightness(outputs.get(led.pin)) * ledCurrentRatio(led.colour, led.ohms, boardId)));
      for (const { pins, glow } of parts.rgbLeds) {
        const [r, g, b] = pins.map((pin) => brightness(outputs.get(pin)));
        const strongest = Math.max(r!, g!, b!);
        const mix = new Color(r!, g!, b!);
        glow.material.emissive.copy(mix);
        (glow.halo.material as SpriteMaterial).color.copy(mix);
        setGlow(glow, strongest);
      }
      for (const { pin, horn } of parts.servos) horn.rotation.y = (((outputs.get(pin)?.angle ?? 90) - 90) * Math.PI) / 180;
      for (const { pin, ring, label } of parts.buzzers) {
        const hz = outputs.get(pin)?.tone ?? 0;
        const material = ring.material as MeshBasicMaterial;
        const pulse = (t % 400) / 400;
        material.opacity = hz ? 0.9 * (1 - pulse) : 0;
        ring.scale.setScalar(hz ? 1 + pulse * 0.8 : 1);
        relabel(label, hz ? `${hz} Hz` : "");
      }
      const full = 2 ** profileOf(boardId).adcBits - 1;
      for (const { pin, shaft, label } of parts.knobs) {
        const value = inputAt(run, pin, t);
        shaft.rotation.y = ((135 - ((value ?? 0) / full) * 270) * Math.PI) / 180;
        relabel(label, value === undefined ? "" : String(value));
      }
      for (const { pin, label } of parts.ldrs) {
        const value = inputAt(run, pin, t);
        relabel(label, value === undefined ? "" : String(value));
      }
      for (const { pin, cap, baseY, pullUp } of parts.buttons) {
        const value = inputAt(run, pin, t);
        const pressed = value !== undefined && (pullUp ? value === 0 : value !== 0);
        cap.position.y = pressed ? baseY - 1.4 : baseY;
      }
      for (const { pin, label, kind } of parts.sensors) {
        const value = inputAt(run, pin, t);
        if (value === undefined) relabel(label, "");
        else if (kind === "temp") relabel(label, `${tmp36Celsius(value, boardId).toFixed(1)} °C`);
        else relabel(label, String(value));
      }
      for (const { echo, wall, baseZ, label } of parts.ultrasonics) {
        const distance = inputAt(run, echo, t);
        // 1 cm of distance is drawn as 0.5 mm, between 2 and 200 cm.
        wall.position.z = baseZ + Math.max(2, Math.min(200, distance ?? 60)) * 0.5;
        relabel(label, distance === undefined ? "" : `${distance} cm`);
      }
      for (const { pin, blades } of parts.motors) blades.rotation.y = -motorTurnsAt(run, pin, t) * Math.PI * 2;
      for (const { pins, wheel, leds } of parts.steppers) {
        wheel.rotation.y = -stepperTurnsAt(run, pins, t) * Math.PI * 2;
        pins.forEach((pin, index) => setGlow(leds[index]!, brightness(outputs.get(pin))));
      }
      for (const oled of parts.oleds) {
        const shown = screenAt(run, t);
        if (shown !== oled.shown) {
          oled.shown = shown;
          drawScreen(oled.texture, shown);
        }
      }
      for (const { pin, finger, pad, label } of parts.touchPads) {
        const { reading, touched } = touchAt(run, pin, t);
        finger.position.y = touched ? FINGER_DOWN : FINGER_UP;
        (pad.material as MeshToonMaterial).color.setHex(touched ? 0xffe08a : MATERIAL_COLOURS.gold!);
        relabel(label, String(reading));
      }
    }
    requestRender();
  }

  paintFloor();
  setTime(0);

  return {
    setRun(next, plan, boardOverride) {
      report = next;
      if (parts) {
        scene.remove(parts.group);
        disposeTree(parts.group);
        parts = null;
      }
      // A run on another board swaps the board itself.
      const wanted = next?.board ?? boardOverride ?? boardId;
      if (wanted !== boardId) {
        boardId = wanted;
        scene.remove(board.group);
        disposeTree(board.group);
        board = using(() => buildBoard(haloTexture, models));
        scene.add(board.group);
      }
      const builtIn = profileOf(boardId).builtInLed;
      rebuildLabels(plan, next?.events.some((event) => event.pin === builtIn) ?? false);
      if (plan) {
        parts = using(() => buildParts(plan, haloTexture, addLabel, models));
        scene.add(parts.group);
      }
      resetView();
      setTime(0);
    },
    setTime,
    setLabels(visible) {
      labelsVisible = visible;
      requestRender();
    },
    rotate(degrees) {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(new Vector3(0, 1, 0), (degrees * Math.PI) / 180);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      requestRender();
    },
    zoom(factor) {
      const offset = camera.position.clone().sub(controls.target);
      const length = Math.min(controls.maxDistance, Math.max(controls.minDistance, offset.length() * factor));
      camera.position.copy(controls.target).add(offset.setLength(length));
      controls.update();
      requestRender();
    },
    resetView,
    setInteraction(next) {
      handlers = next;
      if (!next) release();
    },
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      controls.dispose();
      disposeTree(scene);
      haloTexture.dispose();
      style.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      for (const label of labels) label.element.remove();
      labels = [];
    },
  };
}
