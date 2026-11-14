// The sketchbook look: flat cartoon shading in three tones, thick ink lines
// along every edge (wobbling a little, as if drawn by hand), and an ink
// outline around each silhouette. Line widths are in screen pixels, so the
// drawing keeps the same weight at any zoom.

import {
  BackSide,
  BufferGeometry,
  DataTexture,
  EdgesGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  Vector2,
} from "three";
import type { MeshToonMaterialParameters } from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

/** Pencil-dark ink with a hint of blue. */
export const INK = 0x1d2433;
/** How far a drawn line may wander from the true edge, in mm. */
const WOBBLE = 0.14;
const INK_WIDTH = 1.7;
const OUTLINE_WIDTH = 2.4;

/** Three flat tones: shadow, mid and lit, like a cartoon coloured with markers. */
const toneRamp = (() => {
  const texture = new DataTexture(new Uint8Array([105, 185, 255]), 3, 1, RedFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
})();

export function toon(color: number, extra: MeshToonMaterialParameters = {}): MeshToonMaterial {
  return new MeshToonMaterial({ color, gradientMap: toneRamp, ...extra });
}

/** A repeatable "random" number from a position, so a part looks the same every time it is drawn. */
function wobble(x: number, y: number, z: number, axis: number): number {
  const value = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + axis * 19.19) * 43758.5453;
  return (value - Math.floor(value) - 0.5) * 2 * WOBBLE;
}

const inkCache = new WeakMap<BufferGeometry, LineSegmentsGeometry>();

/** The edges of a shape as hand-drawn line segments (cached per shape). */
function inkGeometry(geometry: BufferGeometry): LineSegmentsGeometry {
  const cached = inkCache.get(geometry);
  if (cached) return cached;
  const edges = new EdgesGeometry(geometry, 35);
  const source = edges.getAttribute("position").array;
  const positions = new Float32Array(source.length);
  for (let i = 0; i < source.length; i += 3) {
    const x = source[i]!;
    const y = source[i + 1]!;
    const z = source[i + 2]!;
    positions[i] = x + wobble(x, y, z, 0);
    positions[i + 1] = y + wobble(x, y, z, 1);
    positions[i + 2] = z + wobble(x, y, z, 2);
  }
  edges.dispose();
  const lines = new LineSegmentsGeometry();
  lines.setPositions(positions);
  inkCache.set(geometry, lines);
  return lines;
}

export interface SketchStyle {
  ink: LineMaterial;
  /** Adds the silhouette outline and, unless `edges` is false, the inked edges to a mesh. */
  outline(mesh: Mesh, edges?: boolean): void;
  /** The drawing size in CSS pixels, so lines keep their width. */
  setSize(width: number, height: number): void;
  dispose(): void;
}

export function createSketchStyle(): SketchStyle {
  const ink = new LineMaterial({ color: INK, linewidth: INK_WIDTH, worldUnits: false });
  // The outline: the back of each shape, pushed outwards on screen by a few
  // pixels and filled with ink, so it shows only around the silhouette.
  const outlineUniforms = { cpeResolution: { value: new Vector2(1, 1) }, cpeWidth: { value: OUTLINE_WIDTH } };
  const outline = new MeshBasicMaterial({ color: INK, side: BackSide });
  outline.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, outlineUniforms);
    shader.vertexShader =
      "uniform vec2 cpeResolution;\nuniform float cpeWidth;\n" +
      shader.vertexShader.replace(
        "#include <project_vertex>",
        [
          "#include <project_vertex>",
          "vec3 cpeNormal = normalize(normalMatrix * normal);",
          "vec2 cpeDir = (projectionMatrix * vec4(cpeNormal, 0.0)).xy;",
          "if (dot(cpeDir, cpeDir) > 1e-8) gl_Position.xy += normalize(cpeDir) * cpeWidth * 2.0 / cpeResolution * gl_Position.w;",
        ].join("\n"),
      );
  };
  outline.customProgramCacheKey = () => "cpe-sketch-outline";

  return {
    ink,
    outline(mesh, edges = true) {
      const shell = new Mesh(mesh.geometry, outline);
      shell.userData.shared = true;
      shell.userData.styled = true;
      mesh.add(shell);
      if (edges) {
        const lines = new LineSegments2(inkGeometry(mesh.geometry), ink);
        lines.userData.shared = true;
        lines.userData.styled = true;
        mesh.add(lines);
      }
    },
    setSize(width, height) {
      ink.resolution.set(width, height);
      outlineUniforms.cpeResolution.value.set(width, height);
    },
    dispose() {
      ink.dispose();
      outline.dispose();
    },
  };
}
