# P2-13a Unit A2 lessons: operators, scanf, reading errors

## Context
CPE Online is a browser IDE with a Learn mode for beginner programmers. A lesson is one Markdown file; the build compiles it and the tests run its code through a real C interpreter. This package adds three lessons to unit A2 ("First C program").

Read these first, in this order:
1. `docs/LESSONS.md`: the lesson file format and every rule the build enforces.
2. `src/content/tracks/core/a2/variables.md`: a finished lesson. Match its depth, tone and layout.
3. `src/content/tracks/core/a2/printf.md`: a finished mini lesson.

## Files
Create:
- `src/content/tracks/core/a2/operators.md`
- `src/content/tracks/core/a2/scanf.md`
- `src/content/tracks/core/a2/reading-errors.md`

Edit:
- none

Do not touch any other file.

## Interface
Use these headers exactly as written. Do not add, remove or rename keys. Write the body below each header yourself.

### operators.md

```yaml
---
id: core.c.operators
kind: lesson
track: core
unit: a2
order: 4
title: Operators and precedence
titleKid: Sums and what goes first
language: c
concepts: [arithmetic, precedence, integer-division, remainder]
prereqs: [core.c.variables]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["125"]
        expect: "2 min 5 s\n"
      - stdin: ["59"]
        expect: "0 min 59 s\n"
      - stdin: ["3600"]
        expect: "60 min 0 s\n"
  - type: code-contains
    pattern: '%\s*60'
    message: Uses % 60 to find the leftover seconds
hints:
  - Dividing two whole numbers throws the remainder away, so total / 60 is the number of full minutes.
  - The % operator gives the remainder of a division, so total % 60 is the seconds left over.
  - 'The two missing lines are: minutes = total / 60; seconds = total % 60;'
hintsKid:
  - Share the seconds into groups of 60. Each group is one minute.
  - The % sign tells you what is left over.
  - 'Type these: minutes = total / 60; seconds = total % 60;'
---
```

Body must cover, in this order:
1. The five arithmetic operators `+ - * / %` in a table with one example each.
2. Integer division: `7 / 2` is `3`. How to get `3.5` (make one side a decimal: `7 / 2.0`).
3. Remainder `%` and two everyday uses (even or odd; minutes and seconds).
4. Precedence: `* / %` before `+ -`; brackets first. Show `2 + 3 * 4` (14) against `(2 + 3) * 4` (20).
5. Shorthand: `+=`, `-=`, `++`, `--`, each with what it means written out.
6. A short "Common mistakes" list (three items).

Example block (`{role=example file=operators.c}`): a program with no input that prints the result of `2 + 3 * 4`, `(2 + 3) * 4`, `7 / 2`, `7 % 2` and `7 / 2.0`, each on its own labelled line.

Task: the starter reads `total` (a number of seconds) with `scanf` and already has the final `printf("%d min %d s\n", minutes, seconds);`. The learner adds the two lines that work out `minutes` and `seconds`. Starter file name `time.c`. The solution is the starter with those two lines added.

### scanf.md

```yaml
---
id: core.c.scanf
kind: mini
track: core
unit: a2
order: 5
title: scanf
titleKid: scanf, the listening helper
symbol: scanf
language: c
concepts: [input, format-string, address]
prereqs: [core.c.variables]
links:
  - to: core.c.printf
    kind: contrast
    note: printf sends values out; scanf brings them in. They share the same placeholders.
est_minutes: 7
checks:
  - type: io-cases
    cases:
      - stdin: ["12", "1.5"]
        expect: "Age 12, height 1.50\n"
      - stdin: ["9", "1.32"]
        expect: "Age 9, height 1.32\n"
  - type: code-contains
    pattern: 'scanf\s*\(\s*"%f"'
    message: Reads the height with %f
hints:
  - Each scanf reads one value. Use %d for the whole number and %f for the decimal.
  - Both variables need & in front of their names inside scanf.
  - 'The two missing lines are: scanf("%d", &age); scanf("%f", &height);'
hintsKid:
  - Use scanf two times. One for each box.
  - Put & in front of each box name.
  - 'Type these: scanf("%d", &age); scanf("%f", &height);'
---
```

Body must cover, in this order:
1. One sentence on what `scanf` does, then the general form in a code block.
2. A table of placeholders: `%d` (int), `%f` (float), `%lf` (double), `%s` (a word of text), with the variable type each one needs.
3. Why the `&` is needed, in two or three sentences.
4. Reading two values: two `scanf` calls, and one call with two placeholders.
5. "Common mistakes": missing `&`; `%d` used for a `float`; expecting `scanf` to print a prompt (it does not: use `printf` first).

Do not mention or use `%c` anywhere in this file.

Example block (`{role=example file=scanf_demo.c}`): must run with NO input, because the Example tab is run without any. So the example prints a short explanation of what a program using `scanf` would do, using only `printf` and ordinary variables set in the code. State in the lesson text that the Try it tab is where input is typed.

Task: the starter declares `int age;` and `float height;` and already has the final `printf("Age %d, height %.2f\n", age, height);`. The learner adds the two `scanf` lines. Starter file name `about.c`. The solution is the starter with those two lines added.

### reading-errors.md

```yaml
---
id: core.c.reading-errors
kind: lesson
track: core
unit: a2
order: 6
title: Reading error messages
titleKid: When the computer says "oops"
language: c
concepts: [error-message, syntax-error, debugging]
prereqs: [core.c.hello-world]
est_minutes: 10
checks:
  - type: stdout-equals
    expect: "Ready\nSet\nGo!\n"
hints:
  - Press Run and read the card. It names a line. Look at that line and the line just above it.
  - The first problem is a missing semicolon at the end of a printf line.
  - After fixing that, run again. The next card is about a name the computer does not know. Check the spelling of printf on every line.
hintsKid:
  - Press Run. Read the card. It tells you a line number.
  - One line has no ; at the end.
  - One printf is spelled wrong. Find it and fix it.
---
```

Body must cover, in this order:
1. Errors are normal: every programmer sees them many times a day. An error message is the computer asking for help, not telling you off.
2. Three kinds of problem, in a table: the program will not start (a rule of the language is broken); it starts and then stops (it was asked to do something impossible); it runs but gives the wrong answer.
3. How to read the error card this site shows: the title, the file name and line number, "What happened", "Why", "How to fix it", and the original message underneath.
4. The line number is where the computer noticed, which is often one line after the real mistake. Show a missing semicolon as the example.
5. Fix the first error first, then run again. Later errors are often caused by the first one.
6. A short checklist of the most common beginner slips: missing `;`, missing closing quote or bracket, misspelled name, wrong capital letter.

No example block in this file.

Task: the starter is exactly this program, which has two mistakes on purpose (a missing semicolon and a misspelled `printf`):

```c
#include <stdio.h>

int main() {
    printf("Ready\n")
    prinf("Set\n");
    printf("Go!\n");
    return 0;
}
```

Starter file name `fixme.c`. The solution is the same program with both mistakes fixed. The task text tells the learner to press Run, read the card, fix one thing, and run again until it prints the three lines.

## Behaviour
1. Every file follows `docs/LESSONS.md` exactly: header, explanation, a `::: kid` block, optional `{role=example}` block, then `::: try`, `::: try-kid`, `{role=starter}` and `{role=solution}` blocks.
2. Explanations are for a first-year student with no programming background: plain words, short paragraphs, one idea per paragraph. Between 250 and 450 words each, not counting code and tables.
3. Kid blocks are written from scratch for a seven-year-old, not shortened copies. Each one uses one concrete picture (for example sharing sweets for division) and is between 5 and 9 short sentences.
4. Kid text rules are enforced by the build: at most 12 words per sentence, and none of the banned words listed in `docs/LESSONS.md`. This applies to the `::: kid` block, the `::: try-kid` block and `titleKid`. Note that a colon also ends a sentence for counting.
5. All C code uses `int main()` (never `int main(void)`), includes `<stdio.h>`, uses 4 spaces to indent, and ends with `return 0;`.
6. Starter and solution must differ only by the lines the learner is asked to write or fix.
7. No raw HTML in any file. No links to outside websites.

## Tests
No new test file. The existing `tests/unit/content.test.ts` picks up the new lessons automatically and must show, for each of the three new ids:
- `<id>: the solution passes its checks`
- `<id>: the starter does not pass yet`
- for `core.c.operators` and `core.c.scanf`: `<id>: the example runs without an error`
- `lesson library > has no problems`

## Acceptance
Run from the repository root. Run each command exactly as written: no pipes, no redirection, no extra flags (the sandbox denies anything else).

```
npx vitest run tests/unit/content.test.ts
npm run typecheck
```

If the first command reports a problem with a lesson, the message names the file and the rule. Fix the lesson text, never the test, the compiler or the header given above.

## Constraints
- Original wording and code only. Do not copy sentences from the existing lessons or from any book or website.
- No new dependencies. No network access. No changes to config files, tests or TypeScript files.
- Do not change the headers given above. If a header seems wrong, stop and say so in your final message.
- Do not commit. Leave the changes in the working tree.

## Output
Only the three files listed above. No summary document. In your final message, list anything in this brief that you could not follow and why.
