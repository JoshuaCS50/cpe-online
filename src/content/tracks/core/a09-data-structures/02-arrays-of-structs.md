---
id: core.c.arrays-of-structs
kind: lesson
track: core
unit: a9
order: 2
title: Arrays of structs
titleKid: A shelf of labelled boxes
language: c
concepts: [array-of-structs, records, sorting-records]
prereqs: [core.c.structs, core.c.bubble-sort]
est_minutes: 15
checks:
  - type: io-cases
    cases:
      - stdin: ["3", "Ann 70", "Ben 95", "Cara 81"]
        expect: "Ben 95\nCara 81\nAnn 70\n"
      - stdin: ["4", "Dee 40", "Eli 60", "Fay 50", "Gus 90"]
        expect: "Gus 90\nEli 60\nFay 50\nDee 40\n"
      - stdin: ["3", "Hal 55", "Ivy 75", "Jon 55"]
        expect: "Ivy 75\nHal 55\nJon 55\n"
      - stdin: ["1", "Kim 100"]
        expect: "Kim 100\n"
  - type: code-contains
    pattern: 'struct\s+Student\s+\w+\s*=\s*\w+\s*\['
    message: Swaps whole students, starting with something like struct Student t = list[j];
hints:
  - Use bubble sort from unit A7, but compare the marks, list[j].mark < list[j + 1].mark, so the higher mark moves to the front.
  - Swap whole structs, not just the marks, or names and marks get mixed up. struct Student t = list[j]; list[j] = list[j + 1]; list[j + 1] = t;
  - Compare with < and not <=, so two equal marks keep their order.
hintsKid:
  - Use bubble sort, but look at the marks.
  - When two are in the wrong order, swap the whole boxes.
  - Equal marks stay where they are.
---
One struct holds one record: one student, one sensor reading, one part in a store room. Real programs have many records, and an **array of structs** keeps them in one list. Each element is a whole struct with all its members.

## Making the array

```c
struct Student {
    char name[20];
    int mark;
};

struct Student list[3] = {{"Ann", 70}, {"Ben", 95}, {"Cara", 81}};
```

Each inner `{ }` fills one element. Elements left out start with every member at 0 (and an empty name).

## Reaching a member

`list[i]` is a whole struct, so `list[i].mark` is the mark of student `i` and `list[i].name` is the name. Reading records in a loop looks like this:

```c
for (int i = 0; i < count; i++) {
    scanf("%s %d", list[i].name, &list[i].mark);
}
```

`list[i].name` has no `&` because a char array already gives its address, just like with plain strings. `&list[i].mark` needs it because `mark` is a single `int`.

## Searching

Finding the best student is the same "keep the best so far" loop as with numbers, but you remember the **position**, so that you can print the whole record afterwards:

```c
int best = 0;
for (int i = 1; i < count; i++) {
    if (list[i].mark > list[best].mark) {
        best = i;
    }
}
printf("%s has the top mark\n", list[best].name);
```

## Passing the list to a function

An array of structs is passed like any array: the function gets the address of the first element, so changes it makes are seen by the caller. Pass the count as well.

```c
void addBonus(struct Student s[], int count) {
    for (int i = 0; i < count; i++) {
        s[i].mark = s[i].mark + 5;
    }
}
```

## Sorting records

Any sort from unit A7 works, with two changes: compare one member (the **key**), and move whole structs. Because structs copy with `=`, a swap is three lines:

```c
struct Student t = list[j];
list[j] = list[j + 1];
list[j + 1] = t;
```

Swapping only the marks would leave each name next to someone else's mark, a bug that is easy to miss when the test data happens to be in order already.

A sort that keeps equal keys in their original order is called **stable**. Bubble sort and insertion sort are stable when they only swap on `<` (or `>`), never on `<=`.

## Common mistakes

- **Swapping one member instead of the whole struct.** The records get scrambled.
- **`list.mark[i]` instead of `list[i].mark`.** The index belongs to the array, the member comes after it.
- **Forgetting `&` before a number member in `scanf`.** `&list[i].mark`, not `list[i].mark`.

::: kid
Picture a shelf of lunch boxes.

Each box has the same labelled parts.

`list[2]` is the third box on the shelf.

`list[2].mark` is the mark part inside that box.

To sort the shelf, move whole boxes.

Never swap just one part. The boxes get mixed up.
:::

```c {role=example file=parts.c}
#include <stdio.h>

struct Part {
    char name[20];
    int stock;
    double price;
};

double stockValue(struct Part parts[], int count) {
    double total = 0;
    for (int i = 0; i < count; i++) {
        total += parts[i].stock * parts[i].price;
    }
    return total;
}

int main() {
    struct Part parts[4] = {
        {"resistor", 120, 0.5},
        {"LED", 40, 1.25},
        {"servo", 3, 85.0},
        {"relay", 0, 22.0}
    };

    printf("Out of stock:");
    for (int i = 0; i < 4; i++) {
        if (parts[i].stock == 0) {
            printf(" %s", parts[i].name);
        }
    }
    printf("\n");

    int priciest = 0;
    for (int i = 1; i < 4; i++) {
        if (parts[i].price > parts[priciest].price) {
            priciest = i;
        }
    }
    printf("Most expensive: %s at R%.2f\n", parts[priciest].name, parts[priciest].price);
    printf("Value of all stock: R%.2f\n", stockValue(parts, 4));
    return 0;
}
```

::: try
The program reads how many students there are (at most 10), then a name and a mark for each. Sort the list so that the highest mark comes first, and keep students with equal marks in the order they were typed. The printing loop is already written.
:::

::: try-kid
Each box holds a name and a mark.

Sort the boxes so the best mark is first.

Two equal marks keep their order.
:::

```c {role=starter file=ranking.c}
#include <stdio.h>

struct Student {
    char name[20];
    int mark;
};

int main() {
    struct Student list[10];
    int count;

    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        scanf("%s %d", list[i].name, &list[i].mark);
    }

    // Sort list so that the highest mark comes first.

    for (int i = 0; i < count; i++) {
        printf("%s %d\n", list[i].name, list[i].mark);
    }
    return 0;
}
```

```c {role=solution file=ranking.c}
#include <stdio.h>

struct Student {
    char name[20];
    int mark;
};

int main() {
    struct Student list[10];
    int count;

    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        scanf("%s %d", list[i].name, &list[i].mark);
    }

    for (int pass = 0; pass < count - 1; pass++) {
        for (int j = 0; j < count - 1 - pass; j++) {
            if (list[j].mark < list[j + 1].mark) {
                struct Student t = list[j];
                list[j] = list[j + 1];
                list[j + 1] = t;
            }
        }
    }

    for (int i = 0; i < count; i++) {
        printf("%s %d\n", list[i].name, list[i].mark);
    }
    return 0;
}
```
