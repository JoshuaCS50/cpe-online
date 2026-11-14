---
id: core.c.top-down
kind: lesson
track: core
unit: a5
order: 5
title: Top-down design
titleKid: Big job, small jobs
language: c
concepts: [top-down-design, decomposition, stub]
prereqs: [core.c.parameters]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["70", "85", "90"]
        expect: "Total: 245\nAverage: 81.67\nPass\n"
      - stdin: ["40", "50", "45"]
        expect: "Total: 135\nAverage: 45.00\nFail\n"
      - stdin: ["50", "50", "50"]
        expect: "Total: 150\nAverage: 50.00\nPass\n"
      - stdin: ["49", "50", "50"]
        expect: "Total: 149\nAverage: 49.67\nFail\n"
hints:
  - main is already finished. Fill in one function at a time, starting with total_of, and run after each one.
  - average_of must keep the decimals, so divide by 3.0, not by 3.
  - print_verdict prints Pass when the average is 50 or more and Fail otherwise, each followed by a new line.
hintsKid:
  - Main is done. Fill in one helper at a time.
  - Divide by 3.0 so the dot part stays.
  - Fifty or more is Pass. Anything less is Fail.
---
A big program is not written from the first line to the last in one go. Top-down design starts with the whole job, splits it into a few smaller jobs, then splits those in turn until each job is small enough to write as one function. The whole job becomes `main`, and the jobs under it become the functions that `main` calls.

## A marks report

The whole job here is a small report on three marks. Split it once:

- Read the three marks.
- Work out the total.
- Work out the average.
- Say Pass or Fail.

Each line is now a job of its own, and none needs splitting again, because each one fits in a few lines. Written as code, `main` becomes the same list of steps:

```c
int main() {
    int a, b, c;

    scanf("%d", &a);
    scanf("%d", &b);
    scanf("%d", &c);

    int total = total_of(a, b, c);
    float average = average_of(total);

    printf("Total: %d\n", total);
    printf("Average: %.2f\n", average);
    print_verdict(average);
    return 0;
}
```

`main` no longer shows how a total is worked out. It reads the marks, calls the three jobs in order, and prints their answers, so each name carries the detail.

## Write one stub at a time

Start with the whole program running, before any job is done. Give every function its first line and a body that does almost nothing, and the program still runs from the start:

```c
int total_of(int a, int b, int c) {
    return 0;
}

void print_verdict(float average) {
}
```

A stub is a placeholder, not a guess at the answer. Replace one stub with real code, run the program, and check that job before moving to the next. Only one thing can be wrong at a time this way.

## What goes in, what comes out

For each job, ask two questions. What does it need to know? That becomes its parameters. What single answer does it hand back? That becomes its return type. `total_of` needs the three marks and returns their sum. `print_verdict` needs the average but gives nothing back, so it returns `void` and prints instead.

## When a job is still too big

Three signs say a function should be split again:

- it does more than one job;
- its name needs "and" in it, such as `total_and_average`;
- it no longer fits on the screen.

A name with "and" in it is two jobs wearing one coat. Give each job its own function.

## Common mistakes

- **Writing everything before running anything.** Mistakes pile up, and the first run reports many at once. Get one stub working at a time.
- **A function that works out an answer and prints it.** The answer is gone once it is printed, so nothing else can use it. Work the answer out in one function and print in another.
- **Passing values the function does not use.** An unused parameter misleads the reader about what the job needs.

::: kid
You are planning a party.

That is a big job.

Do not do it all at once.

Cut it into small jobs.

One job is the invitations.

One job is the cake.

One job is the games.

Finish one job at a time.

Small jobs are easier to finish.
:::

```c {role=example file=room.c}
#include <stdio.h>

int area(int width, int length) {
    return width * length;
}

int perimeter(int width, int length) {
    return 2 * (width + length);
}

void print_report(int floor, int edge) {
    printf("Floor: %d square metres\n", floor);
    printf("Skirting board: %d metres\n", edge);
}

int main() {
    int width = 5;
    int length = 4;

    int floor = area(width, length);
    int edge = perimeter(width, length);

    print_report(floor, edge);
    return 0;
}
```

::: try
`main` is already written as a list of steps, and the three functions above it are stubs. They do not work yet.

Fill in one function at a time and run after each one. `total_of` returns the sum of the three marks. `average_of` returns the total divided by 3.0, keeping the decimals. `print_verdict` prints `Pass` when the average is 50 or more, and `Fail` otherwise. Only change the three functions.
:::

::: try-kid
Main is already finished.

It reads three marks.

Three helpers are empty.

Each helper has one small job.

Fill in total_of first.

Then fill in average_of.

Divide by 3.0 so the dot part stays.

Then fill in print_verdict.

Press Run after each one.
:::

```c {role=starter file=report.c}
#include <stdio.h>

int total_of(int a, int b, int c) {
    // Add the three marks.
    return 0;
}

float average_of(int total) {
    // Divide by 3, keeping the decimals.
    return 0.0;
}

void print_verdict(float average) {
    // Print Pass for 50 or more, otherwise Fail.
}

int main() {
    int a, b, c;

    scanf("%d", &a);
    scanf("%d", &b);
    scanf("%d", &c);

    int total = total_of(a, b, c);
    float average = average_of(total);

    printf("Total: %d\n", total);
    printf("Average: %.2f\n", average);
    print_verdict(average);
    return 0;
}
```

```c {role=solution file=report.c}
#include <stdio.h>

int total_of(int a, int b, int c) {
    return a + b + c;
}

float average_of(int total) {
    return total / 3.0;
}

void print_verdict(float average) {
    if (average >= 50) {
        printf("Pass\n");
    } else {
        printf("Fail\n");
    }
}

int main() {
    int a, b, c;

    scanf("%d", &a);
    scanf("%d", &b);
    scanf("%d", &c);

    int total = total_of(a, b, c);
    float average = average_of(total);

    printf("Total: %d\n", total);
    printf("Average: %.2f\n", average);
    print_verdict(average);
    return 0;
}
```
