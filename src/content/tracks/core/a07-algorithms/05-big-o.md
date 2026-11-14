---
id: core.c.big-o
kind: lesson
track: core
unit: a7
order: 5
title: How work grows (Big-O)
titleKid: Counting the steps
language: c
concepts: [big-o, efficiency, growth, counting-steps]
prereqs: [core.c.binary-search, core.c.bubble-sort]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["8"]
        expect: "Single loop: 8\nNested loops: 64\nHalving: 3\n"
      - stdin: ["1"]
        expect: "Single loop: 1\nNested loops: 1\nHalving: 0\n"
      - stdin: ["16"]
        expect: "Single loop: 16\nNested loops: 256\nHalving: 4\n"
      - stdin: ["100"]
        expect: "Single loop: 100\nNested loops: 10000\nHalving: 6\n"
hints:
  - In each function, start a counter at 0 and add one to it inside the loop, then return the counter.
  - single_loop has one loop from 0 to n. nested_loops has a loop from 0 to n inside another loop from 0 to n.
  - 'halving keeps dividing n by 2 while n > 1: while (n > 1) { n = n / 2; steps++; }'
hintsKid:
  - Start a counter at 0. Add one each time round.
  - Put one loop inside another for the second helper.
  - For the last one, halve n until it reaches 1. Count the halvings.
---
Two programs can give the same answer and still differ enormously in how long they take on big inputs. Seconds are a poor way to compare them: they depend on the computer. Instead, count the **steps**, and ask how that count grows as the input grows. That growth has a short name, written with a capital O, and called Big-O.

## Counting steps

A loop from 0 to `n` runs its body `n` times. Double `n`, and the work doubles. This is written **O(n)**, "order n", and called linear.

A loop inside a loop, both from 0 to `n`, runs its body `n × n` times. Double `n`, and the work goes up four times. This is **O(n²)**, quadratic.

A loop that halves `n` each time, as binary search does, runs only as many times as you can halve `n` before reaching 1: 3 times for 8, 9 times for 1,000, and 19 for a million. Double `n`, and it adds one step. This is **O(log n)**, logarithmic.

Work that does not depend on `n` at all, like reading `values[5]`, is **O(1)**, constant.

## Why growth matters

| n | O(log n) | O(n) | O(n²) |
|---|---|---|---|
| 10 | about 3 | 10 | 100 |
| 1,000 | about 10 | 1,000 | 1,000,000 |
| 1,000,000 | about 20 | 1,000,000 | 1,000,000,000,000 |

At 10 values nobody notices the difference. At a million, a quadratic algorithm needs a million times longer than a linear one. Choosing the right algorithm matters far more than a faster computer.

## The algorithms so far

| Algorithm | Growth | Why |
|---|---|---|
| Reading one array element | O(1) | one step, whatever the size |
| Linear search | O(n) | may look at every value |
| Binary search | O(log n) | halves the list each look |
| Bubble, selection and insertion sort | O(n²) | a loop inside a loop |

The next lesson shows merge sort, which grows as **O(n log n)**: for a million values about 20 million steps, instead of a trillion.

## Only the biggest part counts

Big-O describes how work grows, so it keeps only the part that grows fastest and drops fixed numbers. A loop that runs `n` times doing 3 things is still O(n). Code with a single loop followed by a nested loop is O(n²): for large `n` the nested part swamps the rest. Big-O also usually describes the worst case: linear search is O(n) even though sometimes the value is first.

## Common mistakes

- **Comparing by timing one small run.** On 10 values every algorithm looks fast; the difference only shows as `n` grows.
- **Counting the lines of code.** A short line inside a nested loop can do far more work than many lines outside it.
- **Thinking O(log n) means "a bit slower than O(1)".** It is close to constant in practice, which is why binary search is so useful.

::: kid
You are looking for a toy in a big box.

One way is to check every toy, one by one.

More toys means more checking.

Another way is to split the toys in half each time.

Then even a huge box takes only a few tries.

Clever recipes save lots of steps.

Counting steps shows which recipe is faster.
:::

```c {role=example file=growth.c}
#include <stdio.h>

int halvings(int n) {
    int steps = 0;
    while (n > 1) {
        n = n / 2;
        steps++;
    }
    return steps;
}

int main() {
    int sizes[3] = {10, 100, 1000};

    for (int i = 0; i < 3; i++) {
        int n = sizes[i];
        printf("n = %d: halving %d, single loop %d, nested loops %d\n", n, halvings(n), n, n * n);
    }
    return 0;
}
```

::: try
Each function should count how many times its loop body runs for a given `n`, and return the count:

- `single_loop`: one loop from 0 to `n`.
- `nested_loops`: a loop from 0 to `n` inside another loop from 0 to `n`.
- `halving`: divide `n` by 2 (whole-number division) until it is no longer bigger than 1.

`main` is finished. Compare the three answers as `n` grows: for 100, the nested loops already take 10,000 steps while halving takes 6.
:::

::: try-kid
Each helper counts steps.

The first one counts one loop.

The second counts a loop inside a loop.

The third counts how often n can be halved.

Try a big number and see which grows fastest.
:::

```c {role=starter file=growth_task.c}
#include <stdio.h>

int single_loop(int n) {
    // Count the steps of one loop from 0 to n.
    return 0;
}

int nested_loops(int n) {
    // Count the steps of a loop inside a loop.
    return 0;
}

int halving(int n) {
    // Count how many times n can be halved before it reaches 1.
    return 0;
}

int main() {
    int n;

    scanf("%d", &n);

    printf("Single loop: %d\n", single_loop(n));
    printf("Nested loops: %d\n", nested_loops(n));
    printf("Halving: %d\n", halving(n));
    return 0;
}
```

```c {role=solution file=growth_task.c}
#include <stdio.h>

int single_loop(int n) {
    int steps = 0;
    for (int i = 0; i < n; i++) {
        steps++;
    }
    return steps;
}

int nested_loops(int n) {
    int steps = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            steps++;
        }
    }
    return steps;
}

int halving(int n) {
    int steps = 0;
    while (n > 1) {
        n = n / 2;
        steps++;
    }
    return steps;
}

int main() {
    int n;

    scanf("%d", &n);

    printf("Single loop: %d\n", single_loop(n));
    printf("Nested loops: %d\n", nested_loops(n));
    printf("Halving: %d\n", halving(n));
    return 0;
}
```
