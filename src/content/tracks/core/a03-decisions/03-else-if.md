---
id: core.c.else-if
kind: lesson
track: core
unit: a3
order: 3
title: else if ladders
titleKid: More than two ways to go
language: c
concepts: [else-if, ladder, ranges]
prereqs: [core.c.if-else]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["10"]
        expect: "Cold\n"
      - stdin: ["15"]
        expect: "Mild\n"
      - stdin: ["24"]
        expect: "Mild\n"
      - stdin: ["25"]
        expect: "Hot\n"
      - stdin: ["-3"]
        expect: "Cold\n"
  - type: code-contains
    pattern: 'else\s+if'
    message: Uses else if for the middle range
hints:
  - Check the ranges in order, from the coldest up. The first test is temp < 15.
  - If that is false the temperature is at least 15, so the next test only needs temp < 25.
  - 'The finished part is: if (temp < 15) { printf("Cold\n"); } else if (temp < 25) { printf("Mild\n"); } else { printf("Hot\n"); }'
hintsKid:
  - Start with the cold one. Ask if temp < 15.
  - Next ask if temp < 25. That one is mild.
  - Everything else is hot. Put that after the last else.
---
Some choices have more than two answers. A mark can be high, middle or low, and a day can be cold, mild or hot. One `if` inside another would work, but it grows sideways fast. The tidier tool is `else if`.

## A ladder

```c
if (condition1) {
    // first choice
} else if (condition2) {
    // second choice
} else {
    // everything else
}
```

C tests the conditions from the top. It runs the first group whose condition is true, then skips every group below it. Only one branch of the ladder ever runs, and the rest are ignored.

## The order matters

Suppose a mark of 75 or more is high, 50 or more is middle, and anything below 50 is low. Here is the ladder in the right order:

```c
if (score >= 75) {
    printf("High\n");
} else if (score >= 50) {
    printf("Middle\n");
} else {
    printf("Low\n");
}
```

A mark of 80 stops at the first test, which is correct. A mark of 60 fails the first and lands on the second. A mark of 30 fails both and reaches `else`.

Here are the same bands in the wrong order:

```c
if (score >= 50) {
    printf("Middle\n");
} else if (score >= 75) {
    printf("High\n");
} else {
    printf("Low\n");
}
```

A mark of 80 passes the first test, so it prints `Middle`, and the second test is never reached. Every mark that should have been high has disappeared into the middle band. Nothing in the program is broken as a piece of C; the order is broken. It helps to sort the bands first, then write them in that order, one line each.

## Each test can be simple

Once a test has failed, its opposite is known. In a temperature ladder, reaching the second step already means the temperature is at least 15, so the test only needs `else if (temp < 25)`. Writing `else if (temp >= 15 && temp < 25)` is not wrong, just longer, and it repeats a fact the ladder already knows.

## The last else

`else` with no condition catches every value not caught above. Without it, the ladder simply ends, and a value that matched nothing produces no output at all. That looks like a broken program even though every line worked.

## Common mistakes

- **Separate `if` statements instead of a ladder.** Each `if` is tested on its own, so a mark can pass two of them and print twice.
- **Gaps between ranges.** Write `temp < 15` and then `temp > 15 && temp < 25`, and exactly 15 matches neither test. It falls through to the final `else` and is called Hot. Test the edge values, here 14, 15, 24 and 25, to find a gap.
- **Forgetting the final `else`.** Some values then match nothing and print nothing, which is easy to miss.

::: kid
A machine sorts fruit. It has three baskets in a row.

The machine checks the first basket as a fruit rolls past.

If it fits, the fruit drops in. The machine stops checking.

If not, the fruit rolls on to the next basket.

The last basket takes anything left.

Order matters. A big basket first would catch every fruit.

So the small basket goes first.
:::

```c {role=example file=bands.c}
#include <stdio.h>

int main() {
    int score = 68;

    if (score >= 75) {
        printf("A score of %d is high.\n", score);
    } else if (score >= 50) {
        printf("A score of %d is middle.\n", score);
    } else {
        printf("A score of %d is low.\n", score);
    }
    return 0;
}
```

::: try
The program reads a temperature and must print `Cold`, `Mild` or `Hot`. Below 15 is Cold, 15 up to 24 is Mild, and 25 or more is Hot. The reading is already written. Replace the comment with the ladder.

It is checked with several temperatures, so the answer has to be decided, not typed in.
:::

::: try-kid
The program reads a temperature.

Cold is under 15. Mild is 15 up to 24. Hot is 25 and more.

Use if, else if, and a last else. Press Run to test it.
:::

```c {role=starter file=weather.c}
#include <stdio.h>

int main() {
    int temp;

    scanf("%d", &temp);

    // Print Cold, Mild or Hot here.

    return 0;
}
```

```c {role=solution file=weather.c}
#include <stdio.h>

int main() {
    int temp;

    scanf("%d", &temp);

    if (temp < 15) {
        printf("Cold\n");
    } else if (temp < 25) {
        printf("Mild\n");
    } else {
        printf("Hot\n");
    }

    return 0;
}
```
