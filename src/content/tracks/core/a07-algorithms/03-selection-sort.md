---
id: core.c.selection-sort
kind: lesson
track: core
unit: a7
order: 3
title: Selection sort
titleKid: Pick the smallest, put it first
language: c
concepts: [sorting, selection-sort, minimum, swap]
prereqs: [core.c.bubble-sort, core.c.array-stats]
links:
  - to: core.c.bubble-sort
    kind: contrast
    note: Bubble sort swaps neighbours many times; selection sort finds the right value first and swaps once per pass.
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["5", "1", "4", "2", "8", "0"]
        expect: "Pass 1: 0 1 4 2 8 5\nPass 2: 0 1 4 2 8 5\nPass 3: 0 1 2 4 8 5\nPass 4: 0 1 2 4 8 5\nPass 5: 0 1 2 4 5 8\n"
      - stdin: ["6", "5", "4", "3", "2", "1"]
        expect: "Pass 1: 1 5 4 3 2 6\nPass 2: 1 2 4 3 5 6\nPass 3: 1 2 3 4 5 6\nPass 4: 1 2 3 4 5 6\nPass 5: 1 2 3 4 5 6\n"
      - stdin: ["3", "3", "1", "2", "9", "7"]
        expect: "Pass 1: 1 3 3 2 9 7\nPass 2: 1 2 3 3 9 7\nPass 3: 1 2 3 3 9 7\nPass 4: 1 2 3 3 9 7\nPass 5: 1 2 3 3 7 9\n"
hints:
  - Pass number pass fills position start = pass - 1. Find the index of the smallest value from start to the end of the array.
  - Start with smallest = start, then look at each later index i; when values[i] < values[smallest], set smallest = i.
  - 'After the search, swap values[start] and values[smallest] with a spare variable, then call show(values, count, pass);'
hintsKid:
  - Each pass fills the next place at the front.
  - Find the smallest number from that place to the end.
  - Swap it into that place. Then call show.
---
Bubble sort moves values a little at a time with many swaps. Selection sort takes a more direct route: find the value that belongs in the next place, and put it there with a single swap.

## The idea

- Pass 1: find the smallest value in the whole array and swap it into position 0.
- Pass 2: find the smallest value from position 1 onward and swap it into position 1.
- Pass 3: the same from position 2, and so on.

After each pass, one more position at the front holds its final value. An array of `count` values needs `count - 1` passes, because when only one value is left it must already be in the right place.

## Finding the smallest, again

Finding the smallest value is the "best so far" pattern from the statistics lesson, but here we keep its **index**, because we need to know where to swap from:

```c
int smallest = start;
for (int i = start + 1; i < count; i++) {
    if (values[i] < values[smallest]) {
        smallest = i;
    }
}
```

Then one swap puts it in place:

```c
int temp = values[start];
values[start] = values[smallest];
values[smallest] = temp;
```

If the smallest value is already at `start`, this swaps a value with itself, which is harmless.

## A trace

Sorting `29 10 14 37 13`:

| Pass | Look from | Smallest found | Array after the swap |
|---|---|---|---|
| 1 | index 0 | 10 at index 1 | 10 29 14 37 13 |
| 2 | index 1 | 13 at index 4 | 10 13 14 37 29 |
| 3 | index 2 | 14 at index 2 | 10 13 14 37 29 |
| 4 | index 3 | 29 at index 4 | 10 13 14 29 37 |

## Bubble or selection?

Both compare about the same number of pairs: for 6 values, 5 + 4 + 3 + 2 + 1 = 15. Selection sort makes at most one swap per pass, while bubble sort may swap at every comparison. When swapping is slow, for example when each value is a large record, selection sort does less moving. Neither is fast for big lists; both slow down about four times when the list doubles.

## Common mistakes

- **Keeping the smallest value instead of its index.** You then know what to move but not where it was, so the swap cannot be done.
- **Starting the search at 0 on every pass.** The front of the array is already sorted; searching it again picks the same small values.
- **Swapping inside the search loop.** That turns it back into a slower, muddled sort. Find first, then swap once.

::: kid
You have a pile of apples of different sizes.

You want to line them up, smallest first.

Look at all the apples. Find the smallest one.

Put it at the front of the line.

Now look at the apples that are left.

Find the smallest again. Put it next in line.

Keep going until no apples are left.
:::

```c {role=example file=smallest.c}
#include <stdio.h>

int main() {
    int values[5] = {29, 10, 14, 37, 13};
    int smallest = 0;

    for (int i = 1; i < 5; i++) {
        if (values[i] < values[smallest]) {
            smallest = i;
        }
    }
    printf("Smallest is %d at index %d\n", values[smallest], smallest);

    int temp = values[0];
    values[0] = values[smallest];
    values[smallest] = temp;

    printf("After the first pass:");
    for (int i = 0; i < 5; i++) {
        printf(" %d", values[i]);
    }
    printf("\n");
    return 0;
}
```

::: try
The program reads six numbers and calls `sort`. Write `sort` as a selection sort that puts the numbers in order from smallest to largest.

Do exactly `count - 1` passes. In pass number `pass`, find the smallest value from index `pass - 1` to the end and swap it into index `pass - 1`. At the end of every pass, call `show(values, count, pass);`.
:::

::: try-kid
The program reads six numbers.

Sort them with selection sort, smallest first.

Do five passes. After each pass, call show.
:::

```c {role=starter file=selection.c}
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

```c {role=solution file=selection.c}
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
        int start = pass - 1;
        int smallest = start;
        for (int i = start + 1; i < count; i++) {
            if (values[i] < values[smallest]) {
                smallest = i;
            }
        }
        int temp = values[start];
        values[start] = values[smallest];
        values[smallest] = temp;
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
