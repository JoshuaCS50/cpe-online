---
id: core.c.binary-search
kind: lesson
track: core
unit: a7
order: 1
title: Binary search
titleKid: Guess the middle, halve the rest
language: c
concepts: [binary-search, sorted-data, halving]
prereqs: [core.c.searching]
links:
  - to: core.c.searching
    kind: contrast
    note: Linear search works on any list but may check every value; binary search needs a sorted list and checks very few.
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["4", "8", "15", "16", "23", "42", "50", "61", "42"]
        expect: "Look at 16\nLook at 42\nFound at index 5\n"
      - stdin: ["4", "8", "15", "16", "23", "42", "50", "61", "4"]
        expect: "Look at 16\nLook at 8\nLook at 4\nFound at index 0\n"
      - stdin: ["4", "8", "15", "16", "23", "42", "50", "61", "7"]
        expect: "Look at 16\nLook at 8\nLook at 4\nNot found\n"
      - stdin: ["4", "8", "15", "16", "23", "42", "50", "61", "61"]
        expect: "Look at 16\nLook at 42\nLook at 50\nLook at 61\nFound at index 7\n"
hints:
  - Keep two positions, low = 0 and high = count - 1. The value, if it is there, always lies between them.
  - While low <= high, look at the middle, mid = (low + high) / 2, and print its value. If it is the target, return mid. If it is too small, move low to mid + 1; if too big, move high to mid - 1.
  - 'The loop is: while (low <= high) { int mid = (low + high) / 2; printf("Look at %d\n", values[mid]); if (values[mid] == target) { return mid; } else if (values[mid] < target) { low = mid + 1; } else { high = mid - 1; } }'
hintsKid:
  - Remember the lowest and highest places it could be.
  - Look in the middle. Too small? Throw away the left half.
  - Too big? Throw away the right half. Keep going.
---
Linear search checks values one by one, so in a list of a million it may check a million. When the list is **sorted**, there is a far faster way, the one you use with a dictionary or a guessing game: look in the middle and throw away the half that cannot hold the answer.

## The idea

Keep two positions, `low` and `high`, marking the part of the array the value could still be in. At the start that is the whole array. Then repeat:

1. Look at the middle position, `mid = (low + high) / 2`.
2. If `values[mid]` is the target, you have found it.
3. If `values[mid]` is smaller than the target, the target must be to the right, so move `low` to `mid + 1`.
4. If it is bigger, the target must be to the left, so move `high` to `mid - 1`.

When `low` passes `high`, there is nowhere left to look and the value is not in the array.

## A trace

Searching for 42 in `4 8 15 16 23 42 50 61` (indexes 0 to 7):

| low | high | mid | values[mid] | Decision |
|---|---|---|---|---|
| 0 | 7 | 3 | 16 | too small, so low = 4 |
| 4 | 7 | 5 | 42 | found at index 5 |

Two looks instead of six. Searching for 7, which is missing, takes three looks (16, 8, then 4) before `low` passes `high`.

## Why it is so fast

Every look cuts the part still to search in half. 8 values need at most 4 looks, 1,000 need at most 10, and a million need about 20. Linear search on a million might need a million looks. Doubling the list adds just one more look.

## It only works on sorted data

The decision "too small, so go right" is only true when the values are in order. On an unsorted list binary search can miss a value that is there. Sorting first is the subject of the next lessons.

## Writing the loop

```c
int low = 0;
int high = count - 1;
while (low <= high) {
    int mid = (low + high) / 2;
    // compare values[mid] with the target and move low or high
}
return -1;
```

Integer division rounds down, so `mid` is always a whole position. The test is `low <= high`, not `low < high`: when the two meet, there is still one value left to check.

## Common mistakes

- **`low = mid` instead of `low = mid + 1`.** The middle has already been checked; keeping it can loop forever when two values are left.
- **`while (low < high)`.** It stops one look early and misses a value in the last remaining place.
- **Searching an unsorted array.** The answer can be "not found" for a value that is right there.

::: kid
Your friend thinks of a number from 1 to 100.

You guess 50. They say lower.

Now you know it is from 1 to 49.

You guess the middle again, 25. They say higher.

Each guess throws away half the numbers.

Soon only one number is left.

This only works when the numbers are in order.
:::

```c {role=example file=guess.c}
#include <stdio.h>

int main() {
    int secret = 37;
    int low = 1;
    int high = 100;
    int guesses = 0;

    while (low <= high) {
        int guess = (low + high) / 2;
        guesses++;
        if (guess == secret) {
            printf("Guess %d: got it in %d guesses\n", guess, guesses);
            break;
        } else if (guess < secret) {
            printf("Guess %d: too low\n", guess);
            low = guess + 1;
        } else {
            printf("Guess %d: too high\n", guess);
            high = guess - 1;
        }
    }
    return 0;
}
```

::: try
The program reads eight numbers in increasing order and then a number to look for. `main` is finished. Write `binary_search` so it returns the index of the target, or -1 if it is not there.

Each time you look at a middle value, print it first, in the form `Look at 16`. Use `low = 0`, `high = count - 1` and `mid = (low + high) / 2`, so that your program looks at the same values as the checks expect.
:::

::: try-kid
The numbers are already in order.

Look in the middle first. Say the number you look at.

Too small? Look in the right half. Too big? Look in the left half.

Give back the place where you find it.

Not there? Give back -1.
:::

```c {role=starter file=binary.c}
#include <stdio.h>

int binary_search(int values[], int count, int target) {
    // Search here, printing each middle value you look at.
    return -1;
}

int main() {
    int values[8];
    int target;

    for (int i = 0; i < 8; i++) {
        scanf("%d", &values[i]);
    }
    scanf("%d", &target);

    int where = binary_search(values, 8, target);
    if (where == -1) {
        printf("Not found\n");
    } else {
        printf("Found at index %d\n", where);
    }
    return 0;
}
```

```c {role=solution file=binary.c}
#include <stdio.h>

int binary_search(int values[], int count, int target) {
    int low = 0;
    int high = count - 1;

    while (low <= high) {
        int mid = (low + high) / 2;
        printf("Look at %d\n", values[mid]);
        if (values[mid] == target) {
            return mid;
        } else if (values[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}

int main() {
    int values[8];
    int target;

    for (int i = 0; i < 8; i++) {
        scanf("%d", &values[i]);
    }
    scanf("%d", &target);

    int where = binary_search(values, 8, target);
    if (where == -1) {
        printf("Not found\n");
    } else {
        printf("Found at index %d\n", where);
    }
    return 0;
}
```
