---
id: core.c.pointers-arrays
kind: lesson
track: core
unit: a8
order: 3
title: Pointers and arrays
titleKid: A finger moving along a row
language: c
concepts: [pointer-arithmetic, array-decay, pointer-comparison]
prereqs: [core.c.pass-by-address]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["1", "2", "3", "4", "5", "6"]
        expect: "6 5 4 3 2 1\n"
      - stdin: ["10", "-3", "7", "0", "7", "2"]
        expect: "2 7 0 7 -3 10\n"
      - stdin: ["4", "4", "4", "4", "4", "4"]
        expect: "4 4 4 4 4 4\n"
  - type: code-contains
    pattern: 'start\s*<\s*end'
    message: Keeps going while start is before end
hints:
  - start points at the first number and end at the last. Swap *start and *end.
  - Then move start one place right with start++ and end one place left with end--, and repeat while start < end.
  - 'The loop is: while (start < end) { int temp = *start; *start = *end; *end = temp; start++; end--; }'
hintsKid:
  - One finger is at the front. One is at the back.
  - Swap the two numbers. Move both fingers one step inward.
  - Stop when the fingers meet.
---
Arrays and pointers are closely linked in C. Understanding how is the key to reading a lot of real C code, and it explains why arrays behave the way they do when passed to functions.

## An array name is an address

When you use an array's name in an expression, it stands for the address of its first element. So these two lines do the same thing:

```c
int *p = values;
int *p = &values[0];
```

That is why `scanf("%s", word)` needs no `&`, and why a function given an array can change it: what is passed is the address of the first element, not a copy of the array.

## Pointer arithmetic

Adding a number to a pointer moves it along the array by that many **elements**, not bytes:

```c
int values[4] = {10, 20, 30, 40};
int *p = values;
printf("%d\n", *(p + 2));   // 30
```

`*(p + i)` and `p[i]` mean exactly the same thing, and so do `values[i]` and `*(values + i)`. The square brackets are a shorthand for "move along, then follow".

## Moving a pointer

A pointer variable can be moved with `++`, `--`, `+=` and `-=`. This walks along an array without an index:

```c
for (int *p = values; p < values + 4; p++) {
    printf("%d ", *p);
}
```

`values + 4` is the address just past the last element. Pointers into the same array can be compared with `<`, `>`, `==`, and subtracted: `end - start` is the number of elements between them.

## Two pointers moving towards each other

Reversing an array needs no second array. Point one pointer at the first element and another at the last, swap what they point at, then move them one step towards each other. When they meet or cross, every pair has been swapped.

## Arrays are not pointers, though

An array name cannot be moved: `values++` is an error, because the array always starts in the same place. And `sizeof(values)` gives the size of the whole array, while `sizeof(p)` gives the size of one pointer. Inside a function that receives `int values[]`, the parameter really is a pointer, which is why the count has to be passed separately.

## Common mistakes

- **Going past the end.** Following `values + 4` in an array of 4 reads a place that is not part of the array. It is fine to point there, but not to use `*` on it.
- **Comparing pointers into different arrays.** `<` only makes sense for two positions in the same array.
- **`*p++` against `(*p)++`.** The first reads the value and then moves the pointer; the second adds one to the value and leaves the pointer where it is.

::: kid
Houses stand in a row along a street.

Your finger points at the first house.

Move your finger one step. Now it points at the next house.

Put one finger at each end of the row.

Swap the houses under your fingers.

Move both fingers one step inward.

When your fingers meet, the row is turned around.
:::

```c {role=example file=walk.c}
#include <stdio.h>

int main() {
    int values[5] = {10, 20, 30, 40, 50};
    int *p = values;

    printf("p[2] = %d and *(p + 2) = %d\n", p[2], *(p + 2));

    printf("Walking:");
    for (int *q = values; q < values + 5; q++) {
        printf(" %d", *q);
    }
    printf("\n");

    int *first = &values[0];
    int *last = &values[4];
    printf("There are %d steps from the first to the last\n", (int)(last - first));
    return 0;
}
```

::: try
The program reads six numbers and calls `reverse(values, values + 5);`, then prints the array. Write `reverse` so it turns the array around in place. `start` points at the first element and `end` at the last. Use the two pointers: swap what they point at, move them towards each other, and stop when `start` is no longer before `end`.
:::

::: try-kid
The program reads six numbers.

Turn the row around, using two fingers.

One finger starts at the front. One starts at the back.

Swap, then move both fingers inward. Stop when they meet.
:::

```c {role=starter file=reverse.c}
#include <stdio.h>

void reverse(int *start, int *end) {
    // Swap and move the two pointers towards each other.
}

int main() {
    int values[6];

    for (int i = 0; i < 6; i++) {
        scanf("%d", &values[i]);
    }

    reverse(values, values + 5);

    for (int i = 0; i < 6; i++) {
        printf("%d ", values[i]);
    }
    printf("\n");
    return 0;
}
```

```c {role=solution file=reverse.c}
#include <stdio.h>

void reverse(int *start, int *end) {
    while (start < end) {
        int temp = *start;
        *start = *end;
        *end = temp;
        start++;
        end--;
    }
}

int main() {
    int values[6];

    for (int i = 0; i < 6; i++) {
        scanf("%d", &values[i]);
    }

    reverse(values, values + 5);

    for (int i = 0; i < 6; i++) {
        printf("%d ", values[i]);
    }
    printf("\n");
    return 0;
}
```
