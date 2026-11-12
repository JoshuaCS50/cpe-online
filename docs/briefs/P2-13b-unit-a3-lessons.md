# P2-13b Unit A3 lessons: comparisons, if/else, else-if

## Context
CPE Online is a browser IDE with a Learn mode for beginner programmers. A lesson is one Markdown file; the build compiles it and the tests run its code through a real C interpreter. This package adds the first three lessons of unit A3 ("Decisions").

Read these first, in this order:
1. `docs/LESSONS.md`: the lesson file format and every rule the build enforces.
2. `src/content/tracks/core/a2/operators.md`: a finished lesson. Match its depth, tone and layout, and especially its `::: kid` block: short sentences, each on its own line with a blank line between groups, built around one picture.
3. `src/content/tracks/core/a2/variables.md`: another finished lesson.

## Files
Create:
- `src/content/tracks/core/a3/comparisons.md`
- `src/content/tracks/core/a3/if-else.md`
- `src/content/tracks/core/a3/else-if.md`

Edit:
- none

Do not touch any other file.

## Interface
Use these headers exactly as written. Do not add, remove or rename keys. Write the body below each header yourself.

### comparisons.md

```yaml
---
id: core.c.comparisons
kind: lesson
track: core
unit: a3
order: 1
title: Comparisons and logic
titleKid: Asking yes or no questions
language: c
concepts: [comparison, logic, true-false, and-or-not]
prereqs: [core.c.operators]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["15"]
        expect: "1\n"
      - stdin: ["12"]
        expect: "0\n"
      - stdin: ["13"]
        expect: "1\n"
      - stdin: ["19"]
        expect: "1\n"
      - stdin: ["20"]
        expect: "0\n"
  - type: code-contains
    pattern: '&&'
    message: Uses && to join the two comparisons
hints:
  - A teenager is at least 13 and at most 19. That is two comparisons, age >= 13 and age <= 19.
  - Both comparisons must be true at the same time, so join them with &&.
  - 'The missing line is: teen = age >= 13 && age <= 19;'
hintsKid:
  - Ask two questions. Is the age 13 or more? Is it 19 or less?
  - Both answers must be yes. Join them with &&.
  - 'Type this: teen = age >= 13 && age <= 19;'
---
```

Body must cover, in this order:
1. A comparison asks a yes or no question about two values. In C the answer is a number: `1` for yes (true) and `0` for no (false).
2. The six comparison operators `==  !=  <  >  <=  >=` in a table, each with an example and its answer (1 or 0).
3. `==` compares, `=` stores. Show both side by side.
4. Joining questions: `&&` (both must be true), `||` (at least one is true), `!` (turns true into false and false into true). One example each, with its answer.
5. A truth table for `&&` and `||` with the four combinations of 1 and 0.
6. A short "Common mistakes" list: `=` instead of `==`; writing `13 <= age <= 19` (it does not mean what it looks like: use `&&`); `&` or `|` instead of `&&` or `||`.

Example block (`{role=example file=compare.c}`): a program with no input that sets `int a = 5;` and `int b = 8;` and prints, each on its own labelled line, the results of `a == b`, `a != b`, `a < b`, `a >= b`, `a < b && b < 10`, `a > b || b > 10` and `!(a < b)` using `printf("... %d\n", ...)`.

Task: the starter reads `age` with `scanf`, declares `int teen = 0;`, and already ends with `printf("%d\n", teen);`. The learner adds one line that stores in `teen` whether the age is from 13 to 19 inclusive. Starter file name `teen.c`. The starter has the comment `// Work out teen here.` where the line goes. The solution is the starter with that comment replaced by `teen = age >= 13 && age <= 19;`.

### if-else.md

```yaml
---
id: core.c.if-else
kind: lesson
track: core
unit: a3
order: 2
title: if and else
titleKid: Choosing which way to go
language: c
concepts: [if, else, condition, block]
prereqs: [core.c.comparisons]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["50"]
        expect: "Pass\n"
      - stdin: ["49"]
        expect: "Fail\n"
      - stdin: ["100"]
        expect: "Pass\n"
      - stdin: ["0"]
        expect: "Fail\n"
  - type: code-contains
    pattern: 'else'
    message: Uses else for the other case
hints:
  - The mark passes when it is 50 or more, so the condition is mark >= 50.
  - Put printf("Pass\n"); inside the braces after if, and printf("Fail\n"); inside the braces after else.
  - 'The finished part is: if (mark >= 50) { printf("Pass\n"); } else { printf("Fail\n"); }'
hintsKid:
  - Fifty or more is a pass. Ask if mark >= 50.
  - Say Pass in the first part. Say Fail after else.
  - 'Type this: if (mark >= 50) { printf("Pass\n"); } else { printf("Fail\n"); }'
---
```

Body must cover, in this order:
1. Programs so far ran every line, top to bottom. `if` lets a program skip lines depending on a condition.
2. The shape of `if` and of `if ... else`, each in a code block, with a sentence on what the braces hold.
3. The condition can be any comparison or logic from the previous lesson; any value that is not 0 counts as true.
4. Indentation: the computer ignores it, people rely on it. Indent the lines inside the braces by 4 spaces.
5. Always use braces, even for one line. Show why: a second line added later without braces runs every time.
6. "Common mistakes": `if (mark = 50)` instead of `if (mark == 50)` (it stores 50 and is always true, and the program still runs, so nothing warns you); a semicolon straight after the condition, `if (x > 3);`; testing the wrong boundary (`>` when `>=` is meant).

Example block (`{role=example file=even.c}`): a program with no input that sets `int n = 7;` and prints `7 is odd` using `if (n % 2 == 0) ... else ...`, then sets `n = 10;` and does the same test again, printing `10 is even`. Use `%d` for the number.

Task: the starter reads `mark` with `scanf` and has the comment `// Print Pass or Fail here.` where the learner's code goes. Marks of 50 and above pass. Starter file name `grade.c`. The solution replaces the comment with an `if (mark >= 50) { ... } else { ... }` that prints `Pass` or `Fail`, each followed by `\n`.

### else-if.md

```yaml
---
id: core.c.else-if
kind: lesson
track: core
unit: a3
order: 3
title: else if ladders
titleKid: More than two ways to go
language: c
concepts: [else-if, ladder, ranges]
prereqs: [core.c.if-else]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["10"]
        expect: "Cold\n"
      - stdin: ["15"]
        expect: "Mild\n"
      - stdin: ["24"]
        expect: "Mild\n"
      - stdin: ["25"]
        expect: "Hot\n"
      - stdin: ["-3"]
        expect: "Cold\n"
  - type: code-contains
    pattern: 'else\s+if'
    message: Uses else if for the middle range
hints:
  - Check the ranges in order, from the coldest up. The first test is temp < 15.
  - If that is false the temperature is at least 15, so the next test only needs temp < 25.
  - 'The finished part is: if (temp < 15) { printf("Cold\n"); } else if (temp < 25) { printf("Mild\n"); } else { printf("Hot\n"); }'
hintsKid:
  - Start with the cold one. Ask if temp < 15.
  - Next ask if temp < 25. That one is mild.
  - Everything else is hot. Put that after the last else.
---
```

Body must cover, in this order:
1. Some choices have more than two answers. Chain them with `else if`.
2. The shape of a ladder in a code block, and the rule that C tests each condition from the top and runs only the first one that is true, then skips the rest.
3. Why the order matters: a worked example of grading bands (for example 75 and above, 50 and above, below 50) written in the right order, and the same ladder in the wrong order showing that everything lands in the first band.
4. Each later test can rely on the earlier ones having been false, so it only needs one comparison. Show `else if (temp < 25)` instead of `else if (temp >= 15 && temp < 25)`.
5. The final `else` catches everything left. Leaving it out means some values print nothing.
6. "Common mistakes": separate `if` statements instead of `else if` (more than one can run); gaps or overlaps between ranges; forgetting the final `else`.

Example block (`{role=example file=bands.c}`): a program with no input that sets `int score = 68;` and uses an `if / else if / else` ladder with the bands 75 and above, 50 and above, and below 50, printing which band the score is in. Print the score with `%d`.

Task: the starter reads `temp` (a temperature in degrees) with `scanf` and has the comment `// Print Cold, Mild or Hot here.`. Below 15 is Cold, 15 up to 24 is Mild, 25 and above is Hot. Starter file name `weather.c`. The solution replaces the comment with an `if / else if / else` ladder printing `Cold`, `Mild` or `Hot`, each followed by `\n`.

## Behaviour
1. Every file follows `docs/LESSONS.md` exactly: header, explanation, a `::: kid` block, a `{role=example}` block, then `::: try`, `::: try-kid`, `{role=starter}` and `{role=solution}` blocks.
2. Explanations are for a first-year student with no programming background: plain words, short paragraphs, one idea per paragraph. Between 300 and 500 words each, not counting code and tables.
3. Kid blocks are written from scratch for a seven-year-old, not shortened copies. Each one uses one concrete picture and has 6 to 10 short sentences, written as separate short lines with blank lines between groups, like the kid block in `operators.md`. Pictures to use: comparisons, a teacher asking yes or no questions; if/else, a fork in a path; else if, a sorting machine that drops each fruit into the first basket it fits.
4. Kid text rules are enforced by the build: at most 12 words per sentence, and none of the banned words listed in `docs/LESSONS.md`. This applies to the `::: kid` block, the `::: try-kid` block and `titleKid`. A colon also ends a sentence for counting.
5. All C code uses `int main()` (never `int main(void)`), includes `<stdio.h>`, uses 4 spaces to indent, puts braces around every `if` and `else` body, and ends with `return 0;`.
6. Do not use `bool`, `true`, `false` or `<stdbool.h>` in any code: this C interpreter does not provide `<stdbool.h>`. Write 1 and 0, as the lessons explain.
7. Starter and solution must differ only by the lines the learner is asked to write.
8. Do not describe how this website behaves (buttons, error cards, what the editor does) beyond pressing Run and Check my answer. No raw HTML, no links to outside websites.

## Tests
No new test file. The existing `tests/unit/content.test.ts` picks up the new lessons automatically and must show, for each of the three new ids:
- `<id>: the solution passes its checks`
- `<id>: the starter does not pass yet`
- `<id>: the example runs without an error`
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
