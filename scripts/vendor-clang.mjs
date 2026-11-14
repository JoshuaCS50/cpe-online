#!/usr/bin/env node
// Copies the C++ compiler (Clang/LLD built for WebAssembly, npm package
// @yowasp/clang) from node_modules into public/vendor/clang, so the C++ worker
// can load it on the first C++ run, not in the main bundle.
//
// Files larger than one part are cut into 8 MiB pieces: static hosts cap the
// size of a single file (Cloudflare Pages: 25 MiB), and the compiler alone is
// about 75 MB. The worker fetches the pieces and joins them before the
// compiler asks for the file (see src/runners/cpp/cpp-worker.ts).
//
// The output is generated, not committed. It runs before `dev` and `build`.
//
// Usage: node scripts/vendor-clang.mjs

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = "node_modules/@yowasp/clang";
const TARGET = "public/vendor/clang";
const PART_BYTES = 8 * 1024 * 1024;
/** Bump when this script's output changes, so existing copies are rebuilt. */
const LAYOUT = 1;

if (!existsSync(join(SOURCE, "package.json"))) {
  console.error("@yowasp/clang is not installed. Run `npm install` first.");
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(join(SOURCE, "package.json"), "utf8"));
const manifestFile = join(TARGET, "clang.json");
// Everything except the manifest sits in a folder named after the version, so
// its URLs change with each release and can be cached for good.
const versionDir = join(TARGET, version);

if (existsSync(manifestFile)) {
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  const files = [...manifest.whole, ...Object.values(manifest.split).flatMap((entry) => entry.parts.map((part) => part.file))];
  const complete = files.every((file) => existsSync(join(versionDir, file)));
  if (manifest.version === version && manifest.layout === LAYOUT && complete) {
    console.log(`Clang ${version} already in ${TARGET}.`);
    process.exit(0);
  }
}

rmSync(TARGET, { recursive: true, force: true });
mkdirSync(versionDir, { recursive: true });

const whole = [];
const split = {};
let totalBytes = 0;
for (const name of readdirSync(join(SOURCE, "gen"))) {
  const source = join(SOURCE, "gen", name);
  const data = readFileSync(source);
  totalBytes += data.length;
  if (data.length <= PART_BYTES) {
    cpSync(source, join(versionDir, name));
    whole.push(name);
    continue;
  }
  const parts = [];
  for (let offset = 0, index = 0; offset < data.length; offset += PART_BYTES, index++) {
    const chunk = data.subarray(offset, offset + PART_BYTES);
    const file = `${name}.part${String(index).padStart(2, "0")}`;
    writeFileSync(join(versionDir, file), chunk);
    parts.push({ file, bytes: chunk.length });
  }
  split[name] = { bytes: data.length, parts };
}

writeFileSync(manifestFile, JSON.stringify({ version, layout: LAYOUT, dir: `${version}/`, totalBytes, whole, split }, null, 2) + "\n");
const pieces = Object.values(split).reduce((sum, entry) => sum + entry.parts.length, 0);
console.log(`Clang ${version}: ${whole.length} files and ${pieces} parts, ${(totalBytes / 1e6).toFixed(1)} MB, copied to ${TARGET}.`);
