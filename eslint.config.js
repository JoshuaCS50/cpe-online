import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "public", "src/legacy", "spikes", "scripts", "vendor-src"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
