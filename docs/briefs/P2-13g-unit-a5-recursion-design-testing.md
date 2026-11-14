# P2-13g Unit A5 lessons: recursion, top-down design, testing functions

## Context
CPE Online is a browser IDE with a Learn mode for beginner programmers. A lesson is one Markdown file; the build compiles it and the tests run its code through a real C interpreter. This package adds the last three lessons of unit A5 ("Functions").

Read these first, in this order:
1. `docs/LESSONS.md`: the lesson file format and every rule the build enforces.
2. `src/content/tracks/core/a5/parameters.md`: a finished lesson in the same unit. Match its depth, tone and layout, and its `::: kid` block: short sentences on separate lines with blank lines between groups, built around one picture.
3. `src/content/tracks/core/a5/scope.md`: another finished lesson in the same unit.

## Files
Create:
- `src/content/tracks/core/a5/recursion.md`
- `src/content/tracks/core/a5/top-down.md`
- `src/content/tracks/core/a5/testing-functions.md`

Edit:
- none

Do not touch any other file.

## Interface
Use these headers exactly as written. Do not add, remove or rename keys. Write the body below each header yourself. If a header breaks a build rule, stop and say so in your final message; you may wrap code in a kid hint in backticks, which the build counts as one word.

### recursion.md

```yaml
---
id: core.c.recursion
kind: lesson
track: core
unit: a5
order: 4
title: Recursion
titleKid: A helper that asks itself
language: c
concepts: [recursion, base-case, call-stack]
prereqs: [core.c.parameters]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["2", "10"]
        expect: "1024\n"
      - stdin: ["3", "0"]
        expect: "1\n"
      - stdin: ["5", "3"]
        expect: "125\n"
      - stdin: ["7", "1"]
        expect: "7\n"
  - type: code-contains
    pattern: 'return\s+[^;]*\bpower\s*\('
    message: power calls itself
hints:
  - Start with the base case. Any number to the power 0 is 1, so if exp is 0, return 1.
  - For a bigger exp, base to the power exp is base times base to the power exp - 1. That smaller problem is a call to power itself.
  - 'The body is: if (exp == 0) { return 1; } return base * power(base, exp - 1);'
hintsKid:
  - When exp is 0, the answer is 1. Return 1.
  - Otherwise, multiply base by a smaller power.
  - 'Type this: `if (exp == 0) { return 1; } return base * power(base, exp - 1);`'
---
```

Body must cover, in this order:
1. A function may call itself. This is recursion. It works when each call hands a smaller version of the same problem to the next call, until the problem is so small the answer is known straight away.
2. The two parts every recursive function needs: a base case, which answers without calling again, and a recursive case, which calls the function on a smaller problem. Show `factorial`: `factorial(1)` is 1, and `factorial(n)` is `n * factorial(n - 1)`.
3. A trace of `factorial(4)`: the calls going down (4 asks 3, 3 asks 2, 2 asks 1) and the answers coming back up (1, then 2, then 6, then 24). Use a small table or an indented list.
4. Each call has its own copy of `n`, kept until that call returns. The computer keeps these waiting calls in a stack.
5. A missing or unreachable base case: the calls never stop, the stack runs out of room, and the program stops with an error about the call stack. Show it only in a plain code block.
6. Recursion against loops: anything here could also be written with a loop, and a loop is often simpler and faster. Recursion shines when a problem is naturally made of smaller copies of itself, such as searching a tree of folders. Keep recursive calls shallow here: a few dozen levels at most.
7. A short "Common mistakes" list: no base case; a recursive call that does not get smaller (`factorial(n)` instead of `factorial(n - 1)`); forgetting to `return` the result of the recursive call.

Example block (`{role=example file=factorial.c}`): a program with no input that defines `int factorial(int n)` with base case `n <= 1` and prints `1! = 1` up to `5! = 120`, one line each, using a `for` loop in `main`.

Task: the starter is exactly this program:

```c
#include <stdio.h>

int power(int base, int exp) {
    // Write power here, calling power itself.
    return 0;
}

int main() {
    int base, exp;

    scanf("%d", &base);
    scanf("%d", &exp);

    printf("%d\n", power(base, exp));
    return 0;
}
```

Starter file name `power.c`. The solution replaces the comment and `return 0;` inside `power` with:

```c
    if (exp == 0) {
        return 1;
    }
    return base * power(base, exp - 1);
```

The task text says that `power(base, exp)` multiplies `base` by itself `exp` times, that `exp` is 0 or more, that the answer for an `exp` of 0 is 1, and that the function must call itself rather than use a loop.

### top-down.md

```yaml
---
id: core.c.top-down
kind: lesson
track: core
unit: a5
order: 5
title: Top-down design
titleKid: Big job, small jobs
language: c
concepts: [top-down-design, decomposition, stub]
prereqs: [core.c.parameters]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["70", "85", "90"]
        expect: "Total: 245\nAverage: 81.67\nPass\n"
      - stdin: ["40", "50", "45"]
        expect: "Total: 135\nAverage: 45.00\nFail\n"
      - stdin: ["50", "50", "50"]
        expect: "Total: 150\nAverage: 50.00\nPass\n"
      - stdin: ["49", "50", "50"]
        expect: "Total: 149\nAverage: 49.67\nFail\n"
hints:
  - main is already finished. Fill in one function at a time, starting with total_of, and run after each one.
  - average_of must keep the decimals, so divide by 3.0, not by 3.
  - print_verdict prints Pass when the average is 50 or more and Fail otherwise, each followed by a new line.
hintsKid:
  - Main is done. Fill in one helper at a time.
  - Divide by 3.0 so the dot part stays.
  - Fifty or more is Pass. Anything less is Fail.
---
```

Body must cover, in this order:
1. Big programs are not written top to bottom in one go. Top-down design starts from the whole task and splits it into a few smaller jobs, then splits those again until each job is small enough to write as one function.
2. A worked example of the splitting for a marks report: read three marks; work out the total; work out the average; say Pass or Fail. Show it as an indented list first, then as a `main` that is just those steps as function calls.
3. Stubs: write each function's first line with a body that does almost nothing (returns 0, or prints nothing), so the whole program runs from the start. Then replace one stub at a time and run again after each.
4. Choosing what a function takes and gives back: what does it need to know (its parameters), and what single answer does it produce (its return value), or does it only print (`void`)?
5. Signs a function is too big: it does more than one job, it needs a long name with "and" in it, or it no longer fits on the screen.
6. A short "Common mistakes" list: writing all the code before running any of it; functions that both work something out and print it, so the answer cannot be reused; passing values the function does not use.

Example block (`{role=example file=room.c}`): a program with no input, designed top-down, that works out the floor area and the length of skirting board for a rectangular room 5 by 4 metres. It has `int area(int width, int length)`, `int perimeter(int width, int length)` and `void print_report(int floor, int edge)`. `main` sets `width` to 5 and `length` to 4, calls the two working functions, and passes their answers to `print_report`, which prints `Floor: 20 square metres` and `Skirting board: 18 metres`. Put the three functions above `main`.

Task: the starter is exactly this program:

```c
#include <stdio.h>

int total_of(int a, int b, int c) {
    // Add the three marks.
    return 0;
}

float average_of(int total) {
    // Divide by 3, keeping the decimals.
    return 0.0;
}

void print_verdict(float average) {
    // Print Pass for 50 or more, otherwise Fail.
}

int main() {
    int a, b, c;

    scanf("%d", &a);
    scanf("%d", &b);
    scanf("%d", &c);

    int total = total_of(a, b, c);
    float average = average_of(total);

    printf("Total: %d\n", total);
    printf("Average: %.2f\n", average);
    print_verdict(average);
    return 0;
}
```

Starter file name `report.c`. The solution fills in the three bodies, replacing each comment and stub `return`: `total_of` returns `a + b + c`; `average_of` returns `total / 3.0`; `print_verdict` prints `Pass\n` when `average >= 50` and `Fail\n` otherwise, using `if` and `else` with braces. `main` is unchanged. The task text explains that `main` was written first as a list of steps, that the three functions are stubs, and that the learner should complete them one at a time.

### testing-functions.md

```yaml
---
id: core.c.testing-functions
kind: lesson
track: core
unit: a5
order: 6
title: Testing functions
titleKid: Checking a helper's answers
language: c
concepts: [testing, test-cases, edge-cases, debugging]
prereqs: [core.c.parameters, core.c.decision-bugs]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["2024"]
        expect: "Leap\n"
      - stdin: ["2023"]
        expect: "Not leap\n"
      - stdin: ["1900"]
        expect: "Not leap\n"
      - stdin: ["2000"]
        expect: "Leap\n"
      - stdin: ["2100"]
        expect: "Not leap\n"
  - type: code-contains
    pattern: '%\s*400'
    message: Handles years divisible by 400
hints:
  - Test the function with the four kinds of year in the task. Which one gives the wrong answer?
  - 1900 is divisible by 4 and by 100 but not by 400, so it is not a leap year. The function only checks 4.
  - 'Check 400 first, then 100, then 4: if (year % 400 == 0) { return 1; } if (year % 100 == 0) { return 0; } return year % 4 == 0;'
hintsKid:
  - Try every kind of year in the task. Which one is wrong?
  - 1900 splits into groups of 100. So it is not a leap year.
  - 'Check 400 first: `if (year % 400 == 0) { return 1; }`'
---
```

Body must cover, in this order:
1. A function that gives the right answer once is not yet a function that works. Testing means choosing inputs on purpose, deciding the right answer before running, and comparing.
2. Choosing test cases: an ordinary value; the edges (0, 1, the largest or smallest values that make sense, the value right at a boundary); and every special rule in the task. Show a small table of cases with the expected answer for `absolute(n)` (5, -5, 0, -1).
3. A test driver: a `main` whose only job is to call the function with each case and report pass or fail. Show a `check(test, actual, expected)` helper that prints `Test 1: pass` or `Test 4: FAIL, got -1 but expected 1`.
4. When a test fails, the report says which input and what came back, which points straight at the case the code gets wrong. Then fix the function and run every test again, not only the one that failed, since a fix can break another case.
5. Testing cannot prove a function has no mistakes, only find the ones your cases reach. So spend your cases where mistakes hide: edges and special rules.
6. A short "Common mistakes" list: testing only the example from the task; working out the expected answer by running the code (it will agree with itself); changing the test to match a wrong answer.

Example block (`{role=example file=tests.c}`): a program with no input, exactly this:

```c
#include <stdio.h>

int absolute(int n) {
    if (n < 0) {
        return -n;
    }
    return n;
}

void check(int test, int actual, int expected) {
    if (actual == expected) {
        printf("Test %d: pass\n", test);
    } else {
        printf("Test %d: FAIL, got %d but expected %d\n", test, actual, expected);
    }
}

int main() {
    check(1, absolute(5), 5);
    check(2, absolute(-5), 5);
    check(3, absolute(0), 0);
    check(4, absolute(-1), 1);
    return 0;
}
```

The lesson text suggests changing `n < 0` to `n < -1` and running it again, to watch test 4 catch the mistake.

Task: the starter is exactly this program:

```c
#include <stdio.h>

int is_leap(int year) {
    return year % 4 == 0;
}

int main() {
    int year;

    scanf("%d", &year);

    if (is_leap(year)) {
        printf("Leap\n");
    } else {
        printf("Not leap\n");
    }
    return 0;
}
```

Starter file name `leap.c`. The solution changes only the body of `is_leap` to:

```c
    if (year % 400 == 0) {
        return 1;
    }
    if (year % 100 == 0) {
        return 0;
    }
    return year % 4 == 0;
```

The task text states the full rule: a year is a leap year if it is divisible by 4, except that years divisible by 100 are not, except that years divisible by 400 are. It gives four years to test with, 2024, 2023, 1900 and 2000, says the function passes some of these and not others, and asks the learner to test, find the failing case and fix `is_leap`.

## Behaviour
1. Every file follows `docs/LESSONS.md` exactly: header, explanation, a `::: kid` block, a `{role=example}` block, then `::: try`, `::: try-kid`, `{role=starter}` and `{role=solution}` blocks.
2. Explanations are for a first-year student with no programming background: plain words, short paragraphs, one idea per paragraph. Between 300 and 500 words each, not counting code and tables.
3. Kid blocks are written from scratch for a seven-year-old. Each one uses one concrete picture and has 6 to 10 short sentences on separate lines with blank lines between groups. Pictures to use: recursion, a set of nesting dolls, where you open each doll to find a smaller one until the tiniest doll does not open; top-down design, planning a party by splitting it into small jobs (invitations, cake, games) and doing one at a time; testing, throwing a paper plane in different ways (gently, hard, into the wind) to see if it really flies.
4. Kid text rules are enforced by the build: at most 12 words per sentence, and none of the banned words listed in `docs/LESSONS.md` (note that "parameter", "argument" and "function call" are banned in kid text; say "helper" and so on). This applies to the `::: kid` block, the `::: try-kid` block and `titleKid`. A colon also ends a sentence for counting.
5. All C code uses `int main()` (never `int main(void)`), includes `<stdio.h>`, uses 4 spaces to indent, puts braces around every `if` and loop body, and ends `main` with `return 0;`. Function names are lower case with `_` between words. Functions sit above `main` in every runnable block.
6. No starter, solution or example may contain a loop or recursion that never ends; recursion in runnable code goes no deeper than about 20 calls. Code that shows endless recursion goes only in an ordinary code block (no `role`).
7. Do not use `bool`, `true`, `false` or `<stdbool.h>`. Do not use `scanf("%c", ...)`.
8. Starter and solution must differ only by the lines the learner is asked to write or fix.
9. Do not describe how this website behaves beyond pressing Run and Check my answer. No raw HTML, no links to outside websites. Use "they" for any person who is not named.

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
- Do not change the headers given above, apart from the backtick allowance in kid hints described under Interface.
- Do not commit. Leave the changes in the working tree.

## Output
Only the three files listed above. No summary document. In your final message, list anything in this brief that you could not follow and why.
