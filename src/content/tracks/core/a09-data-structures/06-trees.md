---
id: core.c.trees
kind: lesson
track: core
unit: a9
order: 6
title: Binary search trees
titleKid: A family tree of numbers
language: c
concepts: [tree, binary-search-tree, traversal, tree-height]
prereqs: [core.c.linked-lists, core.c.recursion]
est_minutes: 18
checks:
  - type: io-cases
    cases:
      - stdin: ["50", "30", "70", "20", "40", "0"]
        expect: "Sorted: 20 30 40 50 70\nHeight: 3\n"
      - stdin: ["8", "3", "10", "1", "6", "14", "4", "7", "13", "0"]
        expect: "Sorted: 1 3 4 6 7 8 10 13 14\nHeight: 4\n"
      - stdin: ["1", "2", "3", "4", "0"]
        expect: "Sorted: 1 2 3 4\nHeight: 4\n"
      - stdin: ["5", "0"]
        expect: "Sorted: 5\nHeight: 1\n"
      - stdin: ["0"]
        expect: "Sorted:\nHeight: 0\n"
hints:
  - Both functions start the same way, if (root == NULL), because an empty tree prints nothing and has height 0.
  - "printInOrder: print everything in the left subtree, then root->value, then everything in the right subtree. Each part is one call: printInOrder(root->left);"
  - "height: work out the height of the left and the right subtree, and return 1 plus the bigger of the two."
hintsKid:
  - An empty tree prints nothing. Its height is 0.
  - Print the left side, then this number, then the right side.
  - Height is 1 plus the taller side.
---
A linked list is a chain: each node points to one next node. A **tree** lets each node point to several. In a **binary tree**, each node has at most two children, a left one and a right one.

```
          50          <- root
        /    \
      30      70
     /  \       \
   20    40      80   <- leaves (no children)
```

The top node is the **root**, nodes with no children are **leaves**, and each child is the root of a smaller tree, its **subtree**. The **height** is the number of nodes on the longest path from the root down to a leaf; the tree above has height 3.

## The search tree rule

A **binary search tree** (BST) keeps one rule at every node: values in the left subtree are smaller, values in the right subtree are bigger or equal. Finding a value is then like binary search: compare with the root, and go left or right. Each step skips a whole subtree.

```c
struct Node {
    int value;
    struct Node *left;
    struct Node *right;
};

int contains(struct Node *root, int value) {
    while (root != NULL) {
        if (value == root->value) {
            return 1;
        }
        root = value < root->value ? root->left : root->right;
    }
    return 0;
}
```

## Adding a value

Go down the same way until you fall off the tree, and put a new node there. Recursion says it neatly: inserting into an empty tree makes a one-node tree; otherwise insert into the correct subtree.

```c
struct Node *insert(struct Node *root, int value) {
    if (root == NULL) {
        struct Node *n = malloc(sizeof(struct Node));
        n->value = value;
        n->left = NULL;
        n->right = NULL;
        return n;
    }
    if (value < root->value) {
        root->left = insert(root->left, value);
    } else {
        root->right = insert(root->right, value);
    }
    return root;
}
```

The function returns the root of the tree it was given, so the caller writes `root = insert(root, 42);`. That way an empty tree (`root == NULL`) works too.

## Visiting every node

Trees are made of smaller trees, so most tree functions are short recursive ones. The pattern is always: handle the empty tree, then combine the answers for the two subtrees.

```c
int count(struct Node *root) {
    if (root == NULL) {
        return 0;
    }
    return 1 + count(root->left) + count(root->right);
}
```

Visiting the left subtree, then the node, then the right subtree is called an **in-order traversal**. In a BST it visits the values in sorted order, because everything smaller is on the left.

Freeing a tree must free both subtrees before the node itself, since their addresses are stored in it.

## Balanced or not

When values arrive in a random order, the tree stays bushy and its height is about log2 of the number of nodes: a million values need only about 20 steps to search. When they arrive already sorted, every new value goes to the right of the last one. The "tree" becomes one long chain, height n, and searching is no faster than a linked list. Self-balancing trees (such as red-black trees) fix this by reshaping themselves; they are a topic for later courses.

## Common mistakes

- **Forgetting the empty-tree case.** `root->left` on a NULL root stops with a null pointer error. Every recursive tree function checks `root == NULL` first.
- **Not keeping the returned root.** `insert(root, 5);` on its own loses the new node when the tree was empty; write `root = insert(root, 5);`.
- **Freeing the node before its children.** Their addresses are gone once the node is freed.

::: kid
A tree of numbers starts with one number at the top.

Each number can have two helpers below it.

Smaller numbers go to the left helper.

Bigger numbers go to the right helper.

To find a number, start at the top.

Go left or right until you find it.
:::

```c {role=example file=tree.c}
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int value;
    struct Node *left;
    struct Node *right;
};

struct Node *insert(struct Node *root, int value) {
    if (root == NULL) {
        struct Node *n = malloc(sizeof(struct Node));
        n->value = value;
        n->left = NULL;
        n->right = NULL;
        return n;
    }
    if (value < root->value) {
        root->left = insert(root->left, value);
    } else {
        root->right = insert(root->right, value);
    }
    return root;
}

int contains(struct Node *root, int value) {
    int steps = 0;
    while (root != NULL) {
        steps++;
        if (value == root->value) {
            printf("Found %d in %d steps\n", value, steps);
            return 1;
        }
        root = value < root->value ? root->left : root->right;
    }
    printf("%d is not there (%d steps)\n", value, steps);
    return 0;
}

int count(struct Node *root) {
    if (root == NULL) {
        return 0;
    }
    return 1 + count(root->left) + count(root->right);
}

void freeTree(struct Node *root) {
    if (root == NULL) {
        return;
    }
    freeTree(root->left);
    freeTree(root->right);
    free(root);
}

int main() {
    int readings[9] = {50, 30, 70, 20, 40, 60, 80, 35, 65};
    struct Node *root = NULL;
    for (int i = 0; i < 9; i++) {
        root = insert(root, readings[i]);
    }
    printf("%d values in the tree\n", count(root));
    contains(root, 65);
    contains(root, 45);
    freeTree(root);
    return 0;
}
```

::: try
The program reads numbers until 0 and inserts each into a binary search tree. Finish two recursive functions: `printInOrder`, which prints every value in sorted order with a space before each, and `height`, which returns the number of nodes on the longest path from the root down. An empty tree prints nothing and has height 0.
:::

::: try-kid
Print all the numbers from smallest to biggest.

Then work out how tall the tree is.

An empty tree has height 0.
:::

```c {role=starter file=bst.c}
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int value;
    struct Node *left;
    struct Node *right;
};

struct Node *insert(struct Node *root, int value) {
    if (root == NULL) {
        struct Node *n = malloc(sizeof(struct Node));
        n->value = value;
        n->left = NULL;
        n->right = NULL;
        return n;
    }
    if (value < root->value) {
        root->left = insert(root->left, value);
    } else {
        root->right = insert(root->right, value);
    }
    return root;
}

void printInOrder(struct Node *root) {
    // Print the values in sorted order, each with a space before it.
}

int height(struct Node *root) {
    // Return the number of nodes on the longest path down.
    return 0;
}

int main() {
    struct Node *root = NULL;
    int value;

    scanf("%d", &value);
    while (value != 0) {
        root = insert(root, value);
        scanf("%d", &value);
    }

    printf("Sorted:");
    printInOrder(root);
    printf("\n");
    printf("Height: %d\n", height(root));
    return 0;
}
```

```c {role=solution file=bst.c}
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int value;
    struct Node *left;
    struct Node *right;
};

struct Node *insert(struct Node *root, int value) {
    if (root == NULL) {
        struct Node *n = malloc(sizeof(struct Node));
        n->value = value;
        n->left = NULL;
        n->right = NULL;
        return n;
    }
    if (value < root->value) {
        root->left = insert(root->left, value);
    } else {
        root->right = insert(root->right, value);
    }
    return root;
}

void printInOrder(struct Node *root) {
    if (root == NULL) {
        return;
    }
    printInOrder(root->left);
    printf(" %d", root->value);
    printInOrder(root->right);
}

int height(struct Node *root) {
    if (root == NULL) {
        return 0;
    }
    int left = height(root->left);
    int right = height(root->right);
    if (left > right) {
        return 1 + left;
    }
    return 1 + right;
}

int main() {
    struct Node *root = NULL;
    int value;

    scanf("%d", &value);
    while (value != 0) {
        root = insert(root, value);
        scanf("%d", &value);
    }

    printf("Sorted:");
    printInOrder(root);
    printf("\n");
    printf("Height: %d\n", height(root));
    return 0;
}
```
