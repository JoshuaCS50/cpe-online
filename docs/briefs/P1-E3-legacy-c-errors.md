# P1-E3 Characterise the legacy C error messages

## Context
CPE Online is a browser IDE for beginners. When a C program fails, the legacy runner turns the interpreter's raw error into a short friendly message using the `ERROR_RULES` table in `src/legacy/js/runners/c.js`. That table is about to be replaced by a larger error catalog. Before it is replaced, its current behaviour must be pinned down by tests that run real broken programs, so nothing a student sees today gets worse.

## Files
Create:
- `tests/fixtures/errors/legacy-c-programs.ts`
- `tests/unit/legacy-c-errors.test.ts`

Edit:
- none

Do not touch any other file.

## Interface
```ts
// tests/fixtures/errors/legacy-c-programs.ts

export interface BrokenProgram {
  /** Short kebab-case id, unique, for example "missing-semicolon". */
  id: string;
  /** One sentence: the beginner mistake this program contains. */
  mistake: string;
  /** Complete C source. Keep it under 15 lines. */
  source: string;
  /** Input lines to queue before the run, each ending in "\n". Omit if the program reads nothing. */
  stdin?: string;
  /** Exact friendly title the legacy runner shows for this program. */
  expectTitle: string;
  /** 1-based line the legacy runner highlights, or null if it highlights none. */
  expectLine: number | null;
}

export const BROKEN_PROGRAMS: readonly BrokenProgram[];

/** Titles from ERROR_RULES that no program in BROKEN_PROGRAMS triggers, each with the reason. */
export const UNREACHED_TITLES: readonly { title: string; reason: string }[];
```

## Behaviour
1. Read `src/legacy/js/runners/c.js` (the `ERROR_RULES` table and `explainJSCPPError`) and `tests/helpers/legacy-c.ts` (the helper `runLegacyC`) first. Read `tests/unit/legacy-c-runner.test.ts` for a usage example.
2. Write one broken program per rule in `ERROR_RULES`, in the same order as the table, each containing exactly one typical beginner mistake that makes that rule fire. Also add one program for the fallback message (the text returned when no rule matches), if you can find a mistake that reaches it; its title is the first line of that fallback text.
3. Every `expectTitle` and `expectLine` must be the value the helper really returns. Find it by running the test and reading the failure output; never guess and never edit the expectation to a value you have not seen in test output.
4. If a rule's title depends on captured text (the rule is a function), use the exact title produced for your program.
5. If you cannot make a rule fire after three different programs, do not include a failing or skipped test. Add the rule's title to `UNREACHED_TITLES` with a one-sentence reason that states what you tried.
6. Programs must be original and small. Use ordinary beginner code: variables, `printf`, `scanf`, `if`, loops, arrays, simple functions.
7. No program may run for more than one second, except a single program for the timeout rule if you include it. If the timeout rule needs more than five seconds to fire, put it in `UNREACHED_TITLES` instead.

## Tests
`tests/unit/legacy-c-errors.test.ts`, using Vitest:

1. A table-driven test over `BROKEN_PROGRAMS`: for each program, `const run = await runLegacyC(program.source, program.stdin ?? "")`, then expect `run.ok` to be `false`, `run.errorTitle` to equal `program.expectTitle`, and `run.errorLine` to equal `program.expectLine`. Name each test after the program id.
2. Program ids are unique.
3. Every program source is at most 15 lines.
4. Coverage: build the set of static titles from `ERROR_RULES` (import it from `../../src/legacy/js/runners/c.js`; include only rules whose second element is an object, not a function). Expect every one of those titles to appear either as an `expectTitle` in `BROKEN_PROGRAMS` or as a `title` in `UNREACHED_TITLES`.
5. `UNREACHED_TITLES` has at most 6 entries.

## Acceptance
All three must pass, run from the repository root. Run each command exactly as written: no pipes, no redirection, no extra flags.
```
npm run typecheck
npx vitest run tests/unit/legacy-c-errors.test.ts
npm run lint
```

## Constraints
- TypeScript strict mode with `noUncheckedIndexedAccess`. No `any`, no `@ts-ignore`, no `@ts-expect-error`.
- No new dependencies. No network access. No changes to config files.
- Do not change `src/legacy/js/runners/c.js` or the helper.
- Do not commit. Leave the changes in the working tree.

## Output
Only the two files listed above. No summary document.
