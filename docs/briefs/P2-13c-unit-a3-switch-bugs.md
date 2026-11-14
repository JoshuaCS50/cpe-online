# P2-13c Unit A3 lessons: switch, and a bug hunt

## Context
CPE Online is a browser IDE with a Learn mode for beginner programmers. A lesson is one Markdown file; the build compiles it and the tests run its code through a real C interpreter. This package adds the last two lessons of unit A3 ("Decisions").

Read these first, in this order:
1. `docs/LESSONS.md`: the lesson file format and every rule the build enforces.
2. `src/content/tracks/core/a3/else-if.md`: a finished lesson in the same unit. Match its depth, tone and layout, and its `::: kid` block: short sentences on separate lines with blank lines between groups, built around one picture.
3. `src/content/tracks/core/a2/reading-errors.md`: a finished lesson whose task is to fix a broken program. The bug hunt below has the same shape.

## Files
Create:
- `src/content/tracks/core/a3/switch.md`
- `src/content/tracks/core/a3/decision-bugs.md`

Edit:
- none

Do not touch any other file.

## Interface
Use these headers exactly as written. Do not add, remove or rename keys. Write the body below each header yourself.

### switch.md

```yaml
---
id: core.c.switch
kind: lesson
track: core
unit: a3
order: 4
title: switch
titleKid: Picking from a list of buttons
language: c
concepts: [switch, case, break, default]
prereqs: [core.c.else-if]
links:
  - to: core.c.else-if
    kind: contrast
    note: else if handles ranges such as temp < 15; switch handles exact values such as choice 1, 2 or 3.
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["1"]
        expect: "Tea\n"
      - stdin: ["2"]
        expect: "Coffee\n"
      - stdin: ["3"]
        expect: "Juice\n"
      - stdin: ["4"]
        expect: "Unknown choice\n"
      - stdin: ["0"]
        expect: "Unknown choice\n"
  - type: code-contains
    pattern: 'switch\s*\('
    message: Uses switch to pick the drink
hints:
  - Start with switch (choice) and a pair of braces. Inside, write one case for each drink.
  - Each case ends with break; so that the next case does not run as well.
  - Anything that is not 1, 2 or 3 goes to default, which prints Unknown choice.
hintsKid:
  - Write switch (choice). Then add a case for each drink.
  - End each case with break. Then it stops there.
  - Put Unknown choice under default.
---
```

Body must cover, in this order:
1. When one value is compared with several exact values (a menu choice, a day number), a long `else if` chain repeats the same test. `switch` says it once.
2. The shape of a `switch` with three `case` labels, `break` and `default`, in a code block. Explain each part in one sentence: the value in brackets, `case` (a value to match, followed by a colon), `break` (leave the switch), `default` (runs when no case matches).
3. `break` and fallthrough: without `break`, C carries on into the next case. Show a short example where `case 1` has no `break` and prints two lines, and say what it prints.
4. Using fallthrough on purpose: several cases sharing one block, shown with days 1 to 5 as weekdays and 6 and 7 as the weekend.
5. What a `case` can hold: a whole number or a single character in single quotes, such as `case 'A':`. It cannot hold a range such as `case > 10:` or a variable. For ranges, use `else if`.
6. A short "Common mistakes" list: forgetting `break`; leaving out `default`; trying to use a range or a comparison in a `case`.

Example block (`{role=example file=days.c}`): a program with no input that sets `int day = 6;` and uses a `switch` with cases 1 to 5 grouped (printing `Day 6 is a weekday` style text with `%d`), cases 6 and 7 grouped (weekend), and a `default` (not a day). Then it sets `day = 3;` and runs the same `switch` again. Each group ends with `break;`.

Task: the starter reads `choice` with `scanf` and has the comment `// Print the drink here.`. Choice 1 is Tea, 2 is Coffee, 3 is Juice, and anything else prints `Unknown choice`. Starter file name `menu.c`. The solution replaces the comment with a `switch (choice)` that has `case 1:`, `case 2:`, `case 3:` and `default:`, each printing its text followed by `\n` and ending with `break;`.

### decision-bugs.md

```yaml
---
id: core.c.decision-bugs
kind: lesson
track: core
unit: a3
order: 5
title: "Bug hunt: decisions"
titleKid: Find the sneaky mistakes
language: c
concepts: [logic-error, debugging, assignment-vs-comparison, boundary]
prereqs: [core.c.if-else, core.c.reading-errors]
links:
  - to: core.c.reading-errors
    kind: builds-on
    note: That lesson fixes programs that will not run. These programs run, but give the wrong answer.
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["100"]
        expect: "Perfect score!\nPass\n"
      - stdin: ["50"]
        expect: "Pass\n"
      - stdin: ["49"]
        expect: "Fail\nTry the extra exercises.\n"
      - stdin: ["75"]
        expect: "Pass\n"
  - type: code-contains
    pattern: 'mark\s*==\s*100'
    message: Compares the mark with 100 using ==
hints:
  - Every mark prints Perfect score. Look at the first if. Is it comparing the mark with 100, or storing 100 in it?
  - A mark of exactly 50 should pass. Check whether the second if uses > or >=.
  - Try the extra exercises appears even for a perfect score. Look closely at the end of the third if line, just before the brace.
hintsKid:
  - Every mark says Perfect. Look at the first if. Does it have two = marks?
  - Fifty should pass. Is it > or >=?
  - Look at the end of the last if line. Is there a ; that should not be there?
---
```

Body must cover, in this order:
1. Some bugs stop a program. These do not: the program runs to the end and prints something, and only the answer is wrong. They are called logic errors, and no error message points at them. The computer did exactly what was written.
2. How to hunt them: decide what the right output is before running; pick test inputs that sit on the edges (here 49, 50 and 100) as well as an ordinary one; run each and compare what was printed with what should have been printed; then read the line responsible slowly, one symbol at a time. Pressing Check my answer runs several inputs and shows the expected output next to what the program printed.
3. The three classic decision bugs, each in its own short section with a two-line before-and-after code block:
   - `=` inside a condition: `if (mark = 100)` stores 100 in `mark`, and since 100 is not 0 the test is always true. The real value of `mark` is lost, so later tests are wrong too. The fix is `==`.
   - The wrong boundary: `mark > 50` fails a mark of exactly 50. Read the task's words ("50 or more") and match them: `>=`.
   - A semicolon after the condition: `if (mark < 50);` ends the `if` right there, so the block in braces below it is no longer part of the `if` and runs every time. Remove the semicolon.
4. One fix at a time: change one thing, run again, and check that one symptom went away before changing the next.

No example block in this file.

Task: the starter is exactly this program, which has three bugs on purpose:

```c
#include <stdio.h>

int main() {
    int mark;

    scanf("%d", &mark);

    if (mark = 100) {
        printf("Perfect score!\n");
    }

    if (mark > 50) {
        printf("Pass\n");
    } else {
        printf("Fail\n");
    }

    if (mark < 50); {
        printf("Try the extra exercises.\n");
    }

    return 0;
}
```

Starter file name `marks.c`. The solution is the same program with `mark == 100`, `mark >= 50`, and the semicolon after `if (mark < 50)` removed, and nothing else changed. The task text says what the program is meant to do: print `Perfect score!` only for 100; print `Pass` for 50 or more and `Fail` below 50; print `Try the extra exercises.` only below 50. It does not say where the bugs are.

## Behaviour
1. Every file follows `docs/LESSONS.md` exactly. `switch.md` has: header, explanation, `::: kid`, `{role=example}`, `::: try`, `::: try-kid`, `{role=starter}`, `{role=solution}`. `decision-bugs.md` has the same without the example block.
2. Explanations are for a first-year student with no programming background: plain words, short paragraphs, one idea per paragraph. Between 300 and 500 words each, not counting code and tables.
3. Kid blocks are written from scratch for a seven-year-old. Each one uses one concrete picture and has 6 to 10 short sentences on separate lines with blank lines between groups. Pictures to use: switch, a drinks machine with one button per drink and a light that says "sorry" for any other button; bug hunt, a detective with a magnifying glass checking a page one mark at a time.
4. Kid text rules are enforced by the build: at most 12 words per sentence, and none of the banned words listed in `docs/LESSONS.md`. This applies to the `::: kid` block, the `::: try-kid` block and `titleKid`. A colon also ends a sentence for counting.
5. All C code uses `int main()` (never `int main(void)`), includes `<stdio.h>`, uses 4 spaces to indent, and ends with `return 0;`. Apart from the planted bugs, put braces around every `if` and `else` body.
6. Do not use `bool`, `true`, `false` or `<stdbool.h>`; this interpreter does not provide `<stdbool.h>`. Do not use `scanf("%c", ...)`.
7. Starter and solution must differ only by the lines the learner is asked to write or fix.
8. Do not describe how this website behaves beyond pressing Run and the one sentence about Check my answer given above. No raw HTML, no links to outside websites.

## Tests
No new test file. The existing `tests/unit/content.test.ts` picks up the new lessons automatically and must show, for each new id:
- `<id>: the solution passes its checks`
- `<id>: the starter does not pass yet`
- for `core.c.switch` only: `<id>: the example runs without an error`
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
Only the two files listed above. No summary document. In your final message, list anything in this brief that you could not follow and why.
