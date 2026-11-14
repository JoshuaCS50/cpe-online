---
id: core.c.merge-sort
kind: lesson
track: core
unit: a7
order: 6
title: Merge sort
titleKid: Split in half, then zip together
language: c
concepts: [merge-sort, merging, divide-and-conquer, recursion]
prereqs: [core.c.recursion, core.c.big-o]
est_minutes: 16
checks:
  - type: io-cases
    cases:
      - stdin: ["1", "4", "6", "9", "2", "3", "7", "8"]
        expect: "Merged: 1 2 3 4 6 7 8 9\n"
      - stdin: ["5", "6", "7", "8", "1", "2", "3", "4"]
        expect: "Merged: 1 2 3 4 5 6 7 8\n"
      - stdin: ["1", "2", "3", "4", "5", "6", "7", "8"]
        expect: "Merged: 1 2 3 4 5 6 7 8\n"
      - stdin: ["2", "2", "5", "5", "2", "3", "5", "9"]
        expect: "Merged: 2 2 2 3 5 5 5 9\n"
hints:
  - Keep three positions, i in a, j in b and k in out, all starting at 0.
  - While both lists still have values, copy the smaller of a[i] and b[j] to out[k], and move that list's position and k on by one.
  - When one list runs out, copy whatever is left of the other list onto the end of out.
hintsKid:
  - Point at the front of each list.
  - Take the smaller of the two front numbers. Move that pointer on.
  - When one list is empty, copy the rest of the other.
---
The simple sorts grow as O(n²), which is too slow for big lists. Merge sort is much faster, and it is built from one neat idea: two lists that are **already sorted** can be combined into one sorted list in a single sweep.

## Merging two sorted lists

Put a finger at the front of each list. The smallest value of all must be under one of the two fingers, so compare them, copy the smaller one to the output, and move that finger on. Repeat. When one list runs out, everything left in the other list is bigger than what has been copied, so copy it across in order.

Merging `1 4 6 9` and `2 3 7 8`:

| Compare | Take | Output so far |
|---|---|---|
| 1 and 2 | 1 | 1 |
| 4 and 2 | 2 | 1 2 |
| 4 and 3 | 3 | 1 2 3 |
| 4 and 7 | 4 | 1 2 3 4 |
| 6 and 7 | 6 | 1 2 3 4 6 |
| 9 and 7 | 7 | 1 2 3 4 6 7 |
| 9 and 8 | 8 | 1 2 3 4 6 7 8 |
| first list only | 9 | 1 2 3 4 6 7 8 9 |

Each value is looked at once, so merging is O(n).

## From merging to sorting

Merge sort uses merging together with recursion:

1. If the list has one value, it is already sorted. That is the base case.
2. Otherwise split it into two halves.
3. Sort each half, by calling merge sort on it.
4. Merge the two sorted halves.

The splitting goes down to single values, and the merging builds sorted lists back up, a level at a time. The example below prints every merge for an 8-value array.

## Why it is fast

Halving 8 values down to single values takes 3 levels, and a million takes about 20, the same halving count as binary search. At each level, the merges together touch every value once, so each level costs about `n` steps. That makes merge sort **O(n log n)**: for a million values about 20 million steps, against a trillion for bubble sort.

The price is memory: merging needs a spare array to build the output in, while the simple sorts work inside the original array.

## Common mistakes

- **Forgetting the leftovers.** When the main loop ends, one list still has values; without the two "copy the rest" loops they are lost.
- **Using `<` instead of `<=` when the values are equal.** Both give a sorted result, but `<=` keeps equal values in their original order, which matters when sorting records.
- **Merging lists that are not sorted.** The single sweep only works because each list is in order.

::: kid
You have two short lines of children.

Each line is already in height order.

You want one long line, shortest first.

Look at the front child of each line.

Send the shorter one to the new line.

Keep doing that until one line is empty.

Then the rest just walk across.
:::

```c {role=example file=merge_sort.c}
#include <stdio.h>

void merge_sort(int values[], int low, int high) {
    if (low >= high) {
        return;
    }
    int mid = (low + high) / 2;
    merge_sort(values, low, mid);
    merge_sort(values, mid + 1, high);

    int temp[8];
    int i = low;
    int j = mid + 1;
    int k = 0;
    while (i <= mid && j <= high) {
        if (values[i] <= values[j]) {
            temp[k] = values[i];
            i++;
        } else {
            temp[k] = values[j];
            j++;
        }
        k++;
    }
    while (i <= mid) {
        temp[k] = values[i];
        i++;
        k++;
    }
    while (j <= high) {
        temp[k] = values[j];
        j++;
        k++;
    }
    for (int m = 0; m < k; m++) {
        values[low + m] = temp[m];
    }

    printf("Merged positions %d to %d:", low, high);
    for (int m = low; m <= high; m++) {
        printf(" %d", values[m]);
    }
    printf("\n");
}

int main() {
    int values[8] = {38, 27, 43, 3, 9, 82, 10, 1};
    merge_sort(values, 0, 7);
    return 0;
}
```

::: try
The program reads two lists of four numbers, each already in order from smallest to largest, and calls `merge`. Write `merge` so it fills `out` with all eight numbers in order. `main` prints the result.

Use the finger method: compare the front values of the two lists, copy the smaller one, and move on. Do not sort `out` afterwards; the point is the single sweep.
:::

::: try-kid
You get two lists. Each is already in order.

Put them together into one list, smallest first.

Compare the two front numbers. Take the smaller one.

When one list is empty, take the rest of the other.
:::

```c {role=starter file=merge.c}
#include <stdio.h>

void merge(int a[], int a_count, int b[], int b_count, int out[]) {
    // Merge a and b into out, smallest first.
    for (int k = 0; k < a_count + b_count; k++) {
        out[k] = 0;
    }
}

int main() {
    int a[4];
    int b[4];
    int out[8];

    for (int i = 0; i < 4; i++) {
        scanf("%d", &a[i]);
    }
    for (int i = 0; i < 4; i++) {
        scanf("%d", &b[i]);
    }

    merge(a, 4, b, 4, out);

    printf("Merged:");
    for (int i = 0; i < 8; i++) {
        printf(" %d", out[i]);
    }
    printf("\n");
    return 0;
}
```

```c {role=solution file=merge.c}
#include <stdio.h>

void merge(int a[], int a_count, int b[], int b_count, int out[]) {
    int i = 0;
    int j = 0;
    int k = 0;

    while (i < a_count && j < b_count) {
        if (a[i] <= b[j]) {
            out[k] = a[i];
            i++;
        } else {
            out[k] = b[j];
            j++;
        }
        k++;
    }
    while (i < a_count) {
        out[k] = a[i];
        i++;
        k++;
    }
    while (j < b_count) {
        out[k] = b[j];
        j++;
        k++;
    }
}

int main() {
    int a[4];
    int b[4];
    int out[8];

    for (int i = 0; i < 4; i++) {
        scanf("%d", &a[i]);
    }
    for (int i = 0; i < 4; i++) {
        scanf("%d", &b[i]);
    }

    merge(a, 4, b, 4, out);

    printf("Merged:");
    for (int i = 0; i < 8; i++) {
        printf(" %d", out[i]);
    }
    printf("\n");
    return 0;
}
```
