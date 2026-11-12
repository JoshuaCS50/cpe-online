// Spike: what does the MATLAB runtime say for common beginner mistakes?
// Run: node spikes/matlab-messages.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createInMemoryFsProvider, initRunMat } from "runmat";

const require = createRequire(import.meta.url);
const wasm = readFileSync(require.resolve("runmat/pkg-web/runmat_wasm_web_bg.wasm"));

const CASES = {
  "index past end in loop": "v = [10 20 30];\nfor k = 1:4\n    disp(v(k));\nend\n",
  "index zero": "v = [10 20 30];\ndisp(v(0));\n",
  "index literal past end": "v = [1 2 3];\ndisp(v(7));\n",
  "undefined variable": "x = 5;\ny = x + z;\n",
  "undefined function": "y = sqroot(9);\n",
  "missing end": "x = 5;\nif x > 2\n    disp('big')\n",
  "matrix size mismatch multiply": "x = [1 2 3] * [4 5 6];\n",
  "matrix size mismatch add": "x = [1 2 3] + [1 2];\n",
  "unclosed paren": "disp((1 + 2);\n",
  "unclosed string": "disp('hello);\n",
  "unclosed bracket": "v = [1 2 3;\ndisp(v);\n",
  "double equals assign": "x == 5;\n",
  "assign in if": "x = 3;\nif x = 3\n    disp(x);\nend\n",
  "c style index": "v = [1 2 3];\ndisp(v[1]);\n",
  "c style comment": "x = 5; // set x\n",
  "c style not equal": "x = 5;\nif x != 3\n    disp(x);\nend\n",
  "too many args": "y = numel([1 2], 3, 4, 5);\n",
  "string plus number": "s = ['abc' + 1];\ndisp(s);\n",
  "divide by zero": "x = 1 / 0;\ndisp(x);\n",
  "wrong fprintf": "fprintf('%d\\n');\n",
  "stray end": "x = 1;\nend\n",
  "else without if": "x = 1;\nelse\n    disp(x);\nend\n",
};

for (const [name, text] of Object.entries(CASES)) {
  const session = await initRunMat({
    wasmModule: wasm,
    language: { compat: "matlab" },
    telemetryConsent: false,
    enableGpu: false,
    fsProvider: createInMemoryFsProvider(),
  });
  try {
    const result = await session.executeRequest({ source: { kind: "text", name: "main.m", text } });
    const e = result.error;
    console.log(`${name}: ${e ? `[${e.kind}] ${e.identifier} | ${e.message} | line ${e.span?.line}:${e.span?.column}` : "(no error) " + JSON.stringify(result.stdout.map((s) => s.text).join("")).slice(0, 60)}`);
  } catch (error) {
    console.log(`${name}: THREW [${error.kind}] ${error.identifier} | ${error.message} | line ${error.span?.line}:${error.span?.column}`);
  } finally {
    session.dispose();
  }
}
