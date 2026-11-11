// Spike P1-12: does the vendored JSCPP 2.0.6 bundle expose a usable step
// debugger? Run: node spikes/jscpp-debug/probe.mjs
import { readFileSync } from "node:fs";
import vm from "node:vm";

globalThis.window = globalThis;
vm.runInThisContext(readFileSync("public/vendor/JSCPP.es5.min.js", "utf8"));
const JSCPP = globalThis.JSCPP;

const code = readFileSync("spikes/jscpp-debug/sample.c", "utf8");
let out = "";
const dbg = JSCPP.run(code, "", { debug: true, stdio: { write: (s) => (out += s) } });

const proto = Object.getPrototypeOf(dbg);
console.log("returned:", typeof dbg, "| prototype methods:", Object.getOwnPropertyNames(proto).join(", "));
console.log("own keys:", Object.keys(dbg).join(", "));

const trace = [];
let exit;
const started = performance.now();
for (let step = 0; step < 400; step++) {
  let result;
  try {
    result = dbg.next();
  } catch (error) {
    console.log("step threw:", error.message);
    break;
  }
  let node = null;
  let vars = null;
  try {
    node = dbg.nextNode();
  } catch {
    /* no next node at the very end */
  }
  try {
    vars = dbg.variable();
  } catch (error) {
    vars = "ERR " + error.message;
  }
  trace.push({
    line: node?.sLine,
    col: node?.sColumn,
    vars: Array.isArray(vars) ? vars.map((v) => `${v.name}=${v.value}`).join(" ") : vars,
  });
  if (result !== false && result !== undefined) {
    exit = result;
    break;
  }
}
const elapsed = performance.now() - started;

console.log(`steps: ${trace.length} in ${elapsed.toFixed(1)} ms | exit: ${JSON.stringify(exit)} | stdout: ${JSON.stringify(out)}`);
const lines = [];
for (const entry of trace) {
  if (entry.line !== undefined && lines[lines.length - 1]?.line !== entry.line) lines.push(entry);
}
console.log("line-level trace (first visit of each run of steps):");
for (const entry of lines.slice(0, 40)) console.log(`  line ${entry.line}: ${entry.vars}`);

// Single-variable lookup and stop conditions, if present.
for (const probe of ["variable", "type", "src", "setStopConditions", "stopConditions", "conditions", "continue"]) {
  console.log(`has ${probe}:`, typeof dbg[probe]);
}
