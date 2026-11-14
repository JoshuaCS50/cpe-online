---
id: core.py.c-vs-python
kind: lesson
track: core
unit: a12
order: 7
title: The same algorithm in C and Python
titleKid: One recipe, two languages
language: python
concepts: [translation, binary-search, integer-division, choosing-a-language]
prereqs: [core.py.functions, core.c.binary-search]
links:
  - to: core.c.binary-search
    kind: same-idea
    note: The C lesson this one translates.
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["10 20 30 40 50 60 70", "60"]
        expect: "Looking at index 3: 40\nLooking at index 5: 60\nFound 60 at index 5\n"
      - stdin: ["10 20 30 40 50 60 70", "10"]
        expect: "Looking at index 3: 40\nLooking at index 1: 20\nLooking at index 0: 10\nFound 10 at index 0\n"
      - stdin: ["10 20 30 40 50 60 70", "35"]
        expect: "Looking at index 3: 40\nLooking at index 1: 20\nLooking at index 2: 30\n35 is not in the list\n"
      - stdin: ["5 8 13", "13"]
        expect: "Looking at index 1: 8\nLooking at index 2: 13\nFound 13 at index 2\n"
  - type: code-contains
    pattern: '//'
    message: Works out the middle with // (whole-number division)
hints:
  - 'Translate line by line: low = 0, high = len(values) - 1, then while low <= high: with the body indented.'
  - 'The middle must be a whole number to use as an index, so write mid = (low + high) // 2. A single / gives a float, and values[3.0] is an error.'
  - 'The if / else if / else ladder becomes if, elif and else, and return -1 goes after the loop, not indented under it.'
hintsKid:
  - 'Change the C recipe into Python, one line at a time.'
  - 'Use `//` for the middle, so it is a whole number.'
  - 'Curly brackets become a colon and pushed-in lines.'
---
You now know two languages. Writing the same algorithm in both is the best way to see what really differs and what is only spelling. Here is binary search from unit A7, in C:

```c
int binarySearch(int values[], int count, int target) {
    int low = 0;
    int high = count - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        printf("Looking at index %d: %d\n", mid, values[mid]);
        if (values[mid] == target) {
            return mid;
        } else if (values[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}
```

The **algorithm** is identical in Python: the same variables, the same loop condition, the same three cases. Only the language around it changes.

## Translating, line by line

| C | Python |
|---|---|
| `int binarySearch(int values[], int count, int target) {` | `def binary_search(values, target):` |
| `int count` passed in | `len(values)` asked for |
| `int mid = (low + high) / 2;` | `mid = (low + high) // 2` |
| `printf("...%d...", mid)` | `print(f"...{mid}...")` |
| `} else if (...) {` | `elif ...:` |
| braces | a colon and indentation |

Two changes are more than spelling:

- **Division.** In C, `/` between two ints throws away the fraction. In Python, `/` always gives a float (`7 / 2` is `3.5`), and a float cannot be a list index. Whole-number division is `//`.
- **The length travels with the list.** A C array does not know its size, so it is passed separately; a Python list does, so `len(values)` replaces the extra parameter.

Python names are usually written `like_this` (snake case), where C code here used `likeThis`; both are only conventions.

## Which language, when?

| | C | Python |
|---|---|---|
| Speed | very fast, close to the hardware | often 10 to 100 times slower |
| Runs on | anything, including tiny microcontrollers | computers and larger boards |
| Memory | you control it, and must get it right | managed for you |
| Mistakes | can fail silently (reading past an array) | stop with a clear error |
| Writing it | more code, more care | short, quick to change |

In mechatronics both are everywhere, often in the same project: C (or C++) in the firmware that reads sensors and drives motors in real time, and Python on the PC that sends commands, logs the data and plots it.

Python also has binary search built in: `bisect.bisect_left(values, target)` from the `bisect` module. Writing it yourself is for understanding; in real Python code, use the library.

## Common mistakes when translating

- **`/` for an index.** Use `//`.
- **Keeping C's extra size parameter.** Use `len()`; one less value to get wrong.
- **Indentation of `return -1`.** Inside the loop it would end the search after one step; it belongs after the loop.

::: kid
A recipe can be written in two languages.

The steps stay the same. Only the words change.

C uses curly brackets. Python pushes lines in.

C is very fast and runs on tiny chips.

Python is quicker to write and explains its mistakes.
:::

```python {role=example file=compare.py}
import bisect
import time

values = list(range(0, 20000, 2))     # 10 000 even numbers, sorted
target = 13570

start = time.perf_counter()
found = target in values               # checks one by one
linear = time.perf_counter() - start

start = time.perf_counter()
index = bisect.bisect_left(values, target)   # binary search
binary = time.perf_counter() - start

print("Found:", found, "at index", index)
print("Steps for binary search: about", len(values).bit_length())
print(f"One by one: {linear * 1e6:.0f} microseconds")
print(f"Binary search: {binary * 1e6:.0f} microseconds")
```

::: try
Translate the C function above into Python. `binary_search(values, target)` should print each index it looks at, exactly as the C version does, and return the index where it found `target`, or -1. The code that reads the list and the target and prints the result is already written.
:::

::: try-kid
The C recipe for binary search is shown above.

Write the same recipe in Python.

Print each box you look at, like the C one.
:::

```python {role=starter file=search.py}
def binary_search(values, target):
    # Translate the C function here.
    return -1


values = [int(part) for part in input().split()]
target = int(input())

index = binary_search(values, target)
if index >= 0:
    print(f"Found {target} at index {index}")
else:
    print(f"{target} is not in the list")
```

```python {role=solution file=search.py}
def binary_search(values, target):
    low = 0
    high = len(values) - 1
    while low <= high:
        mid = (low + high) // 2
        print(f"Looking at index {mid}: {values[mid]}")
        if values[mid] == target:
            return mid
        elif values[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1


values = [int(part) for part in input().split()]
target = int(input())

index = binary_search(values, target)
if index >= 0:
    print(f"Found {target} at index {index}")
else:
    print(f"{target} is not in the list")
```
