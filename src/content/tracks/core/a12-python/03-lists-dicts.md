---
id: core.py.lists-dicts
kind: lesson
track: core
unit: a12
order: 3
title: Lists and dictionaries
titleKid: Python's shelves and labelled drawers
language: python
concepts: [list, dict, append, slicing, counting]
prereqs: [core.py.syntax]
links:
  - to: core.c.arrays
    kind: contrast
    note: A C array has a fixed size and one type; a Python list grows.
  - to: core.c.hash-tables
    kind: builds-on
    note: A Python dict is a hash table, built in.
est_minutes: 16
checks:
  - type: io-cases
    cases:
      - stdin: ["relay", "fuse", "relay", "led", "relay", "fuse", "end"]
        expect: "relay: 3\nfuse: 2\nled: 1\nMost common: relay\n"
      - stdin: ["led", "fuse", "fuse", "led", "end"]
        expect: "led: 2\nfuse: 2\nMost common: led\n"
      - stdin: ["motor", "end"]
        expect: "motor: 1\nMost common: motor\n"
  - type: code-contains
    pattern: '\{\s*\}|dict\s*\('
    message: Counts with a dictionary
hints:
  - 'Make an empty dictionary before the loop, counts = {}, and for each name do counts[name] = counts.get(name, 0) + 1.'
  - 'Print the counts with for name, count in counts.items(): and an f-string. A dictionary keeps the order in which names were first added.'
  - 'Find the winner with a loop that remembers the best name so far, or with max(counts, key=counts.get), which picks the first of any tie.'
hintsKid:
  - 'Make an empty drawer cupboard with `counts = {}`.'
  - 'Each name gets a drawer. Add one to it each time.'
  - 'Print every drawer. Then find the fullest one.'
---
C gives you arrays: a fixed number of values, all of one type. Python's two workhorse containers are more flexible, and you will use them in almost every program.

## Lists

A **list** is an ordered sequence that can grow and shrink:

```python
readings = [21.5, 22.0, 19.5]
readings.append(23.0)          # add to the end
print(len(readings))           # 4
print(readings[0], readings[-1])   # first and last: 21.5 23.0
readings[1] = 22.5             # change an element
```

Indexes start at 0 as in C, and negative indexes count from the end. Going past the end raises an `IndexError` instead of quietly reading other memory.

Lists can be cut into pieces with **slices**, `[start:stop]`, where `stop` is not included:

```python
print(readings[1:3])   # elements 1 and 2
print(readings[:2])    # the first two
```

Looping over a list needs no index:

```python
for r in readings:
    print(r)

for i, r in enumerate(readings):   # when you do want the index
    print(i, r)
```

Useful built-ins: `sum(readings)`, `min(...)`, `max(...)`, `sorted(...)` (a new sorted list) and `x in readings` (is it there?). Everything the sorting unit built by hand is one call away, and it is a good sort: Python's is stable and O(n log n).

## Dictionaries

A **dictionary** (`dict`) maps **keys** to **values**, like the hash table from unit A9, built in:

```python
stock = {"relay": 12, "fuse": 40}
stock["led"] = 100            # add or change
print(stock["fuse"])          # 40
print("servo" in stock)       # False: is the key there?
print(stock.get("servo", 0))  # 0: a default instead of an error
```

Asking for a missing key with `stock["servo"]` raises a `KeyError`, so check with `in` or use `get` first. Keys are usually strings or numbers. A dict remembers the order in which keys were first added, and looping gives the keys:

```python
for name in stock:
    print(name, stock[name])

for name, count in stock.items():   # keys and values together
    print(f"{name}: {count}")
```

## The counting pattern

Counting how often each thing appears is one line per item:

```python
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
```

## Lists are shared, not copied

`b = a` does not copy a list: both names refer to the **same** list, so changing one changes "both". Use `b = a.copy()` or `b = a[:]` for a real copy. The same holds for dicts. This is like two pointers to one array in C.

## Common mistakes

- **Reading a missing key with `[]`.** Use `in` or `.get(key, default)`.
- **Changing a list while looping over it.** Build a new list instead.
- **Expecting `b = a` to copy.** It does not; call `.copy()`.

::: kid
A list is a shelf of boxes in a row.

You can add a box to the end at any time.

A dictionary is a cupboard of labelled drawers.

You find a drawer by its label, not by counting.

Each label shows up only once.
:::

```python {role=example file=stock.py}
readings = [21.5, 22.0, 19.5, 23.0, 20.5]
print("Readings:", readings)
print("Lowest:", min(readings), "Highest:", max(readings))
print("Sorted:", sorted(readings))
print("Last two:", readings[-2:])

stock = {"relay": 12, "fuse": 40, "led": 100}
stock["relay"] -= 2
stock["servo"] = 3

for part, count in stock.items():
    if count < 10:
        print(f"{part}: {count} (order more)")
    else:
        print(f"{part}: {count}")
```

::: try
The program reads part names, one per line, until it reads `end`. Count how many times each name appears. Print each name with its count, in the order the names first appeared, for example `relay: 3`. Then print `Most common: relay`; if two names tie, the one that appeared first wins.
:::

::: try-kid
Read part names until the word end.

Count how many times each name comes.

Print each name and its count.

Then say which name came most.
:::

```python {role=starter file=parts.py}
names = []
name = input()
while name != "end":
    names.append(name)
    name = input()

# Count each name, print the counts, then the most common one.

```

```python {role=solution file=parts.py}
names = []
name = input()
while name != "end":
    names.append(name)
    name = input()

counts = {}
for name in names:
    counts[name] = counts.get(name, 0) + 1

for name, count in counts.items():
    print(f"{name}: {count}")

best = names[0]
for name in counts:
    if counts[name] > counts[best]:
        best = name
print(f"Most common: {best}")
```
