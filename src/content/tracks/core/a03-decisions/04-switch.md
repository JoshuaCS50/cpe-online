---
id: core.c.switch
kind: lesson
track: core
unit: a3
order: 4
title: switch
titleKid: Picking from a list of buttons
language: c
concepts: [switch, case, break, default]
prereqs: [core.c.else-if]
links:
  - to: core.c.else-if
    kind: contrast
    note: else if handles ranges such as temp < 15; switch handles exact values such as choice 1, 2 or 3.
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["1"]
        expect: "Tea\n"
      - stdin: ["2"]
        expect: "Coffee\n"
      - stdin: ["3"]
        expect: "Juice\n"
      - stdin: ["4"]
        expect: "Unknown choice\n"
      - stdin: ["0"]
        expect: "Unknown choice\n"
  - type: code-contains
    pattern: 'switch\s*\('
    message: Uses switch to pick the drink
hints:
  - Start with switch (choice) and a pair of braces. Inside, write one case for each drink.
  - Each case ends with break; so that the next case does not run as well.
  - Anything that is not 1, 2 or 3 goes to default, which prints Unknown choice.
hintsKid:
  - Write switch (choice). Then add a case for each drink.
  - End each case with break. Then it stops there.
  - Put Unknown choice under default.
---
A drinks machine has a row of buttons, one per drink. A week has seven numbered days, each with its own name. Both are one value checked against several exact values. An `else if` ladder works, but it repeats the same question once per value:

```c
if (choice == 1) {
    printf("Tea\n");
} else if (choice == 2) {
    printf("Coffee\n");
} else if (choice == 3) {
    printf("Juice\n");
} else {
    printf("Unknown choice\n");
}
```

Every line asks about `choice` again. As the list grows, the repetition grows too. `switch` is made for this shape: one value, several exact matches, and one answer when nothing matches. It asks the question once.

## The shape

```c
switch (choice) {
    case 1:
        printf("Tea\n");
        break;
    case 2:
        printf("Coffee\n");
        break;
    case 3:
        printf("Juice\n");
        break;
    default:
        printf("Unknown choice\n");
        break;
}
```

`switch (choice)` names the value being examined; the brackets hold it, and it is read once. `case 1:` is a label meaning "start here when the value is 1"; the colon is part of the label. `break` leaves the switch at once, so no case below it is tried. `default:` runs when no case matched, playing the part of the final `else` in a ladder.

## break, and fallthrough

C does not stop at the end of a matched case. It runs on down the list until it meets `break` or the closing brace. This is called fallthrough.

```c
switch (n) {
    case 1:
        printf("One\n");
    case 2:
        printf("Two\n");
        break;
    default:
        printf("Other\n");
        break;
}
```

With `n` at 1, this prints `One` and then `Two`. The first case has no `break`, so the program carried on into the next label. With `n` at 2 it prints only `Two`. A forgotten `break` is the most common `switch` mistake.

## Fallthrough on purpose

Several values can share one block. Leave the labels empty and let each one fall into the block below:

```c
switch (day) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
        printf("Day %d is a weekday\n", day);
        break;
    case 6:
    case 7:
        printf("Day %d is the weekend\n", day);
        break;
    default:
        printf("Day %d is not a day\n", day);
        break;
}
```

Cases 1 to 5 have no lines of their own, so all five share one `printf` and one `break`. Cases 6 and 7 share the next block in the same way. `default` catches every value outside 1 to 7.

## What a case may hold

A `case` label holds one fixed value. That can be a whole number, such as `case 3:`, or a single character in single quotes, such as `case 'A':`. It cannot hold a range or a comparison: `case > 10:` is not allowed, and `case choice:` is not allowed either, because a label must be settled before the program runs. When the decision depends on a range, keep `else if`, which tests any condition you can write.

## Common mistakes

- **A missing `break`.** The next case runs too, so extra lines appear.
- **No `default`.** An unmatched value then prints nothing at all.
- **A range or a comparison in a `case`.** `case > 10:` will not work; use `else if` for ranges.

::: kid
A drinks machine has a row of buttons.

Each button has a number and a drink.

Press 1 and tea comes out.

Press 2 and coffee comes out.

Press 3 and juice comes out.

The machine looks at the number once.

Anything else lights a small "sorry" sign.

That sign is like `default`.

Wrong numbers still get an answer.
:::

```c {role=example file=days.c}
#include <stdio.h>

int main() {
    int day = 6;

    switch (day) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            printf("Day %d is a weekday\n", day);
            break;
        case 6:
        case 7:
            printf("Day %d is the weekend\n", day);
            break;
        default:
            printf("Day %d is not a day\n", day);
            break;
    }

    day = 3;

    switch (day) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            printf("Day %d is a weekday\n", day);
            break;
        case 6:
        case 7:
            printf("Day %d is the weekend\n", day);
            break;
        default:
            printf("Day %d is not a day\n", day);
            break;
    }
    return 0;
}
```

::: try
The program reads a menu choice and must print the drink. Choice 1 is `Tea`, 2 is `Coffee`, 3 is `Juice`, and any other number prints `Unknown choice`. The reading is already written. Replace the comment with a `switch`.
:::

::: try-kid
The program reads a number for a drink.

Number 1 is Tea. Number 2 is Coffee. Number 3 is Juice.

Any other number prints Unknown choice.

Use switch in place of the comment.

Press Run to test it.
:::

```c {role=starter file=menu.c}
#include <stdio.h>

int main() {
    int choice;

    scanf("%d", &choice);

    // Print the drink here.

    return 0;
}
```

```c {role=solution file=menu.c}
#include <stdio.h>

int main() {
    int choice;

    scanf("%d", &choice);

    switch (choice) {
        case 1:
            printf("Tea\n");
            break;
        case 2:
            printf("Coffee\n");
            break;
        case 3:
            printf("Juice\n");
            break;
        default:
            printf("Unknown choice\n");
            break;
    }

    return 0;
}
```
