---
id: core.c.string-functions
kind: lesson
track: core
unit: a6
order: 6
title: String functions
titleKid: Handy tools for words
language: c
concepts: [strlen, strcpy, strcat, strcmp, string-h]
prereqs: [core.c.strings, core.c.if-else]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["cat", "dog"]
        expect: "cat\ndog\nTotal letters: 6\n"
      - stdin: ["zebra", "ant"]
        expect: "ant\nzebra\nTotal letters: 8\n"
      - stdin: ["sun", "sun"]
        expect: "sun\nsun\nTotal letters: 6\n"
      - stdin: ["pear", "apple"]
        expect: "apple\npear\nTotal letters: 9\n"
  - type: code-contains
    pattern: 'strcmp\s*\('
    message: Uses strcmp to compare the words
hints:
  - strcmp(first, second) gives a number below 0 when first comes before second in the alphabet, 0 when they are the same, and above 0 otherwise.
  - Print first then second when strcmp(first, second) <= 0; otherwise print second then first.
  - 'For the total, add the two lengths: total = strlen(first) + strlen(second);'
hintsKid:
  - strcmp tells you which word comes first in the alphabet.
  - Below 0 means the first word goes first.
  - 'Add the lengths: `total = strlen(first) + strlen(second);`'
---
A string is an array, and that changes how whole strings are copied and compared. For numbers, `=` copies a value and `==` checks two values. For strings neither works the way you would hope, so C provides a set of string tools in `<string.h>`. Put `#include <string.h>` at the top of any program that uses them.

## strlen: how long is it?

`strlen(s)` counts the characters before the `'\0'`. It is often smaller than the array:

```c
char name[20] = "Ada";
printf("%d\n", (int) strlen(name));   // 3: the letters in use
printf("%d\n", (int) sizeof(name));   // 20: the boxes in the array
```

## strcpy: copy a string into an array

`strcpy(dest, src)` copies `src`, including its `'\0'`, into the array `dest`.

```c
char pet[10];
strcpy(pet, "cat");
```

Writing `pet = "cat";` is not how C copies text into an array; use `strcpy`. The destination must have room for every character and the `'\0'`, so `"cat"` needs at least 4 boxes.

## strcat: join one string onto another

`strcat(dest, src)` adds `src` onto the end of the text already in `dest`. Here too, `dest` must have room for both texts and one `'\0'`.

```c
char word[20] = "sun";
strcat(word, "flower");   // word now holds "sunflower"
```

## strcmp: compare two strings

`strcmp(a, b)` compares two strings one character at a time, using the character codes, until they differ or both end. The answer is a number:

| Answer | Meaning |
|---|---|
| 0 | the strings are the same |
| below 0 | `a` comes first |
| above 0 | `b` comes first |

So `strcmp(a, b) == 0` asks "are these the same?", and `strcmp(a, b) < 0` asks "does `a` come first?". A word that is the start of a longer one comes first: `"sun"` before `"sunny"`. Because codes decide, every capital letter comes before every small letter, so `"Zebra"` comes before `"apple"`.

## Why == does not compare text

`a == b` on two strings asks whether they are the same array in memory, not whether they hold the same letters. Two arrays that both hold `"hi"` are still two different arrays, so the answer is no. Always compare text with `strcmp`.

## Common mistakes

- **Forgetting `#include <string.h>`.** The string tools live there.
- **Reading `strcmp` as "true when equal".** It gives 0, which counts as false, when the strings are equal. Write `strcmp(a, b) == 0`.
- **A destination that is too small.** `strcpy` and `strcat` need room for every character and the `'\0'`; here the program stops with an error, and on many systems it would overwrite other memory instead.

::: kid
You have a toolbox for words.

A ruler measures how many letters a word has.

Glue sticks one word onto the end of another.

A dictionary tells you which word comes first.

Each tool has a name you can use.

The ruler is strlen. The glue is strcat.

The dictionary is strcmp.
:::

```c {role=example file=greet.c}
#include <stdio.h>
#include <string.h>

int main() {
    char message[40];

    strcpy(message, "Hello, ");
    strcat(message, "Ada");
    strcat(message, "!");

    printf("%s (%d letters)\n", message, (int) strlen(message));

    if (strcmp("apple", "pear") < 0) {
        printf("apple comes before pear\n");
    }
    if (strcmp("same", "same") == 0) {
        printf("same equals same\n");
    }
    return 0;
}
```

::: try
The program reads two words in small letters. Print them in alphabetical order, one per line, and then how many letters they have together:

```
apple
pear
Total letters: 9
```

The reading and the final two lines are already written. Use `strcmp` to choose the order and `strlen` for the total.
:::

::: try-kid
The program reads two words.

Say them in alphabet order, one on each line.

Then say how many letters they have in total.

Use strcmp to pick the order.
:::

```c {role=starter file=order.c}
#include <stdio.h>
#include <string.h>

int main() {
    char first[30];
    char second[30];

    scanf("%s", first);
    scanf("%s", second);

    int total = 0;

    // Print the two words in alphabetical order, then work out total.

    printf("%s\n%s\n", first, second);
    printf("Total letters: %d\n", total);
    return 0;
}
```

```c {role=solution file=order.c}
#include <stdio.h>
#include <string.h>

int main() {
    char first[30];
    char second[30];

    scanf("%s", first);
    scanf("%s", second);

    int total = strlen(first) + strlen(second);

    if (strcmp(first, second) <= 0) {
        printf("%s\n%s\n", first, second);
    } else {
        printf("%s\n%s\n", second, first);
    }
    printf("Total letters: %d\n", total);
    return 0;
}
```
