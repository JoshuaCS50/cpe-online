---
id: core.c.bubble-sort
kind: lesson
track: core
unit: a7
order: 2
title: Bubble sort
titleKid: Swap neighbours until they line up
language: c
concepts: [sorting, bubble-sort, swap, passes]
prereqs: [core.c.arrays, core.c.nested-loops, core.c.parameters]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["5", "1", "4", "2", "8", "0"]
        expect: "Pass 1: 1 4 2 5 0 8\nPass 2: 1 2 4 0 5 8\nPass 3: 1 2 0 4 5 8\nPass 4: 1 0 2 4 5 8\nPass 5: 0 1 2 4 5 8\n"
      - stdin: ["6", "5", "4", "3", "2", "1"]
        expect: "Pass 1: 5 4 3 2 1 6\nPass 2: 4 3 2 1 5 6\nPass 3: 3 2 1 4 5 6\nPass 4: 2 1 3 4 5 6\nPass 5: 1 2 3 4 5 6\n"
      - stdin: ["3", "3", "1", "2", "9", "7"]
        expect: "Pass 1: 3 1 2 3 7 9\nPass 2: 1 2 3 3 7 9\nPass 3: 1 2 3 3 7 9\nPass 4: 1 2 3 3 7 9\nPass 5: 1 2 3 3 7 9\n"
hints:
  - The outer loop counts the passes, pass = 1 up to count - 1. Call show(values, count, pass) at the end of each pass.
  - In each pass, compare every neighbouring pair, values[i] and values[i + 1], for i from 0 to less than count - pass. If the left one is bigger, swap them.
  - 'A swap needs a spare variable: int temp = values[i]; values[i] = values[i + 1]; values[i + 1] = temp;'
hintsKid:
  - Do one pass for each number, except the last one.
  - In a pass, look at each pair of neighbours. Swap them if the left one is bigger.
  - 'To swap, use a spare box: `int temp = values[i];`'
---
Sorting puts values in order, smallest first. It matters because sorted data is easier to search (binary search needs it), easier to read, and easy to pick the largest or smallest from. There are many ways to sort. Bubble sort is the simplest to understand.

## Swapping two values

Every sort needs to swap values, and a swap needs a spare variable. Writing `a = b; b = a;` does not work: after the first line, the old value of `a` is gone.

```c
int temp = a;
a = b;
b = temp;
```

`temp` keeps a copy of `a` while `a` is overwritten.

## One pass

Bubble sort walks along the array comparing each pair of neighbours, `values[i]` and `values[i + 1]`. When the left one is bigger, it swaps them. Starting with `5 1 4 2`:

| Compare | Bigger on the left? | Array after |
|---|---|---|
| 5 and 1 | yes, swap | 1 5 4 2 |
| 5 and 4 | yes, swap | 1 4 5 2 |
| 5 and 2 | yes, swap | 1 4 2 5 |

After one pass the largest value, 5, has moved all the way to the end, like a bubble rising to the top. It is now in its final place.

## Many passes

Each pass carries the largest remaining value to its place, so an array of `count` values needs `count - 1` passes. Because the end of the array fills up with values already in place, pass number `pass` only needs to compare up to position `count - pass`:

```c
for (int pass = 1; pass < count; pass++) {
    for (int i = 0; i < count - pass; i++) {
        if (values[i] > values[i + 1]) {
            // swap values[i] and values[i + 1]
        }
    }
}
```

## How much work it is

For 6 values the inner comparison runs 5 + 4 + 3 + 2 + 1 = 15 times. For 100 values it is about 5,000, and for 1,000 values about 500,000. Doubling the number of values roughly multiplies the work by four. That is fine for small lists and slow for large ones, which is why faster sorts exist.

## Common mistakes

- **Swapping without a spare variable.** `values[i] = values[i + 1]; values[i + 1] = values[i];` copies one value into both places.
- **Comparing past the end.** With `i < count`, the last comparison reads `values[count]`, which does not exist. Stop at `i < count - pass`.
- **Using `<` instead of `>`.** The array then ends up sorted from largest to smallest.

::: kid
Children stand in a line, all mixed up.

You want the shortest at the front.

Look at the first two children.

Is the left one taller? Swap them.

Then look at the next two, and the next.

The tallest child slowly moves to the end.

Walk along the line again and again.

Soon everyone is in order.
:::

```c {role=example file=one_pass.c}
#include <stdio.h>

int main() {
    int values[4] = {5, 1, 4, 2};

    for (int i = 0; i < 3; i++) {
        printf("Compare %d and %d: ", values[i], values[i + 1]);
        if (values[i] > values[i + 1]) {
            int temp = values[i];
            values[i] = values[i + 1];
            values[i + 1] = temp;
            printf("swap\n");
        } else {
            printf("keep\n");
        }
    }

    printf("After one pass:");
    for (int i = 0; i < 4; i++) {
        printf(" %d", values[i]);
    }
    printf("\n");
    return 0;
}
```

::: try
The program reads six numbers and calls `sort`. Write `sort` as a bubble sort that puts the numbers in order from smallest to largest.

Do exactly `count - 1` passes, and in pass number `pass` compare neighbours from index 0 up to `count - pass - 1`. At the end of every pass, call `show(values, count, pass);` so the checks can see each step.
:::

::: try-kid
The program reads six numbers.

Sort them with bubble sort, smallest first.

Do five passes. After each pass, call show.
:::

```c {role=starter file=bubble.c}
#include <stdio.h>

void show(int values[], int count, int pass) {
    printf("Pass %d:", pass);
    for (int i = 0; i < count; i++) {
        printf(" %d", values[i]);
    }
    printf("\n");
}

void sort(int values[], int count) {
    // Sort here, calling show(values, count, pass) after each pass.
}

int main() {
    int values[6];

    for (int i = 0; i < 6; i++) {
        scanf("%d", &values[i]);
    }

    sort(values, 6);
    return 0;
}
```

```c {role=solution file=bubble.c}
#include <stdio.h>

void show(int values[], int count, int pass) {
    printf("Pass %d:", pass);
    for (int i = 0; i < count; i++) {
        printf(" %d", values[i]);
    }
    printf("\n");
}

void sort(int values[], int count) {
    for (int pass = 1; pass < count; pass++) {
        for (int i = 0; i < count - pass; i++) {
            if (values[i] > values[i + 1]) {
                int temp = values[i];
                values[i] = values[i + 1];
                values[i + 1] = temp;
            }
        }
        show(values, count, pass);
    }
}

int main() {
    int values[6];

    for (int i = 0; i < 6; i++) {
        scanf("%d", &values[i]);
    }

    sort(values, 6);
    return 0;
}
```
