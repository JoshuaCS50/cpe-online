---
id: core.c.operators
kind: lesson
track: core
unit: a2
order: 4
title: Operators and precedence
titleKid: Sums and what goes first
language: c
concepts: [arithmetic, precedence, integer-division, remainder]
prereqs: [core.c.variables]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["125"]
        expect: "2 min 5 s\n"
      - stdin: ["59"]
        expect: "0 min 59 s\n"
      - stdin: ["3600"]
        expect: "60 min 0 s\n"
  - type: code-contains
    pattern: '%\s*60'
    message: Uses % 60 to find the leftover seconds
hints:
  - Dividing two whole numbers throws the remainder away, so total / 60 is the number of full minutes.
  - The % operator gives the remainder of a division, so total % 60 is the seconds left over.
  - 'The two missing lines are: minutes = total / 60; seconds = total % 60;'
hintsKid:
  - Share the seconds into groups of 60. Each group is one minute.
  - The % sign tells you what is left over.
  - 'Type these: minutes = total / 60; seconds = total % 60;'
---
Arithmetic in C is built from five operators. Each one takes two values and gives back one answer.

| Operator | Name | Example | Answer |
|---|---|---|---|
| `+` | add | `4 + 2` | `6` |
| `-` | subtract | `4 - 2` | `2` |
| `*` | multiply | `4 * 2` | `8` |
| `/` | divide | `4 / 2` | `2` |
| `%` | remainder | `5 % 2` | `1` |

Multiplication is written with `*`, never with a small letter `x`, because the computer would read that `x` as a name.

## Whole numbers divide into whole numbers

When both sides of `/` are `int`, the answer is an `int` as well, so the part after the decimal point is thrown away. `7 / 2` gives `3`, not `3.5`. Nothing is rounded up here; the leftover is simply dropped, so `9 / 4` gives `2`.

To keep the decimals, make one side a decimal number: `7 / 2.0` gives `3.5`. Putting the answer in a `float` is not enough on its own, because the division has already lost the rest before it is stored:

```c
float half = 7 / 2;      // 3.0
float better = 7 / 2.0;  // 3.5
```

## The remainder

`%` divides and hands back whatever is left over. `7 % 2` is `1`, and `7 % 60` is `7`. Two everyday uses:

- **Even or odd.** If `n % 2` is `0`, the number is even. If it is `1`, the number is odd.
- **Minutes and seconds.** `total / 60` counts the full minutes and `total % 60` counts the seconds that do not fill another minute.

## Which part goes first

`*`, `/` and `%` are worked out before `+` and `-`, and brackets beat everything. So `2 + 3 * 4` is `14`, while `(2 + 3) * 4` is `20`. When two operators are equally strong, C works from left to right.

## Short ways to write the same thing

| Short way | Means |
|---|---|
| `score += 5;` | `score = score + 5;` |
| `score -= 5;` | `score = score - 5;` |
| `count++;` | `count = count + 1;` |
| `count--;` | `count = count - 1;` |

**Common mistakes**

- **Expecting decimals from whole-number division.** `7 / 2` is `3`. Write `7 / 2.0`, or make one of the values a `float`.
- **Using `%` with a decimal.** The remainder works on whole numbers only.
- **Forgetting the brackets.** They change the order, and a different order gives a different answer.

::: kid
You have 7 sweets. Two friends want to share them.

Each friend gets 3 sweets. One sweet is left over.

`/` tells you the share. So `7 / 2` is 3.

`%` tells you the leftover. So `7 % 2` is 1.

Times and share go first. Add and take away go after.

Brackets jump the queue. Whatever is inside them goes first of all.
:::

```c {role=example file=operators.c}
#include <stdio.h>

int main() {
    printf("2 + 3 * 4   gives %d\n", 2 + 3 * 4);
    printf("(2 + 3) * 4 gives %d\n", (2 + 3) * 4);
    printf("7 / 2       gives %d\n", 7 / 2);
    printf("7 %% 2       gives %d\n", 7 % 2);
    printf("7 / 2.0     gives %.1f\n", 7 / 2.0);
    return 0;
}
```

::: try
The program reads `total`, a number of seconds, and prints it as whole minutes and leftover seconds. The reading and the final `printf` are already written. Add the two lines that work out `minutes` and `seconds`.

It is checked with three different times, so the answer has to be calculated.
:::

::: try-kid
The program reads a number of seconds. We want minutes and seconds.

Two lines are missing. One line works out the minutes. The other works out the seconds.

Press Run to test it.
:::

```c {role=starter file=time.c}
#include <stdio.h>

int main() {
    int total, minutes, seconds;

    scanf("%d", &total);

    // Work out minutes and seconds here.

    printf("%d min %d s\n", minutes, seconds);
    return 0;
}
```

```c {role=solution file=time.c}
#include <stdio.h>

int main() {
    int total, minutes, seconds;

    scanf("%d", &total);

    minutes = total / 60;
    seconds = total % 60;

    printf("%d min %d s\n", minutes, seconds);
    return 0;
}
```
