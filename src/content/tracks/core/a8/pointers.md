---
id: core.c.pointers
kind: lesson
track: core
unit: a8
order: 1
title: Addresses and pointers
titleKid: A note that says where a box is
language: c
concepts: [memory, address, pointer, dereference, null-pointer]
prereqs: [core.c.scope, core.c.arrays]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["3", "8"]
        expect: "a = 3, b = 18\n"
      - stdin: ["9", "2"]
        expect: "a = 19, b = 2\n"
      - stdin: ["5", "5"]
        expect: "a = 15, b = 5\n"
  - type: code-contains
    pattern: '\*\s*bigger\s*(\+=|=)'
    message: Changes the number through the pointer
hints:
  - Point bigger at a when a >= b, and at b otherwise. An address is written with &, for example bigger = &a;
  - Then add 10 to the variable bigger points at, using *bigger.
  - 'The lines are: if (a >= b) { bigger = &a; } else { bigger = &b; } and then *bigger += 10;'
hintsKid:
  - Point the note at the bigger box. Use & to get its address.
  - Then add 10 to the box the note points at.
  - 'Type this: `*bigger += 10;`'
---
Every variable lives somewhere in the computer's memory. Memory is a long row of numbered places, and the number of a variable's place is its **address**. So far you have reached variables by their names. C also lets you work with their addresses, and that opens up some of the most useful things the language can do.

## Getting an address

`&x` means "the address of `x`". You met it in `scanf("%d", &x);`: `scanf` needs to know where `x` lives so it can store a number there. `printf("%p\n", &x);` prints an address as a hexadecimal number. The exact value is not important, and it differs from computer to computer.

## Pointers

A **pointer** is a variable that holds an address. It is declared with `*` after the type of the thing it points at:

```c
int x = 5;
int *p = &x;   // p holds the address of x: p "points at" x
```

Read `int *p` as "p is a pointer to an int". A pointer can only point at the type it was declared for.

## Following a pointer

Writing `*p` (outside a declaration) means "the variable that `p` points at". You can read it and you can change it:

```c
printf("%d\n", *p);   // prints 5, the value of x
*p = 9;               // changes x to 9
```

After `*p = 9;`, `x` is 9, even though the line never mentions `x`. That is the whole idea: a pointer is a second way to reach a variable.

The same symbol `*` does two jobs, and it helps to tell them apart: in a declaration (`int *p`) it says "this is a pointer"; anywhere else (`*p = 9`) it says "follow this pointer".

## Pointing somewhere else

A pointer can be changed to point at a different variable, just like any other variable can be given a new value:

```c
int y = 2;
p = &y;      // now p points at y
*p = 7;      // changes y, not x
```

## NULL and pointers that point nowhere

`NULL` (from `<stdlib.h>`) is a special pointer value that means "points at nothing". A pointer declared without a starting value also points at nothing useful. Following such a pointer with `*` is always a mistake. Here the program stops with an error saying the pointer points at nothing; on many systems it crashes, or quietly corrupts memory. Check a pointer before following it when it might be `NULL`: `if (p != NULL) { ... }`.

## Common mistakes

- **Forgetting the `&`.** `int *p = x;` tries to use the value 5 as an address. Write `int *p = &x;`.
- **Following a pointer that was never set.** `int *p; *p = 5;` writes through nowhere.
- **Mixing up `p` and `*p`.** `p = 9;` changes where the pointer points; `*p = 9;` changes the variable it points at.

::: kid
Every box in memory has a number, like a house.

The number is called its address.

A pointer is a note with an address written on it.

The note does not hold the toy. It says where the toy is.

Follow the note and you reach the real box.

Change what is in that box, and the box really changes.

A note with no address leads nowhere.
:::

```c {role=example file=pointer.c}
#include <stdio.h>

int main() {
    int x = 5;
    int y = 2;
    int *p = &x;

    printf("x = %d, and p points at a value of %d\n", x, *p);

    *p = 9;
    printf("After *p = 9, x = %d\n", x);

    p = &y;
    *p = 7;
    printf("After pointing at y, x = %d and y = %d\n", x, y);

    printf("The same address twice: %p %p\n", p, &y);
    return 0;
}
```

::: try
The program reads two numbers into `a` and `b`. Make the pointer `bigger` point at the larger of the two (at `a` if they are equal), then add 10 to that variable **through the pointer**, without naming `a` or `b` in the line that adds. The printing is already written.
:::

::: try-kid
The program reads two numbers, a and b.

Point the note called bigger at the bigger number.

If they are the same, point at a.

Then add 10 to that box, using the note.
:::

```c {role=starter file=bigger.c}
#include <stdio.h>
#include <stdlib.h>

int main() {
    int a, b;
    int *bigger = NULL;

    scanf("%d", &a);
    scanf("%d", &b);

    // Point bigger at the larger number, then add 10 through it.

    printf("a = %d, b = %d\n", a, b);
    return 0;
}
```

```c {role=solution file=bigger.c}
#include <stdio.h>
#include <stdlib.h>

int main() {
    int a, b;
    int *bigger = NULL;

    scanf("%d", &a);
    scanf("%d", &b);

    if (a >= b) {
        bigger = &a;
    } else {
        bigger = &b;
    }
    *bigger += 10;

    printf("a = %d, b = %d\n", a, b);
    return 0;
}
```
