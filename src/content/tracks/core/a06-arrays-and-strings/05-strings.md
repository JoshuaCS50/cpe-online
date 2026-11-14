---
id: core.c.strings
kind: lesson
track: core
unit: a6
order: 5
title: Strings as character arrays
titleKid: Words are rows of letters
language: c
concepts: [string, char-array, null-terminator, character]
prereqs: [core.c.arrays]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["banana"]
        expect: "Vowels: 3\n"
      - stdin: ["rhythm"]
        expect: "Vowels: 0\n"
      - stdin: ["education"]
        expect: "Vowels: 5\n"
      - stdin: ["queue"]
        expect: "Vowels: 4\n"
hints:
  - Loop over the word one character at a time, starting at index 0 and stopping when you reach the '\0' at the end.
  - For each character, check whether it is a, e, i, o or u, and add one to vowels if it is. Characters go in single quotes.
  - 'The loop is: for (int i = 0; word[i] != ''\0''; i++) { char ch = word[i]; if (ch == ''a'' || ch == ''e'' || ch == ''i'' || ch == ''o'' || ch == ''u'') { vowels++; } }'
hintsKid:
  - Look at each letter until you reach the stopper at the end.
  - Is the letter a, e, i, o or u? Add one.
  - 'Type this: `for (int i = 0; word[i] != ''\0''; i++)` then check each letter.'
---
C has no separate type for text. A string is an array of `char`, one character in each box, followed by one extra character, `'\0'`, that marks where the text stops. `'\0'` is the character whose code is zero, and it is called the null character.

## Making a string

```c
char name[20] = "Ada";
```

This stores `A`, `d` and `a` in the first three boxes and `'\0'` in the fourth. The other sixteen boxes are spare room. When the size is left out, as in `char word[] = "hello";`, the array is made exactly big enough: 6 boxes, five letters and the `'\0'`. Whatever size you choose, it must leave room for the `'\0'`.

## Double quotes and single quotes

Double quotes make a string and single quotes make one character. `"A"` is two boxes, `A` and `'\0'`. `'A'` is a single `char`.

A `char` is stored as a number, its character code. That is why `printf("%d\n", 'A');` prints 65, and why characters can be compared with `<` and `>`: the small letters `a` to `z` have codes that follow each other in order, and so do the capitals.

## Printing and reading

`printf("%s\n", name);` prints the characters up to the `'\0'` and stops there. `scanf("%s", word);` reads one word: it stops at the first space or new line. It needs no `&`, because the name of an array already stands for the place where it starts.

## Walking through a string

You do not need to know how long a word is to visit every character. Keep going until you meet the `'\0'`:

```c
for (int i = 0; word[i] != '\0'; i++) {
    printf("%c\n", word[i]);
}
```

## Changing characters

Each box can be changed like any array element: `name[0] = 'E';` turns `Ada` into `Eda`. To turn a small letter into a capital, use the codes. `word[i] - 'a'` gives how far along the alphabet the letter is, 0 for `a` and 1 for `b`, and adding `'A'` moves that same distance along the capitals:

```c
if (word[i] >= 'a' && word[i] <= 'z') {
    word[i] = word[i] - 'a' + 'A';
}
```

## Common mistakes

- **No room for the `'\0'`.** `char word[5] = "hello";` has space for the five letters but not the marker, so the text has no proper end.
- **Double quotes in a comparison.** `word[i] == "a"` compares a character with a string. Write `word[i] == 'a'`.
- **Reading a sentence with `%s`.** `scanf("%s", text)` keeps only the first word of `good morning`. The rest stays waiting to be read.

::: kid
Think of beads on a string.

Each bead has one letter on it.

The beads make a word, one letter after another.

At the end is a special stopper bead.

The stopper tells you the word is finished.

To read the word, start at the first bead.

Keep going until you reach the stopper.
:::

```c {role=example file=letters.c}
#include <stdio.h>

int main() {
    char word[10] = "shout";

    for (int i = 0; word[i] != '\0'; i++) {
        printf("word[%d] = %c (%d)\n", i, word[i], word[i]);
    }

    for (int i = 0; word[i] != '\0'; i++) {
        if (word[i] >= 'a' && word[i] <= 'z') {
            word[i] = word[i] - 'a' + 'A';
        }
    }

    printf("%s\n", word);
    return 0;
}
```

::: try
The program reads one word in small letters. Count its vowels, the letters a, e, i, o and u, and store the count in `vowels`. The printing is already written. Replace the comment with a loop.

It is checked with words that have no vowels and words that have several vowels in a row.
:::

::: try-kid
The program reads one word.

Count the letters a, e, i, o and u.

Keep the count in the box called vowels.

Some test words have no vowels at all.
:::

```c {role=starter file=vowels.c}
#include <stdio.h>

int main() {
    char word[30];
    int vowels = 0;

    scanf("%s", word);

    // Count the vowels here.

    printf("Vowels: %d\n", vowels);
    return 0;
}
```

```c {role=solution file=vowels.c}
#include <stdio.h>

int main() {
    char word[30];
    int vowels = 0;

    scanf("%s", word);

    for (int i = 0; word[i] != '\0'; i++) {
        char ch = word[i];
        if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') {
            vowels++;
        }
    }

    printf("Vowels: %d\n", vowels);
    return 0;
}
```
