# P2-13f Unit A5 lessons: functions, parameters and return, scope

## Context
CPE Online is a browser IDE with a Learn mode for beginner programmers. A lesson is one Markdown file; the build compiles it and the tests run its code through a real C interpreter. This package adds the first three lessons of unit A5 ("Functions").

Read these first, in this order:
1. `docs/LESSONS.md`: the lesson file format and every rule the build enforces.
2. `src/content/tracks/core/a4/for.md`: a finished lesson. Match its depth, tone and layout, and its `::: kid` block: short sentences on separate lines with blank lines between groups, built around one picture.
3. `src/content/tracks/core/a4/break-continue.md`: another finished lesson.

## Files
Create:
- `src/content/tracks/core/a5/functions.md`
- `src/content/tracks/core/a5/parameters.md`
- `src/content/tracks/core/a5/scope.md`

Edit:
- none

Do not touch any other file.

## Interface
Use these headers exactly as written. Do not add, remove or rename keys. Write the body below each header yourself. If a header breaks a build rule, stop and say so in your final message; you may wrap code in a kid hint in backticks, which the build counts as one word.

### functions.md

```yaml
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
```

Body must cover, in this order:
1. `main` is itself a function: a named block of code that runs when it is called. Programs grow, and one long `main` becomes hard to read and full of repeated lines. A function gives a job a name, so the job is written once and used many times.
2. The shape of a function that does a job and returns nothing: `void name() { ... }`. Explain `void` ("gives nothing back"), the name, the empty brackets, and the body in braces.
3. Calling it: `name();` runs the body, then the program continues on the line after the call. Show a short program with a `void` function called twice, and walk through the order the lines run in.
4. Where it goes: for now, write each function above `main`, so it exists before `main` uses it. (The next lesson shows the other way, with a prototype.)
5. Good function names say what the job is: `print_menu`, `draw_border`. Use lower case words joined by `_`.
6. Three reasons to use functions: less repetition, easier reading (`main` becomes a list of steps), and one place to fix a mistake.
7. A short "Common mistakes" list: defining the function but never calling it; forgetting the brackets in a call (`line;` does nothing useful); putting a function inside `main` (functions sit side by side, never inside each other).

Example block (`{role=example file=welcome.c}`): a program with no input that defines `void welcome()` printing two lines (`Welcome to the lab.` and `Remember to save your work.`) and a `void divider()` printing `====================`. `main` calls `divider()`, `welcome()`, `divider()`, then `welcome()` again.

Task: the starter is exactly this program:

```c
#include <stdio.h>

// Write the line function here.

int main() {
    // Call line() before and after the title.
    printf("Menu\n");
    return 0;
}
```

The learner writes a function `void line()` that prints `----------` (ten dashes) and a new line, and calls it before and after the title, so the program prints:

```
----------
Menu
----------
```

Starter file name `menu.c`. The solution is:

```c
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

### parameters.md

```yaml
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
```

Body must cover, in this order:
1. A function becomes far more useful when you can hand it values and get an answer back. Show `int square(int x) { return x * x; }` and the call `square(7)`, which gives 49.
2. Parameters: the names in the brackets of the definition, each with a type, separated by commas. Arguments: the values written in the brackets of the call. They are matched by position: the first argument goes to the first parameter.
3. The return type in front of the name (`int`, `float`, or `void` for nothing), and `return`, which sends a value back and ends the function at once. A function can have more than one `return`, but only one of them runs.
4. Using the answer: store it (`int s = square(4);`), print it (`printf("%d\n", square(4));`), or use it in a larger expression (`square(3) + square(4)`).
5. A function with a `float` result: `float average(int a, int b, int c)` returning `(a + b + c) / 3.0`, and why `3.0` and not `3`.
6. Prototypes: to write a function below `main`, put a one-line declaration above `main`, such as `int square(int x);`, with a semicolon and no body. It tells the compiler the name, the parameter types and the return type in advance.
7. A short "Common mistakes" list: forgetting `return` in a function that promises a value; calling with the wrong number of arguments; ignoring the answer (`square(5);` on its own line computes 25 and throws it away).

Example block (`{role=example file=shapes.c}`): a program with no input that declares two prototypes above `main`, `int square(int x);` and `float average(int a, int b, int c);`, and defines both functions below `main`. `main` prints `7 squared is 49` using `square(7)`, and `The average of 70, 85 and 90 is 81.67` using `average(70, 85, 90)` and `%.2f`.

Task: the starter is exactly this program:

```c
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

Starter file name `biggest.c`. The solution replaces the comment and `return 0;` inside `biggest` with:

```c
    if (a > b) {
        return a;
    }
    return b;
```

The task text says that `main` is already finished and only the body of `biggest` needs writing, and that equal numbers should give that number.

### scope.md

```yaml
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
```

Body must cover, in this order:
1. Scope means where a name can be used. A variable made inside a function (a local variable) exists only inside that function, from the line it is made until the closing brace. Show using it outside, and say the program then stops with an error saying the variable does not exist.
2. Every function has its own local variables. Two functions can both have a variable called `count` without interfering, because each `count` lives in its own function.
3. Parameters are local variables too, and they start as copies of the arguments. Changing a parameter changes the copy, never the caller's variable. Show `void change(int n) { n = 99; }` called with `score` set to 5, and that `score` is still 5 afterwards. This is called passing by value.
4. To get a new value out of a function, return it and store it: `score = double_it(score);`. (A later unit shows another way, with addresses.)
5. Blocks: any pair of braces, such as the body of an `if` or a loop, makes its own scope for variables made inside it.
6. Global variables, made outside every function, can be used and changed by any function. Explain briefly why they are best avoided: any function might change them, so a wrong value is hard to trace. A local variable with the same name as a global hides the global inside that function.
7. A short "Common mistakes" list: using a variable outside the function or block it was made in; expecting a function to change the caller's variable through a parameter; making a new local variable by accident with a type in front (`int total = 0;` inside a loop) when the outer one was meant.

Example block (`{role=example file=scope.c}`): a program with no input, exactly this:

```c
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

Its output is `inside show: 5`, `global: 101`, `inner block: 7`, `global again: 101`, one per line. The lesson text explains each line of that output.

Task: the starter is exactly this program:

```c
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

It is meant to double the score, but it prints the score unchanged. Starter file name `double.c`. The solution is:

```c
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

The task text says the program should read a score and print it doubled, and asks the learner to find out why it does not and fix it.

## Behaviour
1. Every file follows `docs/LESSONS.md` exactly: header, explanation, a `::: kid` block, a `{role=example}` block, then `::: try`, `::: try-kid`, `{role=starter}` and `{role=solution}` blocks.
2. Explanations are for a first-year student with no programming background: plain words, short paragraphs, one idea per paragraph. Between 300 and 500 words each, not counting code and tables.
3. Kid blocks are written from scratch for a seven-year-old. Each one uses one concrete picture and has 6 to 10 short sentences on separate lines with blank lines between groups. Pictures to use: functions, a recipe card with a name, used whenever you want that dish; parameters and return, a juice machine where you put fruit in and juice comes out; scope, giving a friend a photocopy of your drawing, so if they scribble on it your drawing stays the same.
4. Kid text rules are enforced by the build: at most 12 words per sentence, and none of the banned words listed in `docs/LESSONS.md` (note that "parameter", "argument" and "function call" are banned in kid text; say "helper", "the numbers you give it", and so on). This applies to the `::: kid` block, the `::: try-kid` block and `titleKid`. A colon also ends a sentence for counting.
5. All C code uses `int main()` (never `int main(void)`), includes `<stdio.h>`, uses 4 spaces to indent, puts braces around every `if` and loop body, and ends `main` with `return 0;`. Function names are lower case with `_` between words.
6. No starter, solution or example may contain a loop that never ends. Do not use `bool`, `true`, `false` or `<stdbool.h>`. Do not use `scanf("%c", ...)`.
7. Starter and solution must differ only by the lines the learner is asked to write or fix.
8. Do not describe how this website behaves beyond pressing Run and Check my answer. No raw HTML, no links to outside websites.

## Tests
No new test file. The existing `tests/unit/content.test.ts` picks up the new lessons automatically and must show, for each of the three new ids:
- `<id>: the solution passes its checks`
- `<id>: the starter does not pass yet`
- `<id>: the example runs without an error`
- `lesson library > has no problems`

## Acceptance
Run from the repository root. Run each command exactly as written: no pipes, no redirection, no extra flags (the sandbox denies anything else).

```
npx vitest run tests/unit/content.test.ts
npm run typecheck
```

If the first command reports a problem with a lesson, the message names the file and the rule. Fix the lesson text, never the test, the compiler or the header given above.

## Constraints
- Original wording and code only. Do not copy sentences from the existing lessons or from any book or website.
- No new dependencies. No network access. No changes to config files, tests or TypeScript files.
- Do not change the headers given above, apart from the backtick allowance in kid hints described under Interface.
- Do not commit. Leave the changes in the working tree.

## Output
Only the three files listed above. No summary document. In your final message, list anything in this brief that you could not follow and why.
