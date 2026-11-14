---
id: core.c.memory-bugs
kind: lesson
track: core
unit: a8
order: 6
title: "Bug hunt: memory"
titleKid: Find the memory mistakes
language: c
concepts: [debugging, buffer-overflow, use-after-free, memory-leak, debugger]
prereqs: [core.c.malloc, core.c.loop-bugs]
links:
  - to: core.c.loop-bugs
    kind: builds-on
    note: The same one-fix-at-a-time method, now for memory mistakes.
est_minutes: 15
checks:
  - type: stdout-equals
    expect: "Last square: 9\nTotal: 14\n"
  - type: code-contains
    pattern: 'free\s*\(\s*squares\s*\)'
    message: Still gives the memory back with free(squares)
hints:
  - Press Run. The first card says the program used a position past the end of the block. Look at the first loop's test.
  - The block has room for n values, positions 0 to n - 1, so the loop must stop at i < n.
  - After that fix, the next card says memory was used after free. Move the printf of the last square above free(squares);
hintsKid:
  - Press Run and read the card. Look at the first loop.
  - The last box is number n - 1. Stop before n.
  - Next card? Use the boxes first. Give them back last.
---
Memory bugs are among the worst in C. On most systems they do not stop the program: it reads or overwrites memory it should not touch and carries on, and the damage shows up later, somewhere else. Here, the most common memory mistakes stop the program at once with an error card, which makes them far easier to learn from. The habits below are what C programmers use everywhere else.

## Writing past the end of a block

A block from `malloc(n * sizeof(int))` has room for exactly `n` ints, at positions 0 to `n - 1`. A loop written `i <= n` writes one place too far. That place belongs to something else, so on a real system this corrupts other data. Here the program stops with an error saying the index is out of bounds, and the card points at the line.

## Using memory after free

After `free(p)`, `p` still holds the old address, which makes it easy to keep using it by mistake. Anything read through it is meaningless, and writing through it can corrupt memory the system has given to something else. Here the program stops with an error saying the memory was already given back.

## Freeing twice, or freeing the wrong thing

Each block is freed exactly once, with the address `malloc` returned. Freeing it again, freeing an ordinary array, or freeing a pointer you have moved along with `p++` are all errors. Setting a pointer to `NULL` right after freeing it makes a second `free` harmless, because `free(NULL)` does nothing.

## Leaks

Forgetting to free is called a leak. A leak does not stop a program and does not show up in its output, so no error card appears here. Read through your program and match every `malloc` with exactly one `free`.

## Hunting with the debugger

When the card points at a line inside a loop, the debugger shows you why. It lives in Code mode: copy the program into a file there, click in the margin beside the line to set a breakpoint, press Debug, and step with Step over while watching the loop counter in the Variables panel. You will see the moment the counter reaches a value the block has no room for. Then fix one thing, run again, and read the next card.

## Common mistakes

- **Fixing the symptom.** Making the block bigger hides a `<=` bug instead of fixing the loop.
- **Changing several things at once.** Fix one line, run, and read the next card.
- **Freeing too early.** Give memory back only after the last line that uses it.

::: kid
You borrow some boxes from the store room.

You must only use the boxes you were given.

Reaching for one box too many is a mistake.

When you give the boxes back, stop using them.

Using a box after giving it back is a mistake too.

Find each mistake one at a time.
:::

```c {role=example file=null_after_free.c}
#include <stdio.h>
#include <stdlib.h>

int main() {
    int *data = malloc(3 * sizeof(int));

    for (int i = 0; i < 3; i++) {
        data[i] = i + 1;
    }
    printf("Last value: %d\n", data[2]);

    free(data);
    data = NULL;

    if (data == NULL) {
        printf("data is NULL, so nobody can use the old memory by mistake\n");
    }
    free(data);
    printf("free(NULL) does nothing, so freeing again is harmless\n");
    return 0;
}
```

::: try
This program should store the squares of 0 to 3 in memory from `malloc`, then print the last square and the total:

```
Last square: 9
Total: 14
```

It has two memory bugs on purpose. Press Run, read the card, fix one thing, and run again until it prints those two lines. Keep the `free(squares);`: the memory must still be given back.
:::

::: try-kid
The program has two memory mistakes.

Press Run. Read the card. Fix one thing.

Press Run again. Read the next card.

Keep going until it says the two lines.
:::

```c {role=starter file=squares.c}
#include <stdio.h>
#include <stdlib.h>

int main() {
    int n = 4;
    int *squares = malloc(n * sizeof(int));

    for (int i = 0; i <= n; i++) {
        squares[i] = i * i;
    }

    int total = 0;
    for (int i = 0; i < n; i++) {
        total += squares[i];
    }

    free(squares);
    printf("Last square: %d\n", squares[n - 1]);
    printf("Total: %d\n", total);
    return 0;
}
```

```c {role=solution file=squares.c}
#include <stdio.h>
#include <stdlib.h>

int main() {
    int n = 4;
    int *squares = malloc(n * sizeof(int));

    for (int i = 0; i < n; i++) {
        squares[i] = i * i;
    }

    int total = 0;
    for (int i = 0; i < n; i++) {
        total += squares[i];
    }

    printf("Last square: %d\n", squares[n - 1]);
    free(squares);
    printf("Total: %d\n", total);
    return 0;
}
```
