---
id: core.cpp.references
kind: lesson
track: core
unit: a11
order: 2
title: References
titleKid: A second name for the same box
language: cpp
concepts: [reference, pass-by-reference, const-reference, alias]
prereqs: [core.cpp.cout-cin, core.c.pass-by-address]
links:
  - to: core.c.pass-by-address
    kind: builds-on
    note: In C the same job needs pointers, & and *.
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["7 2 9"]
        expect: "Lowest 2, highest 9\n"
      - stdin: ["5 5 5"]
        expect: "Lowest 5, highest 5\n"
      - stdin: ["-3 10 0"]
        expect: "Lowest -3, highest 10\n"
      - stdin: ["4 8 1"]
        expect: "Lowest 1, highest 8\n"
  - type: code-contains
    pattern: 'void\s+lowHigh\s*\(\s*int\s+a\s*,\s*int\s+b\s*,\s*int\s+c\s*,\s*int\s*&\s*low\s*,\s*int\s*&\s*high\s*\)'
    message: 'lowHigh gives back its answers through int &low and int &high'
hints:
  - 'Inside lowHigh, low and high are the caller''s variables under new names. Assigning to them changes the caller''s variables directly.'
  - 'Start with low = a; high = a; then compare with b and with c, replacing low or high when a value is smaller or bigger.'
  - 'For example: if (b < low) { low = b; } if (b > high) { high = b; } and the same for c.'
hintsKid:
  - '`low` and `high` are other names for the boxes in main.'
  - 'Start both at `a`. Then look at `b` and `c`.'
  - 'Put smaller numbers in low, bigger ones in high.'
---
In unit A8, a C function could only change the caller's variable if it was given the variable's address: `void addOne(int *x)`, called as `addOne(&n)`, with `*x` everywhere inside. C++ offers a simpler tool for the same job: the **reference**.

## A second name

A reference is another name for a variable that already exists:

```cpp
int speed = 100;
int &s = speed;      // s IS speed, under another name
s = 250;             // changes speed
cout << speed;       // 250
```

The `&` after the type makes `s` a reference. It must be connected to a variable when it is made, and it stays connected to that variable for its whole life. Unlike a pointer, there is no `*` to write when using it, and it cannot be NULL.

## Passing by reference

The main use is in function parameters. A reference parameter is a second name for the caller's variable, so the function can change it:

```cpp
void addOne(int &x) {
    x = x + 1;
}

int n = 5;
addOne(n);           // no & at the call
cout << n;           // 6
```

Compare this with the C version from unit A8: the same idea, without addresses to take and pointers to follow. The cost is that the call `addOne(n)` no longer shows that `n` may change, so choose clear names.

Reference parameters are also how a function gives back **several results**, as in the task below.

## const references: fast and safe

Passing a large value, such as a long `string` or a `vector` of a thousand readings, normally copies it. A `const` reference avoids the copy and promises not to change it:

```cpp
void printReport(const string &text) {
    cout << text << endl;      // may read text, may not change it
}
```

This is the usual way to pass big objects in C++ that the function only reads.

## A common error

A reference parameter (without `const`) needs a real variable to connect to. `addOne(5)` fails: there is no variable called 5 to change. The compiler says it cannot bind a reference to a temporary value.

::: kid
A reference is a second name for a box.

Change it by either name, and it is the same box.

A helper can be given the second name.

Then the helper can change the box in main.

You do not need any stars or addresses.
:::

```cpp {role=example file=swap.cpp}
#include <iostream>
using namespace std;

void swapValues(int &a, int &b) {
    int temp = a;
    a = b;
    b = temp;
}

void report(const string &label, int value) {
    cout << label << " = " << value << endl;
}

int main() {
    int left = 3;
    int right = 8;
    swapValues(left, right);
    report("left", left);
    report("right", right);

    int &alias = left;
    alias = 100;
    report("left after alias = 100", left);
    return 0;
}
```

::: try
Finish `lowHigh`, which takes three numbers and gives back two answers through reference parameters: the lowest in `low` and the highest in `high`. `main` reads three numbers from one line and prints the result.
:::

::: try-kid
The helper gets three numbers.

It puts the smallest in low and the biggest in high.

Those are other names for boxes in main.
:::

```cpp {role=starter file=lowhigh.cpp}
#include <iostream>
using namespace std;

void lowHigh(int a, int b, int c, int &low, int &high) {
    // Put the lowest of a, b and c in low and the highest in high.
}

int main() {
    int a, b, c;
    cin >> a >> b >> c;
    int low = 0;
    int high = 0;
    lowHigh(a, b, c, low, high);
    cout << "Lowest " << low << ", highest " << high << endl;
    return 0;
}
```

```cpp {role=solution file=lowhigh.cpp}
#include <iostream>
using namespace std;

void lowHigh(int a, int b, int c, int &low, int &high) {
    low = a;
    high = a;
    if (b < low) {
        low = b;
    }
    if (b > high) {
        high = b;
    }
    if (c < low) {
        low = c;
    }
    if (c > high) {
        high = c;
    }
}

int main() {
    int a, b, c;
    cin >> a >> b >> c;
    int low = 0;
    int high = 0;
    lowHigh(a, b, c, low, high);
    cout << "Lowest " << low << ", highest " << high << endl;
    return 0;
}
```
