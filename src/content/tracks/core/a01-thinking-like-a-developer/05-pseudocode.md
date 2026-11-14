---
id: core.c.pseudocode
kind: lesson
track: core
unit: a1
order: 5
title: Pseudocode
titleKid: Writing the plan in plain words
language: c
concepts: [pseudocode, algorithm, translation]
prereqs: [core.c.flowcharts]
est_minutes: 13
checks:
  - type: io-cases
    cases:
      - stdin: ["100", "6"]
        expect: "Price: Quantity: Total: 550\n"
      - stdin: ["50", "3"]
        expect: "Price: Quantity: Total: 150\n"
      - stdin: ["250", "2"]
        expect: "Price: Quantity: Total: 500\n"
      - stdin: ["300", "4"]
        expect: "Price: Quantity: Total: 1150\n"
hints:
  - 'Put the pseudocode and the C side by side and match them line by line. Each pseudocode line has one matching piece of C.'
  - 'In the pseudocode, the total is worked out before the IF looks at it. Where is that line in the C?'
  - 'Move the line total = price * quantity; up, so it comes straight after the two scanf lines and before the if.'
hintsKid:
  - 'Match each plain-words line with its line of code.'
  - 'The total must be worked out before it is checked.'
  - 'Move the total line up, above the if.'
---
Before writing a program, developers often write the plan in **pseudocode**: the steps of the algorithm in plain, structured words, without worrying about the exact rules of any programming language. It is quicker to write than code, easy to discuss with someone who does not know C, and easy to translate afterwards into C, Python or anything else.

## What it looks like

There is no single official pseudocode; what matters is that it is clear and consistent. This course uses a few capitalised keywords:

```
READ price
READ quantity
SET total TO price * quantity
IF total > 500 THEN
    SET total TO total - 50
END IF
PRINT "Total: ", total
```

| Keyword | Meaning |
|---|---|
| `READ x` | input: get a value from the user or a sensor |
| `PRINT ...` | output |
| `SET x TO ...` | process: work something out and store it |
| `IF ... THEN ... ELSE ... END IF` | a decision |
| `WHILE ... DO ... END WHILE` | repeat while something is true |
| `FOR i FROM 1 TO 10 ... END FOR` | repeat a set number of times |

Indent the lines inside an `IF` or a loop, so it is clear which steps belong to it.

## Pseudocode and flowcharts

Pseudocode and flowcharts describe the same thing in two ways. A diamond becomes an `IF`; an arrow going back becomes a `WHILE`. Pseudocode is easier to write and change; a flowchart is easier to take in at a glance. Use whichever makes the problem clearer, or both.

## From pseudocode to C

Translating is then mostly line by line:

| Pseudocode | C |
|---|---|
| `READ price` | `scanf("%d", &price);` |
| `SET total TO price * quantity` | `total = price * quantity;` |
| `IF total > 500 THEN` | `if (total > 500) {` |
| `END IF` | `}` |
| `PRINT "Total: ", total` | `printf("Total: %d\n", total);` |

The order stays exactly the same. A translation that changes the order changes the algorithm, which is what went wrong in the task below.

## Good pseudocode

- One step per line, in the order they happen.
- Specific enough that two people would turn it into the same program: "work out the total" is vague; `SET total TO price * quantity` is not.
- No language details: no semicolons, `%d` or brackets around conditions.

::: kid
Pseudocode is a plan written in plain words.

It is not a real computer language.

Each line is one small step.

Later, each step is turned into real code.

The steps stay in the same order.
:::

```c {role=example file=average.c}
#include <stdio.h>

int main() {
    // Pseudocode:
    //   SET total TO 0
    //   FOR i FROM 1 TO 4
    //       SET total TO total + i * 10
    //   END FOR
    //   PRINT "Average: ", total / 4

    int total = 0;
    for (int i = 1; i <= 4; i++) {
        total = total + i * 10;
    }
    printf("Average: %d\n", total / 4);
    return 0;
}
```

::: try
A shop gives R50 off any order over R500. The algorithm, in pseudocode:

```
READ price
READ quantity
SET total TO price * quantity
IF total > 500 THEN
    SET total TO total - 50
END IF
PRINT "Total: ", total
```

The C program below was translated from it, but one line ended up in the wrong place, so nobody ever gets the discount. Move it to where the pseudocode has it.
:::

::: try-kid
The plain-words plan gives money off big orders.

One line of the code is in the wrong place.

Move it so the code follows the plan.
:::

```c {role=starter file=shop.c}
#include <stdio.h>

int main() {
    int price;
    int quantity;
    int total = 0;

    printf("Price: ");
    scanf("%d", &price);
    printf("Quantity: ");
    scanf("%d", &quantity);

    if (total > 500) {
        total = total - 50;
    }
    total = price * quantity;

    printf("Total: %d\n", total);
    return 0;
}
```

```c {role=solution file=shop.c}
#include <stdio.h>

int main() {
    int price;
    int quantity;
    int total = 0;

    printf("Price: ");
    scanf("%d", &price);
    printf("Quantity: ");
    scanf("%d", &quantity);

    total = price * quantity;
    if (total > 500) {
        total = total - 50;
    }

    printf("Total: %d\n", total);
    return 0;
}
```
