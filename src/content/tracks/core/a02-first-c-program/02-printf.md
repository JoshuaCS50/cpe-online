---
id: core.c.printf
kind: mini
track: core
unit: a2
order: 2
title: printf
titleKid: printf, the talking helper
symbol: printf
language: c
concepts: [output, format-string]
prereqs: [core.c.hello-world]
links:
  - to: core.py.print
    kind: same-idea
    note: Python's print does the same job with less typing.
est_minutes: 6
checks:
  - type: stdout-equals
    expect: "I am 7 years old\n"
  - type: code-contains
    pattern: '%d'
    message: Uses %d to put the number into the text
hints:
  - Write %d in the text at the spot where the number belongs.
  - After the closing quote, add a comma and then the name of the variable.
  - 'The finished line is: printf("I am %d years old\n", age);'
hintsKid:
  - Put %d where the number should go.
  - After the words, add a comma. Then write age.
  - 'Type this line: printf("I am %d years old\n", age);'
---
`printf` prints text. It can also drop values into that text, which is what the **f** stands for: *formatted*.

```c
printf("text with %d placeholders\n", value);
```

Each placeholder starts with `%` and is replaced, in order, by the values listed after the text.

| Placeholder | Prints | Example value |
|---|---|---|
| `%d` | a whole number (`int`) | `42` |
| `%f` | a number with decimals (`float`, `double`) | `3.500000` |
| `%.2f` | the same, rounded to 2 decimal places | `3.50` |
| `%c` | one character (`char`) | `A` |
| `%s` | text (a string) | `hello` |
| `%%` | a percent sign | `%` |

Two special codes control the layout: `\n` starts a new line and `\t` jumps to the next tab stop. Without `\n`, the next thing printed carries on along the same line.

**Common mistakes**

- **More placeholders than values**, or the other way round. Count them: one value per placeholder.
- **The wrong placeholder for the type.** `%d` with a decimal number prints nonsense. Match `%d` to `int` and `%f` to `float` or `double`.
- **Forgetting `\n`**, so that all the output runs together on one line.

::: kid
`printf` is a talking helper. You give it words. It says them on the screen.

It can also fill in a gap. The gap looks like `%d`.

You write the number after the words. The helper pops it into the gap.

One gap needs one number. Two gaps need two numbers.

`\n` means "go to a new line". It is like pressing Enter.
:::

```c {role=example file=printf.c}
#include <stdio.h>

int main() {
    int apples = 3;
    float price = 2.5;

    printf("I have %d apples.\n", apples);
    printf("Each one costs %.2f.\n", price);
    printf("Together: %.2f\n", apples * price);
    return 0;
}
```

::: try
The variable `age` holds a number. Print this line, using `%d` so that the number comes from the variable and is not typed into the text:

```
I am 7 years old
```
:::

::: try-kid
The box named `age` holds a number. Make the computer say this:

```
I am 7 years old
```

Use `%d` for the number.
:::

```c {role=starter file=age.c}
#include <stdio.h>

int main() {
    int age = 7;
    printf("I am ... years old\n");
    return 0;
}
```

```c {role=solution file=age.c}
#include <stdio.h>

int main() {
    int age = 7;
    printf("I am %d years old\n", age);
    return 0;
}
```
