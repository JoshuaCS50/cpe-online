---
id: core.c.structs
kind: lesson
track: core
unit: a9
order: 1
title: Structs
titleKid: One box with labelled parts
language: c
concepts: [struct, member, typedef, arrow-operator]
prereqs: [core.c.pass-by-address, core.c.strings]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["9 45 30"]
        expect: "10:15\n"
      - stdin: ["23 50 20"]
        expect: "00:10\n"
      - stdin: ["12 5 125"]
        expect: "14:10\n"
      - stdin: ["0 0 0"]
        expect: "00:00\n"
      - stdin: ["6 30 1440"]
        expect: "06:30\n"
  - type: code-contains
    pattern: 'struct\s+Time\s+addMinutes\s*\('
    message: Keeps addMinutes returning a struct Time
hints:
  - Turn the time into minutes since midnight first, total = t.hours * 60 + t.minutes + extra; then split it up again.
  - A day has 24 * 60 = 1440 minutes, so total % 1440 wraps past midnight. Then hours is total / 60 and minutes is total % 60.
  - Put the results into the members of a struct Time, for example result.hours = ...; and return result;
hintsKid:
  - Turn the time into minutes since midnight.
  - Add the extra minutes. Use `% 1440` to wrap past midnight.
  - Split it back into hours and minutes. Return the new time.
---
A program often needs several values that belong together: a point has an x and a y, a sensor reading has a time, a channel and a value, a student has a name and a mark. Keeping them in separate variables works for one of each, but gets messy fast. A **struct** puts them in one value with named parts, called **members**.

## Defining a struct

```c
struct Point {
    int x;
    int y;
};
```

This makes a new type, `struct Point`, but no variable yet. Note the semicolon after the closing brace: forgetting it is a classic mistake. Members can be any type, including arrays and other structs:

```c
struct Student {
    char name[20];
    int age;
    double mark;
};
```

## Making and using struct variables

```c
struct Point p;
p.x = 3;
p.y = -4;
printf("(%d, %d)\n", p.x, p.y);
```

The dot reaches a member: `p.x` is an ordinary `int` that you can read, change, pass to `scanf` with `&p.x`, and so on. A `{ }` list fills the members in the order they were defined, and any members left out start at 0:

```c
struct Point a = {1, 2};
struct Student s = {"Sipho", 19, 74.5};
```

## Copying a struct

Unlike an array, a struct can be copied with `=`. Every member is copied, including arrays inside it, and the copy is independent:

```c
struct Point b = a;
b.x = 50;          // a.x is still 1
```

Structs cannot be compared with `==`, though; compare the members you care about.

## typedef: a shorter name

Writing `struct Point` every time is long. `typedef` gives a type a second name:

```c
typedef struct {
    int x;
    int y;
} Point;

Point p = {5, 6};
```

Both styles are common; this course mostly writes `struct Name` so the kind of type stays visible.

## Structs and functions

A struct passed to a function is copied, just like an `int`. The function works on its own copy, and the caller's struct does not change. A function can also return a struct, which is a neat way to give back several values at once:

```c
struct Point makePoint(int x, int y) {
    struct Point p;
    p.x = x;
    p.y = y;
    return p;
}
```

To let a function change the caller's struct, pass its address. Through a pointer, members are reached with the arrow `->`:

```c
void moveRight(struct Point *p) {
    p->x = p->x + 10;    // the same as (*p).x = (*p).x + 10;
}

moveRight(&a);
```

Passing the address is also faster for big structs, because nothing is copied.

## Common mistakes

- **Missing `;` after the struct definition.** The struct runs into the next line, and the error message names them together, such as `struct,Point int`.
- **Dot on a pointer.** `q.x` where `q` is a pointer gives an error telling you to use `q->x`.
- **Expecting a function to change a struct passed by value.** It changes its copy. Return the new struct, or pass a pointer.

::: kid
Think of a lunch box with labelled parts.

One part says sandwich. One says apple. One says juice.

A struct is a box like that.

You choose the parts and their names.

`p.x` means the part called x inside box p.

You can copy the whole box in one go.

The copy is a new box. Changing it leaves the first one alone.
:::

```c {role=example file=points.c}
#include <stdio.h>

struct Point {
    int x;
    int y;
};

struct Point midpoint(struct Point a, struct Point b) {
    struct Point m;
    m.x = (a.x + b.x) / 2;
    m.y = (a.y + b.y) / 2;
    return m;
}

void moveRight(struct Point *p, int steps) {
    p->x = p->x + steps;
}

int main() {
    struct Point start = {2, 4};
    struct Point end = {10, 8};
    struct Point mid = midpoint(start, end);

    printf("Middle: (%d, %d)\n", mid.x, mid.y);

    moveRight(&mid, 5);
    printf("Moved: (%d, %d)\n", mid.x, mid.y);

    struct Point copy = start;
    copy.y = 100;
    printf("Start is still (%d, %d)\n", start.x, start.y);
    return 0;
}
```

::: try
A `struct Time` holds hours (0 to 23) and minutes (0 to 59). Finish `addMinutes` so that it returns the time `extra` minutes after `t`, wrapping past midnight: 23:50 plus 20 minutes is 00:10. `main` reads the hours, the minutes and the extra minutes, and prints the answer as `HH:MM`.
:::

::: try-kid
The box holds hours and minutes.

Add the extra minutes to the time.

After 23:59 the clock starts again at 00:00.

Give back the new time in a box.
:::

```c {role=starter file=clock.c}
#include <stdio.h>

struct Time {
    int hours;
    int minutes;
};

struct Time addMinutes(struct Time t, int extra) {
    // Work out the new time and return it.
    return t;
}

int main() {
    struct Time now;
    int extra;
    scanf("%d %d %d", &now.hours, &now.minutes, &extra);

    struct Time later = addMinutes(now, extra);
    printf("%02d:%02d\n", later.hours, later.minutes);
    return 0;
}
```

```c {role=solution file=clock.c}
#include <stdio.h>

struct Time {
    int hours;
    int minutes;
};

struct Time addMinutes(struct Time t, int extra) {
    int total = t.hours * 60 + t.minutes + extra;
    total = total % (24 * 60);

    struct Time result;
    result.hours = total / 60;
    result.minutes = total % 60;
    return result;
}

int main() {
    struct Time now;
    int extra;
    scanf("%d %d %d", &now.hours, &now.minutes, &extra);

    struct Time later = addMinutes(now, extra);
    printf("%02d:%02d\n", later.hours, later.minutes);
    return 0;
}
```
