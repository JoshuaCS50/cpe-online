---
id: core.c.comparisons
kind: lesson
track: core
unit: a3
order: 1
title: Comparisons and logic
titleKid: Asking yes or no questions
language: c
concepts: [comparison, logic, true-false, and-or-not]
prereqs: [core.c.operators]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["15"]
        expect: "1\n"
      - stdin: ["12"]
        expect: "0\n"
      - stdin: ["13"]
        expect: "1\n"
      - stdin: ["19"]
        expect: "1\n"
      - stdin: ["20"]
        expect: "0\n"
  - type: code-contains
    pattern: '&&'
    message: Uses && to join the two comparisons
hints:
  - A teenager is at least 13 and at most 19. That is two comparisons, age >= 13 and age <= 19.
  - Both comparisons must be true at the same time, so join them with &&.
  - 'The missing line is: teen = age >= 13 && age <= 19;'
hintsKid:
  - Ask two questions. Is the age 13 or more? Is it 19 or less?
  - Both answers must be yes. Join them with &&.
  - 'Type this: teen = age >= 13 && age <= 19;'
---
A comparison asks a yes or no question about two values. The computer keeps the answer as a number: `1` for yes and `0` for no. Programmers call these **true** and **false**, but C itself works with the numbers. Every comparison you write produces one of those two values.

## The six comparisons

| Operator | Question it asks | Example | Answer |
|---|---|---|---|
| `==` | equal? | `5 == 5` | `1` |
| `!=` | different? | `5 != 5` | `0` |
| `<` | smaller? | `5 < 8` | `1` |
| `>` | bigger? | `5 > 8` | `0` |
| `<=` | smaller, or the same? | `5 <= 5` | `1` |
| `>=` | bigger, or the same? | `5 >= 8` | `0` |

Each one takes two values and hands back a single `1` or `0`.

## Comparing is not storing

`==` asks a question. `=` gives a value.

```c
int a = 5;              // a now holds 5
int same = (a == 5);    // same now holds 1
```

The first line stores. The second line compares and stores the answer. Swapping the signs turns a question into a store, and C will not complain, because each line is legal on its own.

A comparison is ordinary work, so its answer can be kept. `int teen = age >= 13;` is legal: the comparison runs first, the result lands in `teen`, and `teen` then holds `1` or `0`.

## Joining questions

Two questions can be joined into one. `&&` means **and**: the answer is `1` only when both sides are true. `||` means **or**: the answer is `1` when at least one side is true. `!` means **not**: it turns a `1` into `0` and a `0` into `1`.

```c
2 < 3 && 3 < 4    // both sides are true, so this is 1
2 > 3 || 3 < 4    // one side is true, so this is 1
!(2 < 3)          // 2 < 3 is 1, and ! flips it to 0
```

A teenager is at least 13 and at most 19. That is two comparisons joined by `&&`: `age >= 13 && age <= 19`.

## A truth table

The next table shows both joined forms. The third column is `&&` and the fourth is `||`, for every pair of answers `a` and `b` can have.

| a | b | a && b | a \|\| b |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 |
| 1 | 0 | 0 | 1 |
| 1 | 1 | 1 | 1 |

Read a row as one situation. With `a` at `0` and `b` at `1`, `a && b` gives `0`, because one side failed, while `a || b` gives `1`, because one side succeeded.

`!` is applied before the comparison next to it, so keep the brackets. `!(a < b)` flips the answer to `a < b`. Without brackets, `!a < b` flips `a` first and then compares that `1` or `0` with `b`, which is rarely what you meant.

## Common mistakes

- **`=` in place of `==`.** The first stores, the second asks, and the computer accepts both, so nothing warns you.
- **`13 <= age <= 19`.** It looks like a range, but C works from the left: `13 <= age` gives `1` or `0`, and then that number is compared with `19`. Both `1` and `0` are smaller than 19, so the answer is always `1`, whatever the age. Write `age >= 13 && age <= 19`.
- **`&` or `|` in place of `&&` or `||`.** The single signs work on individual bits. `1 & 2` gives `0` even though both values count as true, so the joined question quietly changes meaning.

::: kid
Your teacher asks yes or no questions.

"Are you tall?" The answer is a number.

Yes is 1, and no is 0.

Sometimes the teacher asks two questions at once.

Both must be yes for `&&`. One no is enough to fail.

With `||`, one yes is enough.

`!` turns a yes into a no.

Two `=` marks ask, "is it the same?"
:::

```c {role=example file=compare.c}
#include <stdio.h>

int main() {
    int a = 5;
    int b = 8;

    printf("a == b           is %d\n", a == b);
    printf("a != b           is %d\n", a != b);
    printf("a < b            is %d\n", a < b);
    printf("a >= b           is %d\n", a >= b);
    printf("a < b && b < 10  is %d\n", a < b && b < 10);
    printf("a > b || b > 10  is %d\n", a > b || b > 10);
    printf("!(a < b)         is %d\n", !(a < b));
    return 0;
}
```

::: try
The program reads `age` and must print `1` when the age is a teenager, meaning 13 up to 19, and `0` otherwise. The reading and the final `printf` are already written. Replace the comment with one line that works out `teen`.

It is checked with several ages, so the answer has to be calculated.
:::

::: try-kid
The program reads an age. A teenager is 13 or more and 19 or less.

Replace the comment with one line. The line asks both questions with `&&`.

Press Run to test it.
:::

```c {role=starter file=teen.c}
#include <stdio.h>

int main() {
    int age;
    int teen = 0;

    scanf("%d", &age);

    // Work out teen here.

    printf("%d\n", teen);
    return 0;
}
```

```c {role=solution file=teen.c}
#include <stdio.h>

int main() {
    int age;
    int teen = 0;

    scanf("%d", &age);

    teen = age >= 13 && age <= 19;

    printf("%d\n", teen);
    return 0;
}
```
