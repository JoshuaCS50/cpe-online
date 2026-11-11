// Runs MATLAB programs through the real RunMat runtime, in Node. This is the
// safety net for runtime upgrades: the starter examples must keep working and
// errors must keep pointing at the right line.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createInMemoryFsProvider, initRunMat } from "runmat";
import type { RunMatSessionHandle } from "runmat";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { MATLAB_EXAMPLES } from "../../src/content/examples-matlab";

let wasm: Buffer;
let session: RunMatSessionHandle | null = null;

beforeAll(() => {
  // Node cannot fetch the runtime by URL, so it is handed over as bytes.
  const require = createRequire(import.meta.url);
  wasm = readFileSync(require.resolve("runmat/pkg-web/runmat_wasm_web_bg.wasm"));
});

afterEach(() => {
  session?.dispose();
  session = null;
});

/** Runs `code` in a fresh session, answering each input() with the next entry of `inputs`. */
async function run(code: string, inputs: string[] = []) {
  session = await initRunMat({
    wasmModule: wasm,
    language: { compat: "matlab" },
    telemetryConsent: false,
    enableGpu: false,
    fsProvider: createInMemoryFsProvider(),
  });
  const prompts: string[] = [];
  const answers = [...inputs];
  await session.setInputHandler((request) => {
    prompts.push(request.prompt);
    return answers.shift() ?? "";
  });
  const result = await session.executeRequest({ source: { kind: "text", name: "test.m", text: code } });
  return {
    stdout: result.stdout.map((entry) => entry.text).join(""),
    error: result.error ?? null,
    variables: result.workspace.values.map((value) => value.name).sort(),
    prompts,
    telemetry: session.telemetryConsent(),
  };
}

const example = (id: string): string => {
  const found = MATLAB_EXAMPLES.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no example ${id}`);
  return found.code;
};

describe("MATLAB runtime", () => {
  it("runs with telemetry switched off", async () => {
    expect((await run("x = 1;")).telemetry).toBe(false);
  }, 60_000);

  it("runs every starter example without an error", async () => {
    const inputs: Record<string, string[]> = { "matlab-input": ["20"], "matlab-if": ["-4"] };
    for (const item of MATLAB_EXAMPLES) {
      const result = await run(item.code, inputs[item.id] ?? []);
      expect(result.error, item.id).toBeNull();
      session?.dispose();
      session = null;
    }
  }, 60_000);

  it("prints what the examples promise", async () => {
    expect((await run(example("matlab-hello"))).stdout).toBe("Hello, World!\n2 + 3 = 5\n");
    session?.dispose();
    expect((await run(example("matlab-loop"))).stdout).toBe("Sum of 1 to 5 is 15\nUsing sum(): 15\n");
    session?.dispose();
    expect((await run(example("matlab-array"))).stdout).toBe(
      "First mark: 72\nNumber of marks: 4\nAverage: 71.2\nHighest: 91\n",
    );
    session?.dispose();
    expect((await run(example("matlab-function"))).stdout).toBe("Area = 19.63\n");
  });

  it("asks for input with the program's prompt and uses the answer", async () => {
    const result = await run(example("matlab-input"), ["20"]);
    expect(result.prompts).toEqual(["How old are you? "]);
    expect(result.stdout).toBe("You were born in about 2006.\n");
  });

  it("reads text input with input(prompt, 's')", async () => {
    const result = await run("name = input('Name: ', 's');\nfprintf('Hi %s\\n', name);\n", ["Ada"]);
    expect(result.stdout).toBe("Hi Ada\n");
  });

  it("takes the right branch", async () => {
    expect((await run(example("matlab-if"), ["-4"])).stdout).toBe("Negative\n");
    session?.dispose();
    expect((await run(example("matlab-if"), ["0"])).stdout).toBe("Zero\n");
  });

  it("does matrix arithmetic", async () => {
    const result = await run("A = [1 2; 3 4];\nC = A * A';\nfprintf('%d %d %d %d\\n', C(1,1), C(1,2), C(2,1), C(2,2));\n");
    expect(result.stdout).toBe("5 11 11 25\n");
  });

  it("starts each run with an empty workspace", async () => {
    await run("leftover = 42;");
    session?.dispose();
    const second = await run("x = 1;");
    expect(second.variables).toEqual(["x"]);
  });

  it("reports an undefined variable with its line and column", async () => {
    const { error } = await run("x = 5;\ny = x + z;\ndisp(y);\n");
    expect(error?.message).toContain("undefined variable 'z'");
    expect(error?.span).toMatchObject({ line: 2, column: 9 });
    expect(error?.diagnostic).toContain("test.m:2:9");
  });

  it("reports an index past the end of an array", async () => {
    const { error } = await run("v = [1 2 3];\ndisp(v(7));\n");
    expect(error?.kind).toBe("runtime");
    expect(error?.span?.line).toBe(2);
    expect(error?.message).toMatch(/out of bounds/i);
  });

  it("reports a missing end as a syntax error", async () => {
    const { error } = await run("x = 5;\nif x > 2\n    disp('big')\n");
    expect(error?.kind).toBe("syntax");
    expect(error?.message).toContain("end");
  });
});
