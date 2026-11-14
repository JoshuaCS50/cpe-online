---
id: core.c.parameters
kind: lesson
track: core
unit: a5
order: 2
title: Parameters and return
titleKid: Things in, answer out
language: c
concepts: [parameter, argument-passing, return-value, prototype]
prereqs: [core.c.functions]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["3", "8"]
        expect: "Biggest: 8\n"
      - stdin: ["9", "2"]
        expect: "Biggest: 9\n"
      - stdin: ["5", "5"]
        expect: "Biggest: 5\n"
      - stdin: ["-4", "-7"]
        expect: "Biggest: -4\n"
hints:
  - The function receives two numbers, a and b. Compare them with an if.
  - return sends a value back and ends the function at once, so if a > b you can return a straight away.
  - 'The body is: if (a > b) { return a; } return b;'
hintsKid:
  - The helper gets two numbers. Ask which one is bigger.
  - Send the bigger one back with return.
  - 'Type this: `if (a > b) { return a; } return b;`'
---
A function that always does the same job is useful. A function becomes far more useful when you can hand it values and get an answer back. The answer is often the whole reason for the function.

```c
int square(int x) {
    return x * x;
}
```

Inside the body, `x` stands for whatever number was handed in. The call `square(7)` runs the body with `x` set to 7, and the call gives back 49.

## Parameters and arguments

The names in the brackets of the definition are parameters. Each one has a type, and commas separate them, as in `int add(int a, int b)`. The values written in the brackets of a call are arguments. In `add(3, 5)`, the arguments are 3 and 5.

Arguments are matched to parameters by position. The first argument goes to the first parameter and the second to the second. Their names need not agree with anything in the caller; only the order and the types matter.

## Return type and return

The word in front of the name is the return type. `int` means a whole number comes back, `float` means a decimal one, and `void` means nothing comes back. A function with a return type must give a value of that type.

Inside the body, `return` sends a value back to the caller and ends the function at once. A function may hold more than one `return`, but only one of them ever runs: the first one reached. Lines after it are skipped.

## Using the answer

The answer is an ordinary value, so it can be treated like one. Store it with `int s = square(4);`, print it with `printf("%d\n", square(4));`, or use it inside a larger sum such as `square(3) + square(4)`, which gives 25.

## A decimal answer

```c
float average(int a, int b, int c) {
    return (a + b + c) / 3.0;
}
```

The types decide how division behaves. Dividing by `3` would keep whole numbers only, so the fraction would be lost. Writing `3.0` divides as decimals, and the answer keeps its fraction.

## Prototypes

`main` can come first if the compiler is told what is coming. A prototype is the first line of the function with a semicolon and no body:

```c
int square(int x);
```

Put it above `main`. It announces the name, the parameter types and the return type, so calls are checked before the body is read. The full definition can then sit below `main`.

## Common mistakes

- **No `return` in a function that promises a value.** Many compilers let this through and the caller receives a meaningless value; here the program stops with an error instead. Every path through the body needs a `return`.
- **The wrong number of arguments.** A call must supply one argument for each parameter, in the right order.
- **Ignoring the answer.** `square(5);` on its own line works out 25 and throws it away, because nothing stores or prints the result.

::: kid
A juice machine sits on the counter.

You put fruit in at the top.

Juice comes out at the bottom.

Oranges in, orange juice out.

Apples in, apple juice out.

The machine does the same work every time.

Only what you put in changes.

A helper can work like that too.

Give it numbers, and it gives one back.
:::

```c {role=example file=shapes.c}
#include <stdio.h>

int square(int x);
float average(int a, int b, int c);

int main() {
    printf("7 squared is %d\n", square(7));
    printf("The average of 70, 85 and 90 is %.2f\n", average(70, 85, 90));
    return 0;
}

int square(int x) {
    return x * x;
}

float average(int a, int b, int c) {
    return (a + b + c) / 3.0;
}
```

::: try
`main` is already finished. It reads two numbers and prints the bigger one using a function called `biggest`.

Only the body of `biggest` needs writing. Return the larger of the two numbers. When they are equal, return that same number.
:::

::: try-kid
The helper gets two numbers.

It should send back the bigger one.

If they are the same, send that number.

Compare them with an if.

Send the answer with return.

Only change the helper.

Press Run to test it.
:::

```c {role=starter file=biggest.c}
#include <stdio.h>

int biggest(int a, int b) {
    // Return the larger number here.
    return 0;
}

int main() {
    int a, b;

    scanf("%d", &a);
    scanf("%d", &b);

    printf("Biggest: %d\n", biggest(a, b));
    return 0;
}
```

```c {role=solution file=biggest.c}
#include <stdio.h>

int biggest(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;
}

int main() {
    int a, b;

    scanf("%d", &a);
    scanf("%d", &b);

    printf("Biggest: %d\n", biggest(a, b));
    return 0;
}
```
