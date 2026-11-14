// The boards and parts modelled in Autodesk Fusion (scripts/fusion/cpe-parts.py),
// packed by scripts/pack-models.mjs into public/models/cpe-parts.{json,bin}.
// Each part becomes a Group of meshes, one per material, drawn in the
// sketchbook style (style.ts). Geometry is shared between copies; materials
// are not, so one LED can glow while another is off.

import { BufferAttribute, BufferGeometry, Group, Mesh } from "three";
import { toon } from "./style";
import type { SketchStyle } from "./style";

export type PartName =
  | "uno"
  | "esp32"
  | "breadboard"
  | "breadboard-full"
  | "ldr"
  | "rgb-led"
  | "tmp36"
  | "tip120"
  | "motor"
  | "fan"
  | "stepper"
  | "wheel"
  | "uln2003"
  | "hc-sr04"
  | "oled"
  | "fsr"
  | "soil-sensor"
  | "led"
  | "resistor"
  | "servo"
  | "servo-horn"
  | "buzzer"
  | "knob"
  | "knob-cap"
  | "button"
  | "button-cap";

interface PackedMesh {
  material: string;
  vertexCount: number;
  indexCount: number;
  positions: number;
  normals: number;
  indices: number;
  indexBits: 16 | 32;
}

interface Manifest {
  version: number;
  positionScale: number;
  byteLength: number;
  parts: Record<string, PackedMesh[]>;
}

/**
 * Colours by material name: a cartoon palette, bright and a little softened,
 * with dark parts kept light enough for the ink lines to show on them.
 */
export const MATERIAL_COLOURS: Record<string, number> = {
  pcb: 0x2f76d2,
  "pcb-black": 0x353d4c,
  "module-pcb": 0x24324a,
  "plastic-black": 0x3a3e48,
  metal: 0xd9dde3,
  gold: 0xf0c552,
  chip: 0x2c2f37,
  capacitor: 0x454a56,
  red: 0xf0533f,
  "button-red": 0xf0533f,
  "led-l": 0xe6a63a,
  "led-tx": 0xd8b55a,
  "led-rx": 0xd8b55a,
  "led-on": 0x49b86a,
  "smd-dark": 0x3a3e48,
  "smd-tan": 0xe2bf86,
  breadboard: 0xfaf6ea,
  led: 0xe0483a,
  resistor: 0xf0d9a8,
  "band-brown": 0x8a5628,
  "band-black": 0x25262b,
  "band-red": 0xe0483a,
  "band-gold": 0xe8b93a,
  servo: 0x4a8cf0,
  white: 0xfdfdfd,
  pot: 0x3f72d6,
  ldr: 0xe8873a,
  "led-milky": 0xf4f2ec,
  "motor-cap": 0x8a5a3a,
  fan: 0x3fa0e0,
  "stepper-cap": 0x3f72d6,
  "pcb-green": 0x2e8b57,
  "led-red": 0xc0392b,
  mesh: 0x2a2d35,
  screen: 0x0b0d12,
  fsr: 0x3a2f2a,
  "fsr-ring": 0xc9a46a,
  "plastic-white": 0xf4f4f0,
};

/** Tiny bodies get only the silhouette outline: inked edges would turn them into black specks. */
const NO_EDGES = new Set(["smd-dark", "smd-tan", "led-l", "led-tx", "led-rx", "led-on", "band-brown", "band-black", "band-red", "band-gold", "gold"]);

export interface PartModels {
  /** A new copy of a part in the given style, its meshes named by material. */
  make(part: PartName, style: SketchStyle): Group;
}

interface Template {
  material: string;
  geometry: BufferGeometry;
}

let loading: Promise<PartModels> | null = null;

/** Loads the packed parts once per page; later calls share the result. */
export function loadPartModels(): Promise<PartModels> {
  loading ??= fetchModels().catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

async function fetchModels(): Promise<PartModels> {
  const base = new URL("models/", document.baseURI);
  const manifestResponse = await fetch(new URL("cpe-parts.json", base));
  if (!manifestResponse.ok) throw new Error(`models: ${manifestResponse.status}`);
  const manifest = (await manifestResponse.json()) as Manifest;
  const binaryResponse = await fetch(new URL("cpe-parts.bin", base));
  if (!binaryResponse.ok) throw new Error(`models: ${binaryResponse.status}`);
  const buffer = await binaryResponse.arrayBuffer();
  if (buffer.byteLength !== manifest.byteLength) throw new Error("models: the model file is incomplete");

  const templates = new Map<string, Template[]>();
  for (const [part, meshes] of Object.entries(manifest.parts)) {
    templates.set(
      part,
      meshes.map((packed) => {
        const geometry = new BufferGeometry();
        // Positions are whole hundredths of a millimetre; turn them back into mm.
        const stored = new Int16Array(buffer, packed.positions, packed.vertexCount * 3);
        const positions = Float32Array.from(stored, (value) => value * manifest.positionScale);
        geometry.setAttribute("position", new BufferAttribute(positions, 3));
        geometry.setAttribute("normal", new BufferAttribute(new Int8Array(buffer, packed.normals, packed.vertexCount * 3), 3, true));
        const indices =
          packed.indexBits === 32 ? new Uint32Array(buffer, packed.indices, packed.indexCount) : new Uint16Array(buffer, packed.indices, packed.indexCount);
        geometry.setIndex(new BufferAttribute(indices, 1));
        geometry.computeBoundingSphere();
        return { material: packed.material, geometry };
      }),
    );
  }

  return {
    make(part, style) {
      const group = new Group();
      group.name = part;
      for (const template of templates.get(part) ?? []) {
        const mesh = new Mesh(template.geometry, toon(MATERIAL_COLOURS[template.material] ?? 0x888888));
        mesh.name = template.material;
        // The scene disposes what it owns; shared geometry must outlive one copy.
        mesh.userData.shared = true;
        style.outline(mesh, !NO_EDGES.has(template.material));
        group.add(mesh);
      }
      return group;
    },
  };
}
