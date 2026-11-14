# P2-13h Unit A6 lessons: arrays, array statistics, searching

## Context
CPE Online is a browser IDE with a Learn mode for beginner programmers. A lesson is one Markdown file; the build compiles it and the tests run its code through a real C interpreter. This package adds the first three lessons of unit A6 ("Arrays and strings").

Read these first, in this order:
1. `docs/LESSONS.md`: the lesson file format and every rule the build enforces.
2. `src/content/tracks/core/a5/parameters.md`: a finished lesson. Match its depth, tone and layout, and its `::: kid` block: short sentences on separate lines with blank lines between groups, built around one picture.
3. `src/content/tracks/core/a4/for.md`: another finished lesson.

## Files
Create:
- `src/content/tracks/core/a6/arrays.md`
- `src/content/tracks/core/a6/array-stats.md`
- `src/content/tracks/core/a6/searching.md`

Edit:
- none

Do not touch any other file.

## Interface
Use these headers exactly as written. Do not add, remove or rename keys. Write the body below each header yourself. If a header breaks a build rule, stop and say so in your final message; you may wrap code in a kid hint in backticks, which the build counts as one word.

### arrays.md

```yaml
---
id: core.c.arrays
kind: lesson
track: core
unit: a6
order: 1
title: Arrays
titleKid: A row of numbered boxes
language: c
concepts: [array, index, element, sizeof]
prereqs: [core.c.for]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["1", "2", "3", "4", "5"]
        expect: "5\n4\n3\n2\n1\n"
      - stdin: ["10", "-3", "0", "7", "7"]
        expect: "7\n7\n0\n-3\n10\n"
  - type: code-contains
    pattern: 'for[\s\S]*for'
    message: Uses a second loop to print the numbers
hints:
  - The numbers are already in values[0] to values[4]. To print them backwards, start at the last index, 4, and count down to 0.
  - A for loop can count down. Start at 4, keep going while i >= 0, and use i-- as the step.
  - 'The loop is: for (int i = 4; i >= 0; i--) { printf("%d\n", values[i]); }'
hintsKid:
  - The last box is number 4. The first box is number 0.
  - Count down from 4 to 0. Say each box.
  - 'Type this: `for (int i = 4; i >= 0; i--) { printf("%d\n", values[i]); }`'
---
```

Body must cover, in this order:
1. Five marks in five separate variables (`mark1` to `mark5`) work, but fifty would not. An array is one name for a row of values of the same type, each reached by its position.
2. Making an array: `int marks[5];` makes five `int` boxes. Giving starting values: `int marks[5] = {72, 85, 91, 64, 78};`. Leaving the size out when values are given: `int marks[] = {72, 85, 91};`. Giving fewer values than boxes fills the rest with 0, so `int counts[10] = {0};` starts every box at 0.
3. Indexes start at 0. In an array of 5, the positions are 0 to 4. `marks[0]` is the first, `marks[4]` the last. Show reading and changing one element: `marks[2] = 95;`.
4. Arrays and loops belong together: a `for` loop with `i` from 0 to less than the size visits every element. Show printing every mark with its index, and reading five numbers into an array with `scanf("%d", &values[i]);` inside a loop.
5. Working out the number of elements: `sizeof(marks) / sizeof(marks[0])`. Explain in one sentence that `sizeof` gives a size in bytes, so dividing the whole by one element gives the count.
6. Going past the end: `marks[5]` in an array of 5 does not exist. Here the program stops with an error saying the index is out of bounds; on many other systems it quietly reads or overwrites some other memory, which is worse.
7. A short "Common mistakes" list: starting at 1 instead of 0; `i <= 5` in a loop over 5 elements; forgetting the `&` before `values[i]` in `scanf`.

Example block (`{role=example file=marks.c}`): a program with no input that makes `int marks[5] = {72, 85, 91, 64, 78};`, works out the count with `sizeof`, prints `There are 5 marks.`, prints the first and last mark, changes `marks[2]` to 95, and prints every mark as `marks[0] = 72` and so on with a `for` loop.

Task: the starter is exactly this program:

```c
#include <stdio.h>

int main() {
    int values[5];

    for (int i = 0; i < 5; i++) {
        scanf("%d", &values[i]);
    }

    // Print the numbers in reverse order, one per line.

    return 0;
}
```

Starter file name `reverse.c`. The solution replaces the comment with:

```c
    for (int i = 4; i >= 0; i--) {
        printf("%d\n", values[i]);
    }
```

### array-stats.md

```yaml
---
id: core.c.array-stats
kind: lesson
track: core
unit: a6
order: 2
title: Simple statistics
titleKid: Biggest, smallest and in the middle
language: c
concepts: [array, sum, average, maximum, minimum]
prereqs: [core.c.arrays]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["5", "4", "9", "1", "7", "3"]
        expect: "Sum: 24\nAverage: 4.80\nLargest: 9\nSmallest: 1\n"
      - stdin: ["3", "-5", "-2", "-9"]
        expect: "Sum: -16\nAverage: -5.33\nLargest: -2\nSmallest: -9\n"
      - stdin: ["1", "42"]
        expect: "Sum: 42\nAverage: 42.00\nLargest: 42\nSmallest: 42\n"
      - stdin: ["4", "10", "10", "20", "20"]
        expect: "Sum: 60\nAverage: 15.00\nLargest: 20\nSmallest: 10\n"
hints:
  - Starting largest and smallest at 0 goes wrong when every number is negative, or every number is positive. Start both at the first value, values[0].
  - Then loop over the rest, from index 1. When a value is bigger than largest, it becomes the new largest. Do the same for smallest.
  - 'Start with int largest = values[0]; and int smallest = values[0]; then inside the loop: if (values[i] > largest) { largest = values[i]; } and the same with < for smallest.'
hintsKid:
  - Start both at the first number, not at 0.
  - Look at each other number. Is it bigger? Keep it.
  - 'Start with this: `int largest = values[0];` and `int smallest = values[0];`'
---
```

Body must cover, in this order:
1. Once values sit in an array, a few short loops answer the questions people ask most about a list of numbers: the total, the average, the largest and the smallest.
2. The sum: a variable that starts at 0 and has each element added. The average: the sum divided by the count, as a decimal, `(float) sum / count`. Explain `(float)` in one sentence: it turns the whole-number sum into a decimal so the division keeps its fraction.
3. The largest value: keep a best-so-far. Start it at the first element, then look at each other element and replace the best when you find a bigger one. Show a three-row trace on a short list.
4. Why not start at 0: if every number is negative, 0 is bigger than all of them and wins without being in the list. Starting at the first element is always safe.
5. The smallest value works the same way with `<`.
6. Reading a count first: a program can read how many numbers will follow, then read that many, as long as the array is big enough. Say that the array here has room for 10, so the count must be at most 10.
7. A short "Common mistakes" list: starting the largest or smallest at 0; integer division in the average (`sum / count`); a loop that starts at index 1 for the sum (and so misses the first value).

Example block (`{role=example file=rainfall.c}`): a program with no input that holds seven daily rainfall readings in millimetres, `int rain[7] = {0, 12, 5, 0, 23, 8, 3};`, and prints the total (`Total: 51 mm`), the average with two decimals (`Average: 7.29 mm`) and the wettest day number (days counted from 1, so `Wettest day: 5`), keeping both the largest value and its index while looping.

Task: the starter is exactly this program:

```c
#include <stdio.h>

int main() {
    int count;
    int values[10];
    int sum = 0;

    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        scanf("%d", &values[i]);
        sum += values[i];
    }

    int largest = 0;
    int smallest = 0;

    // Find the largest and smallest here.

    printf("Sum: %d\n", sum);
    printf("Average: %.2f\n", (float) sum / count);
    printf("Largest: %d\n", largest);
    printf("Smallest: %d\n", smallest);
    return 0;
}
```

It already reads the numbers and works out the sum and average. Starter file name `stats.c`. The solution changes the two starting values to `values[0]` and replaces the comment with:

```c
    for (int i = 1; i < count; i++) {
        if (values[i] > largest) {
            largest = values[i];
        }
        if (values[i] < smallest) {
            smallest = values[i];
        }
    }
```

The task text says the first number typed is how many numbers follow (from 1 to 10), that the sum and average already work, and that the learner must find the largest and smallest, and that the program is checked with lists that are all negative as well as all positive.

### searching.md

```yaml
---
id: core.c.searching
kind: lesson
track: core
unit: a6
order: 3
title: Searching an array
titleKid: Looking in every box
language: c
concepts: [linear-search, array-parameter, sentinel-result]
prereqs: [core.c.arrays, core.c.parameters]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["4", "8", "15", "16", "23", "42", "15"]
        expect: "Found at index 2\n"
      - stdin: ["4", "8", "15", "16", "23", "42", "7"]
        expect: "Not found\n"
      - stdin: ["4", "8", "15", "16", "23", "42", "4"]
        expect: "Found at index 0\n"
      - stdin: ["4", "8", "15", "16", "23", "42", "42"]
        expect: "Found at index 5\n"
      - stdin: ["5", "3", "5", "3", "5", "3", "3"]
        expect: "Found at index 1\n"
hints:
  - Look at each element in turn with a for loop from 0 to count - 1.
  - As soon as values[i] equals target, return i. The function ends there, which also gives the first match when there are several.
  - 'The body is: for (int i = 0; i < count; i++) { if (values[i] == target) { return i; } } return -1;'
hintsKid:
  - Look in each box, one at a time.
  - Found it? Give back the box number straight away.
  - 'Type this: `for (int i = 0; i < count; i++) { if (values[i] == target) { return i; } } return -1;`'
---
```

Body must cover, in this order:
1. Searching asks: is this value in the array, and where? The simplest way, linear search, looks at each element in turn from the start until it finds the value or runs out of elements.
2. Passing an array to a function: the parameter is written `int values[]`, with no size, and the count is passed as a separate parameter, because the function cannot work out the size by itself. Show `int find(int values[], int count, int target)`.
3. Arrays are not copied when passed: the function works on the caller's own array, so a function can change it. Contrast this with the copies of plain values from the scope lesson, in two sentences, and show a tiny `double_all` function that doubles every element in place.
4. Returning a position, or -1 for "not there": -1 can never be a real index, so it is a safe signal. The caller checks for it before using the answer.
5. Returning as soon as the value is found gives the first match. Counting every match is a different job: show a `count_of` function that keeps going to the end and adds one for each match.
6. How long it takes: in the worst case, a value that is not there, every element is checked. That is fine for short lists; a later unit shows a faster search for sorted lists.
7. A short "Common mistakes" list: returning -1 inside the loop when the first element does not match (so only index 0 is ever checked); forgetting to check for -1 before using the answer as an index; looping to `count` with `<=`.

Example block (`{role=example file=dice.c}`): a program with no input that holds eight dice rolls, `int rolls[8] = {3, 6, 1, 6, 2, 6, 4, 1};`, defines `int count_of(int values[], int size, int target)` above `main`, and prints `6 came up 3 times` and `5 came up 0 times`.

Task: the starter is exactly this program:

```c
#include <stdio.h>

int find(int values[], int count, int target) {
    // Look through the array here.
    return -1;
}

int main() {
    int values[6];
    int target;

    for (int i = 0; i < 6; i++) {
        scanf("%d", &values[i]);
    }
    scanf("%d", &target);

    int where = find(values, 6, target);
    if (where == -1) {
        printf("Not found\n");
    } else {
        printf("Found at index %d\n", where);
    }
    return 0;
}
```

Starter file name `search.c`. The solution replaces the comment and the `return -1;` inside `find` with:

```c
    for (int i = 0; i < count; i++) {
        if (values[i] == target) {
            return i;
        }
    }
    return -1;
```

The task text says the program reads six numbers and then a number to look for, that `main` is finished, that `find` must return the index of the first match or -1 if there is none, and that indexes count from 0.

## Behaviour
1. Every file follows `docs/LESSONS.md` exactly: header, explanation, a `::: kid` block, a `{role=example}` block, then `::: try`, `::: try-kid`, `{role=starter}` and `{role=solution}` blocks.
2. Explanations are for a first-year student with no programming background: plain words, short paragraphs, one idea per paragraph. Between 300 and 500 words each, not counting code and tables.
3. Kid blocks are written from scratch for a seven-year-old. Each one uses one concrete picture and has 6 to 10 short sentences on separate lines with blank lines between groups. Pictures to use: arrays, a row of numbered lockers at school, where the first locker is number 0; statistics, a line of children measuring their height, where you remember the tallest so far as you walk along the line; searching, looking for your coat on a row of numbered pegs, checking each peg in turn.
4. Kid text rules are enforced by the build: at most 12 words per sentence, and none of the banned words listed in `docs/LESSONS.md`. This applies to the `::: kid` block, the `::: try-kid` block and `titleKid`. A colon also ends a sentence for counting.
5. All C code uses `int main()` (never `int main(void)`), includes `<stdio.h>`, uses 4 spaces to indent, puts braces around every `if` and loop body, and ends `main` with `return 0;`. Functions sit above `main` in every runnable block.
6. No starter, solution or example may contain a loop that never ends, or read or write past the end of an array. Code that shows going past the end goes only in an ordinary code block (no `role`).
7. Do not use `bool`, `true`, `false` or `<stdbool.h>`. Do not use `scanf("%c", ...)`.
8. Starter and solution must differ only by the lines the learner is asked to write or fix.
9. Do not describe how this website behaves beyond pressing Run and Check my answer, and the one sentence about the out-of-bounds error given above. No raw HTML, no links to outside websites. Use "they" for any person who is not named.

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
