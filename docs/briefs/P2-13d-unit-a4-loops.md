# P2-13d Unit A4 lessons: while, for, do-while

## Context
CPE Online is a browser IDE with a Learn mode for beginner programmers. A lesson is one Markdown file; the build compiles it and the tests run its code through a real C interpreter. This package adds the first three lessons of unit A4 ("Loops").

Read these first, in this order:
1. `docs/LESSONS.md`: the lesson file format and every rule the build enforces.
2. `src/content/tracks/core/a3/else-if.md`: a finished lesson. Match its depth, tone and layout, and its `::: kid` block: short sentences on separate lines with blank lines between groups, built around one picture.
3. `src/content/tracks/core/a3/switch.md`: another finished lesson.

## Files
Create:
- `src/content/tracks/core/a4/while.md`
- `src/content/tracks/core/a4/for.md`
- `src/content/tracks/core/a4/do-while.md`

Edit:
- none

Do not touch any other file.

## Interface
Use these headers exactly as written. Do not add, remove or rename keys. Write the body below each header yourself.

### while.md

```yaml
---
id: core.c.while
kind: lesson
track: core
unit: a4
order: 1
title: while loops
titleKid: Doing it again and again
language: c
concepts: [loop, while, condition, counter, infinite-loop]
prereqs: [core.c.if-else]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["3"]
        expect: "3\n2\n1\nLiftoff!\n"
      - stdin: ["1"]
        expect: "1\nLiftoff!\n"
      - stdin: ["0"]
        expect: "Liftoff!\n"
  - type: code-contains
    pattern: 'while\s*\('
    message: Uses a while loop to count down
hints:
  - The loop should keep going while n is bigger than 0, so the condition is n > 0.
  - Inside the loop, print n and then make it one smaller with n--. Without n-- the loop never ends.
  - 'The loop is: while (n > 0) { printf("%d\n", n); n--; }'
hintsKid:
  - Keep going while n > 0.
  - Say the number. Then make it one smaller with n--.
  - 'Type this: while (n > 0) { printf("%d\n", n); n--; }'
---
```

Body must cover, in this order:
1. A loop repeats lines. `while` repeats them as long as a condition is true, like an `if` that keeps coming back.
2. The shape of `while` in a code block, and the order things happen in: test the condition; if true, run the body, then go back and test again; if false, skip to the line after the closing brace.
3. A worked trace: a short loop that prints 1, 2, 3 with a counter `i`, followed by a small table showing the value of `i` and the condition's result (1 or 0) at each test, including the last test that ends the loop.
4. The three parts every counting loop needs: a starting value before the loop, a condition, and a change inside the body that moves towards making the condition false.
5. Infinite loops: if nothing in the body changes the condition, the loop never ends and the program never finishes. Show the countdown with `n--` missing. Say that the Stop button ends a program that will not finish.
6. A `while` loop can run zero times: if the condition is false at the start, the body is skipped.
7. A short "Common mistakes" list: forgetting to change the counter; changing it the wrong way (`n++` in a countdown); a semicolon after the condition, `while (n > 0);`, which makes an empty loop.

Keep every loop in this file small: fewer than 1000 repetitions. The interpreter is slow with very long loops.

Example block (`{role=example file=doubling.c}`): a program with no input that starts with `int amount = 1;` and `int days = 0;`, doubles `amount` in a `while (amount <= 100)` loop while counting days, and then prints `After 7 days the amount is 128` using `%d` for both numbers.

Task: the starter reads `n` with `scanf`, has the comment `// Count down here.`, and already ends with `printf("Liftoff!\n");`. The learner writes a `while` loop that prints `n`, `n - 1`, ... down to `1`, one number per line, before Liftoff. Starter file name `countdown.c`. The solution replaces the comment with:

```c
    while (n > 0) {
        printf("%d\n", n);
        n--;
    }
```

### for.md

```yaml
---
id: core.c.for
kind: lesson
track: core
unit: a4
order: 2
title: for loops
titleKid: Counting from start to finish
language: c
concepts: [loop, for, counter, increment]
prereqs: [core.c.while]
links:
  - to: core.c.while
    kind: builds-on
    note: A for loop is a while loop with its start, test and step written on one line.
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["3"]
        expect: "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n"
      - stdin: ["7"]
        expect: "7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n"
  - type: code-contains
    pattern: 'for\s*\('
    message: Uses a for loop
hints:
  - The counter goes from 1 to 5. Start it at 1, keep going while it is 5 or less, and add one each time.
  - Inside the loop, print one line of the table using n, the counter, and their product.
  - 'The loop is: for (int i = 1; i <= 5; i++) { printf("%d x %d = %d\n", n, i, n * i); }'
hintsKid:
  - Count from 1 to 5. Start at 1. Stop after 5.
  - Each time, say one line of the table.
  - 'Type this: for (int i = 1; i <= 5; i++) { printf("%d x %d = %d\n", n, i, n * i); }'
---
```

Body must cover, in this order:
1. Many loops count: start somewhere, stop somewhere, step each time. `for` puts those three parts on one line, where they are easy to check.
2. The shape `for (start; test; step) { ... }` in a code block, with what each of the three parts does and when it runs: start once at the beginning; test before every repetition; step after every repetition.
3. The same counting loop written with `while` and with `for`, side by side, so the three parts can be matched up.
4. Counting in other ways: down (`i--`), in steps of 2 (`i += 2`), and the meaning of `i < 5` against `i <= 5` (four or five repetitions when starting at 1? show both and count them).
5. A counter declared in the brackets, `for (int i = 1; ...)`, exists only inside the loop.
6. Adding things up with a loop: a `total` that starts at 0 and has `i` added each time; show summing 1 to 10 and the answer 55.
7. A short "Common mistakes" list: off by one (`<` when `<=` was meant); a semicolon straight after the brackets, `for (...);`, which runs an empty loop; changing the counter inside the body as well as in the step.

Keep every loop in this file small: fewer than 1000 repetitions.

Example block (`{role=example file=squares.c}`): a program with no input that prints `1 squared is 1` up to `5 squared is 25`, one line each, with a `for` loop and `%d`.

Task: the starter reads `n` with `scanf` and has the comment `// Print the table here.`. The learner prints the first five lines of the times table for `n`, in the form `3 x 1 = 3`. Starter file name `table.c`. The solution replaces the comment with:

```c
    for (int i = 1; i <= 5; i++) {
        printf("%d x %d = %d\n", n, i, n * i);
    }
```

### do-while.md

```yaml
---
id: core.c.do-while
kind: lesson
track: core
unit: a4
order: 3
title: do-while loops
titleKid: Try first, then check
language: c
concepts: [loop, do-while, input-checking]
prereqs: [core.c.while]
links:
  - to: core.c.while
    kind: contrast
    note: while tests before the first run, so its body can run zero times; do-while always runs its body at least once.
est_minutes: 10
checks:
  - type: io-cases
    cases:
      - stdin: ["5"]
        expect: "You chose 5\n"
      - stdin: ["0", "11", "4"]
        expect: "You chose 4\n"
      - stdin: ["-3", "10"]
        expect: "You chose 10\n"
  - type: code-contains
    pattern: 'do\s*\{'
    message: Uses a do-while loop
hints:
  - The number has to be read at least once, which is exactly what do-while is for. Put the scanf inside do { ... }.
  - The loop should repeat while the number is out of range, that is while n < 1 || n > 10.
  - 'The loop is: do { scanf("%d", &n); } while (n < 1 || n > 10);'
hintsKid:
  - Read the number inside do. It always runs once.
  - Ask again if it is under 1 or over 10.
  - 'Type this: do { scanf("%d", &n); } while (n < 1 || n > 10);'
---
```

Body must cover, in this order:
1. `while` tests first, so its body may never run. Sometimes the body must run at least once before there is anything to test, such as reading an answer before checking it.
2. The shape `do { ... } while (condition);` in a code block, the order (run the body, then test, then repeat if true), and that the semicolon after the closing bracket is required here, unlike after a `while` condition.
3. The classic use: asking again until the input is acceptable. Show it with a range 1 to 10 and explain the condition `n < 1 || n > 10` as "out of range".
4. Comparing the three loops in a small table: when the test happens, the fewest times the body can run, and a typical use.
5. A short "Common mistakes" list: leaving out the semicolon after `while (...)`; writing the condition for "good" input instead of "bad" input (the loop repeats while the condition is true); declaring the variable inside the braces, so the condition cannot see it.

Example block (`{role=example file=digits.c}`): a program with no input that counts the digits of 4096 with a `do-while` loop (divide by 10 and count until the number reaches 0) and prints `4096 has 4 digits`, then does the same for 0 and prints `0 has 1 digit`, and says in a comment that a `while` loop would have reported 0 digits for 0.

Task: the starter declares `int n;`, reads it once with `scanf("%d", &n);`, and ends with `printf("You chose %d\n", n);`. The comment `// Keep asking until n is from 1 to 10.` sits above the `scanf` line. The learner wraps the reading in a `do-while` loop. Starter file name `choose.c`. The solution replaces the comment and the single `scanf` line with:

```c
    do {
        scanf("%d", &n);
    } while (n < 1 || n > 10);
```

The task text says that the program is tested with someone typing numbers that are out of range before a good one.

## Behaviour
1. Every file follows `docs/LESSONS.md` exactly: header, explanation, a `::: kid` block, a `{role=example}` block, then `::: try`, `::: try-kid`, `{role=starter}` and `{role=solution}` blocks.
2. Explanations are for a first-year student with no programming background: plain words, short paragraphs, one idea per paragraph. Between 300 and 500 words each, not counting code and tables.
3. Kid blocks are written from scratch for a seven-year-old. Each one uses one concrete picture and has 6 to 10 short sentences on separate lines with blank lines between groups. Pictures to use: while, washing plates while there are dirty plates in the sink; for, climbing a staircase and counting each step from 1 to the top; do-while, tasting soup (you always taste once, then add salt and taste again while it is not right).
4. Kid text rules are enforced by the build: at most 12 words per sentence, and none of the banned words listed in `docs/LESSONS.md`. This applies to the `::: kid` block, the `::: try-kid` block and `titleKid`. A colon also ends a sentence for counting.
5. All C code uses `int main()` (never `int main(void)`), includes `<stdio.h>`, uses 4 spaces to indent, puts braces around every loop and `if` body, and ends with `return 0;`.
6. No starter, solution or example may contain a loop that never ends. Code that shows an infinite loop goes only in an ordinary code block (no `role`), never in a block that is run.
7. Do not use `bool`, `true`, `false` or `<stdbool.h>`. Do not use `scanf("%c", ...)`.
8. Starter and solution must differ only by the lines the learner is asked to write.
9. Do not describe how this website behaves beyond pressing Run, Check my answer, and the Stop button ending a program. No raw HTML, no links to outside websites.

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

If the first command reports a problem with a lesson, the message names the file and the rule. Fix the lesson text, never the test, the compiler or the header given above. If the first command does not finish within a few minutes, a runnable block contains a loop that never ends: find it and fix it.

## Constraints
- Original wording and code only. Do not copy sentences from the existing lessons or from any book or website.
- No new dependencies. No network access. No changes to config files, tests or TypeScript files.
- Do not change the headers given above. If a header seems wrong, stop and say so in your final message.
- Do not commit. Leave the changes in the working tree.

## Output
Only the three files listed above. No summary document. In your final message, list anything in this brief that you could not follow and why.
