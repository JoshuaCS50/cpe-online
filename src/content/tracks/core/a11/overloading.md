---
id: core.cpp.overloading
kind: lesson
track: core
unit: a11
order: 5
title: Overloading
titleKid: One name, different jobs
language: cpp
concepts: [overloading, default-arguments, signatures]
prereqs: [core.cpp.vector-string]
est_minutes: 13
checks:
  - type: io-cases
    cases:
      - stdin: ["circle 2"]
        expect: "Area: 12.57\n"
      - stdin: ["rectangle 3 4.5"]
        expect: "Area: 13.50\n"
      - stdin: ["triangle 3 4 5"]
        expect: "Area: 6.00\n"
      - stdin: ["triangle 5 5 6"]
        expect: "Area: 12.00\n"
  - type: code-contains
    pattern: 'double\s+area\s*\(\s*double\s+\w+\s*,\s*double\s+\w+\s*,\s*double\s+\w+\s*\)'
    message: 'Adds a third area with three sides'
hints:
  - 'Write a third function with the same name and three double parameters: double area(double a, double b, double c).'
  - 'Heron''s formula: with s = (a + b + c) / 2, the area is sqrt(s * (s - a) * (s - b) * (s - c)). sqrt comes from <cmath>.'
  - 'Then in main, for "triangle", read three sides and call area(a, b, c); the compiler picks the right area by the number of values.'
hintsKid:
  - 'Make a third `area` helper that takes three sides.'
  - 'Use the triangle rule from the hint before.'
  - 'C++ picks the right helper by counting the values.'
---
In C, every function needs a different name: `areaCircle`, `areaRectangle`, `areaTriangle`. In C++, several functions may share one name as long as their parameters differ in number or type. This is **overloading**.

## One name, several functions

```cpp
double area(double radius) {                    // a circle
    return 3.14159265 * radius * radius;
}

double area(double width, double height) {      // a rectangle
    return width * height;
}
```

When the program calls `area(2.0)`, the compiler sees one value and picks the circle version; `area(3.0, 4.5)` has two values, so it picks the rectangle version. The choice is made when compiling, from the number and types of the values in the call, so it costs nothing while running.

You have used overloading all along: `cout << 5`, `cout << 2.5` and `cout << "hi"` call three different versions of `<<`, one for each type.

## What makes functions different

Overloads must differ in their **parameters**: how many there are, or their types. Two functions that differ only in their return type cannot share a name, because the call alone would not say which one is meant.

```cpp
int scale(int value);          // fine
double scale(double value);    // fine: the parameter type differs
double scale(int value);       // error: only the return type differs from the first
```

When no version fits the call, or two fit equally well, the compiler reports it ("no matching function" or "ambiguous").

## Default arguments

A parameter can also have a default value, used when the call leaves it out:

```cpp
void beep(int times = 1, int lengthMs = 100);

beep();           // once, 100 ms
beep(3);          // three times, 100 ms
beep(2, 500);     // twice, 500 ms
```

Defaults go at the end of the parameter list. They are often simpler than writing several overloads that do the same thing.

## Use it with care

Overloads that share a name should do the same kind of job. `area` for a circle and a rectangle is clear; an `area` that sometimes returns a perimeter would confuse every reader.

::: kid
In C++, two helpers can have the same name.

They must take different numbers or kinds of values.

`area` with one number works out a circle.

`area` with two numbers works out a rectangle.

C++ picks the right helper by looking at what you give it.
:::

```cpp {role=example file=describe.cpp}
#include <iostream>
#include <string>
using namespace std;

void describe(int value) {
    cout << "a whole number: " << value << endl;
}

void describe(double value) {
    cout << "a number with a fraction: " << value << endl;
}

void describe(const string &text) {
    cout << "some text: " << text << endl;
}

void beep(int times = 1) {
    for (int i = 0; i < times; i++) {
        cout << "beep ";
    }
    cout << endl;
}

int main() {
    describe(42);
    describe(2.5);
    describe(string("relay"));
    beep();
    beep(3);
    return 0;
}
```

::: try
The program reads a shape and its sizes, such as `circle 2`, `rectangle 3 4.5` or `triangle 3 4 5`, and prints the area with two decimals. The `area` versions for a circle and a rectangle are written. Add a third `area` that takes the three sides of a triangle and uses Heron's formula: with `s = (a + b + c) / 2`, the area is the square root of `s(s - a)(s - b)(s - c)`. Then handle `triangle` in `main`.
:::

::: try-kid
There are area helpers for a circle and a rectangle.

Add one more `area` helper for a triangle.

It takes the three sides.
:::

```cpp {role=starter file=areas.cpp}
#include <cmath>
#include <iomanip>
#include <iostream>
#include <string>
using namespace std;

double area(double radius) {
    return 3.14159265 * radius * radius;
}

double area(double width, double height) {
    return width * height;
}

// Add area for a triangle with sides a, b and c here.

int main() {
    string shape;
    cin >> shape;
    double result = 0;

    if (shape == "circle") {
        double r;
        cin >> r;
        result = area(r);
    } else if (shape == "rectangle") {
        double w, h;
        cin >> w >> h;
        result = area(w, h);
    }

    cout << fixed << setprecision(2) << "Area: " << result << endl;
    return 0;
}
```

```cpp {role=solution file=areas.cpp}
#include <cmath>
#include <iomanip>
#include <iostream>
#include <string>
using namespace std;

double area(double radius) {
    return 3.14159265 * radius * radius;
}

double area(double width, double height) {
    return width * height;
}

double area(double a, double b, double c) {
    double s = (a + b + c) / 2;
    return sqrt(s * (s - a) * (s - b) * (s - c));
}

int main() {
    string shape;
    cin >> shape;
    double result = 0;

    if (shape == "circle") {
        double r;
        cin >> r;
        result = area(r);
    } else if (shape == "rectangle") {
        double w, h;
        cin >> w >> h;
        result = area(w, h);
    } else if (shape == "triangle") {
        double a, b, c;
        cin >> a >> b >> c;
        result = area(a, b, c);
    }

    cout << fixed << setprecision(2) << "Area: " << result << endl;
    return 0;
}
```
