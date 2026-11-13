---
id: core.c.trace-tables
kind: lesson
track: core
unit: a1
order: 6
title: Tracing by hand
titleKid: Pretending to be the computer
language: c
concepts: [trace-table, tracing, variables, loop]
prereqs: [core.c.pseudocode]
est_minutes: 14
checks:
  - type: stdout-equals
    expect: "After the loop: a = 16, b = 15\nThe loop body ran 4 times\n"
hints:
  - 'Draw a table with the columns i, a and b, and a row for the start: a is 1 and b is 0. Each pass of the loop adds one row.'
  - 'In each pass, first b becomes b + a, then a becomes a * 2, in that order. The first pass gives b = 1 and a = 2.'
  - 'The rows are: i=1 gives b=1, a=2; i=2 gives b=3, a=4; i=3 gives b=7, a=8; i=4 gives b=15, a=16. Then i is 5, which is not 4 or less, so the loop stops.'
hintsKid:
  - 'Make a table. Write a and b at the start.'
  - 'Each time round, add a to b. Then double a.'
  - 'Do it four times. Write the last numbers in.'
---
A **trace table** lets you run a program on paper, one step at a time, writing down the value of every variable after each step. It is how you check an algorithm before (or instead of) running it, how you find out why a program gives a strange answer, and a common exam question.

## How to trace

1. Make a column for each variable, and one for any output.
2. Write the starting values in the first row.
3. Go through the program line by line, exactly as the computer would. Each time a variable changes, write its new value in a new row.
4. Do not skip ahead or guess what a line "probably" does. The point is to be as literal as the computer.

## An example

```
SET total TO 0
SET count TO 1
WHILE count <= 3 DO
    SET total TO total + count
    SET count TO count + 1
END WHILE
PRINT total
```

| Step | count | total | Output |
|---|---|---|---|
| start | 1 | 0 | |
| pass 1 | 1 | 1 | |
| | 2 | 1 | |
| pass 2 | 2 | 3 | |
| | 3 | 3 | |
| pass 3 | 3 | 6 | |
| | 4 | 6 | |
| `count <= 3` is false, so the loop ends | | | 6 |

The table shows not only the answer, 6, but also that the loop ran three times, and that `count` ends at 4, one past the last value used. Facts like that are exactly where bugs hide.

## Reading a C loop

The task uses a C `for` loop. You will learn it properly in unit A4, but it can be read in plain words:

```c
for (int i = 1; i <= 4; i++) {
    // body
}
```

"Start `i` at 1. While `i` is 4 or less, do the body, then add 1 to `i`." So the body runs with `i` = 1, 2, 3 and 4. Inside the body, a line such as `b = b + a;` means "work out `b + a` using the current values, then store the result in `b`".

## Tips

- Changes inside the loop happen in order: when one line uses a variable that the line before it changed, it gets the new value.
- Write every change, even when it feels obvious. The surprising row is the one you would have skipped.
- When the program and your table disagree, your table usually shows where your idea of the program was wrong.

::: kid
Tracing means pretending to be the computer.

Draw a table with a column for each box.

Do one step at a time, slowly.

Each time a box changes, write the new number.

At the end, the table shows what the program does.
:::

```c {role=example file=trace.c}
#include <stdio.h>

int main() {
    // The WHILE example from the lesson, printing each row of the trace table.
    int total = 0;
    int count = 1;
    printf("count=%d total=%d (start)\n", count, total);
    while (count <= 3) {
        total = total + count;
        count = count + 1;
        printf("count=%d total=%d\n", count, total);
    }
    printf("Output: %d\n", total);
    return 0;
}
```

::: try
Trace this piece of C by hand with a trace table (columns `i`, `a` and `b`):

```c
int a = 1;
int b = 0;
for (int i = 1; i <= 4; i++) {
    b = b + a;
    a = a * 2;
}
```

Then put your answers into the program: replace the three 0s with the final values of `a` and `b`, and with how many times the loop body ran.
:::

::: try-kid
Be the computer for this little program.

Write a table, one row each time round.

Then put the last numbers into the answer lines.
:::

```c {role=starter file=answers.c}
#include <stdio.h>

int main() {
    printf("After the loop: a = %d, b = %d\n", 0, 0);
    printf("The loop body ran %d times\n", 0);
    return 0;
}
```

```c {role=solution file=answers.c}
#include <stdio.h>

int main() {
    printf("After the loop: a = %d, b = %d\n", 16, 15);
    printf("The loop body ran %d times\n", 4);
    return 0;
}
```
