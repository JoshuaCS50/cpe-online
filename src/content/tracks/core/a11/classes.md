---
id: core.cpp.classes
kind: lesson
track: core
unit: a11
order: 3
title: Classes
titleKid: Making your own kind of object
language: cpp
concepts: [class, object, member-function, constructor, private, public, encapsulation]
prereqs: [core.cpp.references, core.c.structs]
links:
  - to: core.c.structs
    kind: builds-on
    note: A struct groups data; a class groups data with the functions that look after it.
est_minutes: 18
checks:
  - type: io-cases
    cases:
      - stdin: ["100", "fill 60", "fill 70", "drain 30", "end"]
        expect: "Added 60, level 60 of 100\nAdded 40, level 100 of 100\nRemoved 30, level 70 of 100\n"
      - stdin: ["50", "drain 10", "fill 20", "drain 50", "end"]
        expect: "Removed 0, level 0 of 50\nAdded 20, level 20 of 50\nRemoved 20, level 0 of 50\n"
      - stdin: ["10", "fill 10", "fill 1", "end"]
        expect: "Added 10, level 10 of 10\nAdded 0, level 10 of 10\n"
  - type: code-contains
    pattern: 'class\s+Tank\b'
    message: 'Keeps the Tank class'
hints:
  - 'fill can only add what still fits: the room left is capacity - amount. Add the smaller of that room and the amount asked for, and return how much was really added.'
  - 'drain works the same way the other round: it can only take out what is in the tank, so remove the smaller of the two and return it.'
  - 'For example in fill: int room = capacity - amount; int added = wanted < room ? wanted : room; amount += added; return added;'
hintsKid:
  - 'The tank cannot hold more than its size.'
  - 'Add only what still fits. Say how much went in.'
  - 'Take out only what is there. Say how much came out.'
---
A `struct` (unit A9) groups related data: a tank has a capacity and an amount of water. But nothing stops any part of the program from setting the amount to more than the capacity, or below zero. A **class** groups the data together with the functions that are allowed to change it, and hides the data from everything else. The object then looks after itself.

## A class

```cpp
class Tank {
public:
    Tank(int size) {                 // constructor: runs when a Tank is made
        capacity = size;
        amount = 0;
    }

    int fill(int wanted) {            // a member function
        int room = capacity - amount;
        int added = wanted < room ? wanted : room;
        amount += added;
        return added;
    }

    int level() const {               // const: only reads the object
        return amount;
    }

private:
    int capacity;
    int amount;
};
```

- The **members** are the data (`capacity`, `amount`) and the **member functions** (`fill`, `level`). Member functions use the data directly, by name.
- `private:` members can only be used by the class's own functions. `public:` members are what the rest of the program may use.
- The **constructor** has the class's name and no return type. It runs automatically when an object is made, and sets the starting values.
- `const` after a member function promises it does not change the object.

## Objects

The class is the plan; each **object** made from it has its own copy of the data:

```cpp
Tank small(50);           // calls the constructor with 50
Tank big(1000);
small.fill(80);           // only 50 fits
cout << small.level();    // 50
cout << big.level();      // 0: big is a separate tank
```

Writing `small.amount = 999;` outside the class is a compile error: `amount` is private. The only way to change the water level is through `fill` and `drain`, which never let it go out of range. This idea, keeping the data safe behind a small set of functions, is called **encapsulation**.

## class or struct?

In C++, `struct` and `class` are almost the same: the only difference is that members are public by default in a `struct` and private by default in a `class`. By convention, a `struct` is used for plain groups of data and a `class` for objects that protect their data.

## Classes you have already used

`string` is a class: `name.length()` calls its member function. So are `cin` and `cout`. On an Arduino, `Serial.begin(9600)` and `myServo.write(90)` call member functions of objects. Writing your own classes is how large programs, such as a robot with motors, sensors and a controller, are kept understandable.

::: kid
A class is a plan for a new kind of thing.

A water tank has a size and some water in it.

The tank also has helpers, like fill and drain.

Only those helpers may change the water.

So the tank can never overflow by mistake.
:::

```cpp {role=example file=motor.cpp}
#include <iostream>
using namespace std;

class Motor {
public:
    Motor(string label, int maxRpm) {
        name = label;
        limit = maxRpm;
        rpm = 0;
    }

    void setSpeed(int value) {
        if (value < 0) {
            value = 0;
        }
        if (value > limit) {
            value = limit;
        }
        rpm = value;
    }

    void report() const {
        cout << name << ": " << rpm << " of " << limit << " rpm" << endl;
    }

private:
    string name;
    int limit;
    int rpm;
};

int main() {
    Motor conveyor("Conveyor", 3000);
    Motor fan("Fan", 1200);
    conveyor.setSpeed(4500);
    fan.setSpeed(800);
    conveyor.report();
    fan.report();
    return 0;
}
```

::: try
Finish the `Tank` class: `fill(wanted)` adds as much of `wanted` as still fits and returns how much it really added; `drain(wanted)` removes as much as is there, up to `wanted`, and returns how much it really removed. The program reads the tank's capacity, then commands such as `fill 60` or `drain 30` until `end`, and prints what happened after each one.
:::

::: try-kid
Finish the tank's two helpers.

Fill adds water, but never more than fits.

Drain takes water out, but never more than is there.
:::

```cpp {role=starter file=tank.cpp}
#include <iostream>
using namespace std;

class Tank {
public:
    Tank(int size) {
        capacity = size;
        amount = 0;
    }

    // Add as much of wanted as fits; return how much was added.
    int fill(int wanted) {
        return 0;
    }

    // Remove up to wanted; return how much was removed.
    int drain(int wanted) {
        return 0;
    }

    int level() const {
        return amount;
    }

    int size() const {
        return capacity;
    }

private:
    int capacity;
    int amount;
};

int main() {
    int capacity;
    cin >> capacity;
    Tank tank(capacity);

    string command;
    int value;
    while (cin >> command && command != "end") {
        cin >> value;
        if (command == "fill") {
            cout << "Added " << tank.fill(value);
        } else {
            cout << "Removed " << tank.drain(value);
        }
        cout << ", level " << tank.level() << " of " << tank.size() << endl;
    }
    return 0;
}
```

```cpp {role=solution file=tank.cpp}
#include <iostream>
using namespace std;

class Tank {
public:
    Tank(int size) {
        capacity = size;
        amount = 0;
    }

    // Add as much of wanted as fits; return how much was added.
    int fill(int wanted) {
        int room = capacity - amount;
        int added = wanted < room ? wanted : room;
        amount += added;
        return added;
    }

    // Remove up to wanted; return how much was removed.
    int drain(int wanted) {
        int removed = wanted < amount ? wanted : amount;
        amount -= removed;
        return removed;
    }

    int level() const {
        return amount;
    }

    int size() const {
        return capacity;
    }

private:
    int capacity;
    int amount;
};

int main() {
    int capacity;
    cin >> capacity;
    Tank tank(capacity);

    string command;
    int value;
    while (cin >> command && command != "end") {
        cin >> value;
        if (command == "fill") {
            cout << "Added " << tank.fill(value);
        } else {
            cout << "Removed " << tank.drain(value);
        }
        cout << ", level " << tank.level() << " of " << tank.size() << endl;
    }
    return 0;
}
```
