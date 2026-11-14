---
id: core.c.insertion-sort
kind: lesson
track: core
unit: a7
order: 4
title: Insertion sort
titleKid: Slot each card into place
language: c
concepts: [sorting, insertion-sort, shifting]
prereqs: [core.c.selection-sort]
links:
  - to: core.c.selection-sort
    kind: contrast
    note: Selection sort picks the right value for the next place; insertion sort takes the next value and finds its place.
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["5", "1", "4", "2", "8", "0"]
        expect: "Pass 1: 1 5 4 2 8 0\nPass 2: 1 4 5 2 8 0\nPass 3: 1 2 4 5 8 0\nPass 4: 1 2 4 5 8 0\nPass 5: 0 1 2 4 5 8\n"
      - stdin: ["6", "5", "4", "3", "2", "1"]
        expect: "Pass 1: 5 6 4 3 2 1\nPass 2: 4 5 6 3 2 1\nPass 3: 3 4 5 6 2 1\nPass 4: 2 3 4 5 6 1\nPass 5: 1 2 3 4 5 6\n"
      - stdin: ["3", "3", "1", "2", "9", "7"]
        expect: "Pass 1: 3 3 1 2 9 7\nPass 2: 1 3 3 2 9 7\nPass 3: 1 2 3 3 9 7\nPass 4: 1 2 3 3 9 7\nPass 5: 1 2 3 3 7 9\n"
hints:
  - In pass number pass, take the value at index pass and call it key. Everything to its left is already sorted.
  - Walk left from j = pass - 1. While j >= 0 and values[j] > key, move values[j] one place right and step j down.
  - 'Then drop the key into the gap with values[j + 1] = key; and call show(values, count, pass);'
hintsKid:
  - Take the next number. Hold it in your hand.
  - Move bigger numbers on its left one place right.
  - Put your number into the gap. Then call show.
---
Most people sort a hand of cards this way without thinking. You pick up cards one at a time, and each new card slides into its place among the cards you already hold, which are kept in order. Insertion sort does exactly that with an array.

## The idea

Think of the array as two parts: a sorted part on the left and an unsorted part on the right. At the start, the sorted part is just the first value, because one value on its own is always in order. Then, for each value in the unsorted part:

1. Take it out and call it `key`.
2. Look left through the sorted part. Every value bigger than `key` moves one place to the right, opening a gap.
3. When you meet a value that is not bigger, or reach the start, drop `key` into the gap.

The sorted part has grown by one. Repeat until no unsorted values are left.

## Shifting, not swapping

Bigger values are moved one place right with `values[j + 1] = values[j];`, not swapped. The key is kept safe in its own variable while values slide over its old place:

```c
int key = values[pass];
int j = pass - 1;
while (j >= 0 && values[j] > key) {
    values[j + 1] = values[j];
    j--;
}
values[j + 1] = key;
```

The order of the test matters. `j >= 0` comes first, so when `j` reaches -1 the loop stops before it can read `values[-1]`.

## A trace

Inserting 4 into the sorted part `2 5 9`: 9 is bigger, so it moves right; 5 is bigger, so it moves right; 2 is not bigger, so 4 goes in after it, giving `2 4 5 9`.

## When it shines

On an array that is already nearly sorted, each key moves only a step or two, so insertion sort finishes in almost one quick pass. On a fully sorted array the inner loop never runs at all. That makes it the best of the three simple sorts for data that arrives almost in order, and real libraries use it to finish off small pieces of bigger sorts. On reversed data, though, every key travels all the way to the front, and it is as slow as bubble sort.

## Common mistakes

- **Not saving the key first.** The first shift overwrites `values[pass]`, and the value being inserted is lost.
- **Testing `values[j] > key` before `j >= 0`.** When `j` reaches -1, the program reads before the start of the array.
- **Putting the key at `values[j]`.** When the loop stops, `j` points at the value that stays, so the gap is at `j + 1`.

::: kid
You are holding some cards, already in order.

You pick up one new card.

Look at the cards in your hand from right to left.

Slide each bigger card along to make room.

When you find a smaller card, stop.

Slot the new card into the gap.

Pick up the next card and do it again.
:::

```c {role=example file=insert.c}
#include <stdio.h>

int main() {
    int values[5] = {2, 5, 9, 4, 7};
    int key = values[3];
    int j = 2;

    printf("Insert %d into 2 5 9\n", key);
    while (j >= 0 && values[j] > key) {
        printf("%d moves right\n", values[j]);
        values[j + 1] = values[j];
        j--;
    }
    values[j + 1] = key;

    printf("Now:");
    for (int i = 0; i < 5; i++) {
        printf(" %d", values[i]);
    }
    printf("\n");
    return 0;
}
```

::: try
The program reads six numbers and calls `sort`. Write `sort` as an insertion sort that puts the numbers in order from smallest to largest.

Do exactly `count - 1` passes. In pass number `pass`, insert the value at index `pass` into the sorted part to its left. At the end of every pass, call `show(values, count, pass);`.
:::

::: try-kid
The program reads six numbers.

Sort them with insertion sort, smallest first.

Do five passes. After each pass, call show.
:::

```c {role=starter file=insertion.c}
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

```c {role=solution file=insertion.c}
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
        int key = values[pass];
        int j = pass - 1;
        while (j >= 0 && values[j] > key) {
            values[j + 1] = values[j];
            j--;
        }
        values[j + 1] = key;
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
