/// <reference types="vitest/config" />
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

// Cross-origin isolation headers. Production gets the same pair from
// public/_headers (Cloudflare Pages). Serving them in dev and preview too
// means anything they would block shows up locally, not after deploy.
const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

/**
 * Fills in the service worker after a build: the list of files that make up
 * the app shell, and a version derived from them. public/sw.js carries the
 * placeholders; see the comment at its top.
 */
function swManifest(): Plugin {
  return {
    name: "cpe-sw-manifest",
    apply: "build",
    closeBundle() {
      const dist = "dist";
      const assets = readdirSync(join(dist, "assets"))
        // Source maps are for debugging; fonts for scripts the UI does not use stay on the network.
        .filter((file) => !file.endsWith(".map") && !(file.endsWith(".woff2") && !file.includes("-latin-wght-")))
        .sort()
        .map((file) => `assets/${file}`);
      const precache = ["./", "index.html", "manifest.webmanifest", ...assets];

      const hash = createHash("sha256");
      hash.update(precache.join("\n"));
      hash.update(readFileSync(join(dist, "index.html")));
      const version = hash.digest("hex").slice(0, 12);

      const target = join(dist, "sw.js");
      // Replace the assignments, not the words: the file's comments mention
      // both placeholders by name.
      const filled = readFileSync(target, "utf8")
        .replace('const VERSION = "__VERSION__";', `const VERSION = ${JSON.stringify(version)};`)
        .replace("const PRECACHE = __PRECACHE__;", `const PRECACHE = ${JSON.stringify(precache)};`);
      if (/= "?__(VERSION|PRECACHE)__"?;/.test(filled)) {
        throw new Error("public/sw.js placeholders were not filled in; the service worker would not start.");
      }
      writeFileSync(target, filled);
      console.log(`service worker: version ${version}, ${precache.length} files precached`);
    },
  };
}

export default defineConfig({
  // Relative base keeps the build portable: domain root (Cloudflare Pages)
  // or any subpath. Override with VITE_BASE when an absolute base is needed.
  base: process.env.VITE_BASE ?? "./",
  plugins: [swManifest()],
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },
  build: {
    target: "es2022",
    sourcemap: true,
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
