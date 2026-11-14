---
id: core.c.variables
kind: lesson
track: core
unit: a2
order: 3
title: Variables and input
titleKid: Boxes that hold numbers
language: c
concepts: [variable, type, input, assignment]
prereqs: [core.c.printf]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["3", "4"]
        expect: "Sum = 7\n"
      - stdin: ["10", "-2"]
        expect: "Sum = 8\n"
      - stdin: ["0", "0"]
        expect: "Sum = 0\n"
  - type: code-contains
    pattern: 'scanf\s*\('
    message: Reads the numbers with scanf
hints:
  - You need two scanf lines, one for each number. Each one stores what it reads in a variable.
  - scanf needs to know where the variable lives, so put & in front of its name.
  - Add the two variables and store the result, for example sum = a + b. Then print it with %d.
  - 'The three missing lines are: scanf("%d", &a); scanf("%d", &b); sum = a + b;'
hintsKid:
  - Read two numbers. Use scanf two times.
  - Put & in front of the box name.
  - Add the two boxes. Put the answer in sum.
  - 'Type these: scanf("%d", &a); scanf("%d", &b); sum = a + b;'
---
A **variable** is a named place in memory that holds a value. Before using one, you tell C its **type** (what kind of value it holds) and its **name**:

```c
int count;        // a whole number
float price;      // a number with decimals
char grade;       // a single character
```

Give a variable a value with `=`. Read it as "becomes", not "equals":

```c
count = 5;            // count becomes 5
count = count + 1;    // count becomes 6
```

The right-hand side is worked out first, and the result is stored in the variable on the left. Whatever was there before is gone.

## Reading input

`scanf` is the mirror image of `printf`: it reads what the user types and stores it in a variable.

```c
int age;
scanf("%d", &age);
```

The `&` means "the address of". `printf` only needs the *value* of a variable, but `scanf` has to *change* the variable, so it needs to know where the variable lives. Leaving out the `&` is the most common `scanf` mistake.

## A variable has no value until you give it one

```c
int total;
printf("%d\n", total);   // prints whatever happened to be in memory
```

C does not set new variables to zero. Always give a variable a value before reading it, either with `=` or by reading into it with `scanf`.

## Choosing a type

| Type | Holds | Placeholder |
|---|---|---|
| `int` | whole numbers: `-3`, `0`, `42` | `%d` |
| `float` | numbers with decimals: `3.14` | `%f` |
| `double` | the same, with more precision | `%lf` in `scanf`, `%f` in `printf` |
| `char` | one character: `'A'` | `%c` |

Dividing two `int` values throws away the remainder: `7 / 2` is `3`. Use `float` or `double` when the decimals matter.

::: kid
A variable is a box with a name on it.

The box holds one thing. A number, for example.

You can put a new number in the box. The old number goes away.

`scanf` listens to what you type. Then it drops that into a box.

`scanf` must know where the box is. The `&` mark shows it the way.

A new box is not empty. It holds junk! Always put your own number in first.
:::

```c {role=example file=variables.c}
#include <stdio.h>

int main() {
    int width = 4;
    int height = 3;
    int area;

    area = width * height;
    printf("A %d by %d rectangle has area %d.\n", width, height, area);

    width = width + 1;
    area = width * height;
    printf("One wider, and the area is %d.\n", area);
    return 0;
}
```

::: try
Read two whole numbers from the user and print their sum in this form:

```
Sum = 7
```

The program is checked with several pairs of numbers, so the sum has to be worked out, not typed in.
:::

::: try-kid
Read two numbers. Add them. Then say the answer like this:

```
Sum = 7
```

We will test it with other numbers too.
:::

```c {role=starter file=sum.c}
#include <stdio.h>

int main() {
    int a, b, sum;

    // Read a and b here, then work out sum.

    printf("Sum = %d\n", sum);
    return 0;
}
```

```c {role=solution file=sum.c}
#include <stdio.h>

int main() {
    int a, b, sum;

    scanf("%d", &a);
    scanf("%d", &b);
    sum = a + b;

    printf("Sum = %d\n", sum);
    return 0;
}
```
