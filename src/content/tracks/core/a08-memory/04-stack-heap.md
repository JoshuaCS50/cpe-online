---
id: core.c.stack-heap
kind: lesson
track: core
unit: a8
order: 4
title: The stack and the heap
titleKid: Short-stay shelves and long-stay lockers
language: c
concepts: [stack, heap, lifetime, dangling-pointer, malloc, free]
prereqs: [core.c.pointers-arrays, core.c.scope]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["5"]
        expect: "5 4 3 2 1\n"
      - stdin: ["1"]
        expect: "1\n"
      - stdin: ["8"]
        expect: "8 7 6 5 4 3 2 1\n"
  - type: code-contains
    pattern: 'malloc\s*\('
    message: The function gets its memory from malloc
  - type: code-contains
    pattern: 'free\s*\('
    message: main gives the memory back with free
hints:
  - The array inside make_countdown disappears when the function returns, so the address it returns points at memory that is no longer the program's.
  - Get the memory from the heap instead, which lasts until you free it. Replace int values[10]; with int *values = malloc(n * sizeof(int)); and add #include <stdlib.h>.
  - Once main has printed the numbers, give the memory back with free(countdown);
hintsKid:
  - The helper's shelf is cleared when the helper finishes.
  - Rent a locker with malloc instead. It stays until you give it back.
  - When main is done, give it back with free.
---
Every variable has to live somewhere in memory, and C uses two main places with very different rules. Knowing which is which explains a whole family of bugs.

## The stack

Each time a function is called, it gets a fresh area of memory for its local variables and parameters, called its **stack frame**. When the function returns, the frame is thrown away and its variables stop existing. The next function call reuses the same space.

This is automatic and fast, and it is why local variables need no cleaning up. It is also why a function's locals vanish when it returns: that is the scope rule you already know, seen from memory's side.

## The heap

Sometimes data must outlive the function that made it, or its size is not known until the program runs. For that there is the **heap**, a large pool of memory you ask for and hand back yourself:

```c
int *values = malloc(n * sizeof(int));   // ask for room for n ints
...
free(values);                             // give it back
```

`malloc` (from `<stdlib.h>`) takes a number of bytes and returns the address of a block that big. `sizeof(int)` is the size of one `int`, so `n * sizeof(int)` is room for `n` of them. Memory from the heap stays yours until you call `free`, however many functions return in between.

## Returning the address of a local variable

This function looks reasonable but is badly wrong:

```c
int *make_countdown(int n) {
    int values[10];          // lives in make_countdown's stack frame
    ...
    return values;           // the address of memory about to vanish
}
```

When it returns, its frame is gone, and the caller is left holding a **dangling pointer**: an address that points at memory the program no longer owns. The next function call will reuse that space and overwrite the numbers.

Here is the uncomfortable part: on many systems, including this one, such a program often still prints the right answer, because nothing has overwritten the old frame yet. A bug that hides until something unrelated changes is the hardest kind to find. The fix is to put data that must outlive a function on the heap.

## Who frees it

Every block from `malloc` needs exactly one `free`. When a function returns heap memory to its caller, the caller becomes responsible for freeing it. Forgetting is called a **memory leak**: the program keeps memory it no longer uses, and a long-running program that leaks can run out.

## Common mistakes

- **Returning the address of a local.** Return heap memory, or have the caller pass in an array to fill.
- **Forgetting `sizeof`.** `malloc(n)` gives `n` bytes, which is room for only `n / 4` ints. Write `malloc(n * sizeof(int))`.
- **Freeing stack memory.** Only memory from `malloc`, `calloc` or `realloc` may be passed to `free`.

::: kid
A helper gets a little shelf while it works.

When the helper finishes, the shelf is cleared at once.

Anything left on it is gone.

For things that must stay, rent a locker instead.

The locker stays yours until you hand back the key.

Rent with malloc. Hand back with free.
:::

```c {role=example file=heap_lifetime.c}
#include <stdio.h>
#include <stdlib.h>

int *make_table(int n) {
    int *table = malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        table[i] = (i + 1) * 10;
    }
    return table;
}

int main() {
    int *table = make_table(4);

    printf("The table outlived make_table:");
    for (int i = 0; i < 4; i++) {
        printf(" %d", table[i]);
    }
    printf("\n");

    free(table);
    printf("Memory given back with free\n");
    return 0;
}
```

::: try
`make_countdown` builds an array of the numbers from `n` down to 1 and returns it, but the array lives on the function's stack frame and is gone once it returns. Here it may still print the right numbers, which is what makes the bug dangerous.

Fix it properly: get the memory from `malloc` so it outlives the function (add `#include <stdlib.h>`), and give it back with `free` in `main` once the numbers are printed. `n` is from 1 to 10.
:::

::: try-kid
The helper builds a countdown on its own shelf.

The shelf is cleared when the helper finishes.

Use malloc so the numbers stay.

Then give the memory back with free.
:::

```c {role=starter file=countdown.c}
#include <stdio.h>

int *make_countdown(int n) {
    int values[10];
    for (int i = 0; i < n; i++) {
        values[i] = n - i;
    }
    return values;
}

int main() {
    int n;

    scanf("%d", &n);

    int *countdown = make_countdown(n);
    for (int i = 0; i < n; i++) {
        printf("%d ", countdown[i]);
    }
    printf("\n");
    return 0;
}
```

```c {role=solution file=countdown.c}
#include <stdio.h>
#include <stdlib.h>

int *make_countdown(int n) {
    int *values = malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        values[i] = n - i;
    }
    return values;
}

int main() {
    int n;

    scanf("%d", &n);

    int *countdown = make_countdown(n);
    for (int i = 0; i < n; i++) {
        printf("%d ", countdown[i]);
    }
    printf("\n");
    free(countdown);
    return 0;
}
```
