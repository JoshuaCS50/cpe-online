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

A C lesson can give its programs data files to open with `fopen`. Each one is a block with `role=file` and a name made of letters, digits, dots, dashes and underscores:

````markdown
```text {role=file file=readings.txt}
21.5
22.0
```
````

The file is shown in the explanation under its name and again above the editor on the Example and Try tabs. Every run of the lesson (example, Run, every check) starts from a fresh copy, and "Open in the editor" adds it to the explorer unless a file of that name is already there. A lesson may have several data files.

Hints are plain text, except that text between backticks is shown as code: `` 'Type this: `n++;`' ``. In kid hints, code in backticks counts as one word, which keeps a long line of code within the 12-word rule.

"Try it yourself" is all or nothing: `::: try`, `::: try-kid`, a starter, a solution and at least one check. `hints` and `hintsKid` must have the same number of entries.

## Checks

| Type | Passes when | Fields |
|---|---|---|
| `stdout-equals` | the output equals `expect` | `expect`, `stdin` (optional list of input lines) |
| `io-cases` | every case prints its `expect` | `cases: [{stdin: [...], expect: "..."}]` |
| `stdout-regex` | the output matches `pattern` | `pattern`, `stdin`, `message` (shown on failure) |
| `code-contains` | the code (comments removed) matches `pattern` | `pattern`, `message` |
| `file-equals` | after the run, the file the program wrote holds `expect` (C and C++ only) | `file`, `expect`, `stdin` (optional) |

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

The C interpreter is stricter than a desktop compiler in places. Known so far:

- Write `int main()`, not `int main(void)`.
- `scanf` into an array element (`&values[i]`), `scanf("%c", ...)`, `scanf("%lf", ...)` and `printf("%lf"/"%ld", ...)` all failed upstream; patches in `scripts/patch-jscpp.mjs` fix them, guarded by `tests/unit/jscpp-scanf-arrays.test.ts` and `tests/unit/jscpp-interactive-input.test.ts`.
- `<string.h>` and array starting values were broken upstream: `strcmp` crashed on equal strings, `strcat`, `strncat` and `sprintf` crashed, `strncpy` copied nothing, `strcpy` refused exact fits, `int a[3] = {1};` failed, and no 2D starting values worked. Patches fix all of these, guarded by `tests/unit/jscpp-strings-2d.test.ts`. A single value other than 0 for a whole 2D array (`int s[2][2] = {5};`) and a flat list for a 2D array still give an error.
- Pointers were badly broken upstream: every comparison (`==`, `<`, `== NULL`), pointer subtraction, `p += n`, `!p`, `if (p)`, `int *p = NULL;`, `int *p = 0;` and `%p` crashed, and `p++` also moved the array `p` was copied from. Patches fix them, guarded by `tests/unit/jscpp-pointers.test.ts`. Following a NULL or never-set pointer now stops with a "null pointer" error that the catalog explains (`c.null-pointer`). `%p` prints a made-up but consistent address.
- `malloc`, `calloc`, `realloc` and `free` did not exist upstream; patches add them (guarded by `tests/unit/jscpp-heap.test.ts`). A block from `malloc` takes the type it is first assigned to. Writing past its end, using it after `free`, freeing it twice, and freeing an ordinary array or a moved pointer all stop with an error that the catalog explains (`c.index-out-of-range`, `c.use-after-free`, `c.double-free`, `c.bad-free`). Unlike real C, new memory always starts at 0, and returning the address of a local variable is not detected (it usually still prints the right values), so lessons point these out in the text. Leaks are not reported.
- Casts with a pointer type name, such as `(int *) p`, lost their `*` upstream; a patch fixes it.
- Structs did not work at all upstream: every `struct` type was "not defined". Patches add them, guarded by `tests/unit/jscpp-structs.test.ts`: members, `{ }` starting values, copying with `=` (arrays inside are copied too), `typedef` with or without a struct name, structs passed to and returned from functions, `->`, arrays of structs (with `{{...}, {...}}` lists), structs inside structs, `sizeof` with typical padding, and linked lists built with `malloc`. `.` on a pointer, a member name the struct lacks, a struct that was never defined, a missing `;` after the definition, too many starting values and `==` on whole structs each have an error card. Not supported: designated starting values (`{.x = 1}`), compound literals (`(struct Point){1, 2}`), unions, bit fields and function pointers as members. Integer `sizeof` results assume 4-byte pointers.
- `NULL` now comes with `<stdio.h>` as well as `<stdlib.h>`, as in real C.
- Three upstream bugs in array starting values are fixed: `int a[2] = {x, x};` made the elements and `x` one shared value, a function's `int a[3] = {n};` kept the values of its first call, and `scanf("%s", ...)` left a gap after the word (and ignored `buf + 2`).
- The debugger shows a struct as `{x: 1, y: 2}` and a NULL pointer as `NULL`.
- Arrays of pointers (`int *p[3]`, `char *names[] = {...}`, `struct Entry *table[5] = {NULL}`) lost their `*` upstream, so every element was a plain value; a patch fixes it.
- `scanf("%s", ...)` used a garbled pattern upstream that dropped symbols and kept the newline (`([]{})` came back as `[]{})`); it now reads every character up to the next space, as in real C. A backslash in typed input is still removed.
- Files did not exist upstream. Patches add `FILE`, `fopen` (modes `r`, `w`, `a`, with `+` and `b` accepted), `fclose`, `fprintf`, `fputs`, `fputc`, `fgetc`, `getc`, `fgets`, `fscanf`, `feof`, `rewind`, `fflush`, `stdin`, `stdout`, `stderr` and `EOF`, guarded by `tests/unit/jscpp-files.test.ts`. Files live in memory: in Code mode they are the explorer's files, and what a program writes is saved back there; in lessons they are the `{role=file}` blocks. `fgets(line, sizeof(line), stdin)` reads a typed line, spaces included. A NULL file, the wrong mode, use after `fclose` and an unknown mode each have an error card. `gets` exists but is unsafe and removed from modern C; lessons use `fgets`.
- `scanf`, `sscanf` and `fscanf` returned the number of `%` codes upstream, not how many values were read, and crashed when a value did not match. They now stop at the first value that does not match and return how many were stored, or `EOF` when the input ran out first, so `while (scanf("%d", &x) == 1)` works. `%d` reads decimal digits only (upstream also took letters and read `010` as octal). `getchar()` returns `EOF` at the end of input (upstream: 0).
- `strtok` is added. `strchr`, `strrchr` and `strstr` returned unusable pointers upstream, and `strstr` never matched; fixed. `printf("%s", s + 2)` printed from the start of `s` upstream; it now starts where the pointer points.
- `printf` rounds an exact tie (`22.25` to one decimal) up, as JavaScript does, where C rounds to even (`22.2`). Avoid such values in expected output.
- There is no `<stdbool.h>`, so no `bool`, `true` or `false` in C lessons. Use 1 and 0.
- Recursion is shallow and slow: every C call uses several JavaScript stack frames, so a few hundred levels already take over a second and around a thousand overflow the stack. Keep recursion in lessons to a few dozen levels. Endless recursion stops with "Maximum call stack size exceeded", which the error catalog explains (`c.recursion-too-deep`).
- It is slow: roughly 15,000 loop repetitions a second. Keep loops in lessons under about 1,000 repetitions. The tests stop a C program after a million interpreter steps and report it as a loop that never ends, so a starter that loops forever fails the build instead of hanging it.
- Function prototypes work (`int square(int x);` above `main`, the body below), through a patch in `scripts/patch-jscpp.mjs` guarded by `tests/unit/jscpp-functions.test.ts`. The interpreter also accepts a function defined after `main` with no prototype, which real C compilers reject or warn about, so lessons always show the prototype.
- Comparisons and `&&`, `||`, `!` give 1 or 0 as in real C, including when printed with `%d` or stored in an `int`. This relies on two patches in `scripts/patch-jscpp.mjs`; `tests/unit/jscpp-comparisons.test.ts` guards them.

## Adding a unit

Units are listed in `src/content/tracks.ts` with a normal and a kid title. A lesson that names a unit not listed there fails the build.
