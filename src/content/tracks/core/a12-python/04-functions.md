---
id: core.py.functions
kind: lesson
track: core
unit: a12
order: 4
title: Functions in Python
titleKid: Python helpers that hand back answers
language: python
concepts: [def, return, tuple, default-arguments, keyword-arguments, scope]
prereqs: [core.py.lists-dicts, core.c.functions]
links:
  - to: core.c.parameters
    kind: same-idea
    note: C functions with parameters and return, for comparison.
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["19 22 25"]
        expect: "Lowest 19.0, highest 25.0, average 22.0\nLabels: ok ok ok\nStrict: cold ok hot\n"
      - stdin: ["30 10"]
        expect: "Lowest 10.0, highest 30.0, average 20.0\nLabels: hot cold\nStrict: hot cold\n"
      - stdin: ["18"]
        expect: "Lowest 18.0, highest 18.0, average 18.0\nLabels: ok\nStrict: cold\n"
  - type: code-contains
    pattern: 'return\s+\w+\s*,'
    message: stats returns several values at once
hints:
  - 'stats can use the built-ins: lowest = min(values), highest = max(values), average = sum(values) / len(values), then return lowest, highest, average.'
  - 'label compares with its own low and high: if value < low: return "cold", then elif value > high: return "hot", otherwise return "ok".'
  - 'The defaults are already in the def line, so label(v) uses 18 and 26 while label(v, 20, 24) uses the numbers given.'
hintsKid:
  - '`stats` finds the smallest, the biggest and the average.'
  - 'It hands back all three at once.'
  - '`label` says cold, ok or hot, using its own limits.'
---
A Python function does what a C function does: it takes values, runs its own lines, and can return a result. The writing is shorter and a few things are more flexible.

## Defining and calling

```python
def area(width, height):
    return width * height

print(area(3, 4))      # 12
```

`def`, the name, the parameters in brackets, a colon, and an indented body. There are no types and no prototypes. A function must be **defined before the line that calls it runs**, so definitions usually go at the top of the file, with the main code below. A function without a `return` gives back `None`, Python's "nothing".

## Returning several values

In C, a function returns one value, and more need pointers (unit A8). In Python, list them:

```python
def min_max(values):
    return min(values), max(values)

low, high = min_max([4, 9, 2])
print(low, high)       # 2 9
```

The values travel together as a **tuple**, a fixed group of values, and the line `low, high = ...` unpacks it into two variables.

## Default and keyword arguments

A parameter can have a **default value**, used when the caller leaves it out:

```python
def label(value, low=18, high=26):
    if value < low:
        return "cold"
    elif value > high:
        return "hot"
    return "ok"

label(21)              # uses 18 and 26
label(21, 20, 24)      # uses 20 and 24
label(21, high=20)     # keyword argument: only high changes
```

Naming an argument (`high=20`) makes calls readable and lets you skip the ones in between. Parameters with defaults must come after those without.

## Scope

Variables made inside a function are **local**, as in C: they disappear when it returns, and a local with the same name as an outside variable hides it. A function can read outside variables, but assigning to one creates a new local instead; prefer passing values in and returning results.

## Passing lists

A list passed to a function is not copied. The function gets the same list, so `values.append(5)` inside it changes the caller's list, much like passing an array in C. Assigning a whole new list to the parameter (`values = []`) does not affect the caller.

## Common mistakes

- **Calling before defining.** Python reads the file top to bottom; `NameError` means the `def` had not run yet.
- **Printing instead of returning.** A function that prints its answer cannot be used in further calculations. Return the value and let the caller print.
- **A list as a default value (`def f(items=[])`).** The same list is reused on every call. Use `None` and create the list inside.

::: kid
A function is a helper with a name.

You give it some values. It does its job.

Then it hands back the answer with return.

A Python helper can hand back several answers at once.

Some values have a usual setting, so you can leave them out.
:::

```python {role=example file=helpers.py}
def stats(values):
    return min(values), max(values), sum(values) / len(values)


def describe(value, unit="C", decimals=1):
    return f"{value:.{decimals}f} {unit}"


readings = [21.5, 19.0, 24.25]
low, high, average = stats(readings)
print("Lowest:", describe(low))
print("Highest:", describe(high, decimals=2))
print("Average:", describe(average, unit="degrees"))


def add_reading(values, new):
    values.append(new)


add_reading(readings, 30.0)
print(len(readings), "readings now")
```

::: try
Finish the two functions. `stats(values)` returns three values: the lowest, the highest and the average of the list. `label(value, low=18, high=26)` returns `"cold"` below `low`, `"hot"` above `high`, and `"ok"` otherwise. The main code, which reads the numbers from one line and prints everything, is already written.
:::

::: try-kid
Finish the two helpers.

`stats` hands back the smallest, the biggest and the average.

`label` hands back cold, ok or hot.
:::

```python {role=starter file=helpers.py}
def stats(values):
    # Return the lowest, the highest and the average.
    return 0, 0, 0


def label(value, low=18, high=26):
    # Return "cold", "hot" or "ok".
    return "ok"


values = []
for part in input().split():
    values.append(float(part))

lowest, highest, average = stats(values)
print(f"Lowest {lowest:.1f}, highest {highest:.1f}, average {average:.1f}")

labels = []
strict = []
for v in values:
    labels.append(label(v))
    strict.append(label(v, 20, 24))
print("Labels:", " ".join(labels))
print("Strict:", " ".join(strict))
```

```python {role=solution file=helpers.py}
def stats(values):
    lowest = min(values)
    highest = max(values)
    average = sum(values) / len(values)
    return lowest, highest, average


def label(value, low=18, high=26):
    if value < low:
        return "cold"
    elif value > high:
        return "hot"
    return "ok"


values = []
for part in input().split():
    values.append(float(part))

lowest, highest, average = stats(values)
print(f"Lowest {lowest:.1f}, highest {highest:.1f}, average {average:.1f}")

labels = []
strict = []
for v in values:
    labels.append(label(v))
    strict.append(label(v, 20, 24))
print("Labels:", " ".join(labels))
print("Strict:", " ".join(strict))
```
