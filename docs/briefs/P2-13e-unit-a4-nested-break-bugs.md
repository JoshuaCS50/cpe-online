# P2-13e Unit A4 lessons: nested loops, break and continue, a loop bug hunt

## Context
CPE Online is a browser IDE with a Learn mode for beginner programmers. A lesson is one Markdown file; the build compiles it and the tests run its code through a real C interpreter. This package adds the last three lessons of unit A4 ("Loops").

Read these first, in this order:
1. `docs/LESSONS.md`: the lesson file format and every rule the build enforces.
2. `src/content/tracks/core/a4/for.md`: a finished lesson in the same unit. Match its depth, tone and layout, and its `::: kid` block: short sentences on separate lines with blank lines between groups, built around one picture.
3. `src/content/tracks/core/a3/decision-bugs.md`: a finished bug-hunt lesson. The loop bug hunt below has the same shape.

## Files
Create:
- `src/content/tracks/core/a4/nested-loops.md`
- `src/content/tracks/core/a4/break-continue.md`
- `src/content/tracks/core/a4/loop-bugs.md`

Edit:
- none

Do not touch any other file.

## Interface
Use these headers exactly as written. Do not add, remove or rename keys. Write the body below each header yourself. If a header breaks a build rule, stop and say so in your final message; you may wrap code in a kid hint in backticks, which the build counts as one word.

### nested-loops.md

```yaml
---
id: core.c.nested-loops
kind: lesson
track: core
unit: a4
order: 4
title: Nested loops and patterns
titleKid: A loop inside a loop
language: c
concepts: [nested-loop, rows-and-columns, pattern]
prereqs: [core.c.for]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["3"]
        expect: "*\n**\n***\n"
      - stdin: ["1"]
        expect: "*\n"
      - stdin: ["5"]
        expect: "*\n**\n***\n****\n*****\n"
  - type: code-contains
    pattern: 'for[\s\S]*for'
    message: Uses one loop inside another
hints:
  - The outer loop counts rows, from 1 to n. The inner loop prints the stars for one row.
  - Row 1 has one star, row 2 has two, so the inner loop runs from 1 to the row number. After the inner loop, print a new line.
  - 'The loops are: for (int row = 1; row <= n; row++) { for (int col = 1; col <= row; col++) { printf("*"); } printf("\n"); }'
hintsKid:
  - The big loop makes rows. The small loop makes stars.
  - Row 2 gets two stars. Row 3 gets three stars.
  - 'Type this: `for (int row = 1; row <= n; row++) { for (int col = 1; col <= row; col++) { printf("*"); } printf("\n"); }`'
---
```

Body must cover, in this order:
1. A loop's body can hold anything, including another loop. The inner loop then runs all the way through once for every turn of the outer loop.
2. Rows and columns: the outer loop counts rows, the inner loop counts columns, and a `printf("\n")` after the inner loop ends each row. Show a rectangle of 3 rows and 4 stars as the first example and its output.
3. A trace in words or a short table: for each value of `row`, which values `col` takes, so the reader can see the inner loop start again from the beginning each time.
4. How many times the inner body runs in total: rows times columns (3 times 4 is 12 for the rectangle).
5. Patterns where the inner loop depends on the outer counter: a triangle whose row `r` has `r` stars. Explain that changing the inner loop's test from `col <= 4` to `col <= row` is what turns a rectangle into a triangle.
6. Use different counter names for the two loops (`row` and `col`, or `i` and `j`).
7. A short "Common mistakes" list: using the same counter name in both loops; putting the `printf("\n")` inside the inner loop (one star per line); forgetting it entirely (one long line).

Keep every loop small: the product of the two loop sizes stays under 1000.

Example block (`{role=example file=grid.c}`): a program with no input that prints a 3-row, 4-column multiplication grid with nested `for` loops, `row` and `col` as counters, each number printed with `printf("%4d", row * col);` and a new line after each row. Its output is:

```
   1   2   3   4
   2   4   6   8
   3   6   9  12
```

Task: the starter reads `n` with `scanf` and has the comment `// Print the triangle here.`. The learner prints a triangle of `n` rows where row 1 has one `*` and row `n` has `n`. Starter file name `triangle.c`. The solution replaces the comment with:

```c
    for (int row = 1; row <= n; row++) {
        for (int col = 1; col <= row; col++) {
            printf("*");
        }
        printf("\n");
    }
```

### break-continue.md

```yaml
---
id: core.c.break-continue
kind: lesson
track: core
unit: a4
order: 5
title: break and continue
titleKid: Stop now, or skip this one
language: c
concepts: [break, continue, sentinel, loop-control]
prereqs: [core.c.for]
links:
  - to: core.c.switch
    kind: same-idea
    note: The same break word leaves a switch. Inside a loop it leaves the loop.
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["4", "-2", "3", "0"]
        expect: "Sum: 7\n"
      - stdin: ["5", "0", "8"]
        expect: "Sum: 5\n"
      - stdin: ["-5", "-1", "10", "0", "99"]
        expect: "Sum: 10\n"
      - stdin: ["0"]
        expect: "Sum: 0\n"
  - type: code-contains
    pattern: '\bbreak\s*;'
    message: Uses break to stop at 0
  - type: code-contains
    pattern: '\bcontinue\s*;'
    message: Uses continue to skip negative numbers
hints:
  - Right after the scanf, check for 0 first. If n == 0, break leaves the loop at once.
  - Then check for a negative number. If n < 0, continue skips the rest of this turn, so the number is never added.
  - 'The two checks are: if (n == 0) { break; } and then if (n < 0) { continue; }, both before total += n;'
hintsKid:
  - First, stop the loop when the number is 0. Use break.
  - Next, skip numbers under 0. Use continue.
  - 'Type these before the adding line: `if (n == 0) { break; }` and `if (n < 0) { continue; }`'
---
```

Body must cover, in this order:
1. A loop normally stops only when its test fails. Two words change that from inside the body: `break` and `continue`.
2. `break` leaves the loop at once; the program carries on after the loop's closing brace. Show a loop that reads numbers and stops at the first 0, and say this is called a stop value (programmers also say sentinel).
3. `while (1)` with a `break`: a loop whose test is always true and which ends only through `break`. Show it briefly and say that it must contain a `break` that will be reached, or it runs forever.
4. `continue` skips the rest of this turn and goes straight to the next one; in a `for` loop the step still runs. Show printing only the even numbers from 1 to 10 by continuing past odd ones. Its output is `2 4 6 8 10`.
5. In nested loops, `break` and `continue` affect only the innermost loop they are in.
6. Use them to keep loops simple, not as a habit: a loop with several `break`s is hard to follow.
7. A short "Common mistakes" list: `continue` placed after the line it was meant to skip; a `while (1)` whose `break` can never be reached; in a `while` loop, a `continue` that jumps past the line that changes the counter, so the loop never ends.

Example block (`{role=example file=evens.c}`): a program with no input that prints the even numbers from 1 to 10 on one line, separated by spaces, using a `for` loop with `if (i % 2 != 0) { continue; }`, then prints a new line.

Task: the starter is exactly this program:

```c
#include <stdio.h>

int main() {
    int n;
    int total = 0;

    for (int i = 0; i < 10; i++) {
        scanf("%d", &n);
        // Stop at 0, and skip negative numbers.
        total += n;
    }

    printf("Sum: %d\n", total);

    return 0;
}
```

It reads up to 10 numbers and adds them all. The learner makes it stop when a 0 is typed and leave negative numbers out of the sum. Starter file name `positives.c`. The solution replaces the comment with:

```c
        if (n == 0) {
            break;
        }
        if (n < 0) {
            continue;
        }
```

The task text explains: read up to 10 numbers; a 0 means "no more numbers" and is not added; negative numbers are skipped; print the sum of the rest.

### loop-bugs.md

```yaml
---
id: core.c.loop-bugs
kind: lesson
track: core
unit: a4
order: 6
title: "Bug hunt: loops"
titleKid: Find the loop mistakes
language: c
concepts: [logic-error, debugging, off-by-one, accumulator, loop-invariant, infinite-loop]
prereqs: [core.c.for, core.c.decision-bugs]
links:
  - to: core.c.decision-bugs
    kind: builds-on
    note: The same hunting method, applied to loops.
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["5"]
        expect: "Sum: 15\nEven numbers: 2\n"
      - stdin: ["10"]
        expect: "Sum: 55\nEven numbers: 5\n"
      - stdin: ["4"]
        expect: "Sum: 10\nEven numbers: 2\n"
      - stdin: ["1"]
        expect: "Sum: 1\nEven numbers: 0\n"
  - type: code-contains
    pattern: 'total\s*\+='
    message: Adds each number to the total with +=
hints:
  - Work out the right answers by hand first. For 5, the sum 1 + 2 + 3 + 4 + 5 is 15, and the even numbers are 2 and 4.
  - Run it with 5. The sum is far too small. Look at the line inside the loop that changes total. Does it add i, or replace total with i?
  - Fix one thing and run again. Then check where the loop stops (should 5 itself be counted?) and what total starts at before the loop.
hintsKid:
  - Work it out first. For 5 the sum is 15.
  - Look at the line that changes total. Does it add?
  - Check where the loop stops. Check what total starts at.
---
```

Body must cover, in this order:
1. Loop bugs are usually logic errors: the program runs and prints an answer, but the answer is wrong. Work the right answer out by hand for a small input before running anything.
2. The trace table as the main tool: write the counter and every variable the loop changes, one row per turn, and compare with what the code really does. Show a three-row trace of a small sum loop.
3. A simple loop invariant as a checking habit: a sentence that should be true at the start of every turn, such as "`total` holds the sum of all the numbers before `i`". If the sentence is false on some turn, the bug is in the line that broke it.
4. Five classic loop bugs, each with a short before-and-after code block (plain code blocks, never runnable):
   - Off by one: `i < n` when `n` itself should be included.
   - A total that does not start at 0, or starts in the wrong place (declared inside the loop, so it restarts every turn).
   - `=` where `+=` is meant: the total is replaced instead of added to.
   - An infinite loop: a counter that never changes, or changes the wrong way. Explain that the Stop button ends such a program. Show it only in a plain code block.
   - A semicolon straight after the loop brackets.
5. One fix at a time, then run again and check the trace again.

No example block in this file.

Task: the starter is exactly this program, which has three bugs on purpose:

```c
#include <stdio.h>

int main() {
    int n;
    int total = 1;
    int evens = 0;

    scanf("%d", &n);

    for (int i = 1; i < n; i++) {
        total = i;
        if (i % 2 == 0) {
            evens++;
        }
    }

    printf("Sum: %d\n", total);
    printf("Even numbers: %d\n", evens);

    return 0;
}
```

Starter file name `sums.c`. The solution is the same program with `int total = 0;`, `i <= n` and `total += i;`, and nothing else changed. The task text says what the program is meant to do: read `n`, print the sum of the whole numbers from 1 to `n`, and print how many of those numbers are even. It does not say where the bugs are.

## Behaviour
1. Every file follows `docs/LESSONS.md` exactly. `nested-loops.md` and `break-continue.md` have: header, explanation, `::: kid`, `{role=example}`, `::: try`, `::: try-kid`, `{role=starter}`, `{role=solution}`. `loop-bugs.md` has the same without the example block.
2. Explanations are for a first-year student with no programming background: plain words, short paragraphs, one idea per paragraph. Between 300 and 500 words each, not counting code and tables.
3. Kid blocks are written from scratch for a seven-year-old. Each one uses one concrete picture and has 6 to 10 short sentences on separate lines with blank lines between groups. Pictures to use: nested loops, planting a garden in rows, where for each row you plant every seed before starting the next row; break and continue, picking strawberries, where you skip the green ones (continue) and stop when your basket is full (break); loop bugs, counting sheep jumping a fence and checking your count after each sheep.
4. Kid text rules are enforced by the build: at most 12 words per sentence, and none of the banned words listed in `docs/LESSONS.md`. This applies to the `::: kid` block, the `::: try-kid` block and `titleKid`. A colon also ends a sentence for counting.
5. All C code uses `int main()` (never `int main(void)`), includes `<stdio.h>`, uses 4 spaces to indent, puts braces around every loop and `if` body, and ends with `return 0;`. The planted bugs in the loop bug hunt are the only exceptions.
6. No starter, solution or example may contain a loop that never ends. Code that shows an infinite loop goes only in an ordinary code block (no `role`), never in a block that is run.
7. Do not use `bool`, `true`, `false` or `<stdbool.h>`. Do not use `scanf("%c", ...)`.
8. Starter and solution must differ only by the lines the learner is asked to write or fix.
9. Do not describe how this website behaves beyond pressing Run, Check my answer, and the Stop button ending a program. No raw HTML, no links to outside websites.

## Tests
No new test file. The existing `tests/unit/content.test.ts` picks up the new lessons automatically and must show, for each new id:
- `<id>: the solution passes its checks`
- `<id>: the starter does not pass yet`
- for `core.c.nested-loops` and `core.c.break-continue`: `<id>: the example runs without an error`
- `lesson library > has no problems`

## Acceptance
Run from the repository root. Run each command exactly as written: no pipes, no redirection, no extra flags (the sandbox denies anything else).

```
npx vitest run tests/unit/content.test.ts
npm run typecheck
```

If the first command reports a problem with a lesson, the message names the file and the rule. Fix the lesson text, never the test, the compiler or the header given above. A failure that mentions "loops forever" means a runnable block contains a loop that never ends.

## Constraints
- Original wording and code only. Do not copy sentences from the existing lessons or from any book or website.
- No new dependencies. No network access. No changes to config files, tests or TypeScript files.
- Do not change the headers given above, apart from the backtick allowance in kid hints described under Interface.
- Do not commit. Leave the changes in the working tree.

## Output
Only the three files listed above. No summary document. In your final message, list anything in this brief that you could not follow and why.
