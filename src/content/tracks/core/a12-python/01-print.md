---
id: core.py.print
kind: mini
track: core
unit: a12
order: 1
title: print
titleKid: print, Python's talking helper
symbol: print
language: python
concepts: [output, format-string]
links:
  - to: core.c.printf
    kind: same-idea
    note: C's printf does the same job, with placeholders such as %d.
est_minutes: 5
checks:
  - type: stdout-equals
    expect: "Thabo is 9\nNext year: 10\n"
  - type: code-contains
    pattern: 'f["'']'
    message: Uses an f-string to put values into the text
hints:
  - An f-string starts with the letter f before the opening quote. Inside it, anything in curly brackets is replaced by its value.
  - You can do a sum inside the curly brackets, for example {age + 1}.
  - 'The two lines are: print(f"{name} is {age}") and print(f"Next year: {age + 1}")'
hintsKid:
  - Put the letter f before the first quote mark.
  - Curly marks hold a box name. Python swaps in what is inside.
  - 'Type: print(f"{name} is {age}") then print(f"Next year: {age + 1}")'
---
`print` shows values on the screen and then starts a new line.

```python
print("Hello")          # text
print(42)               # a number
print("Total:", 42)     # several values, separated by a space
```

No placeholder codes are needed: `print` works out how to show each value by itself.

## Putting values into text

An **f-string** is text with an `f` before the opening quote. Anything inside curly brackets is replaced by its value:

```python
name = "Aisha"
score = 87.456
print(f"{name} scored {score}")        # Aisha scored 87.456
print(f"{name} scored {score:.1f}")    # Aisha scored 87.5
```

`:.1f` after the name rounds to one decimal place, like `%.1f` in C.

## Controlling the ending

`print` ends with a new line. Change that with `end`:

```python
print("Loading", end="")
print("...")            # Loading...
```

**Common mistakes**

- **Forgetting the `f`.** Without it, `"{name}"` prints the curly brackets and the word `name`.
- **Joining text and a number with `+`.** `"Age: " + 9` is an error, because Python will not guess how to combine them. Use an f-string, or separate the values with a comma.

::: kid
`print` is Python's talking helper. Give it words. It says them on the screen.

It can say numbers too. You do not need a special code.

Want to mix words and numbers? Put the letter `f` before the quote.

Then put a box name inside curly marks. Python swaps in what the box holds.

Each `print` starts a new line when it is done.
:::

```python {role=example file=print_demo.py}
item = "pencil"
count = 3
price = 4.5

print("Shopping list")
print(f"{count} x {item}")
print(f"Total: {count * price:.2f}")
print("Done", end="!\n")
```

::: try
Two variables are set for you. Print these two lines, using f-strings so that the values come from the variables:

```
Thabo is 9
Next year: 10
```
:::

::: try-kid
Two boxes are ready for you. Make Python say this:

```
Thabo is 9
Next year: 10
```

Use the boxes. Do not type the numbers.
:::

```python {role=starter file=about.py}
name = "Thabo"
age = 9

print("... is ...")
print("Next year: ...")
```

```python {role=solution file=about.py}
name = "Thabo"
age = 9

print(f"{name} is {age}")
print(f"Next year: {age + 1}")
```
