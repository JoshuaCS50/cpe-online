# ADR 0002: Debugger back ends and how execution pauses

Status: C/C++ part decided. Python part open until spike P1-17a.

## C / C++

**Decision: use JSCPP's built-in debugger (Tier A in the plan's risk register).** The tree-sitter instrumentation fallback (Tier B) is not needed.

Evidence, from `spikes/jscpp-debug/probe.mjs` run under Node against the vendored `JSCPP.es5.min.js` (2.0.6):

- `JSCPP.run(code, input, { debug: true, stdio })` returns a debugger object instead of running to completion.
- Prototype methods: `start`, `continue`, `next`, `nextLine`, `nextNode`, `variable`. Own fields: `src`, `prevNode`, `done`, `conditions`, `stopConditions`, `rt`, `gen`.
- `next()` returns `false` until the program ends, then the exit value. `nextNode()` gives the upcoming AST node with `sLine` and `sColumn`. `variable()` lists visible variables as `{ name, value, type }`; `variable(name)` looks one up.
- The sample (function call inside a loop, 16 lines) took 33 node-level steps in about 8 ms and printed the correct output. Stepping enters the called function and shows its locals (`x`, `y`) with the right values on each call.
- `stopConditions` exists, so line breakpoints can be expressed as a stop condition or by stepping until `nextNode().sLine` matches.

Known gaps to cover in the adapter (P1-21):

1. `variable()` returns one flat list: locals of the current function, then the caller's, then library functions with `undefined` values. The adapter must drop the library names and split the list into frames using the runtime's scope stack (`dbg.rt`).
2. There is no call-stack method. Build it from the scope stack, or track depth from call and return nodes.
3. Step granularity is AST nodes, not lines. "Step over" and "step out" are implemented in the adapter by stepping until the line changes at the same or a shallower depth.
4. The debugger is synchronous. It runs in the worker; the worker stays idle between commands, so no blocking channel is needed for C stepping. Input (`scanf`) while debugging still needs the blocking channel from P1-18.

## Python

Open. Candidates and the test that decides between them are in the plan (section 10.1, row 2; spike P1-17a).

### C / C++: as built

- `src/debugger/c-stepper.ts` drives the JSCPP debugger and is tested in Node against the real interpreter (`tests/unit/c-stepper.test.ts`).
- Call stack: `rt.scope` entries carry `$name`; those starting with `function ` are frames. Call-site lines are recorded by the stepper each time the depth grows, since JSCPP does not keep them.
- Variables per frame: `dbg.variable()` formats values well but flattens every scope, so the stepper temporarily narrows `rt.scope` to one frame's scopes before calling it.
- Stops are line-level: a stop needs the line or the call depth to change, so a breakpoint on a one-line loop pauses once.
- The worker is a module worker (`src/runners/c/c-worker.ts`). JSCPP is a classic script, so it is fetched and evaluated in the worker's global scope.
- Stepping runs synchronously inside one message handler. A program that never reaches a stop is ended by terminating the worker.
