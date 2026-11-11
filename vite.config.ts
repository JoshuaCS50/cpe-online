/// <reference types="vitest/config" />
import { defineConfig } from "vite";

// Cross-origin isolation headers. Production gets the same pair from
// public/_headers (Cloudflare Pages). Serving them in dev and preview too
// means anything they would block shows up locally, not after deploy.
const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  // Relative base keeps the build portable: domain root (Cloudflare Pages)
  // or any subpath. Override with VITE_BASE when an absolute base is needed.
  base: process.env.VITE_BASE ?? "./",
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
