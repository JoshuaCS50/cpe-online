---
id: core.c.functions
kind: lesson
track: core
unit: a5
order: 1
title: Why functions
titleKid: Giving a job a name
language: c
concepts: [function, void, call, reuse]
prereqs: [core.c.for]
est_minutes: 12
checks:
  - type: stdout-equals
    expect: "----------\nMenu\n----------\n"
  - type: code-contains
    pattern: 'void\s+line\s*\(\s*\)'
    message: Defines a function called line
hints:
  - Above main, write void line() followed by a pair of braces. Inside the braces, print the ten dashes and a new line.
  - Inside main, call the function by writing its name and brackets, line();, once before the Menu line and once after it.
  - 'The function is: void line() { printf("----------\n"); } and main calls line(); before and after printf("Menu\n");'
hintsKid:
  - Above main, make a helper called line. It prints the dashes.
  - In main, write line(); before Menu and again after it.
  - 'The helper is: `void line() { printf("----------\n"); }`'
---
Every program you have written already contains one function: `main`. A function is a named block of code. The name is written once, and the block runs whenever the name is used. `main` is special only because the program starts there.

As a program grows, `main` grows with it. Lines get repeated, and a long list of instructions becomes hard to follow. A function gives one job a name, so the job is written once and used wherever it is needed.

## The shape

A function that does a job and gives nothing back has four parts:

- `void`, which says the function gives nothing back
- a name, chosen by you
- a pair of empty brackets, because no values go in
- a body in braces, holding the lines that run

```c
void name() {
    printf("...");
}
```

Everything between the braces belongs to the function. When the closing brace is reached, the function is finished.

## Calling it

To run the body, write the name with brackets and a semicolon: `name();`. That is a call. The body runs from its first line to its last, then the program carries on with the line after the call. Writing a function does not run it; only a call does.

```c
#include <stdio.h>

void cheer() {
    printf("Ready\n");
    printf("Go\n");
}

int main() {
    printf("Start\n");
    cheer();
    printf("Halfway\n");
    cheer();
    printf("End\n");
    return 0;
}
```

The order is `Start`, then `Ready` and `Go` from the first call, then `Halfway`, then the same two lines again, then `End`. Each call runs the whole body. The `printf` lines in `main` show exactly where the body ran.

## Where it goes

For now, write every function above `main`. The file is read from the top, so a function has to exist before `main` uses it. The next lesson shows the other order, with a prototype above `main`.

## Names

A good name says what the job is: `print_menu`, `draw_border`, `show_total`. Use lower case words joined by `_`, and keep the brackets empty in the definition and in every call.

## Three reasons

- **Less repetition.** Ten dashes printed in five places become one function, called five times.
- **Easier reading.** `main` turns into a list of steps, and each name says what happens.
- **One place to fix.** A mistake in the border is repaired once, inside the function, and every call improves.

## Common mistakes

- **Defining but never calling.** The function sits above `main` and does nothing at all. Nothing runs until a call is made.
- **Forgetting the brackets.** `line;` on its own is not a call. It reads a name and throws it away.
- **Putting a function inside `main`.** Functions sit side by side. One function is never written inside another.

::: kid
A recipe card has a name at the top.

It tells you how to make one dish.

You keep the card in a box.

When you want that dish, you read the card.

You follow the same steps every time.

You do not learn the steps again.

You just use the card.

That is what a helper does in your program.

You write it once, then use its name.
:::

```c {role=example file=welcome.c}
#include <stdio.h>

void welcome() {
    printf("Welcome to the lab.\n");
    printf("Remember to save your work.\n");
}

void divider() {
    printf("====================\n");
}

int main() {
    divider();
    welcome();
    divider();
    welcome();
    return 0;
}
```

::: try
The program should print a menu with a dashed line above and below the title, like this:

```
----------
Menu
----------
```

Write a function called `line` that prints ten dashes and a new line. Then call it once before the title and once after it. The title itself is already printed.
:::

::: try-kid
The program prints a menu.

It needs a dashed line above and below.

Make a helper called line.

The helper prints ten dashes.

Call it before Menu.

Call it again after Menu.

Press Run to test it.
:::

```c {role=starter file=menu.c}
#include <stdio.h>

// Write the line function here.

int main() {
    // Call line() before and after the title.
    printf("Menu\n");
    return 0;
}
```

```c {role=solution file=menu.c}
#include <stdio.h>

void line() {
    printf("----------\n");
}

int main() {
    line();
    printf("Menu\n");
    line();
    return 0;
}
```
