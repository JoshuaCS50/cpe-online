---
id: core.c.searching
kind: lesson
track: core
unit: a6
order: 3
title: Searching an array
titleKid: Looking in every box
language: c
concepts: [linear-search, array-parameter, sentinel-result]
prereqs: [core.c.arrays, core.c.parameters]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["4", "8", "15", "16", "23", "42", "15"]
        expect: "Found at index 2\n"
      - stdin: ["4", "8", "15", "16", "23", "42", "7"]
        expect: "Not found\n"
      - stdin: ["4", "8", "15", "16", "23", "42", "4"]
        expect: "Found at index 0\n"
      - stdin: ["4", "8", "15", "16", "23", "42", "42"]
        expect: "Found at index 5\n"
      - stdin: ["5", "3", "5", "3", "5", "3", "3"]
        expect: "Found at index 1\n"
hints:
  - Look at each element in turn with a for loop from 0 to count - 1.
  - As soon as values[i] equals target, return i. The function ends there, which also gives the first match when there are several.
  - 'The body is: for (int i = 0; i < count; i++) { if (values[i] == target) { return i; } } return -1;'
hintsKid:
  - Look in each box, one at a time.
  - Found it? Give back the box number straight away.
  - 'Type this: `for (int i = 0; i < count; i++) { if (values[i] == target) { return i; } } return -1;`'
---
A search asks two things: is this value in the array, and if so, where? The simplest method is a linear search. It looks at the first element, then the second, and keeps going until it finds the value or reaches the end of the array.

## Passing an array to a function

A function that searches needs the array and the value to look for. It also needs the count, because an array parameter carries no size of its own:

```c
int find(int values[], int count, int target) {
    for (int i = 0; i < count; i++) {
        if (values[i] == target) {
            return i;
        }
    }
    return -1;
}
```

The parameter is written `int values[]`, with empty brackets. The count is passed separately, so the function knows how far to look.

## The caller's own array

An array is not copied when it is passed. The function works on the caller's own array, so it can change the values in it:

```c
void double_all(int values[], int count) {
    for (int i = 0; i < count; i++) {
        values[i] = values[i] * 2;
    }
}
```

After `double_all(marks, 5)`, the marks in `main` are doubled. A plain value such as an `int` is different. It arrives as a copy, so changing the parameter leaves the caller's variable alone, as the scope lesson showed.

## A position, or -1

A real index is 0 or more, so -1 can never be one. Returning -1 is therefore a safe way to say "not there". The caller must check for it before using the answer as an index:

```c
int where = find(values, count, target);

if (where == -1) {
    printf("Not found\n");
} else {
    printf("Found at index %d\n", where);
}
```

## First match, or every match

Returning as soon as the value is found gives the first match, which is usually what a search should do. Counting every match is a different job: the loop must keep going to the end and add one each time:

```c
int count_of(int values[], int count, int target) {
    int total = 0;

    for (int i = 0; i < count; i++) {
        if (values[i] == target) {
            total++;
        }
    }
    return total;
}
```

## How long it takes

In the worst case the value is not there at all, so every element is checked. That is fine for short lists. A later unit shows a faster search that works when the list is sorted.

## Common mistakes

- **Returning -1 inside the loop.** If the first element does not match, the function stops at once, so only index 0 is ever checked. Return -1 after the loop.
- **Using the answer without checking.** When the search returns -1, `values[where]` reads before the start of the array.
- **Looping with `<=`.** For `count` elements the last index is `count - 1`, so the test is `i < count`.

::: kid
Your coat hangs on a peg at school.

The pegs are in a long row.

Each peg has a number.

You start at peg 0 and look.

No coat here, so walk on.

Still no coat. Walk on again.

When you find it, you stop.

You remember that peg number.

If you reach the end, your coat is not there.
:::

```c {role=example file=dice.c}
#include <stdio.h>

int count_of(int values[], int size, int target) {
    int total = 0;

    for (int i = 0; i < size; i++) {
        if (values[i] == target) {
            total++;
        }
    }
    return total;
}

int main() {
    int rolls[8] = {3, 6, 1, 6, 2, 6, 4, 1};

    printf("6 came up %d times\n", count_of(rolls, 8, 6));
    printf("5 came up %d times\n", count_of(rolls, 8, 5));
    return 0;
}
```

::: try
The program reads six numbers, then one more number to look for. `main` is finished.

Only `find` needs writing. It should return the index of the first match, or -1 when the value is not in the array. Indexes count from 0.
:::

::: try-kid
The program reads six numbers.

Then it reads one more number.

Look for that number in the boxes.

Give back the box number.

If it is not there, give back -1.

Only change the helper.

Press Run to test it.
:::

```c {role=starter file=search.c}
#include <stdio.h>

int find(int values[], int count, int target) {
    // Look through the array here.
    return -1;
}

int main() {
    int values[6];
    int target;

    for (int i = 0; i < 6; i++) {
        scanf("%d", &values[i]);
    }
    scanf("%d", &target);

    int where = find(values, 6, target);
    if (where == -1) {
        printf("Not found\n");
    } else {
        printf("Found at index %d\n", where);
    }
    return 0;
}
```

```c {role=solution file=search.c}
#include <stdio.h>

int find(int values[], int count, int target) {
    for (int i = 0; i < count; i++) {
        if (values[i] == target) {
            return i;
        }
    }
    return -1;
}

int main() {
    int values[6];
    int target;

    for (int i = 0; i < 6; i++) {
        scanf("%d", &values[i]);
    }
    scanf("%d", &target);

    int where = find(values, 6, target);
    if (where == -1) {
        printf("Not found\n");
    } else {
        printf("Found at index %d\n", where);
    }
    return 0;
}
```
