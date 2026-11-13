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
A program can keep one mark in one variable. Five marks would need five variables, `mark1` to `mark5`. That works, but fifty marks would need fifty variables, and every loop would have to name them one at a time. A row of values under a single name is far easier to manage.

## One name, many boxes

An array is one name for a row of values of the same type. Each value is reached by its position in the row, and that position is called an index. The values themselves are the elements.

## Making an array

`int marks[5];` makes five `int` boxes but does not fill them, so they hold leftover junk until you store something, just like a plain variable with no starting value. Starting values go inside braces, as in `int marks[5] = {72, 85, 91, 64, 78};`. When the values are given, the size may be left out, as in `int marks[] = {72, 85, 91};`, and the compiler counts them. Giving fewer values than boxes fills the rest with 0, so `int counts[10] = {0};` starts every box at 0.

## Indexes start at 0

The first element is `marks[0]`, not `marks[1]`. In an array of five the positions are 0 to 4, so `marks[4]` is the last. Reading works like any other value: `printf("%d\n", marks[0]);`. Changing works the same way: `marks[2] = 95;` replaces the third mark and leaves the other four alone.

## Arrays and loops

An array and a `for` loop are natural partners. The counter becomes the index, running from 0 to less than the size, so each turn handles one element:

```c
for (int i = 0; i < 5; i++) {
    printf("marks[%d] = %d\n", i, marks[i]);
}
```

Reading values into an array uses the same shape. `scanf` needs the address of the element, so the `&` stays in front:

```c
int values[5];

for (int i = 0; i < 5; i++) {
    scanf("%d", &values[i]);
}
```

## Counting the elements

Writing 5 in every loop means editing every loop when the array grows. `sizeof` gives a size in bytes, so dividing the size of the whole array by the size of one element gives the number of elements:

```c
int count = sizeof(marks) / sizeof(marks[0]);
```

## Past the end

`marks[5]` does not exist in an array of five. Here the program stops with an error saying the index is out of bounds. On many other systems the same mistake is worse: the program quietly reads or overwrites some other memory, and the fault may only show up much later.

## Common mistakes

- **Starting at 1.** The first element is at index 0, so a loop from 1 skips it. Written as `i = 1; i <= 5`, it also runs past the end.
- **`i <= 5` over five elements.** The last index is 4, so the test should be `i < 5`.
- **A missing `&` in `scanf`.** `scanf("%d", values[i]);` passes a value where an address is needed. Write `&values[i]`.

::: kid
Think of a row of lockers at school.

Each locker has a number on the door.

The first locker is number 0, not 1.

The next is 1, then 2, and so on.

The whole row has one name.

You can open a locker by its number.

Locker 3 is the fourth one along.

A row of numbers works the same way.

One name, and a number for each box.
:::

```c {role=example file=marks.c}
#include <stdio.h>

int main() {
    int marks[5] = {72, 85, 91, 64, 78};
    int count = sizeof(marks) / sizeof(marks[0]);

    printf("There are %d marks.\n", count);
    printf("First: %d\n", marks[0]);
    printf("Last: %d\n", marks[4]);

    marks[2] = 95;

    for (int i = 0; i < count; i++) {
        printf("marks[%d] = %d\n", i, marks[i]);
    }
    return 0;
}
```

::: try
The program reads five numbers into an array. `main` already reads them, and the last number sits at index 4.

Replace the comment with a loop that prints the numbers in reverse order, one per line. Start at the last index and count down to 0.
:::

::: try-kid
The program reads five numbers.

They sit in boxes 0 to 4.

Print them backwards, one on each line.

Start at box 4 and count down.

Stop after box 0.

Use a for loop where the comment is.

Press Run to test it.
:::

```c {role=starter file=reverse.c}
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

```c {role=solution file=reverse.c}
#include <stdio.h>

int main() {
    int values[5];

    for (int i = 0; i < 5; i++) {
        scanf("%d", &values[i]);
    }

    for (int i = 4; i >= 0; i--) {
        printf("%d\n", values[i]);
    }

    return 0;
}
```
