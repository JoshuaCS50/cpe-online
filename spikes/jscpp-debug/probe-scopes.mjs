// Spike: what does the JSCPP runtime expose about scopes, frames and values
// while paused? Run: node spikes/jscpp-debug/probe-scopes.mjs
import { readFileSync } from "node:fs";
import vm from "node:vm";

globalThis.window = globalThis;
vm.runInThisContext(readFileSync("public/vendor/JSCPP.es5.min.js", "utf8"));

const code = `#include <stdio.h>

int square(int x) {
    int y = x * x;
    return y;
}

int main() {
    int a = 3;
    float f = 2.5;
    char c = 'k';
    int nums[3] = {4, 5, 6};
    int *p = &a;
    char name[6] = "Ada";
    int i;
    for (i = 0; i < 2; i++) {
        int inner = square(a + i);
        nums[i] = inner;
    }
    printf("%d\\n", nums[0]);
    return 0;
}
`;

const dbg = globalThis.JSCPP.run(code, "", { debug: true, stdio: { write: () => {} } });
const rt = dbg.rt;
console.log("rt keys:", Object.keys(rt).join(", "));
console.log("scope is array:", Array.isArray(rt.scope), "length at start:", rt.scope.length);

function describe(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = v !== null && typeof v === "object" ? `{${Object.keys(v).slice(0, 8).join(",")}}` : v;
  }
  return JSON.stringify(out);
}

let shown = new Set();
for (let step = 0; step < 400; step++) {
  const result = dbg.next();
  if (result !== false && result !== undefined) break;
  let node;
  try {
    node = dbg.nextNode();
  } catch {
    continue;
  }
  const line = node.sLine;
  // Look closely once inside square() and once late in main().
  if ((line === 5 || line === 19) && !shown.has(line)) {
    shown.add(line);
    console.log(`\n=== paused before line ${line} | node type ${node.type} | scope depth ${rt.scope.length}`);
    rt.scope.forEach((scope, index) => {
      const names = Object.keys(scope);
      console.log(`  scope[${index}] $name=${JSON.stringify(scope["$name"])} keys: ${names.filter((n) => !["printf", "scanf", "sprintf", "sscanf", "getchar", "gets", "putchar", "puts"].includes(n)).join(", ")}`);
    });
    const top = rt.scope[rt.scope.length - 1];
    for (const [name, value] of Object.entries(top)) {
      if (name.startsWith("$")) continue;
      console.log(`    top.${name} = ${describe(value)}`);
    }
    console.log("  dbg.variable():");
    for (const v of dbg.variable()) {
      if (v.value === undefined) continue;
      console.log(`    ${v.name} : ${v.type} = ${JSON.stringify(v.value)}`);
    }
    if (line === 19) {
      const main = rt.scope.find((s) => "nums" in s);
      console.log("  nums raw:", describe(main.nums), "| nums.v:", describe(main.nums.v), "| target0:", describe(main.nums.v?.target?.[0]));
      console.log("  p raw:", describe(main.p), "| p.v:", describe(main.p.v));
      console.log("  name.v:", describe(main.name.v));
      console.log("  typeString(nums):", rt.makeTypeString?.(main.nums.t), "| typeString(p):", rt.makeTypeString?.(main.p.t), "| typeString(f):", rt.makeTypeString?.(main.f.t));
    }
  }
}
console.log("\nnode types seen would be listed by dbg.nextNode().type; done:", dbg.done);
