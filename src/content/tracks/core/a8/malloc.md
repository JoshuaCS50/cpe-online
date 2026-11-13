---
id: core.c.malloc
kind: lesson
track: core
unit: a8
order: 5
title: malloc and free
titleKid: Asking for exactly enough room
language: c
concepts: [malloc, free, calloc, realloc, dynamic-array, sizeof]
prereqs: [core.c.stack-heap]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["4", "10", "20", "30", "40"]
        expect: "Above average: 2\n"
      - stdin: ["1", "50"]
        expect: "Above average: 0\n"
      - stdin: ["5", "1", "2", "3", "4", "100"]
        expect: "Above average: 1\n"
      - stdin: ["3", "70", "70", "70"]
        expect: "Above average: 0\n"
  - type: code-contains
    pattern: 'malloc\s*\('
    message: Gets room for the marks with malloc
  - type: code-contains
    pattern: 'free\s*\(\s*marks\s*\)'
    message: Gives the memory back with free(marks)
hints:
  - Ask for room for count marks with marks = malloc(count * sizeof(int)); then read each one with scanf("%d", &marks[i]); and add it to a total.
  - The average is (float) total / count. Then loop again and count the marks bigger than the average.
  - Finish with free(marks); before printing or after, but before main ends.
hintsKid:
  - Ask malloc for room for all the marks.
  - Read them in. Add them up. Work out the average.
  - Count the marks above it. Then give the room back with free.
---
An array's size has to be written in the program: `int marks[100];`. But often the program only finds out how much room it needs while running, for example when the user types how many marks there are. `malloc` solves this: it asks for exactly the room needed, at the moment it is needed.

## Asking for memory

```c
int count;
scanf("%d", &count);
int *marks = malloc(count * sizeof(int));
```

`malloc` takes a number of bytes, so multiply the number of elements by `sizeof` one element. It returns the address of the block, which you keep in a pointer of the right type. From then on, `marks` is used exactly like an array: `marks[i]`, `&marks[i]` in `scanf`, `*(marks + i)`.

## Checking the result

On a real computer `malloc` can fail when memory runs out, and then it returns `NULL`. Careful programs check:

```c
if (marks == NULL) {
    printf("Out of memory\n");
    return 1;
}
```

Small programs here will not run out, but the habit matters in real projects.

## Giving it back

`free(marks);` returns the block. After that, `marks` still holds the old address, but using it is a bug. A common habit is to set it to `NULL` straight after: `marks = NULL;`.

## calloc and realloc

`calloc(count, sizeof(int))` asks for room for `count` elements and sets every byte to zero. In real C, `malloc` does not clear the memory, so it starts with leftover junk; here both start at zero, but do not rely on that elsewhere.

`realloc(marks, newCount * sizeof(int))` changes the size of a block, keeping the values already in it, and returns the address of the resized block, which may be a different place. Always keep the result: `marks = realloc(marks, newCount * sizeof(int));`.

## The rules in one place

1. Ask with `malloc` (or `calloc`), multiplying by `sizeof`.
2. Use the memory only between the `malloc` and the `free`.
3. `free` each block exactly once, with the address `malloc` gave you.

## Common mistakes

- **Forgetting `sizeof`.** `malloc(count)` gives `count` bytes, room for only a quarter as many ints.
- **Using memory after `free`.** Here the program stops with an error saying the memory was already given back; elsewhere it quietly reads rubbish.
- **Losing the pointer.** Writing `marks = malloc(...)` a second time without freeing the first block leaks it: nothing can free it any more.

::: kid
Some days you need two boxes. Some days you need ten.

So you ask the store room for exactly enough boxes.

That is what malloc does.

The boxes are yours while you work.

When you finish, you take them all back.

That is what free does.

Never use a box after you have taken it back.
:::

```c {role=example file=grow.c}
#include <stdio.h>
#include <stdlib.h>

int main() {
    int count = 3;
    int *scores = malloc(count * sizeof(int));

    for (int i = 0; i < count; i++) {
        scores[i] = (i + 1) * 5;
    }

    scores = realloc(scores, 5 * sizeof(int));
    scores[3] = 20;
    scores[4] = 25;

    printf("Scores:");
    for (int i = 0; i < 5; i++) {
        printf(" %d", scores[i]);
    }
    printf("\n");

    free(scores);
    scores = NULL;
    return 0;
}
```

::: try
The program reads how many marks there are, then the marks. It does not know the count in advance, so get room for the marks with `malloc`. Read them in, work out the average, and count how many marks are **above** the average (equal does not count). Store the answer in `above`, and give the memory back with `free(marks)` before `main` ends.
:::

::: try-kid
First the program reads how many marks there are.

Ask malloc for exactly enough room for them.

Read the marks. Find the average.

Count the marks bigger than the average.

Give the room back with free.
:::

```c {role=starter file=marks.c}
#include <stdio.h>
#include <stdlib.h>

int main() {
    int count;
    int *marks = NULL;
    int above = 0;

    scanf("%d", &count);

    // Get room for count marks, read them, and count those above the average.

    printf("Above average: %d\n", above);
    return 0;
}
```

```c {role=solution file=marks.c}
#include <stdio.h>
#include <stdlib.h>

int main() {
    int count;
    int *marks = NULL;
    int above = 0;

    scanf("%d", &count);

    marks = malloc(count * sizeof(int));
    int total = 0;
    for (int i = 0; i < count; i++) {
        scanf("%d", &marks[i]);
        total += marks[i];
    }

    float average = (float) total / count;
    for (int i = 0; i < count; i++) {
        if (marks[i] > average) {
            above++;
        }
    }
    free(marks);

    printf("Above average: %d\n", above);
    return 0;
}
```
