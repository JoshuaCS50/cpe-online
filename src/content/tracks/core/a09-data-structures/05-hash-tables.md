---
id: core.c.hash-tables
kind: lesson
track: core
unit: a9
order: 5
title: Hash tables
titleKid: A cupboard with numbered drawers
language: c
concepts: [hash-table, hash-function, collision, chaining]
prereqs: [core.c.linked-lists, core.c.string-functions]
est_minutes: 18
checks:
  - type: io-cases
    cases:
      - stdin: ["4", "motor 3", "sensor 8", "relay 2", "valve 5", "sensor"]
        expect: "Stock of sensor: 8\n"
      - stdin: ["4", "motor 3", "sensor 8", "relay 2", "valve 5", "valve"]
        expect: "Stock of valve: 5\n"
      - stdin: ["3", "motor 3", "sensor 8", "relay 2", "servo"]
        expect: "servo is not in the table\n"
      - stdin: ["5", "ab 1", "ba 2", "led 7", "fuse 4", "diode 9", "ba"]
        expect: "Stock of ba: 2\n"
      - stdin: ["5", "ab 1", "ba 2", "led 7", "fuse 4", "diode 9", "ab"]
        expect: "Stock of ab: 1\n"
  - type: code-contains
    pattern: 'strcmp\s*\('
    message: Compares names with strcmp
hints:
  - Only one bucket can hold the name, so start at table[hash(name)] and walk that list with e = e->next until e is NULL.
  - "Compare each entry's name with strcmp(e->name, name) == 0. When they are equal, return e."
  - If the walk reaches NULL without a match, the name is not in the table, so return NULL.
hintsKid:
  - Work out the drawer number with `hash(name)`.
  - Look at each card in that drawer.
  - Return the card with the same name, or NULL.
---
Searching an array or a linked list means looking at the items one by one: on average half of them, O(n). Binary search does better, O(log n), but needs sorted data. A **hash table** finds an item in about the same time whether it holds ten items or a million, which is why it is behind dictionaries in Python, symbol tables in compilers and caches everywhere.

## The idea

Keep an array of **buckets**. A **hash function** turns each key, such as a name, into a bucket number. To store an item, compute its bucket and put it there. To find it again, compute the same bucket and look only there.

```c
#define BUCKETS 7

int hash(char key[]) {
    int h = 0;
    for (int i = 0; key[i] != '\0'; i++) {
        h = (h * 31 + key[i]) % BUCKETS;
    }
    return h;
}
```

A good hash function is quick, always gives the same number for the same key, and spreads different keys evenly over the buckets. Multiplying by a prime such as 31 at each step makes the order of the letters matter, so `ab` and `ba` usually land in different buckets. Taking `% BUCKETS` at every step keeps the number small.

## Collisions

There are far more possible keys than buckets, so sooner or later two keys land in the same bucket. That is a **collision**, and it is normal. The simplest fix is **chaining**: each bucket holds a linked list of the entries that hashed there.

```c
struct Entry {
    char name[20];
    int stock;
    struct Entry *next;
};

struct Entry *table[BUCKETS] = {NULL};    // every bucket starts empty
```

`table` is an array of pointers, one list head per bucket. Adding an entry is the "push at the front" from the linked-list lesson, into one bucket:

```c
void put(struct Entry *table[], char name[], int stock) {
    int b = hash(name);
    struct Entry *e = malloc(sizeof(struct Entry));
    strcpy(e->name, name);
    e->stock = stock;
    e->next = table[b];
    table[b] = e;
}
```

Finding an entry walks only that one bucket's list, comparing names with `strcmp`, because two different names can share a bucket.

## How fast is it?

With `n` entries spread over `B` buckets, each list is about `n / B` long. Keep the buckets roughly as many as the entries and each search looks at one or two entries: O(1) on average. If the hash function is poor and puts everything in one bucket, the table becomes one long linked list, O(n). Real hash tables grow the bucket array when it fills up, and use better hash functions than this one.

What a hash table gives up: the entries are in no useful order. To print them sorted you must sort them first.

## Common mistakes

- **Comparing strings with `==`.** That compares addresses. Use `strcmp(a, b) == 0`.
- **Searching every bucket.** That throws away the whole point; compute the bucket and look only there.
- **Forgetting that buckets start empty.** The list heads must start as `NULL`.

::: kid
Imagine a cupboard with seven drawers.

A rule turns each name into a drawer number.

You put each card in its drawer.

To find a card, use the rule again.

Then look in only that one drawer.

Sometimes two names share a drawer. That is fine.

The cards in a drawer sit in a little chain.
:::

```c {role=example file=buckets.c}
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define BUCKETS 5

struct Entry {
    char name[20];
    int stock;
    struct Entry *next;
};

int hash(char key[]) {
    int h = 0;
    for (int i = 0; key[i] != '\0'; i++) {
        h = (h * 31 + key[i]) % BUCKETS;
    }
    return h;
}

void put(struct Entry *table[], char name[], int stock) {
    int b = hash(name);
    struct Entry *e = malloc(sizeof(struct Entry));
    strcpy(e->name, name);
    e->stock = stock;
    e->next = table[b];
    table[b] = e;
}

int main() {
    struct Entry *table[BUCKETS] = {NULL};
    put(table, "motor", 3);
    put(table, "sensor", 8);
    put(table, "relay", 2);
    put(table, "valve", 5);
    put(table, "fuse", 9);
    put(table, "servo", 1);

    for (int b = 0; b < BUCKETS; b++) {
        printf("Bucket %d:", b);
        for (struct Entry *e = table[b]; e != NULL; e = e->next) {
            printf(" %s(%d)", e->name, e->stock);
        }
        printf("\n");
    }

    for (int b = 0; b < BUCKETS; b++) {
        while (table[b] != NULL) {
            struct Entry *next = table[b]->next;
            free(table[b]);
            table[b] = next;
        }
    }
    return 0;
}
```

::: try
The program fills a hash table with part names and how many are in stock, then reads one name to look up. Finish `find`, which returns a pointer to the entry with that name, or `NULL` if there is none. Look only in the bucket the name hashes to. Some names here share a bucket, so compare the names.
:::

::: try-kid
Work out which drawer the name belongs in.

Look at each card in that drawer.

Give back the card with the same name.

If no card matches, give back NULL.
:::

```c {role=starter file=stock.c}
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define BUCKETS 3

struct Entry {
    char name[20];
    int stock;
    struct Entry *next;
};

int hash(char key[]) {
    int h = 0;
    for (int i = 0; key[i] != '\0'; i++) {
        h = (h * 31 + key[i]) % BUCKETS;
    }
    return h;
}

void put(struct Entry *table[], char name[], int stock) {
    int b = hash(name);
    struct Entry *e = malloc(sizeof(struct Entry));
    strcpy(e->name, name);
    e->stock = stock;
    e->next = table[b];
    table[b] = e;
}

struct Entry *find(struct Entry *table[], char name[]) {
    // Look through the bucket for name and return the matching entry.
    return NULL;
}

int main() {
    struct Entry *table[BUCKETS] = {NULL};
    int count;
    char name[20];
    int stock;

    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        scanf("%s %d", name, &stock);
        put(table, name, stock);
    }

    scanf("%s", name);
    struct Entry *e = find(table, name);
    if (e != NULL) {
        printf("Stock of %s: %d\n", name, e->stock);
    } else {
        printf("%s is not in the table\n", name);
    }
    return 0;
}
```

```c {role=solution file=stock.c}
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define BUCKETS 3

struct Entry {
    char name[20];
    int stock;
    struct Entry *next;
};

int hash(char key[]) {
    int h = 0;
    for (int i = 0; key[i] != '\0'; i++) {
        h = (h * 31 + key[i]) % BUCKETS;
    }
    return h;
}

void put(struct Entry *table[], char name[], int stock) {
    int b = hash(name);
    struct Entry *e = malloc(sizeof(struct Entry));
    strcpy(e->name, name);
    e->stock = stock;
    e->next = table[b];
    table[b] = e;
}

struct Entry *find(struct Entry *table[], char name[]) {
    for (struct Entry *e = table[hash(name)]; e != NULL; e = e->next) {
        if (strcmp(e->name, name) == 0) {
            return e;
        }
    }
    return NULL;
}

int main() {
    struct Entry *table[BUCKETS] = {NULL};
    int count;
    char name[20];
    int stock;

    scanf("%d", &count);
    for (int i = 0; i < count; i++) {
        scanf("%s %d", name, &stock);
        put(table, name, stock);
    }

    scanf("%s", name);
    struct Entry *e = find(table, name);
    if (e != NULL) {
        printf("Stock of %s: %d\n", name, e->stock);
    } else {
        printf("%s is not in the table\n", name);
    }
    return 0;
}
```
