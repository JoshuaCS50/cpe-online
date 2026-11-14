---
id: core.py.modules
kind: lesson
track: core
unit: a12
order: 6
title: Modules
titleKid: Borrowing helpers from other files
language: python
concepts: [import, modules, math, standard-library, name-main]
prereqs: [core.py.functions]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["10 8 0 90"]
        expect: "Tip: (10.00, 8.00)\nReach: 12.81\nHeading: 38.7 degrees\n"
      - stdin: ["5 5 90 -90"]
        expect: "Tip: (5.00, 5.00)\nReach: 7.07\nHeading: 45.0 degrees\n"
      - stdin: ["4 3 30 60"]
        expect: "Tip: (3.46, 5.00)\nReach: 6.08\nHeading: 55.3 degrees\n"
  - type: code-contains
    pattern: '(^|\n)\s*(import\s+math\b|from\s+math\s+import)'
    message: Imports the math module
  - type: code-contains
    pattern: '\bgeometry\b'
    message: Uses the geometry module for the reach and heading
hints:
  - 'Angles must be in radians for math.cos and math.sin: turn each one with math.radians(...). The second joint adds to the first, so the second link points at a1 + a2.'
  - 'The tip is x = l1 * math.cos(r1) + l2 * math.cos(r1 + r2), and y is the same with math.sin.'
  - 'With from geometry import distance, heading at the top, distance(x, y) and heading(x, y) give the last two numbers.'
hintsKid:
  - 'Bring in `math` and the `geometry` helpers with import.'
  - 'Turn the angles into radians first.'
  - 'Add up where each arm part points to find the tip.'
---
A **module** is a file of Python code that other files can use. Instead of writing everything yourself, you `import` what others (or you, earlier) have written. Python ships with a large **standard library** of modules, and this is a big part of why Python programs are short.

## Importing

```python
import math
print(math.sqrt(2), math.pi)         # use the module's name as a prefix

from math import sqrt, radians       # bring in chosen names
print(sqrt(16), radians(180))

import statistics as st              # a shorter name
print(st.mean([2, 4, 9]))
```

The prefix form (`math.sqrt`) makes it obvious where a name comes from; `from ... import` is shorter for names you use a lot. Avoid `from math import *`, which dumps every name into your file and hides where they came from.

## Useful standard modules

| Module | For |
|---|---|
| `math` | `sqrt`, `sin`, `cos`, `atan2`, `radians`, `degrees`, `pi`, `hypot` |
| `random` | `random()`, `randint(a, b)`, `choice(list)`; `seed(n)` repeats the same sequence |
| `statistics` | `mean`, `median`, `stdev` |
| `time`, `datetime` | timing and dates |
| `csv`, `json` | reading and writing common file formats |

Beyond the standard library there are thousands of packages, such as `numpy` for fast number arrays and `matplotlib` for graphs, installed on a desktop with `pip`.

## Writing your own module

Any `.py` file is a module. Put functions in `geometry.py`, next to your program, and import it by its name without `.py`:

```python
from geometry import distance
```

Here, a program can import the `.py` files in the explorer (Code mode), or the ones a lesson gives it. In C, the same idea needs a `.h` file with prototypes, a separate `.c` file and a linker; in Python, the file itself is enough.

## `if __name__ == "__main__":`

Importing a module runs its top-level code. To keep test code in a module from running when someone imports it, put it under this check:

```python
def distance(x, y):
    return (x * x + y * y) ** 0.5

if __name__ == "__main__":
    print(distance(3, 4))    # runs only when this file is run directly
```

`__name__` is `"__main__"` in the file you run, and the module's own name in a file that was imported.

## A shortcut used below

```python
l1, l2, a1, a2 = [float(part) for part in input().split()]
```

The part in square brackets is a **list comprehension**: it builds a list by working out `float(part)` for each piece of the typed line, the same as a loop that calls `append`. The four names on the left then take the four values in order.

## Common mistakes

- **Naming your file like a standard module.** A file called `math.py` or `random.py` hides the real one, and imports then fail in confusing ways.
- **Degrees given to `math.sin`.** The trigonometry functions work in radians; convert with `math.radians`.
- **Forgetting the prefix.** After `import math`, it is `math.sqrt`, not `sqrt`.

::: kid
A module is a file full of helpers.

You can borrow its helpers with import.

Python comes with many modules ready to use.

The math module knows about square roots and angles.

You can also make your own module file.
:::

```python {role=file file=geometry.py}
"""Small helpers for points on a flat surface."""
import math


def distance(x, y):
    """How far (x, y) is from (0, 0)."""
    return math.hypot(x, y)


def heading(x, y):
    """The angle of (x, y) from the x axis, in degrees."""
    return math.degrees(math.atan2(y, x))


if __name__ == "__main__":
    print(distance(3, 4), heading(1, 1))
```

```python {role=example file=tools.py}
import math
import random
import statistics
from geometry import distance, heading

print("Square root of 2:", round(math.sqrt(2), 4))
print("Point (3, 4):", distance(3, 4), "away, at", round(heading(3, 4), 1), "degrees")

random.seed(7)
readings = [round(random.uniform(20, 25), 1) for _ in range(6)]
print("Readings:", readings)
print("Mean:", round(statistics.mean(readings), 2))
print("Median:", round(statistics.median(readings), 2))
```

::: try
A robot arm has two links, of length `l1` and `l2`. The first joint turns the first link to angle `a1` from the x axis; the second joint turns the second link a further `a2` degrees. The program reads `l1 l2 a1 a2` from one line. Work out where the tip of the arm ends up, using the `math` module, then print how far the tip is from the base and in which direction, using `distance` and `heading` from the `geometry` module shown below.
:::

::: try-kid
A robot arm has two parts joined together.

Work out where the end of the arm is.

Use `math` for the angles, and `geometry` for the rest.
:::

```python {role=starter file=arm.py}
l1, l2, a1, a2 = [float(part) for part in input().split()]

# Import math and geometry, then work out x, y, reach and direction.
x = 0
y = 0
reach = 0
direction = 0

print(f"Tip: ({x:.2f}, {y:.2f})")
print(f"Reach: {reach:.2f}")
print(f"Heading: {direction:.1f} degrees")
```

```python {role=solution file=arm.py}
import math
from geometry import distance, heading

l1, l2, a1, a2 = [float(part) for part in input().split()]

r1 = math.radians(a1)
r2 = math.radians(a1 + a2)
x = l1 * math.cos(r1) + l2 * math.cos(r2)
y = l1 * math.sin(r1) + l2 * math.sin(r2)
reach = distance(x, y)
direction = heading(x, y)

print(f"Tip: ({x:.2f}, {y:.2f})")
print(f"Reach: {reach:.2f}")
print(f"Heading: {direction:.1f} degrees")
```
