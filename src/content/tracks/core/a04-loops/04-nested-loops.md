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
A loop's body is a list of instructions, and nothing says that list cannot hold another loop. When one loop sits inside another, the outer loop takes its turns as usual. On every one of those turns the inner loop starts again from its own beginning and runs to its own end. Only when the inner loop has finished does the outer loop move on.

## Rows and columns

This arrangement is easiest to picture as a grid. The outer loop counts rows, so it takes one turn per line of output. The inner loop counts columns, so it prints the items along that line. A `printf("\n")` placed after the inner loop, still inside the outer loop, ends the row and starts the next one.

Three rows of four stars:

```c
for (int row = 1; row <= 3; row++) {
    for (int col = 1; col <= 4; col++) {
        printf("*");
    }
    printf("\n");
}
```

```
****
****
****
```

## Following the two counters

The table below traces the same program. It shows which values `col` takes on each turn of `row`.

| Turn of `row` | Values of `col` | Line printed |
|---|---|---|
| 1 | 1, 2, 3, 4 | `****` |
| 2 | 1, 2, 3, 4 | `****` |
| 3 | 1, 2, 3, 4 | `****` |

Two things are worth noticing. `col` begins again at 1 on every row, because the inner loop's start runs again each time. The inner body runs four times per row, so it runs twelve times in all: three rows times four columns. For a grid of `r` rows and `c` columns the count is `r * c`, which is a quick way to check a loop before you run it.

## Patterns

The rectangle comes from the inner test `col <= 4`. That 4 is the same on every row. Compare the column with the row instead, `col <= row`, and the inner loop grows and shrinks with the outer turn. Row 1 prints one star, row 2 prints two, and row 5 prints five, which makes a triangle:

```c
for (int row = 1; row <= 5; row++) {
    for (int col = 1; col <= row; col++) {
        printf("*");
    }
    printf("\n");
}
```

The outer loop has not changed at all. Only the inner test is different, and that one change turns a rectangle into a triangle. The same trick builds number patterns, letter patterns and tables of every kind.

## Name the two counters

Give the loops different counters, such as `row` and `col`, or `i` and `j`. Each loop keeps its own count, and different names make it obvious which count a line is using.

## Common mistakes

- **The same counter in both loops.** With one variable `i` declared before both loops, the inner loop resets and advances the only counter there is, so the outer loop loses its place and the rows go wrong.
- **The newline inside the inner loop.** Putting `printf("\n")` before the inner loop ends prints one star per line instead of one row.
- **No newline at all.** Without it every star lands on one long line, because nothing tells the screen to start a new row.

::: kid
Think of a vegetable garden.

The seeds go in rows.

You start at the first row.

You plant every seed in that row.

Only then do you walk to the next row.

Each row gets its own seeds.

The rows do not mix.

A loop inside a loop works the same way.

Finish one row, then start the next.
:::

```c {role=example file=grid.c}
#include <stdio.h>

int main() {
    for (int row = 1; row <= 3; row++) {
        for (int col = 1; col <= 4; col++) {
            printf("%4d", row * col);
        }
        printf("\n");
    }
    return 0;
}
```

::: try
The program reads a number `n` and draws a triangle of stars. Row 1 holds one star, row 2 holds two, and the last row holds `n`. Replace the comment with two loops, one inside the other.

It is checked with more than one number, so the answer has to be worked out, not typed in.
:::

::: try-kid
The program reads a number.

That number is how many rows to draw.

Row 1 gets one star.

Row 2 gets two stars.

Keep going until the last row.

Use a loop inside a loop.

Press Run to test it.
:::

```c {role=starter file=triangle.c}
#include <stdio.h>

int main() {
    int n;

    scanf("%d", &n);

    // Print the triangle here.

    return 0;
}
```

```c {role=solution file=triangle.c}
#include <stdio.h>

int main() {
    int n;

    scanf("%d", &n);

    for (int row = 1; row <= n; row++) {
        for (int col = 1; col <= row; col++) {
            printf("*");
        }
        printf("\n");
    }

    return 0;
}
```
