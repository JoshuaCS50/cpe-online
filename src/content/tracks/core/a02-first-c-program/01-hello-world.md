---
id: core.c.hello-world
kind: lesson
track: core
unit: a2
order: 1
title: Hello, world
titleKid: Make the computer say hello
language: c
concepts: [program, output, main]
prereqs: [core.c.what-is-a-program]
est_minutes: 8
checks:
  - type: stdout-equals
    expect: "Hello, CPE!\n"
  - type: code-contains
    pattern: 'printf\s*\('
    message: Uses printf to print the text
hints:
  - The text to print goes between the double quotes inside printf.
  - Capital letters, the comma and the exclamation mark all count. Compare your output with the task one character at a time.
  - 'The finished line is: printf("Hello, CPE!\n");'
hintsKid:
  - Put your words between the two quote marks.
  - Big letters matter. So does the comma.
  - 'Type this line: printf("Hello, CPE!\n");'
---
A program is a list of instructions. The computer carries them out one at a time, from the top down, and does exactly what each one says: no more, no less.

The smallest useful C program prints one line of text:

```c
#include <stdio.h>

int main() {
    printf("Hello, world!\n");
    return 0;
}
```

Every line has a job.

| Line | What it does |
|---|---|
| `#include <stdio.h>` | Brings in the standard input and output tools, which is where `printf` lives. |
| `int main()` | Marks where the program starts. Every C program has exactly one `main`. |
| `{` and `}` | Hold the instructions that belong to `main`. |
| `printf("Hello, world!\n");` | Prints the text between the quotes. `\n` ends the line. |
| `return 0;` | Tells the system the program finished without trouble. |

Three details catch most beginners:

- **Every instruction ends with a semicolon.** Leave one out and the program will not run. The error usually points at the *next* line, because that is where the computer noticed.
- **Text needs double quotes.** `"Hello"` is text. `Hello` without quotes is a name the computer does not know.
- **C cares about capitals.** `printf` works. `Printf` and `PRINTF` do not.

Press **Run** on the Example tab to see it work, then change the text and run it again. Breaking a working program on purpose, one small change at a time, is one of the fastest ways to learn what each part is for.

::: kid
A program is a list of jobs for the computer.

The computer does the jobs in order. It starts at the top.

It does just what you say. It never guesses.

Look for the word `printf`. It means "say this".

Put your words between two quote marks. The computer shows them on the screen.

Every job ends with a little `;` mark. It works like a full stop.

Forget the mark and the computer gets stuck. That is okay. Add it and try again.
:::

```c {role=example file=hello.c}
#include <stdio.h>

int main() {
    printf("Hello, world!\n");
    return 0;
}
```

::: try
Change the program so that it prints exactly this, on one line:

```
Hello, CPE!
```
:::

::: try-kid
Make the computer say this:

```
Hello, CPE!
```

Copy every letter and mark.
:::

```c {role=starter file=hello.c}
#include <stdio.h>

int main() {
    printf("Change me\n");
    return 0;
}
```

```c {role=solution file=hello.c}
#include <stdio.h>

int main() {
    printf("Hello, CPE!\n");
    return 0;
}
```
