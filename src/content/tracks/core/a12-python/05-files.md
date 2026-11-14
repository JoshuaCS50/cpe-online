---
id: core.py.files
kind: lesson
track: core
unit: a12
order: 5
title: Files in Python
titleKid: Python opens saved pages too
language: python
concepts: [open, with, readlines, split, write, exceptions]
prereqs: [core.py.functions, core.c.reading-files]
links:
  - to: core.c.csv
    kind: same-idea
    note: The same CSV job in C, with fgets, strtok and sscanf.
est_minutes: 16
checks:
  - type: file-equals
    stdin: ["T1"]
    file: summary.txt
    expect: "sensor: T1\nreadings: 4\naverage: 22.4\nbad lines: 1\n"
  - type: file-equals
    stdin: ["T2"]
    file: summary.txt
    expect: "sensor: T2\nreadings: 2\naverage: 19.5\nbad lines: 1\n"
  - type: file-equals
    stdin: ["T3"]
    file: summary.txt
    expect: "sensor: T3\nreadings: 0\naverage: none\nbad lines: 1\n"
  - type: code-contains
    pattern: 'with\s+open\s*\('
    message: Opens the files with a with block
hints:
  - 'Read every line with: with open("sensors.csv") as f: lines = f.readlines(). Then loop over lines[1:] to skip the header.'
  - 'For each line, parts = line.strip().split(","). Turn parts[2] into a number inside try: ... except ValueError: and count the line as bad when it fails.'
  - 'Write the summary with: with open("summary.txt", "w") as out: and out.write(f"sensor: {wanted}\n") for each line of the report.'
hintsKid:
  - 'Open the file. Skip the first line.'
  - 'Cut each line at the commas. Try to turn the last piece into a number.'
  - 'Write four lines into summary.txt.'
---
Reading and writing files in Python takes a fraction of the code it takes in C, and it is just as useful for logging sensor data or preparing reports.

As in C, programs here can open the files in the explorer (Code mode) or the files a lesson gives them, and files they write appear in the explorer.

## Opening with `with`

```python
with open("sensors.csv") as f:
    for line in f:
        print(line.strip())
```

`open(name)` opens a file for reading; the `with` block closes it automatically when the block ends, even if an error happens inside, so there is no `fclose` to forget. Looping over the file gives one line at a time, each still ending in `"\n"`; `strip()` removes that and any spaces around the text.

Other ways to read: `f.read()` gives the whole file as one string, and `f.readlines()` gives a list of lines.

## Writing

```python
with open("report.txt", "w") as out:
    out.write("Speed: 300 rpm\n")
    print("Done", file=out)      # print can write to a file too
```

The modes are the same letters as in C: `"r"` (the default) reads, `"w"` empties or creates the file, `"a"` adds to the end. `write` does not add a newline for you; `print(..., file=out)` does.

## Splitting lines

`split(",")` cuts a string into a list at every comma, empty fields included, which is exactly what CSV needs:

```python
parts = "08:15,T1,22.0".split(",")   # ["08:15", "T1", "22.0"]
value = float(parts[2])
```

Python also has a `csv` module (`import csv`) that handles quoted fields with commas inside; for simple files `split` is enough.

## When something goes wrong: exceptions

`float("error")` cannot work, so Python raises a `ValueError` and, unless something catches it, the program stops with a traceback. `try` and `except` catch it so the program can deal with the bad value and carry on:

```python
try:
    value = float(parts[2])
except ValueError:
    print("Bad value:", parts[2])
```

The same works for a missing file: opening one that does not exist raises `FileNotFoundError`. C reports problems through return values you must remember to check (`NULL` from `fopen`, the count from `sscanf`); Python raises an exception that cannot be ignored silently.

## Common mistakes

- **Forgetting the header line.** Skip it with `lines[1:]` or by reading one line before the loop.
- **Comparing with the newline still on.** `"T1\n" != "T1"`; strip each line first.
- **Catching everything with a bare `except:`.** Name the error you expect, or real bugs get hidden.

::: kid
Python can open a saved page with open.

The with word closes the page for you at the end.

Each line can be cut at the commas with split.

Sometimes a piece is not a number.

Python lets you try, and catch the problem if it fails.
:::

```text {role=file file=sensors.csv}
time,sensor,value
08:00,T1,21.5
08:00,T2,19.0
08:15,T1,22.0
08:15,T2,error
08:30,T1,23.5
08:30,T2,20.0
08:45,T1,22.5
```

```python {role=example file=peek.py}
with open("sensors.csv") as f:
    lines = f.readlines()

print("The file has", len(lines), "lines.")
print("Columns:", lines[0].strip().split(","))

for line in lines[1:]:
    time, sensor, text = line.strip().split(",")
    try:
        value = float(text)
        print(f"{time} {sensor} {value:.1f}")
    except ValueError:
        print(f"{time} {sensor} has a bad value: {text}")

with open("times.txt", "w") as out:
    for line in lines[1:]:
        out.write(line.split(",")[0] + "\n")
print("Saved the times in times.txt")
```

::: try
`sensors.csv` (shown below) holds readings from two sensors and one failed reading. The program reads a sensor name. Go through the file, skipping the header, and write `summary.txt` with four lines: the sensor, how many good readings it has, their average with one decimal (or `none` if there are none), and how many lines in the whole file are bad. The check reads `summary.txt`.

```
sensor: T1
readings: 4
average: 22.4
bad lines: 1
```
:::

::: try-kid
Find the readings for the sensor that was typed.

Count them and work out the average.

Count the broken lines too.

Write the answers into summary.txt.
:::

```python {role=starter file=summary.py}
wanted = input()

# Read sensors.csv, then write summary.txt.

print("Saved summary.txt")
```

```python {role=solution file=summary.py}
wanted = input()

with open("sensors.csv") as f:
    lines = f.readlines()

values = []
bad = 0
for line in lines[1:]:
    parts = line.strip().split(",")
    try:
        value = float(parts[2])
    except (ValueError, IndexError):
        bad += 1
        continue
    if parts[1] == wanted:
        values.append(value)

with open("summary.txt", "w") as out:
    out.write(f"sensor: {wanted}\n")
    out.write(f"readings: {len(values)}\n")
    if values:
        out.write(f"average: {sum(values) / len(values):.1f}\n")
    else:
        out.write("average: none\n")
    out.write(f"bad lines: {bad}\n")

print("Saved summary.txt")
```
