---
id: core.c.recursion
kind: lesson
track: core
unit: a5
order: 4
title: Recursion
titleKid: A helper that asks itself
language: c
concepts: [recursion, base-case, call-stack]
prereqs: [core.c.parameters]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["2", "10"]
        expect: "1024\n"
      - stdin: ["3", "0"]
        expect: "1\n"
      - stdin: ["5", "3"]
        expect: "125\n"
      - stdin: ["7", "1"]
        expect: "7\n"
  - type: code-contains
    pattern: 'return\s+[^;]*\bpower\s*\('
    message: power calls itself
hints:
  - Start with the base case. Any number to the power 0 is 1, so if exp is 0, return 1.
  - For a bigger exp, base to the power exp is base times base to the power exp - 1. That smaller problem is a call to power itself.
  - 'The body is: if (exp == 0) { return 1; } return base * power(base, exp - 1);'
hintsKid:
  - When exp is 0, the answer is 1. Return 1.
  - Otherwise, multiply base by a smaller power.
  - 'Type this: `if (exp == 0) { return 1; } return base * power(base, exp - 1);`'
---
A function may call itself. That is recursion. It works when each call hands the next call a smaller version of the same problem, until the problem is small enough that the answer is already known.

## Two parts

Every recursive function has two parts:

- **Base case:** the smallest version, answered directly without calling again.
- **Recursive case:** every bigger version, answered by calling the same function on a smaller problem and using what comes back.

Take the factorial of a number, written `factorial(n)`. The factorial of 1 is 1. For any bigger `n`, it is `n` times the factorial of `n - 1`:

```c
int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
```

The body holds both parts. The `if` answers the base case. The last line answers everything else, and its call is smaller because `n - 1` is less than `n`.

## One call at a time

Here is `factorial(4)` traced in full:

| Call | Asks for | Answers |
|---|---|---|
| `factorial(4)` | `factorial(3)` | `4 * 6 = 24` |
| `factorial(3)` | `factorial(2)` | `3 * 2 = 6` |
| `factorial(2)` | `factorial(1)` | `2 * 1 = 2` |
| `factorial(1)` | nothing | `1` |

The first three calls cannot finish yet, because each one waits on the next. The smallest call answers at once with 1. Then the answers travel back up: 2, then 6, then 24. The table reads downwards on the way in, and its last column fills on the way out.

## Each call has its own copy

While `factorial(4)` waits, its `n` stays 4. The call it made gets a fresh `n` set to 3, and that copy belongs to that call alone. Every waiting call keeps its own copy until it returns.

The computer holds waiting calls in a stack. A new call goes on top, and the top call is always the next to finish. When it returns, it leaves the stack and the call underneath carries on with the answer.

## A base case that never comes

Remove the base case, or make it impossible to reach, and nothing stops the calls:

```c
int down(int n) {
    return down(n - 1);
}
```

Each call asks for another and none ever answers. The stack fills up, runs out of room, and the program stops with an error about the call stack.

## Recursion or a loop

Everything here could also be written with a loop, and a loop is often simpler and faster. Recursion earns its place when the problem is naturally made of smaller copies of itself, such as searching a tree of folders, where each folder can hold more folders. While you are learning, keep recursive calls shallow: a few dozen levels at most.

## Common mistakes

- **No base case.** The calls never stop and the stack runs out.
- **A call that does not get smaller.** Writing `factorial(n)` inside `factorial` asks the same question again. It must be `factorial(n - 1)`.
- **Losing the answer.** `n * factorial(n - 1);` on its own line works out the answer and throws it away. Put `return` in front.

::: kid
You have a set of nesting dolls.

You open the biggest doll.

Inside is a smaller doll.

You open that one too.

Inside is an even smaller doll.

You keep opening dolls.

At last you find the tiniest doll.

That one does not open.

Then you put them all back together.

A helper can work the same way.
:::

```c {role=example file=factorial.c}
#include <stdio.h>

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    int i;

    for (i = 1; i <= 5; i++) {
        printf("%d! = %d\n", i, factorial(i));
    }
    return 0;
}
```

::: try
`power(base, exp)` multiplies `base` by itself `exp` times. The exponent `exp` is 0 or more. Any number to the power 0 is 1, so `power(5, 0)` is 1.

Complete the function `power`. It must call itself, not use a loop. `main` is finished.
:::

::: try-kid
This helper should work out a power.

It takes two numbers: base and exp.

When exp is 0, the answer is 1.

For a bigger exp, the helper asks itself.

It asks for a smaller power each time.

Multiply base by that smaller answer.

Send the answer back with return.

Do not use a loop.
:::

```c {role=starter file=power.c}
#include <stdio.h>

int power(int base, int exp) {
    // Write power here, calling power itself.
    return 0;
}

int main() {
    int base, exp;

    scanf("%d", &base);
    scanf("%d", &exp);

    printf("%d\n", power(base, exp));
    return 0;
}
```

```c {role=solution file=power.c}
#include <stdio.h>

int power(int base, int exp) {
    if (exp == 0) {
        return 1;
    }
    return base * power(base, exp - 1);
}

int main() {
    int base, exp;

    scanf("%d", &base);
    scanf("%d", &exp);

    printf("%d\n", power(base, exp));
    return 0;
}
```
