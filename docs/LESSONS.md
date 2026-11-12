# Writing lessons

A lesson is one Markdown file under `src/content/tracks/<track>/<unit>/`. The build turns it into a page in Learn mode. A lesson that breaks any rule below stops the build and fails `npm test`, so a broken lesson cannot ship.

## The file

```markdown
---
id: core.c.printf            # track.area.slug, unique, lower case
kind: mini                   # lesson = teaches an idea; mini = one-page reference for one symbol
track: core                  # core | embedded | plc | control
unit: a2                     # a unit id from src/content/tracks.ts
order: 2                     # position in the unit; no two lessons share one
title: printf
titleKid: printf, the talking helper     # optional
symbol: printf               # mini lessons only
language: c                  # c | cpp | python | matlab
concepts: [output]
prereqs: [core.c.hello-world]            # lesson ids to do first
links:
  - {to: core.py.print, kind: same-idea, note: "Python's print does the same job."}
est_minutes: 6
checks:
  - {type: stdout-equals, expect: "I am 7 years old\n"}
hints: ["First hint", "Second hint"]
hintsKid: ["First hint, simple words", "Second hint, simple words"]
---
The explanation, in Markdown. Tables and code blocks are fine. Raw HTML is shown as text.

::: kid
The same idea for a seven-year-old. Required. Hand-written, not a shortened copy.
:::

```c {role=example file=printf.c}
// shown and runnable on the Example tab
```

::: try
The task.
:::

::: try-kid
The same task in simple words.
:::

```c {role=starter file=age.c}
// what the learner starts from; must NOT pass the checks
```

```c {role=solution file=age.c}
// a correct answer; must pass every check
```
```

A code block without `{role=...}` stays in the text where it is written.

"Try it yourself" is all or nothing: `::: try`, `::: try-kid`, a starter, a solution and at least one check. `hints` and `hintsKid` must have the same number of entries.

## Checks

| Type | Passes when | Fields |
|---|---|---|
| `stdout-equals` | the output equals `expect` | `expect`, `stdin` (optional list of input lines) |
| `io-cases` | every case prints its `expect` | `cases: [{stdin: [...], expect: "..."}]` |
| `stdout-regex` | the output matches `pattern` | `pattern`, `stdin`, `message` (shown on failure) |
| `code-contains` | the code (comments removed) matches `pattern` | `pattern`, `message` |

Output is compared after dropping trailing spaces and blank lines at the end. Typed input is not echoed into the output, so a prompt and the answer that follows it sit on one line: `Enter n: Sum = 5`.

Use `io-cases` with several inputs when the answer must be computed, so that typing the expected text into `printf` does not pass.

## Kid text rules

Checked by the build:

- At most 12 words per sentence. Code in backticks counts as one word.
- None of these words: initialise/initialize, parameter, argument, syntax, compile, compiler, execute, allocate, iterate, boolean, expression, statement, declaration, operand, operator, function call, data type.

Not checked, but expected: one idea per sentence, a concrete picture (a box, a helper, a recipe), and reassurance where beginners usually get stuck.

## What the tests run

`tests/unit/content.test.ts` compiles every lesson and then, through the real C and Python runtimes:

- runs each solution against its checks: all must pass;
- runs each starter: it must not pass;
- runs each example: it must finish without an error and print something.

The C interpreter is stricter than a desktop compiler in places. Known so far: write `int main()`, not `int main(void)`, and avoid `scanf("%c", ...)`.

## Adding a unit

Units are listed in `src/content/tracks.ts` with a normal and a kid title. A lesson that names a unit not listed there fails the build.
