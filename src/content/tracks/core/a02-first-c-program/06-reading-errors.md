---
id: core.c.reading-errors
kind: lesson
track: core
unit: a2
order: 6
title: Reading error messages
titleKid: When the computer says "oops"
language: c
concepts: [error-message, syntax-error, debugging]
prereqs: [core.c.hello-world]
est_minutes: 10
checks:
  - type: stdout-equals
    expect: "Ready\nSet\nGo!\n"
hints:
  - Press Run and read the card. It names a line. Look at that line and the line just above it.
  - The first problem is a missing semicolon at the end of a printf line.
  - After fixing that, run again. The next card is about a name the computer does not know. Check the spelling of printf on every line.
hintsKid:
  - Press Run. Read the card. It tells you a line number.
  - One line has no ; at the end.
  - One printf is spelled wrong. Find it and fix it.
---
Programs go wrong, and they go wrong constantly. Every programmer sees error messages many times a day, including people who have written code for twenty years. A message is not a telling-off. It is the computer saying that it cannot carry on from here without your help, and it nearly always points at something small that you can change.

## Three kinds of problem

| What you see | What it means |
|---|---|
| The program will not start | A rule of the language is broken, so the computer cannot turn your text into something it can run. |
| It starts, then stops | It was asked to do something impossible, such as dividing a number by zero. |
| It runs but gives the wrong answer | Nothing stopped. Every instruction was followed exactly, but those were not the instructions you meant. |

The first two kinds come with an error card. The third does not, which makes it the hardest: nothing tells you where to look, so you have to compare the output with what you expected.

## Reading the card

Press **Run** and a card appears. It has the same parts every time:

- **The title** is a short name for the problem, in plain words.
- **The file name and line number** say where to look. Tap them to jump to that line.
- **What happened** describes the problem in plain words. When the site is making an educated guess, this part is headed **Most likely** instead.
- **Why** explains which rule was broken.
- **How to fix it** lists the steps to take.
- **Original message** waits underneath, closed until you open it. That is the exact text the C runtime produced, and it is what you would search for or show to someone helping you.

## The line number is where it noticed

A missing semicolon is the classic case:

```c
printf("Ready\n")
printf("Set\n");
```

Every instruction needs `;` at the end. The end of the first line still looks fine to the computer until it meets the word `printf` on the next line, and only then does it know something is missing. So the original message names line 2 while the real mistake sits on line 1.

For common slips like this one, the card works out the real line and points there for you. It cannot do that every time. If the line a message names looks correct, read the line above it.

## Fix one thing, then run again

Change the first error only, then press **Run** before touching anything else. One mistake often causes several messages: a missing bracket can make every later line look wrong too. Repairing the cause makes most of the list disappear, and it stops you from guessing. A run that fails in a new way is progress, because the old problem is gone.

**Common beginner slips**

- A missing `;` at the end of an instruction.
- An opening quote or bracket with no partner to close it.
- A name spelled differently from the place where it was created, such as `prinf` instead of `printf`.
- The wrong capital letter. C treats `Printf` and `printf` as two different names.

::: kid
A friend is following your recipe. One step makes no sense.

Your friend stops and points at the page. That is an error message.

It is not cross with you. It just needs help.

Everyone gets them. Even grown-ups who code all day.

Read where it points. Fix one thing. Then press Run again.

Still stuck? Look at the line just above.
:::

::: try
This program has two mistakes on purpose. Press **Run**, read the card, fix one thing, then press **Run** again. Repeat until it prints all three lines:

```
Ready
Set
Go!
```

The mistakes are independent: a missing semicolon and a misspelled name. Deal with the one the first card points at before you go looking for the other.
:::

::: try-kid
The program has two mistakes. Press Run. Read the card. Fix one thing. Press Run again.

Keep going until it says three lines: Ready, Set, Go!
:::

```c {role=starter file=fixme.c}
#include <stdio.h>

int main() {
    printf("Ready\n")
    prinf("Set\n");
    printf("Go!\n");
    return 0;
}
```

```c {role=solution file=fixme.c}
#include <stdio.h>

int main() {
    printf("Ready\n");
    printf("Set\n");
    printf("Go!\n");
    return 0;
}
```
