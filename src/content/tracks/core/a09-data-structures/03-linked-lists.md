---
id: core.c.linked-lists
kind: lesson
track: core
unit: a9
order: 3
title: Linked lists
titleKid: A chain of boxes holding hands
language: c
concepts: [linked-list, node, self-referential-struct, traversal]
prereqs: [core.c.arrays-of-structs, core.c.malloc]
est_minutes: 18
checks:
  - type: io-cases
    cases:
      - stdin: ["3", "7", "9", "0"]
        expect: "List: 9 7 3\nCount: 3\n"
      - stdin: ["5", "0"]
        expect: "List: 5\nCount: 1\n"
      - stdin: ["0"]
        expect: "List:\nCount: 0\n"
      - stdin: ["1", "2", "3", "4", "5", "0"]
        expect: "List: 5 4 3 2 1\nCount: 5\n"
  - type: code-contains
    pattern: 'malloc\s*\(\s*sizeof\s*\(\s*struct\s+Node\s*\)\s*\)'
    message: Makes each node with malloc(sizeof(struct Node))
hints:
  - "In push: struct Node *n = malloc(sizeof(struct Node)); then n->value = value; and n->next = head; and finally return n; because the new node is the new head."
  - "To print, walk with a pointer: for (struct Node *p = head; p != NULL; p = p->next) and print p->value inside."
  - Count the nodes in the same walk, adding 1 to count for each node.
hintsKid:
  - Get a new box with malloc. Put the number in it.
  - Its arrow points at the old first box. Return the new box.
  - Walk the chain with `p = p->next` until p is NULL.
---
An array keeps its elements side by side in one block, and its size is fixed when it is made. Adding a value at the front means shifting everything else up one place. A **linked list** stores each value in its own small struct, called a **node**, and each node holds the address of the next one. The nodes can be anywhere in memory; the addresses chain them together.

## A node points at a node

```c
struct Node {
    int value;
    struct Node *next;
};
```

A struct cannot contain itself (it would be infinitely big), but it can contain a **pointer** to its own type. `next` holds the address of the following node, and the last node's `next` is `NULL`, which marks the end. The program keeps one pointer to the first node, usually called `head`. An empty list is simply `head == NULL`.

```
head -> [ 9 | next ] -> [ 7 | next ] -> [ 3 | NULL ]
```

## Walking the list

There are no indexes. To visit every node, start at `head` and follow `next` until you reach `NULL`:

```c
for (struct Node *p = head; p != NULL; p = p->next) {
    printf("%d ", p->value);
}
```

`p->value` reads the value of the node `p` points at. Every list function is built on this walk: counting nodes, adding them up, searching for a value.

## Adding at the front

New nodes come from `malloc`, because they must outlive the function that makes them. Adding at the front takes three steps and does not depend on the length of the list:

```c
struct Node *push(struct Node *head, int value) {
    struct Node *n = malloc(sizeof(struct Node));
    n->value = value;
    n->next = head;      // the old first node comes after the new one
    return n;            // the new node is the new head
}

head = push(head, 3);
```

The order matters: link the new node to the old head before `head` changes, or the rest of the list is lost.

## Removing and freeing

To take out the node after `p`, skip over it, then free it:

```c
struct Node *gone = p->next;
p->next = gone->next;
free(gone);
```

When the program is done with the list, every node must be freed. Save `next` before freeing a node, because its members cannot be read after `free`:

```c
while (head != NULL) {
    struct Node *next = head->next;
    free(head);
    head = next;
}
```

## Array or linked list?

| | Array | Linked list |
|---|---|---|
| Reach element `i` | instant: `a[i]` | walk `i` steps |
| Add or remove at the front | shift everything | change two pointers |
| Size | fixed when made | grows one node at a time |
| Extra memory | none | one pointer per node |

Lists shine when items are added and removed often and are visited in order, such as a queue of messages waiting to be sent. Arrays win when you need to jump to any position, which is why binary search needs an array.

## Common mistakes

- **Following a NULL pointer.** `head->value` on an empty list stops with a null pointer error. Check `head != NULL` first.
- **Losing the rest of the list.** Changing `head` before linking the new node to it leaves the old nodes unreachable.
- **Using a node after freeing it.** Read `next` first, then free.

::: kid
Think of children in a line, holding hands.

Each child holds a number and one hand of the next child.

The last child has a free hand. That is NULL.

To visit everyone, start at the front and follow the hands.

A new child can join at the front.

They take the hand of the old first child.

Now the new child is first.
:::

```c {role=example file=chain.c}
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int value;
    struct Node *next;
};

struct Node *push(struct Node *head, int value) {
    struct Node *n = malloc(sizeof(struct Node));
    n->value = value;
    n->next = head;
    return n;
}

void printList(struct Node *head) {
    printf("List:");
    for (struct Node *p = head; p != NULL; p = p->next) {
        printf(" %d", p->value);
    }
    printf("\n");
}

int main() {
    struct Node *head = NULL;
    head = push(head, 30);
    head = push(head, 20);
    head = push(head, 10);
    printList(head);

    // Take out the node after the first one.
    struct Node *gone = head->next;
    head->next = gone->next;
    free(gone);
    printList(head);

    while (head != NULL) {
        struct Node *next = head->next;
        free(head);
        head = next;
    }
    return 0;
}
```

::: try
The program reads numbers until it reads 0, and adds each one at the front of a linked list, so the list ends up in reverse order. Finish `push` so that it makes a new node with `malloc` and puts it at the front. Then, in `main`, walk the list to print every value and count the nodes. Freeing the list is already done.
:::

::: try-kid
Each number goes in a new box at the front.

Finish `push` so it adds the box.

Then walk the chain. Print each number and count the boxes.
:::

```c {role=starter file=stack.c}
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int value;
    struct Node *next;
};

struct Node *push(struct Node *head, int value) {
    // Make a new node holding value, put it in front of head, return it.
    return head;
}

void freeList(struct Node *head) {
    while (head != NULL) {
        struct Node *next = head->next;
        free(head);
        head = next;
    }
}

int main() {
    struct Node *head = NULL;
    int value;
    int count = 0;

    scanf("%d", &value);
    while (value != 0) {
        head = push(head, value);
        scanf("%d", &value);
    }

    printf("List:");
    // Print " " and the value of every node, and count the nodes.
    printf("\n");
    printf("Count: %d\n", count);

    freeList(head);
    return 0;
}
```

```c {role=solution file=stack.c}
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int value;
    struct Node *next;
};

struct Node *push(struct Node *head, int value) {
    struct Node *n = malloc(sizeof(struct Node));
    n->value = value;
    n->next = head;
    return n;
}

void freeList(struct Node *head) {
    while (head != NULL) {
        struct Node *next = head->next;
        free(head);
        head = next;
    }
}

int main() {
    struct Node *head = NULL;
    int value;
    int count = 0;

    scanf("%d", &value);
    while (value != 0) {
        head = push(head, value);
        scanf("%d", &value);
    }

    printf("List:");
    for (struct Node *p = head; p != NULL; p = p->next) {
        printf(" %d", p->value);
        count++;
    }
    printf("\n");
    printf("Count: %d\n", count);

    freeList(head);
    return 0;
}
```
