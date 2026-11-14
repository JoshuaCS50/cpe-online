---
id: core.py.syntax
kind: lesson
track: core
unit: a12
order: 2
title: Python for C programmers
titleKid: A new way to write the same ideas
language: python
concepts: [python-syntax, indentation, dynamic-types, input, if-elif, for-range]
prereqs: [core.py.print, core.c.for]
links:
  - to: core.c.if-else
    kind: same-idea
    note: The same decisions in C, with braces and brackets.
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["4", "16.5", "22", "27.25", "18"]
        expect: "16.5: cold\n22.0: ok\n27.2: hot\n18.0: ok\nAverage: 20.9\n"
      - stdin: ["2", "30", "31"]
        expect: "30.0: hot\n31.0: hot\nAverage: 30.5\n"
      - stdin: ["1", "10"]
        expect: "10.0: cold\nAverage: 10.0\n"
  - type: code-contains
    pattern: '\belif\b'
    message: Uses elif for the middle case
hints:
  - 'Read the count with n = int(input()), then loop with for i in range(n): and read each reading with float(input()).'
  - "Inside the loop: if t < 18: ... elif t > 26: ... else: ..., each branch printing f\"{t:.1f}: cold\" and so on. Indent the lines under each part."
  - 'Keep a running total, and after the loop (not indented) print f"Average: {total / n:.1f}".'
hintsKid:
  - Read how many. Then read each reading in a loop.
  - Under 18 is cold. Over 26 is hot. The rest is ok.
  - Add them up. Print the average at the end.
---
Python runs the same ideas you know from C (variables, decisions, loops, functions) with far less to type. There is no compiling and no `main`: the file runs from top to bottom. This lesson is a tour of the differences.

## Blocks are shown by indentation

C marks a block with `{ }`; Python marks it with a colon and **indentation** (4 spaces by convention). The indentation is not decoration, it is the structure:

```python
if speed > 100:
    print("Too fast")
    speed = 100
print("Done")        # not indented: runs either way
```

There are no semicolons, and no brackets around conditions. Mixing up the indentation gives an `IndentationError`.

## Variables have no declared type

```python
count = 3          # an int
voltage = 4.75     # a float
name = "Pump 2"    # a string (str)
running = True     # a bool: True or False, with capitals
```

The value carries its type, not the variable, and a variable can later hold something else. Integers never overflow: `2 ** 100` is exact.

## Reading input

`input()` reads one typed line and always returns a **string**. Convert it before doing sums:

```python
n = int(input())          # "5"   -> 5
t = float(input())        # "21.5" -> 21.5
```

Forgetting this gives `"2" + "3" == "23"`, or a `TypeError` when you mix text and numbers.

## Operators that differ

| C | Python | Note |
|---|---|---|
| `&&`, `\|\|`, `!` | `and`, `or`, `not` | words, not symbols |
| `7 / 2` is 3 | `7 / 2` is 3.5 | `/` always gives a float |
| | `7 // 2` is 3 | `//` divides and rounds down |
| `pow(2, 8)` | `2 ** 8` | power |
| `x++` | `x += 1` | there is no `++` |

Comparisons chain: `18 <= t <= 26` means the same as `t >= 18 and t <= 26`.

## Decisions and loops

```python
if t < 18:
    print("cold")
elif t > 26:          # else if
    print("hot")
else:
    print("ok")

for i in range(5):    # 0, 1, 2, 3, 4, like for (i = 0; i < 5; i++)
    print(i)

while level < 100:
    level += 10
```

`range(a, b)` counts from `a` up to but not including `b`; `range(a, b, step)` uses a step, which may be negative. `break` and `continue` work as in C. There is no `do-while`.

## Comments

`#` starts a comment to the end of the line, like `//` in C.

## Common mistakes

- **Doing sums with `input()` directly.** Convert with `int()` or `float()` first.
- **Inconsistent indentation.** Use 4 spaces everywhere; a line one space out of place breaks the block.
- **Writing `true`, `else if` or `x++`.** Python spells them `True`, `elif` and `x += 1`.

::: kid
Python is another language for talking to the computer.

It has fewer marks to type than C.

Lines that belong together are pushed in with spaces.

You do not say what kind each box holds.

Python looks at what you put inside and knows.
:::

```python {role=example file=tour.py}
readings = 5
total = 0

for i in range(readings):
    value = 20 + i * 1.5
    total += value
    if value > 24:
        print(f"Reading {i + 1}: {value} is high")
    else:
        print(f"Reading {i + 1}: {value}")

print(f"Average: {total / readings:.2f}")
print(7 / 2, 7 // 2, 2 ** 10)
print(18 <= 21.5 <= 26)
```

::: try
The program first reads how many temperature readings follow, then the readings. For each reading print it with one decimal and a label: below 18 is `cold`, above 26 is `hot`, anything else is `ok`, for example `16.5: cold`. Finish with the average, `Average: 21.0`.
:::

::: try-kid
Read how many temperatures there are.

Read each one. Say if it is cold, ok or hot.

At the end, print the average.
:::

```python {role=starter file=temps.py}
n = int(input())
total = 0

# Read n readings, print each with its label, and add them to total.

```

```python {role=solution file=temps.py}
n = int(input())
total = 0

for i in range(n):
    t = float(input())
    total += t
    if t < 18:
        print(f"{t:.1f}: cold")
    elif t > 26:
        print(f"{t:.1f}: hot")
    else:
        print(f"{t:.1f}: ok")

print(f"Average: {total / n:.1f}")
```
