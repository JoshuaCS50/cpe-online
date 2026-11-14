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
Some data is a list. Some data is a table: the seats in a small hall, marks for several students in several subjects, the squares of a game board. A 2D array holds a table. It is an array of rows, and every row is an array of the same size.

## Making one

```c
int seats[2][3];
```

This makes 2 rows of 3 boxes each, six `int` boxes in all. The first number is how many rows, the second is how many boxes in each row.

Starting values are written as a list of rows, each row in its own braces:

```c
int seats[2][3] = {{1, 0, 1}, {0, 0, 1}};
```

Rows or values left out of the list are filled with 0, so `{{1}, {4, 5}}` in a 3 by 3 table gives a first row of `1 0 0`, a second row of `4 5 0`, and a third row of zeros. `int seats[2][3] = {0};` sets every box to 0.

## Reaching one box

One box needs two indexes, the row first and then the column, each in its own brackets. Both count from 0, so in `seats[2][3]` the rows are 0 and 1 and the columns are 0, 1 and 2.

```c
printf("%d\n", seats[1][2]);   // row 1, column 2: prints 1
seats[1][0] = 1;               // takes the first seat in row 1
```

## Visiting every box

A table needs two loops: an outer loop over the rows, and inside it a loop over the columns. A new line after the inner loop finishes each printed row.

```c
for (int r = 0; r < 2; r++) {
    for (int col = 0; col < 3; col++) {
        printf("%d ", seats[r][col]);
    }
    printf("\n");
}
```

Reading a table works the same way, with `scanf("%d", &grid[r][col]);` inside the two loops. The values are read row by row: the whole of row 0, then the whole of row 1.

## Totals by row and by column

To total each row, start a total at 0 at the beginning of every row, add the boxes in that row, and print the total when the row is done. To total each column instead, swap which loop is outside: the column loop goes outside, and the row loop inside it.

## Passing a table to a function

A function that takes a 2D array must be told the size of each row in its parameter:

```c
int total(int m[][3], int rows)
```

The number of rows can be left empty and passed separately, but the column size cannot, because C uses it to work out where each row begins.

## Common mistakes

- **The indexes the wrong way round.** `seats[col][r]` swaps rows and columns, and goes past the end when the table is not square.
- **A comma instead of two brackets.** `seats[1, 2]` does not mean row 1, column 2. Write `seats[1][2]`.
- **Not restarting a row total.** A total made before the outer loop keeps growing, so every row adds the rows before it.

::: kid
Think of an egg box.

It has rows of little cups.

Each row has the same number of cups.

To find one egg, you need two numbers.

First the row. Then the cup along that row.

Both numbers start at 0.

To check every egg, go along one row.

Then start the next row.
:::

```c {role=example file=seats.c}
#include <stdio.h>

int main() {
    int seats[2][3] = {{1, 0, 1}, {0, 0, 1}};
    int taken = 0;

    seats[1][0] = 1;

    for (int r = 0; r < 2; r++) {
        for (int col = 0; col < 3; col++) {
            if (seats[r][col] == 1) {
                printf("X ");
                taken++;
            } else {
                printf(". ");
            }
        }
        printf("\n");
    }

    printf("Taken: %d\n", taken);
    return 0;
}
```

::: try
The program reads nine numbers into a 3 by 3 grid, row by row. Print the total of each row in this form, with rows numbered from 1:

```
Row 1: 6
```

The reading is already written. Replace the comment with two loops.
:::

::: try-kid
The program fills a grid with nine numbers.

Add up each row. Then say the total, like this:

```
Row 1: 6
```

The first row is row 1 when you say it.
:::

```c {role=starter file=rows.c}
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

```c {role=solution file=rows.c}
#include <stdio.h>

int main() {
    int grid[3][3];

    for (int r = 0; r < 3; r++) {
        for (int col = 0; col < 3; col++) {
            scanf("%d", &grid[r][col]);
        }
    }

    for (int r = 0; r < 3; r++) {
        int total = 0;
        for (int col = 0; col < 3; col++) {
            total += grid[r][col];
        }
        printf("Row %d: %d\n", r + 1, total);
    }

    return 0;
}
```
