---
id: core.c.scope
kind: lesson
track: core
unit: a5
order: 3
title: Scope and copies
titleKid: Every helper has its own boxes
language: c
concepts: [scope, local-variable, global-variable, pass-by-value]
prereqs: [core.c.parameters]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["5"]
        expect: "Score: 10\n"
      - stdin: ["0"]
        expect: "Score: 0\n"
      - stdin: ["-3"]
        expect: "Score: -6\n"
      - stdin: ["21"]
        expect: "Score: 42\n"
  - type: code-contains
    pattern: 'score\s*=\s*double_it\s*\('
    message: Stores the returned value back in score
hints:
  - Run it with 5. The score stays 5, because double_it doubles its own copy and then throws it away.
  - Make double_it give its answer back. Change void to int and write return n * 2; instead of changing n.
  - 'Then keep the answer in main: score = double_it(score);'
hintsKid:
  - The helper doubles its own copy. Then the copy is thrown away.
  - Make the helper give the answer back with return.
  - 'In main, type: `score = double_it(score);`'
---
A name is not visible everywhere in a file. Scope means the part of the program where a name can be used. A variable made inside a function is a local variable. It exists from the line where it is made until the closing brace of that function. Use it anywhere else and the program stops with an error saying the variable does not exist.

## Each function has its own

Every function has its own set of local variables. Two functions can each have a variable called `count` without interfering, because each lives in its own function. When a function finishes, its locals are gone.

## Copies, not the original

Parameters are local variables too, and they begin as copies of the arguments. Changing a parameter changes the copy and nothing else:

```c
void change(int n) {
    n = 99;
}
```

With `score` set to 5, the call `change(score)` copies 5 into `n` and sets that copy to 99. `score` is still 5 afterwards. This is called passing by value, and it holds for every plain parameter in C.

## Getting a value out

The way a function sends a new value to its caller is `return`. The caller then stores the answer:

```c
score = double_it(score);
```

The old score is copied in, the function works on its copy, and the answer is stored back in `score`. A later unit shows a second way, using addresses.

## Braces make scope

Any pair of braces makes a scope, not only a function body. A variable made inside an `if` or a loop belongs to that block. It disappears at the closing brace, while the function carries on.

## Global variables

A variable made outside every function is a global variable. Every function can read it and change it. That sounds convenient, but it is easy to lose track: when a global holds a wrong value, any function in the file might have changed it. Prefer locals and returned answers. A local variable with the same name as a global hides the global for as long as the local exists.

## One program, four numbers

The example uses every kind of name. `show` makes its own `count`, so it prints 5 and the global is untouched. `bump` changes the global, which becomes 101. The block inside `main` makes another `count`, prints 7, and then vanishes, so the last line sees the global 101 again.

## Common mistakes

- **Using a name outside its scope.** A variable from a function or a block cannot be read after that function or block ends.
- **Expecting a parameter to change the caller's variable.** It is a copy. Return the new value and store it instead.
- **Making a new local by accident.** Writing `int total = 0;` inside a loop, when the `total` above was meant, creates a second variable that vanishes each turn, so the running total is lost.

::: kid
Your friend wants your drawing.

You give them a photocopy.

They scribble on the copy.

Your own drawing stays the same.

A helper works like that too.

It gets a copy of your number.

It can change its copy.

Your number stays the same.

If you want a new number, ask the helper for it.
:::

```c {role=example file=scope.c}
#include <stdio.h>

int count = 100;

void show() {
    int count = 5;
    printf("inside show: %d\n", count);
}

void bump() {
    count++;
}

int main() {
    show();
    bump();
    printf("global: %d\n", count);
    {
        int count = 7;
        printf("inner block: %d\n", count);
    }
    printf("global again: %d\n", count);
    return 0;
}
```

::: try
The program reads a score and should print it doubled, but it prints the score unchanged.

Find out why, and fix it. `main` is finished. Change `double_it` so that it works on its copy and sends the answer back, then store that answer in `score`.
:::

::: try-kid
The program reads a score.

It should double the score.

Right now the score stays the same.

The helper doubles its own copy.

Make the helper send the answer back.

In main, keep the answer in score.

Press Run to test it.
:::

```c {role=starter file=double.c}
#include <stdio.h>

void double_it(int n) {
    n = n * 2;
}

int main() {
    int score;

    scanf("%d", &score);
    double_it(score);
    printf("Score: %d\n", score);
    return 0;
}
```

```c {role=solution file=double.c}
#include <stdio.h>

int double_it(int n) {
    return n * 2;
}

int main() {
    int score;

    scanf("%d", &score);
    score = double_it(score);
    printf("Score: %d\n", score);
    return 0;
}
```
