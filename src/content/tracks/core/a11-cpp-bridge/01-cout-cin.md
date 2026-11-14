---
id: core.cpp.cout-cin
kind: lesson
track: core
unit: a11
order: 1
title: From C to C++
titleKid: A bigger toolbox for C
language: cpp
concepts: [cpp, iostream, cout, cin, namespace, iomanip]
prereqs: [core.c.scanf, core.c.functions]
links:
  - to: core.c.printf
    kind: contrast
    note: printf needs a % code for every value; cout works the type out itself.
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["Ann 70 75"]
        expect: "Ann: average 72.5\n"
      - stdin: ["Ben 60 61"]
        expect: "Ben: average 60.5\n"
      - stdin: ["Cara 90 90"]
        expect: "Cara: average 90.0\n"
  - type: code-contains
    pattern: '\bcin\s*>>'
    message: 'Reads with cin >>'
  - type: code-contains
    pattern: '\bcout\s*<<'
    message: 'Prints with cout <<'
hints:
  - 'Read all three values in one line: cin >> name >> first >> second;'
  - 'The average needs a fraction, so divide by 2.0, not 2: (first + second) / 2.0'
  - 'Print with one decimal: cout << fixed << setprecision(1) << name << ": average " << average << endl;'
hintsKid:
  - 'Read the name and both marks with `cin >>`.'
  - 'Add the marks. Divide by `2.0`.'
  - 'Print with `fixed << setprecision(1)` for one decimal.'
---
**C++** grew out of C in the 1980s. Almost every C program is also a C++ program, and everything you learned about variables, `if`, loops, functions and arrays still holds. C++ adds tools on top: easier input and output, references, classes, ready-made containers such as `vector` and `string`, and functions that share a name. Arduino sketches are C++, and so are many robot controllers, games and simulators.

Here C++ is compiled by **clang**, a real compiler used by professionals, running inside the browser. The first C++ run downloads it (about 20 MB, once); after that each run compiles in a second or two. Its error messages are the real ones, explained on the error card.

## Hello, C++

```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, C++!" << endl;
    return 0;
}
```

- `#include <iostream>` brings in input and output (C used `<stdio.h>`).
- `cout` ("character output") is the screen. `<<` sends something to it; several `<<` can be chained on one line.
- `endl` ends the line, like `"\n"` (which also works).
- The standard library's names live in a **namespace** called `std`. Their full names are `std::cout` and `std::endl`; `using namespace std;` lets you leave off the `std::`. Small programs often use it; big projects often write `std::` to keep names apart.

## No format codes

`cout` works out how to print each value from its type, so there is no `%d` or `%f` to get wrong:

```cpp
int count = 3;
double voltage = 4.75;
char unit = 'V';
cout << "Count: " << count << ", voltage: " << voltage << unit << endl;
```

## Reading with cin

`cin` ("character input") is the keyboard. `>>` reads one value into a variable, and no `&` is needed:

```cpp
int age;
string name;
cin >> name >> age;      // reads "Sipho 19"
```

Like `scanf("%s")`, `cin >>` reads text one word at a time. `getline(cin, line);` reads a whole line, spaces included.

## Controlling decimals

`<iomanip>` controls how numbers look. `fixed << setprecision(2)` prints exactly two decimals, like `%.2f`, and stays in effect for the following numbers:

```cpp
#include <iomanip>
cout << fixed << setprecision(2) << 3.14159 << endl;   // 3.14
```

## true and false

C++ has a `bool` type with the values `true` and `false`, which C lacked here. Conditions are `bool`, and `cout` prints them as 1 and 0.

::: kid
C++ is C with extra tools.

Everything you know from C still works.

`cout` shows things on the screen.

`cin` reads what you type.

You do not need any `%` codes.

C++ works out the kind of value for you.
:::

```cpp {role=example file=hello.cpp}
#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    string sensor = "T1";
    int readings = 4;
    double average = 21.6667;
    bool tooHot = average > 25;

    cout << "Sensor " << sensor << ": " << readings << " readings" << endl;
    cout << "Average: " << fixed << setprecision(1) << average << " C" << endl;
    cout << "Too hot? " << tooHot << endl;
    return 0;
}
```

::: try
The program reads a student's name and two marks from one line, such as `Ann 70 75`. Print the name and the average with exactly one decimal: `Ann: average 72.5`. Use `cin` and `cout`.
:::

::: try-kid
Read a name and two marks.

Print the name and the average of the marks.

Show one number after the dot.
:::

```cpp {role=starter file=average.cpp}
#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    string name;
    int first;
    int second;

    // Read the name and the two marks, then print the average.

    return 0;
}
```

```cpp {role=solution file=average.cpp}
#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    string name;
    int first;
    int second;

    cin >> name >> first >> second;
    double average = (first + second) / 2.0;
    cout << fixed << setprecision(1) << name << ": average " << average << endl;
    return 0;
}
```
