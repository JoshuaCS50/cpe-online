// Packs the meshes written by scripts/fusion/cpe-parts.py into the small
// binary the 3D board loads: public/models/cpe-parts.bin plus a manifest,
// public/models/cpe-parts.json.
//
//   node scripts/pack-models.mjs [path to cpe-parts-raw.json]
//
// Fusion is Z-up; the viewer is Y-up, so (x, y, z) becomes (x, z, y). That
// swap mirrors the shapes, so each triangle's winding is reversed to keep its
// front face outward. Bodies of one part with the same material are merged.
// Positions are stored as 16-bit integers in hundredths of a millimetre,
// normals as 8-bit integers, indices as 16 or 32 bits.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2] ?? join(homedir(), "cpe-parts-raw.json");
const outDir = join(root, "public", "models");
const POSITION_SCALE = 100;

const raw = JSON.parse(readFileSync(input, "utf8"));
const chunks = [];
let offset = 0;
function append(typed) {
  const bytes = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength);
  const start = offset;
  chunks.push(bytes);
  offset += bytes.byteLength;
  const pad = (4 - (offset % 4)) % 4;
  if (pad) {
    chunks.push(new Uint8Array(pad));
    offset += pad;
  }
  return start;
}

const manifest = { version: 1, positionScale: 1 / POSITION_SCALE, parts: {} };
for (const [part, bodies] of Object.entries(raw.parts)) {
  const byMaterial = new Map();
  for (const body of bodies) {
    const list = byMaterial.get(body.material) ?? [];
    list.push(body);
    byMaterial.set(body.material, list);
  }
  manifest.parts[part] = [];
  for (const [material, list] of byMaterial) {
    const positions = [];
    const normals = [];
    const indices = [];
    for (const body of list) {
      const base = positions.length / 3;
      for (let i = 0; i < body.positions.length; i += 3) {
        positions.push(body.positions[i], body.positions[i + 2], body.positions[i + 1]);
        normals.push(body.normals[i], body.normals[i + 2], body.normals[i + 1]);
      }
      for (let i = 0; i < body.indices.length; i += 3) {
        indices.push(base + body.indices[i], base + body.indices[i + 2], base + body.indices[i + 1]);
      }
    }
    const quantised = Int16Array.from(positions, (value) => {
      const scaled = Math.round(value * POSITION_SCALE);
      if (scaled < -32768 || scaled > 32767) throw new Error(`${part}/${material}: ${value} mm is out of range`);
      return scaled;
    });
    const packedNormals = Int8Array.from(normals, (value) => Math.max(-127, Math.min(127, Math.round(value * 127))));
    const vertexCount = positions.length / 3;
    const wide = vertexCount > 65535;
    manifest.parts[part].push({
      material,
      vertexCount,
      indexCount: indices.length,
      positions: append(quantised),
      normals: append(packedNormals),
      indices: append(wide ? Uint32Array.from(indices) : Uint16Array.from(indices)),
      indexBits: wide ? 32 : 16,
    });
  }
}

mkdirSync(outDir, { recursive: true });
const binary = new Uint8Array(offset);
let at = 0;
for (const chunk of chunks) {
  binary.set(chunk, at);
  at += chunk.byteLength;
}
manifest.byteLength = offset;
writeFileSync(join(outDir, "cpe-parts.bin"), binary);
writeFileSync(join(outDir, "cpe-parts.json"), JSON.stringify(manifest, null, 1) + "\n");
console.log(`packed ${Object.keys(manifest.parts).length} parts, ${offset} bytes`);
