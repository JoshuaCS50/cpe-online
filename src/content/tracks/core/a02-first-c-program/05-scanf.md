---
id: core.c.scanf
kind: mini
track: core
unit: a2
order: 5
title: scanf
titleKid: scanf, the listening helper
symbol: scanf
language: c
concepts: [input, format-string, address]
prereqs: [core.c.variables]
links:
  - to: core.c.printf
    kind: contrast
    note: printf sends values out; scanf brings them in. They share the same placeholders.
est_minutes: 7
checks:
  - type: io-cases
    cases:
      - stdin: ["12", "1.5"]
        expect: "Age 12, height 1.50\n"
      - stdin: ["9", "1.32"]
        expect: "Age 9, height 1.32\n"
  - type: code-contains
    pattern: 'scanf\s*\(\s*"%f"'
    message: Reads the height with %f
hints:
  - Each scanf reads one value. Use %d for the whole number and %f for the decimal.
  - Both variables need & in front of their names inside scanf.
  - 'The two missing lines are: scanf("%d", &age); scanf("%f", &height);'
hintsKid:
  - Use scanf two times. One for each box.
  - Put & in front of each box name.
  - 'Type these: scanf("%d", &age); scanf("%f", &height);'
---
`scanf` reads values that the user types and stores them in variables. Its general form is:

```c
scanf("format string", &variable);
```

The format string holds one placeholder for each value to read, and each placeholder is paired, in order, with a variable whose address follows it.

| Placeholder | Reads | Needs a variable of this type |
|---|---|---|
| `%d` | a whole number | `int` |
| `%f` | a decimal number | `float` |
| `%lf` | a decimal number with more precision | `double` |
| `%s` | one word of text | a `char` array |

## Why the ampersand is there

`printf` only needs to look at a value, so the value itself is enough. `scanf` has to change the variable, and a variable is a place in memory rather than a number floating in the air. The `&` hands over that place, which is how `scanf` finds the variable to write into. Leave it out and the program usually stops with an error, or quietly writes somewhere it should not.

## Reading two values

One call per value:

```c
int age;
float height;
scanf("%d", &age);
scanf("%f", &height);
```

Or a single call, with one placeholder and one address for each value, in matching order:

```c
scanf("%d %f", &age, &height);
```

Either way the user types both answers with a space or a line break between them.

## Where the typing happens

The example on this page sets its values in the code, so it runs without any typing. Open the Try it tab to type the numbers yourself. There the program pauses at each `scanf` and waits until you type a line and press Enter.

**Common mistakes**

- **Leaving out `&`.** `scanf("%d", age);` has no address, so `scanf` cannot store anything.
- **Using `%d` for a `float`.** The placeholder and the variable must agree, or the decimal part is read wrongly.
- **Expecting `scanf` to print a prompt.** It prints nothing at all. Put a `printf` before it to tell the user what to type.

::: kid
`scanf` is a listening helper. It waits for you to type.

Then it drops what you typed into a box.

The helper must know which box. The `&` mark points at it.

Use `%d` for a whole number, like 12.

Use `%f` for a number with a dot, like 1.5.

The helper never asks a question. Use `printf` to ask first.
:::

```c {role=example file=scanf_demo.c}
#include <stdio.h>

int main() {
    int age = 12;
    float height = 1.5;

    printf("A program can ask for a number with scanf.\n");
    printf("The number goes into a box, then a placeholder prints it.\n");
    printf("Here the box age already holds %d.\n", age);
    printf("A decimal works the same way, with its own placeholder.\n");
    printf("Here height already holds %.2f.\n", height);
    printf("Nothing is typed on this tab. Use Try it for that.\n");
    return 0;
}
```

::: try
Read an age and a height from the user, then print them in this form:

```
Age 12, height 1.50
```

The two `scanf` lines are missing. Use `%d` for the age and `%f` for the height, and put `&` before each variable name. The program is checked twice with different numbers, so both values must really be read.
:::

::: try-kid
Read two numbers. One is whole. One has a dot.

Add two `scanf` lines. Put `&` in front of each box name.

Then the program says this:

```
Age 12, height 1.50
```

We will test with other numbers too.
:::

```c {role=starter file=about.c}
#include <stdio.h>

int main() {
    int age;
    float height;

    // Read age and height here.

    printf("Age %d, height %.2f\n", age, height);
    return 0;
}
```

```c {role=solution file=about.c}
#include <stdio.h>

int main() {
    int age;
    float height;

    scanf("%d", &age);
    scanf("%f", &height);

    printf("Age %d, height %.2f\n", age, height);
    return 0;
}
```
