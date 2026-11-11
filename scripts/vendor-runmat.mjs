#!/usr/bin/env node
// Copies the MATLAB runtime (RunMat) from node_modules into
// public/vendor/runmat so the app can load it at run time, the way it loads
// Pyodide: on first use, not in the main bundle.
//
// Two things are done on the way:
//   - Only the files the runtime needs are copied. The language server
//     (55 MB), tests, type definitions and source maps are left out.
//   - The 69 MB WebAssembly file is cut into parts. Static hosts cap the size
//     of a single file (Cloudflare Pages: 25 MiB); the app fetches the parts
//     in order and joins them, which also lets it show download progress.
//
// The output is generated, not committed. It runs before `dev` and `build`.
//
// Usage: node scripts/vendor-runmat.mjs

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = "node_modules/runmat";
const TARGET = "public/vendor/runmat";
const WASM = "dist/pkg-web/runmat_wasm_web_bg.wasm";
const PART_BYTES = 8 * 1024 * 1024;

/** Top-level entries of dist/ that the runtime never loads in this app. */
const SKIP = new Set(["lsp", "test", "testing", "generated", "builtins.js"]);
/** The one small file under a skipped folder that the entry module does import. */
const EXTRA = ["generated/fea-study-document-contracts.js"];
/** Bump when this script's output changes, so existing copies are rebuilt. */
const LAYOUT = 2;

if (!existsSync(join(SOURCE, "package.json"))) {
  console.error("runmat is not installed. Run `npm install` first.");
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(join(SOURCE, "package.json"), "utf8"));
const stampFile = join(TARGET, "runtime.json");

// Nothing to do when the copy already matches the installed version.
if (existsSync(stampFile)) {
  const stamp = JSON.parse(readFileSync(stampFile, "utf8"));
  const complete = stamp.parts?.every((part) => existsSync(join(TARGET, part.file)));
  if (stamp.version === version && stamp.layout === LAYOUT && complete) {
    console.log(`RunMat ${version} already in ${TARGET}.`);
    process.exit(0);
  }
}

rmSync(TARGET, { recursive: true, force: true });
mkdirSync(TARGET, { recursive: true });

function copyScripts(from, to) {
  for (const entry of readdirSync(from)) {
    const source = join(from, entry);
    if (statSync(source).isDirectory()) {
      copyScripts(source, join(to, entry));
    } else if (entry.endsWith(".js")) {
      mkdirSync(to, { recursive: true });
      cpSync(source, join(to, entry));
    }
  }
}

for (const entry of readdirSync(join(SOURCE, "dist"))) {
  if (SKIP.has(entry)) continue;
  const source = join(SOURCE, "dist", entry);
  if (statSync(source).isDirectory()) copyScripts(source, join(TARGET, entry));
  else if (entry.endsWith(".js")) cpSync(source, join(TARGET, entry));
}

for (const file of EXTRA) {
  mkdirSync(join(TARGET, file, ".."), { recursive: true });
  cpSync(join(SOURCE, "dist", file), join(TARGET, file));
}

const wasm = readFileSync(join(SOURCE, WASM));
const parts = [];
for (let offset = 0, index = 0; offset < wasm.length; offset += PART_BYTES, index++) {
  const chunk = wasm.subarray(offset, offset + PART_BYTES);
  const file = `runtime.part${String(index).padStart(2, "0")}`;
  writeFileSync(join(TARGET, file), chunk);
  parts.push({ file, bytes: chunk.length });
}

writeFileSync(stampFile, JSON.stringify({ version, layout: LAYOUT, totalBytes: wasm.length, parts }, null, 2) + "\n");
console.log(`RunMat ${version}: ${parts.length} parts, ${(wasm.length / 1e6).toFixed(1)} MB, copied to ${TARGET}.`);
