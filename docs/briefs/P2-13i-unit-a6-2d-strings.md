# P2-13i Unit A6 lessons: 2D arrays, strings, string functions

## Context
CPE Online is a browser IDE with a Learn mode for beginner programmers. A lesson is one Markdown file; the build compiles it and the tests run its code through a real C interpreter. This package adds the last three lessons of unit A6 ("Arrays and strings").

Read these first, in this order:
1. `docs/LESSONS.md`: the lesson file format and every rule the build enforces.
2. `src/content/tracks/core/a6/arrays.md`: a finished lesson in the same unit. Match its depth, tone and layout, and its `::: kid` block: short sentences on separate lines with blank lines between groups, built around one picture.
3. `src/content/tracks/core/a6/searching.md`: another finished lesson in the same unit.

## Files
Create:
- `src/content/tracks/core/a6/2d-arrays.md`
- `src/content/tracks/core/a6/strings.md`
- `src/content/tracks/core/a6/string-functions.md`

Edit:
- none

Do not touch any other file.

## Interface
Use these headers exactly as written. Do not add, remove or rename keys. Write the body below each header yourself. If a header breaks a build rule, stop and say so in your final message; you may wrap code in a kid hint in backticks, which the build counts as one word.

### 2d-arrays.md

```yaml
---
id: core.c.2d-arrays
kind: lesson
track: core
unit: a6
order: 4
title: 2D arrays
titleKid: Boxes in rows and columns
language: c
concepts: [2d-array, rows-and-columns, nested-loop]
prereqs: [core.c.arrays, core.c.nested-loops]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
        expect: "Row 1: 6\nRow 2: 15\nRow 3: 24\n"
      - stdin: ["10", "-4", "0", "0", "0", "0", "5", "5", "5"]
        expect: "Row 1: 6\nRow 2: 0\nRow 3: 15\n"
hints:
  - Use two loops, one inside the other. The outer loop goes through the rows, r from 0 to 2.
  - Inside the outer loop, start a total at 0, add grid[r][col] for each column, then print the total. Rows are numbered from 1 when printed, so print r + 1.
  - 'The loops are: for (int r = 0; r < 3; r++) { int total = 0; for (int col = 0; col < 3; col++) { total += grid[r][col]; } printf("Row %d: %d\n", r + 1, total); }'
hintsKid:
  - Use a loop for the rows. Put a loop for the columns inside it.
  - Start each row at 0. Add the row's boxes. Then say the total.
  - 'Type this: `for (int r = 0; r < 3; r++) { int total = 0; for (int col = 0; col < 3; col++) { total += grid[r][col]; } printf("Row %d: %d\n", r + 1, total); }`'
---
```

Body must cover, in this order:
1. Some data comes as a table: seats in rows, marks for several students in several subjects, the squares of a game board. A 2D array is an array of rows, each row an array of the same size.
2. Making one: `int seats[2][3];` is 2 rows of 3. Starting values go in a list of rows: `int seats[2][3] = {{1, 0, 1}, {0, 0, 1}};`. `= {0}` sets every element to 0. Rows or values left out of the list are filled with 0.
3. Reaching one element needs two indexes, row first then column: `seats[1][2]`. Both count from 0. Show changing one element.
4. Visiting every element: an outer loop over the rows and an inner loop over the columns, with a new line printed after each row. Show printing the seating chart as a grid.
5. Reading a table with `scanf("%d", &grid[r][col]);` inside the two loops: values are read row by row.
6. Totals by row (reset the total at the start of each row) and by column (swap which loop is outside).
7. Passing a 2D array to a function: the column size must be written in the parameter, as in `int total(int m[][3], int rows)`, because C needs it to find each row.
8. A short "Common mistakes" list: the indexes the wrong way round (`[col][r]`); writing `seats[1, 2]` instead of `seats[1][2]`; forgetting to reset a row total, so it carries over from the previous row.

Example block (`{role=example file=seats.c}`): a program with no input that makes `int seats[2][3] = {{1, 0, 1}, {0, 0, 1}};` where 1 means taken, prints each row as `X` for taken and `.` for free with a space between, then marks `seats[1][0]` as taken and prints the number of taken seats (`Taken: 4`).

Task: the starter is exactly this program:

```c
#include <stdio.h>

int main() {
    int grid[3][3];

    for (int r = 0; r < 3; r++) {
        for (int col = 0; col < 3; col++) {
            scanf("%d", &grid[r][col]);
        }
    }

    // Print the total of each row here.

    return 0;
}
```

Starter file name `rows.c`. The solution replaces the comment with:

```c
    for (int r = 0; r < 3; r++) {
        int total = 0;
        for (int col = 0; col < 3; col++) {
            total += grid[r][col];
        }
        printf("Row %d: %d\n", r + 1, total);
    }
```

The task text says the program reads nine numbers into a 3 by 3 grid, row by row, and must print each row's total in the form `Row 1: 6`, with rows numbered from 1.

### strings.md

```yaml
---
id: core.c.strings
kind: lesson
track: core
unit: a6
order: 5
title: Strings as character arrays
titleKid: Words are rows of letters
language: c
concepts: [string, char-array, null-terminator, character]
prereqs: [core.c.arrays]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["banana"]
        expect: "Vowels: 3\n"
      - stdin: ["rhythm"]
        expect: "Vowels: 0\n"
      - stdin: ["education"]
        expect: "Vowels: 5\n"
      - stdin: ["queue"]
        expect: "Vowels: 4\n"
hints:
  - Loop over the word one character at a time, starting at index 0 and stopping when you reach the '\0' at the end.
  - For each character, check whether it is a, e, i, o or u, and add one to vowels if it is. Characters go in single quotes.
  - 'The loop is: for (int i = 0; word[i] != ''\0''; i++) { char ch = word[i]; if (ch == ''a'' || ch == ''e'' || ch == ''i'' || ch == ''o'' || ch == ''u'') { vowels++; } }'
hintsKid:
  - Look at each letter until you reach the stopper at the end.
  - Is the letter a, e, i, o or u? Add one.
  - 'Type this: `for (int i = 0; word[i] != ''\0''; i++)` then check each letter.'
---
```

Body must cover, in this order:
1. C has no separate type for text. A string is an array of `char`, one character per box, with an extra character `'\0'` (zero) at the end marking where the text stops.
2. Making one: `char name[20] = "Ada";` stores `A`, `d`, `a` and then `'\0'`; the other boxes are spare room. `char word[] = "hello";` makes an array of exactly 6. The size must always leave room for the `'\0'`.
3. Double quotes make a string; single quotes make one character: `"A"` is two boxes (`A` and `'\0'`), `'A'` is a single `char`. A `char` is stored as a number, its character code, which is why `printf("%d", 'A')` prints 65.
4. Printing and reading: `printf("%s", name)` prints up to the `'\0'`. `scanf("%s", word)` reads one word (it stops at a space) and needs no `&`, because the array's name already stands for where it starts.
5. Walking through a string: a loop `for (int i = 0; word[i] != '\0'; i++)` visits each character without knowing the length in advance.
6. Changing characters: `name[0] = 'E';`, and turning a small letter into a capital with `word[i] - 'a' + 'A'`, explained in one or two sentences using character codes.
7. A short "Common mistakes" list: an array with no room for the `'\0'`; using `"a"` where `'a'` was meant in a comparison; reading a whole sentence with `scanf("%s", ...)`, which keeps only the first word.

Example block (`{role=example file=letters.c}`): a program with no input that makes `char word[10] = "shout";`, prints each character on its own line with its index and its code (`word[0] = s (115)`), then turns every small letter into a capital in a loop and prints `SHOUT`.

Task: the starter is exactly this program:

```c
#include <stdio.h>

int main() {
    char word[30];
    int vowels = 0;

    scanf("%s", word);

    // Count the vowels here.

    printf("Vowels: %d\n", vowels);
    return 0;
}
```

Starter file name `vowels.c`. The solution replaces the comment with:

```c
    for (int i = 0; word[i] != '\0'; i++) {
        char ch = word[i];
        if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') {
            vowels++;
        }
    }
```

The task text says the program reads one word in small letters and must count its vowels (a, e, i, o and u), and that it is checked with words that have no vowels and words that have several in a row.

### string-functions.md

```yaml
---
id: core.c.string-functions
kind: lesson
track: core
unit: a6
order: 6
title: String functions
titleKid: Handy tools for words
language: c
concepts: [strlen, strcpy, strcat, strcmp, string-h]
prereqs: [core.c.strings, core.c.if-else]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["cat", "dog"]
        expect: "cat\ndog\nTotal letters: 6\n"
      - stdin: ["zebra", "ant"]
        expect: "ant\nzebra\nTotal letters: 8\n"
      - stdin: ["sun", "sun"]
        expect: "sun\nsun\nTotal letters: 6\n"
      - stdin: ["pear", "apple"]
        expect: "apple\npear\nTotal letters: 9\n"
  - type: code-contains
    pattern: 'strcmp\s*\('
    message: Uses strcmp to compare the words
hints:
  - strcmp(first, second) gives a number below 0 when first comes before second in the alphabet, 0 when they are the same, and above 0 otherwise.
  - Print first then second when strcmp(first, second) <= 0; otherwise print second then first.
  - 'For the total, add the two lengths: total = strlen(first) + strlen(second);'
hintsKid:
  - strcmp tells you which word comes first in the alphabet.
  - Below 0 means the first word goes first.
  - 'Add the lengths: `total = strlen(first) + strlen(second);`'
---
```

Body must cover, in this order:
1. Because a string is an array, `=` and `==` do not work on whole strings the way they do on numbers. The standard library has tools for it in `<string.h>`.
2. `strlen(s)`: the number of characters before the `'\0'`. Show it next to the size of the array, which is usually bigger.
3. `strcpy(dest, src)`: copies a string into an array. Explain that `dest = "text";` is not the way to copy text into an array in C, and that the destination must be big enough for the text and its `'\0'`.
4. `strcat(dest, src)`: adds `src` onto the end of `dest`; again, `dest` needs room for both.
5. `strcmp(a, b)`: compares two strings letter by letter by character code and gives 0 when they are equal, a number below 0 when `a` comes first, and above 0 when `b` comes first. Use it for "are these the same?" (`strcmp(a, b) == 0`) and for alphabetical order. Note that capital letters come before small letters, so `"Zebra"` comes before `"apple"`.
6. Why `a == b` is wrong for strings: it asks whether the two arrays are the same array in memory, not whether they hold the same letters.
7. A short "Common mistakes" list: forgetting `#include <string.h>`; reading `strcmp` as "true when equal" (it gives 0 for equal); a destination array too small for `strcpy` or `strcat`.

Example block (`{role=example file=greet.c}`): a program with no input that uses `strcpy` and `strcat` to build `Hello, Ada!` in a `char message[40]` from `"Hello, "`, a name and `"!"`, prints it with its length from `strlen` (`Hello, Ada! (11 letters)`), and then uses `strcmp` to print whether `"apple"` comes before `"pear"` and whether `"same"` equals `"same"`.

Task: the starter is exactly this program:

```c
#include <stdio.h>
#include <string.h>

int main() {
    char first[30];
    char second[30];

    scanf("%s", first);
    scanf("%s", second);

    int total = 0;

    // Print the two words in alphabetical order, then work out total.

    printf("%s\n%s\n", first, second);
    printf("Total letters: %d\n", total);
    return 0;
}
```

Starter file name `order.c`. The solution is:

```c
#include <stdio.h>
#include <string.h>

int main() {
    char first[30];
    char second[30];

    scanf("%s", first);
    scanf("%s", second);

    int total = strlen(first) + strlen(second);

    if (strcmp(first, second) <= 0) {
        printf("%s\n%s\n", first, second);
    } else {
        printf("%s\n%s\n", second, first);
    }
    printf("Total letters: %d\n", total);
    return 0;
}
```

The task text says the program reads two words in small letters, must print them in alphabetical order, one per line, and then print how many letters they have together.

## Behaviour
1. Every file follows `docs/LESSONS.md` exactly: header, explanation, a `::: kid` block, a `{role=example}` block, then `::: try`, `::: try-kid`, `{role=starter}` and `{role=solution}` blocks.
2. Explanations are for a first-year student with no programming background: plain words, short paragraphs, one idea per paragraph. Between 300 and 500 words each, not counting code and tables.
3. Kid blocks are written from scratch for a seven-year-old. Each one uses one concrete picture and has 6 to 10 short sentences on separate lines with blank lines between groups. Pictures to use: 2D arrays, an egg box with rows and columns of cups; strings, beads on a string with a special stopper bead at the end; string functions, a toolbox with a ruler for measuring a word, glue for joining two words, and a dictionary for putting words in order.
4. Kid text rules are enforced by the build: at most 12 words per sentence, and none of the banned words listed in `docs/LESSONS.md`. This applies to the `::: kid` block, the `::: try-kid` block and `titleKid`. A colon also ends a sentence for counting.
5. All C code uses `int main()` (never `int main(void)`), includes `<stdio.h>` (and `<string.h>` when it uses string functions), uses 4 spaces to indent, puts braces around every `if` and loop body, and ends `main` with `return 0;`.
6. No starter, solution or example may contain a loop that never ends, or read or write past the end of an array. Do not use `fgets`, `gets`, `bool`, `true`, `false` or `<stdbool.h>`.
7. Starter and solution must differ only by the lines the learner is asked to write.
8. Do not describe how this website behaves beyond pressing Run and Check my answer. No raw HTML, no links to outside websites. Use "they" for any person who is not named.

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
