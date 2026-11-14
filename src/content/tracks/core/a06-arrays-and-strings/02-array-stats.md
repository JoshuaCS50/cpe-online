---
id: core.c.array-stats
kind: lesson
track: core
unit: a6
order: 2
title: Simple statistics
titleKid: Biggest, smallest and in the middle
language: c
concepts: [array, sum, average, maximum, minimum]
prereqs: [core.c.arrays]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["5", "4", "9", "1", "7", "3"]
        expect: "Sum: 24\nAverage: 4.80\nLargest: 9\nSmallest: 1\n"
      - stdin: ["3", "-5", "-2", "-9"]
        expect: "Sum: -16\nAverage: -5.33\nLargest: -2\nSmallest: -9\n"
      - stdin: ["1", "42"]
        expect: "Sum: 42\nAverage: 42.00\nLargest: 42\nSmallest: 42\n"
      - stdin: ["4", "10", "10", "20", "20"]
        expect: "Sum: 60\nAverage: 15.00\nLargest: 20\nSmallest: 10\n"
hints:
  - Starting largest and smallest at 0 goes wrong when every number is negative, or every number is positive. Start both at the first value, values[0].
  - Then loop over the rest, from index 1. When a value is bigger than largest, it becomes the new largest. Do the same for smallest.
  - 'Start with int largest = values[0]; and int smallest = values[0]; then inside the loop: if (values[i] > largest) { largest = values[i]; } and the same with < for smallest.'
hintsKid:
  - Start both at the first number, not at 0.
  - Look at each other number. Is it bigger? Keep it.
  - 'Start with this: `int largest = values[0];` and `int smallest = values[0];`'
---
Once the numbers sit in an array, a few short loops answer the questions people ask most about a list: the total, the average, the largest and the smallest.

## The total

The total starts at 0 before the loop, and each element is added as the loop visits it:

```c
int sum = 0;

for (int i = 0; i < count; i++) {
    sum += values[i];
}
```

After the last turn, `sum` holds every value added together.

## The average

The average is the total divided by how many values there are:

```c
float average = (float) sum / count;
```

`(float)` turns the whole-number sum into a decimal, so the division keeps its fraction instead of throwing it away.

## The largest so far

To find the largest value, keep a best-so-far in a variable. Start it at the first element, because that value is certainly in the list. Then look at each of the others and replace the best when a bigger one appears:

```c
int largest = values[0];

for (int i = 1; i < count; i++) {
    if (values[i] > largest) {
        largest = values[i];
    }
}
```

On the short list 4, 9, 1 the trace has three rows:

| Step | Value seen | Largest |
|---|---|---|
| Start | 4 | 4 |
| Next | 9 | 9 |
| Next | 1 | 9 |

## Why not start at 0

Starting the best at 0 looks harmless, but it only works when some value is at least 0. If every number is negative, 0 is bigger than all of them, so it wins without ever being in the list. Starting at the first element is always safe.

## The smallest

The smallest value works in exactly the same way, with `<` in place of `>`:

```c
int smallest = values[0];

for (int i = 1; i < count; i++) {
    if (values[i] < smallest) {
        smallest = values[i];
    }
}
```

## How many numbers

A program often reads the count first, then that many values:

```c
int count;
int values[10];

scanf("%d", &count);
for (int i = 0; i < count; i++) {
    scanf("%d", &values[i]);
}
```

The array here has room for 10, so the count must be at most 10. A larger count would write past the end of the array.

## Common mistakes

- **Starting the largest or smallest at 0.** An all-negative list then gives an answer that was never in the list.
- **Integer division in the average.** `sum / count` with two `int` values drops the fraction. Use `(float) sum / count`.
- **Starting the sum loop at index 1.** The first value is then left out of the total.

::: kid
Children stand in a line to be measured.

You walk along the line with a notebook.

The first child is the tallest so far.

Write that height down.

Walk to the next child and look.

Is this child taller than your note?

If yes, write the new height down.

If no, keep the note as it is.

At the end, your note holds the tallest child.

Your note started with a real child, not with zero.
:::

```c {role=example file=rainfall.c}
#include <stdio.h>

int main() {
    int rain[7] = {0, 12, 5, 0, 23, 8, 3};
    int count = 7;
    int total = 0;
    int wettest = rain[0];
    int wettest_day = 1;

    for (int i = 0; i < count; i++) {
        total += rain[i];
        if (rain[i] > wettest) {
            wettest = rain[i];
            wettest_day = i + 1;
        }
    }

    printf("Total: %d mm\n", total);
    printf("Average: %.2f mm\n", (float) total / count);
    printf("Wettest day: %d\n", wettest_day);
    return 0;
}
```

::: try
The first number typed is how many numbers follow, from 1 to 10. The program already reads them, works out the sum and prints the average.

Only the largest and smallest are wrong. Replace the comment with a loop that finds them.

The program is checked with lists that are all negative as well as all positive, so starting both values at 0 will not do.
:::

::: try-kid
The first number says how many numbers follow.

Then the numbers come in.

The sum and average already work.

Find the biggest and the smallest.

Start both at the first number, not at 0.

Look at each other number and keep the winner.

Press Run to test it.
:::

```c {role=starter file=stats.c}
#include <stdio.h>

int main() {
    int count;
    int values[10];
    int sum = 0;

    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        scanf("%d", &values[i]);
        sum += values[i];
    }

    int largest = 0;
    int smallest = 0;

    // Find the largest and smallest here.

    printf("Sum: %d\n", sum);
    printf("Average: %.2f\n", (float) sum / count);
    printf("Largest: %d\n", largest);
    printf("Smallest: %d\n", smallest);
    return 0;
}
```

```c {role=solution file=stats.c}
#include <stdio.h>

int main() {
    int count;
    int values[10];
    int sum = 0;

    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        scanf("%d", &values[i]);
        sum += values[i];
    }

    int largest = values[0];
    int smallest = values[0];

    for (int i = 1; i < count; i++) {
        if (values[i] > largest) {
            largest = values[i];
        }
        if (values[i] < smallest) {
            smallest = values[i];
        }
    }

    printf("Sum: %d\n", sum);
    printf("Average: %.2f\n", (float) sum / count);
    printf("Largest: %d\n", largest);
    printf("Smallest: %d\n", smallest);
    return 0;
}
```
