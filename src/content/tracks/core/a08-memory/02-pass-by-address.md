---
id: core.c.pass-by-address
kind: lesson
track: core
unit: a8
order: 2
title: Passing addresses to functions
titleKid: Lending a helper your real box
language: c
concepts: [pass-by-reference, pointer-parameter, swap, out-parameter]
prereqs: [core.c.pointers]
links:
  - to: core.c.scope
    kind: builds-on
    note: A plain parameter is a copy; a pointer parameter lets the function reach the caller's own variable.
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["8", "3"]
        expect: "3 8\n"
      - stdin: ["2", "9"]
        expect: "2 9\n"
      - stdin: ["4", "4"]
        expect: "4 4\n"
      - stdin: ["-1", "-5"]
        expect: "-5 -1\n"
hints:
  - The function receives two addresses. *first and *second are the caller's own variables.
  - If *first is bigger than *second, swap them using a spare int variable.
  - 'The body is: if (*first > *second) { int temp = *first; *first = *second; *second = temp; }'
hintsKid:
  - The helper gets two notes. Each note points at a real box.
  - If the first box holds the bigger number, swap them.
  - 'Use a spare box: `int temp = *first;`'
---
In the scope lesson, a function could not change the caller's variables, because every parameter is a **copy**. Returning a value was the way out, but a function can return only one value. Pointers give a second way: pass the function the **address** of a variable, and it can reach the caller's own variable through it.

## The swap that does not work

```c
void swap(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
}
```

Calling `swap(x, y)` swaps two copies inside the function, and `x` and `y` are untouched. The copies vanish when the function returns.

## The swap that works

```c
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}
```

The parameters are now pointers. The call passes addresses: `swap(&x, &y);`. Inside, `*a` **is** `x` and `*b` **is** `y`, so the swap happens to the real variables. This is often called passing by reference; in C it is done by passing an address.

## You have done this all along

`scanf("%d", &x);` is exactly this. `scanf` cannot return what it reads into your variable, so you give it the address and it stores the number there.

## Giving back more than one answer

A function that works out several results can take one address per result and store each answer through its pointer. These are called out-parameters:

```c
void min_max(int values[], int count, int *smallest, int *largest) {
    *smallest = values[0];
    *largest = values[0];
    for (int i = 1; i < count; i++) {
        if (values[i] < *smallest) {
            *smallest = values[i];
        }
        if (values[i] > *largest) {
            *largest = values[i];
        }
    }
}
```

The caller writes `min_max(marks, 5, &low, &high);` and afterwards `low` and `high` hold the answers.

## When to use which

Return a value when a function produces one answer: it is the clearest. Pass an address when the function must change the caller's variable (like `swap`), or produce several answers (like `min_max`).

## Common mistakes

- **Forgetting `&` in the call.** `swap(x, y)` with pointer parameters passes numbers where addresses are needed.
- **Forgetting `*` inside the function.** `a = b;` copies one address into another pointer and changes neither variable. Write `*a = *b;`.
- **Swapping without a spare variable.** `*a = *b; *b = *a;` leaves both holding the same value.

::: kid
Your friend wants to tidy your toy box.

You could give them a photo of the box.

Tidying the photo does not tidy your real box.

So you tell them where your real box is.

Now they can tidy the real one.

Giving a helper the address works the same way.
:::

```c {role=example file=min_max.c}
#include <stdio.h>

void min_max(int values[], int count, int *smallest, int *largest) {
    *smallest = values[0];
    *largest = values[0];
    for (int i = 1; i < count; i++) {
        if (values[i] < *smallest) {
            *smallest = values[i];
        }
        if (values[i] > *largest) {
            *largest = values[i];
        }
    }
}

int main() {
    int marks[5] = {64, 91, 55, 78, 83};
    int low, high;

    min_max(marks, 5, &low, &high);
    printf("Lowest %d, highest %d\n", low, high);
    return 0;
}
```

::: try
The program reads two numbers and calls `order(&x, &y);`, then prints them. Write `order` so that afterwards `x` holds the smaller number and `y` the larger. If they are already in order, leave them as they are. `main` is finished.
:::

::: try-kid
The program reads two numbers.

The helper called order gets the address of each one.

Make the first box hold the smaller number.

Swap them if they are the wrong way round.
:::

```c {role=starter file=order.c}
#include <stdio.h>

void order(int *first, int *second) {
    // Swap the two numbers if they are the wrong way round.
}

int main() {
    int x, y;

    scanf("%d", &x);
    scanf("%d", &y);

    order(&x, &y);
    printf("%d %d\n", x, y);
    return 0;
}
```

```c {role=solution file=order.c}
#include <stdio.h>

void order(int *first, int *second) {
    if (*first > *second) {
        int temp = *first;
        *first = *second;
        *second = temp;
    }
}

int main() {
    int x, y;

    scanf("%d", &x);
    scanf("%d", &y);

    order(&x, &y);
    printf("%d %d\n", x, y);
    return 0;
}
```
