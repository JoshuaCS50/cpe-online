// Structs, which upstream JSCPP parsed but could not use: every struct type
// was "not defined". scripts/patch-jscpp.mjs keeps each struct's member list
// and builds the type from it. These programs are the ones unit A9 relies on:
// members, { } starting values, copies, typedef, structs in and out of
// functions, ->, arrays of structs, sizeof, and linked lists on the heap.

import { describe, expect, it } from "vitest";
import { escapeSpacesInStringLiterals } from "../../src/runners/c/prepare-source";
import { rawJscppError, runCInteractive } from "../helpers/jscpp";

function run(code: string, stdin: string[] = []): string {
  return runCInteractive(escapeSpacesInStringLiterals(code), stdin).stdout;
}

function error(code: string): string | null {
  return rawJscppError(escapeSpacesInStringLiterals(code));
}

const POINT = String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Point {
    int x;
    int y;
};
`;

describe("struct basics", () => {
  it("stores and reads members", () => {
    expect(
      run(POINT + String.raw`
int main() {
    struct Point p;
    p.x = 3;
    p.y = -4;
    printf("%d %d\n", p.x, p.y);
    return 0;
}`),
    ).toBe("3 -4\n");
  });

  it("starts members at 0 when nothing is given", () => {
    expect(
      run(POINT + String.raw`
int main() {
    struct Point p;
    printf("%d %d\n", p.x, p.y);
    return 0;
}`),
    ).toBe("0 0\n");
  });

  it("takes starting values from a { } list, filling the rest with 0", () => {
    expect(
      run(POINT + String.raw`
int main() {
    int k = 7;
    struct Point a = {1, 2};
    struct Point b = {k * 2};
    struct Point c = {0};
    printf("%d %d %d %d %d %d\n", a.x, a.y, b.x, b.y, c.x, c.y);
    return 0;
}`),
    ).toBe("1 2 14 0 0 0\n");
  });

  it("accepts several members on one line", () => {
    expect(
      run(String.raw`#include <stdio.h>
struct P {
    int x, y;
    double w;
};
int main() {
    struct P p = {-3, 'A', 1.5};
    printf("%d %d %.1f\n", p.x, p.y, p.w);
    return 0;
}`),
    ).toBe("-3 65 1.5\n");
  });

  it("copies a struct with =, so changing the copy leaves the original alone", () => {
    expect(
      run(POINT + String.raw`
int main() {
    struct Point a = {1, 2};
    struct Point b = a;
    struct Point c;
    c = a;
    b.x = 50;
    c.y = 60;
    printf("%d %d | %d %d | %d %d\n", a.x, a.y, b.x, b.y, c.x, c.y);
    return 0;
}`),
    ).toBe("1 2 | 50 2 | 1 60\n");
  });

  it("works with members that are other types: double, char, pointers", () => {
    expect(
      run(String.raw`#include <stdio.h>
struct Reading {
    char sensor;
    double value;
    int *count;
};
int main() {
    int n = 3;
    struct Reading r = {'T', 21.5, &n};
    *r.count = *r.count + 1;
    printf("%c %.1f %d\n", r.sensor, r.value, n);
    return 0;
}`),
    ).toBe("T 21.5 4\n");
  });

  it("supports typedef, with and without a struct name", () => {
    expect(
      run(String.raw`#include <stdio.h>
typedef struct {
    int x;
    int y;
} Point;
typedef struct Student {
    int id;
    double mark;
} Student;
int main() {
    Point p = {5, 6};
    Student s = {42, 77.5};
    struct Student t = s;
    printf("%d %d %d %.1f\n", p.x, p.y, t.id, t.mark);
    return 0;
}`),
    ).toBe("5 6 42 77.5\n");
  });

  it("allows a struct inside a struct", () => {
    expect(
      run(POINT + String.raw`
struct Rect {
    struct Point corner;
    int width;
    int height;
};
int main() {
    struct Rect r = {{1, 2}, 10, 20};
    struct Rect s = r;
    s.corner.x = 99;
    r.height = r.height + 1;
    printf("%d %d %d %d | %d\n", r.corner.x, r.corner.y, r.width, r.height, s.corner.x);
    return 0;
}`),
    ).toBe("1 2 10 21 | 99\n");
  });

  it("defines a struct and a variable in one go, and allows globals", () => {
    expect(
      run(String.raw`#include <stdio.h>
struct Counter {
    int hits;
} total;
int main() {
    struct Counter mine = {4};
    total.hits = total.hits + mine.hits;
    total.hits++;
    printf("%d\n", total.hits);
    return 0;
}`),
    ).toBe("5\n");
  });
});

describe("text in structs", () => {
  it("holds a string in a char array member", () => {
    expect(
      run(String.raw`#include <stdio.h>
#include <string.h>
struct Student {
    char name[20];
    int age;
};
int main() {
    struct Student a = {"Sipho", 19};
    struct Student b;
    strcpy(b.name, "Lerato");
    b.age = 20;
    struct Student c = a;
    c.name[0] = 'Z';
    printf("%s %d, %s %d, %s (%d letters)\n", a.name, a.age, b.name, b.age, c.name, (int) strlen(c.name));
    return 0;
}`),
    ).toBe("Sipho 19, Lerato 20, Zipho (5 letters)\n");
  });

  it("reads members with scanf", () => {
    expect(
      run(
        String.raw`#include <stdio.h>
struct Student {
    char name[20];
    int age;
    double mark;
};
int main() {
    struct Student s;
    scanf("%s %d %lf", s.name, &s.age, &s.mark);
    printf("%s is %d and got %.1f\n", s.name, s.age, s.mark);
    return 0;
}`,
        ["Thandi 18 81.5"],
      ),
    ).toBe("Thandi is 18 and got 81.5\n");
  });

  it("copies a struct whose name was read with scanf", () => {
    expect(
      run(
        String.raw`#include <stdio.h>
struct Student {
    char name[8];
    int mark;
};
int main() {
    struct Student a;
    scanf("%s %d", a.name, &a.mark);
    struct Student b = a;
    a.name[0] = 'X';
    printf("%s %d %s\n", b.name, b.mark, a.name);
    return 0;
}`,
        ["Ann 70"],
      ),
    ).toBe("Ann 70 Xnn\n");
  });

  it("lets scanf write a word part-way into an array", () => {
    expect(
      run(
        String.raw`#include <stdio.h>
int main() {
    char buf[10] = "ab";
    scanf("%s", buf + 2);
    printf("%s\n", buf);
    return 0;
}`,
        ["cde"],
      ),
    ).toBe("abcde\n");
  });
});

describe("structs and functions", () => {
  it("passes a copy, so the function cannot change the caller's struct", () => {
    expect(
      run(POINT + String.raw`
void moveRight(struct Point p) {
    p.x = p.x + 10;
    printf("inside: %d\n", p.x);
}
int main() {
    struct Point a = {1, 2};
    moveRight(a);
    printf("outside: %d\n", a.x);
    return 0;
}`),
    ).toBe("inside: 11\noutside: 1\n");
  });

  it("returns a struct", () => {
    expect(
      run(POINT + String.raw`
struct Point makePoint(int x, int y) {
    struct Point p;
    p.x = x;
    p.y = y;
    return p;
}
int main() {
    struct Point a = makePoint(3, 4);
    struct Point b;
    b = makePoint(a.y, a.x);
    printf("%d %d %d %d %d\n", a.x, a.y, b.x, b.y, makePoint(8, 9).y);
    return 0;
}`),
    ).toBe("3 4 4 3 9\n");
  });

  it("changes the caller's struct through a pointer and ->", () => {
    expect(
      run(POINT + String.raw`
void moveRight(struct Point *p) {
    p->x = p->x + 10;
    (*p).y = (*p).y * 2;
}
int main() {
    struct Point a = {1, 2};
    struct Point *q = &a;
    moveRight(&a);
    q->x++;
    printf("%d %d %d\n", a.x, a.y, q->y);
    return 0;
}`),
    ).toBe("12 4 4\n");
  });

  it("works with a prototype above main", () => {
    expect(
      run(POINT + String.raw`
int area(struct Point corner);
int main() {
    struct Point c = {3, 5};
    printf("%d\n", area(c));
    return 0;
}
int area(struct Point corner) {
    return corner.x * corner.y;
}`),
    ).toBe("15\n");
  });
});

describe("arrays of structs", () => {
  const STUDENT = String.raw`#include <stdio.h>
#include <string.h>

struct Student {
    char name[20];
    int mark;
};
`;

  it("takes a { } list of { } lists", () => {
    expect(
      run(STUDENT + String.raw`
int main() {
    struct Student class[3] = {{"Ann", 70}, {"Ben", 55}, {"Cara", 91}};
    for (int i = 0; i < 3; i++) {
        printf("%s %d\n", class[i].name, class[i].mark);
    }
    return 0;
}`),
    ).toBe("Ann 70\nBen 55\nCara 91\n");
  });

  it("fills missing elements with zeros", () => {
    expect(
      run(STUDENT + String.raw`
int main() {
    struct Student class[3] = {{"Ann", 70}};
    struct Student empty[2];
    printf("[%s] %d [%s] %d %d\n", class[1].name, class[2].mark, empty[1].name, empty[0].mark, (int) strlen(class[0].name));
    return 0;
}`),
    ).toBe("[] 0 [] 0 3\n");
  });

  it("reads each element with scanf and finds the best", () => {
    expect(
      run(
        STUDENT + String.raw`
int main() {
    struct Student class[3];
    for (int i = 0; i < 3; i++) {
        scanf("%s %d", class[i].name, &class[i].mark);
    }
    int best = 0;
    for (int i = 1; i < 3; i++) {
        if (class[i].mark > class[best].mark) {
            best = i;
        }
    }
    printf("Best: %s with %d\n", class[best].name, class[best].mark);
    return 0;
}`,
        ["Ann 70", "Ben 95", "Cara 91"],
      ),
    ).toBe("Best: Ben with 95\n");
  });

  it("passes the array to a function, which can change elements", () => {
    expect(
      run(STUDENT + String.raw`
void addBonus(struct Student s[], int n) {
    for (int i = 0; i < n; i++) {
        s[i].mark = s[i].mark + 5;
    }
}
double average(struct Student *s, int n) {
    int sum = 0;
    for (int i = 0; i < n; i++) {
        sum += s[i].mark;
    }
    return (double) sum / n;
}
int main() {
    struct Student class[2] = {{"Ann", 70}, {"Ben", 55}};
    addBonus(class, 2);
    printf("%d %d %.1f\n", class[0].mark, class[1].mark, average(class, 2));
    return 0;
}`),
    ).toBe("75 60 67.5\n");
  });

  it("swaps whole elements, which sorting needs", () => {
    expect(
      run(STUDENT + String.raw`
int main() {
    struct Student class[3] = {{"Ann", 70}, {"Ben", 55}, {"Cara", 91}};
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2 - i; j++) {
            if (class[j].mark < class[j + 1].mark) {
                struct Student t = class[j];
                class[j] = class[j + 1];
                class[j + 1] = t;
            }
        }
    }
    printf("%s %s %s\n", class[0].name, class[1].name, class[2].name);
    return 0;
}`),
    ).toBe("Cara Ann Ben\n");
  });

  it("points into the array with & and ->", () => {
    expect(
      run(STUDENT + String.raw`
int main() {
    struct Student class[2] = {{"Ann", 70}, {"Ben", 55}};
    struct Student *p = &class[1];
    p->mark = 60;
    p = class;
    printf("%s %d %d\n", p->name, p->mark, class[1].mark);
    return 0;
}`),
    ).toBe("Ann 70 60\n");
  });
});

describe("sizeof a struct", () => {
  it("adds up the members with padding", () => {
    expect(
      run(String.raw`#include <stdio.h>
struct A { int x; int y; };
struct B { char c; int x; };
struct C { char name[20]; int age; };
struct D { char c; double d; };
int main() {
    printf("%d %d %d %d\n", (int) sizeof(struct A), (int) sizeof(struct B), (int) sizeof(struct C), (int) sizeof(struct D));
    return 0;
}`),
    ).toBe("8 8 24 16\n");
  });
});

describe("linked lists", () => {
  const NODE = String.raw`#include <stdio.h>
#include <stdlib.h>

struct Node {
    int value;
    struct Node *next;
};
`;

  it("links nodes by hand with &", () => {
    expect(
      run(NODE + String.raw`
int main() {
    struct Node c = {30, NULL};
    struct Node b = {20, &c};
    struct Node a = {10, NULL};
    a.next = &b;
    for (struct Node *p = &a; p != NULL; p = p->next) {
        printf("%d ", p->value);
    }
    printf("\n");
    printf("%d\n", a.next->next->value);
    return 0;
}`),
    ).toBe("10 20 30 \n30\n");
  });

  it("builds a list on the heap, counts it and frees it", () => {
    expect(
      run(NODE + String.raw`
struct Node *push(struct Node *head, int value) {
    struct Node *n = malloc(sizeof(struct Node));
    if (n == NULL) {
        return head;
    }
    n->value = value;
    n->next = head;
    return n;
}
int length(struct Node *head) {
    int count = 0;
    while (head != NULL) {
        count++;
        head = head->next;
    }
    return count;
}
void freeList(struct Node *head) {
    while (head != NULL) {
        struct Node *next = head->next;
        free(head);
        head = next;
    }
}
int main() {
    struct Node *list = NULL;
    for (int i = 1; i <= 4; i++) {
        list = push(list, i * 10);
    }
    printf("%d nodes:", length(list));
    for (struct Node *p = list; p != NULL; p = p->next) {
        printf(" %d", p->value);
    }
    printf("\n");
    freeList(list);
    list = NULL;
    printf("%d\n", length(list));
    return 0;
}`),
    ).toBe("4 nodes: 40 30 20 10\n0\n");
  });

  it("appends at the tail with a typedef node and a cast", () => {
    expect(
      run(String.raw`#include <stdio.h>
#include <stdlib.h>
typedef struct Node {
    int value;
    struct Node *next;
} Node;
void append(Node **head, int value) {
    Node *n = (Node *) malloc(sizeof(Node));
    n->value = value;
    n->next = NULL;
    if (*head == NULL) {
        *head = n;
        return;
    }
    Node *p = *head;
    while (p->next != NULL) {
        p = p->next;
    }
    p->next = n;
}
int main() {
    Node *list = NULL;
    append(&list, 1);
    append(&list, 2);
    append(&list, 3);
    for (Node *p = list; p; p = p->next) {
        printf("%d", p->value);
    }
    printf("\n");
    return 0;
}`),
    ).toBe("123\n");
  });

  it("removes a node from the middle", () => {
    expect(
      run(NODE + String.raw`
int main() {
    struct Node *c = malloc(sizeof(struct Node));
    struct Node *b = malloc(sizeof(struct Node));
    struct Node *a = malloc(sizeof(struct Node));
    a->value = 1; a->next = b;
    b->value = 2; b->next = c;
    c->value = 3; c->next = NULL;
    a->next = b->next;
    free(b);
    for (struct Node *p = a; p != NULL; p = p->next) {
        printf("%d", p->value);
    }
    printf("\n");
    free(a);
    free(c);
    return 0;
}`),
    ).toBe("13\n");
  });

  it("stops with the null pointer error when following past the end", () => {
    const message = error(NODE + String.raw`
int main() {
    struct Node *head = NULL;
    printf("%d\n", head->value);
    return 0;
}`);
    expect(message).toMatch(/null pointer/);
  });

  it("stops with the use-after-free error when a freed node is used", () => {
    const message = error(NODE + String.raw`
int main() {
    struct Node *n = malloc(sizeof(struct Node));
    n->value = 5;
    free(n);
    printf("%d\n", n->value);
    return 0;
}`);
    expect(message).toMatch(/use after free/);
  });
});

describe("arrays of pointers", () => {
  it("keeps the * on each element, which upstream dropped", () => {
    expect(
      run(String.raw`#include <stdio.h>
int main() {
    int x = 1;
    int y = 2;
    int *p[3] = {&x, &y};
    *p[1] = 20;
    char *names[3] = {"Ann", "Ben", "Cara"};
    printf("%d %d %d %s %c\n", y, *p[0], p[2] == NULL, names[2], names[1][0]);
    return 0;
}`),
    ).toBe("20 1 1 Cara B\n");
  });

  it("holds pointers to structs, all NULL at first", () => {
    expect(
      run(POINT + String.raw`
int main() {
    struct Point a = {1, 2};
    struct Point *slots[4] = {NULL};
    struct Point *more[2];
    slots[2] = &a;
    slots[2]->y = 9;
    int empty = 0;
    for (int i = 0; i < 4; i++) {
        if (slots[i] == NULL) {
            empty++;
        }
    }
    printf("%d %d %d\n", empty, a.y, more[1] == NULL);
    return 0;
}`),
    ).toBe("3 9 1\n");
  });
});

describe("data structures built from structs", () => {
  it("keeps a stack in a struct with an array member, through a pointer", () => {
    expect(
      run(String.raw`#include <stdio.h>
#define MAX 5
struct Stack {
    int items[MAX];
    int top;
};
int push(struct Stack *s, int value) {
    if (s->top == MAX) {
        return 0;
    }
    s->items[s->top] = value;
    s->top++;
    return 1;
}
int pop(struct Stack *s) {
    s->top--;
    return s->items[s->top];
}
int main() {
    struct Stack s;
    s.top = 0;
    for (int i = 1; i <= 6; i++) {
        if (!push(&s, i * 10)) {
            printf("full at %d\n", i * 10);
        }
    }
    while (s.top > 0) {
        printf("%d ", pop(&s));
    }
    printf("\n");
    return 0;
}`),
    ).toBe("full at 60\n50 40 30 20 10 \n");
  });

  it("runs a circular queue with % to wrap around", () => {
    expect(
      run(String.raw`#include <stdio.h>
#define SIZE 4
struct Queue {
    int items[SIZE];
    int front;
    int count;
};
void enqueue(struct Queue *q, int value) {
    q->items[(q->front + q->count) % SIZE] = value;
    q->count++;
}
int dequeue(struct Queue *q) {
    int value = q->items[q->front];
    q->front = (q->front + 1) % SIZE;
    q->count--;
    return value;
}
int main() {
    struct Queue q = {{0}, 0, 0};
    enqueue(&q, 1);
    enqueue(&q, 2);
    enqueue(&q, 3);
    printf("%d ", dequeue(&q));
    printf("%d ", dequeue(&q));
    enqueue(&q, 4);
    enqueue(&q, 5);
    enqueue(&q, 6);
    while (q.count > 0) {
        printf("%d ", dequeue(&q));
    }
    printf("\n");
    return 0;
}`),
    ).toBe("1 2 3 4 5 6 \n");
  });

  it("builds a hash table from an array of list heads", () => {
    expect(
      run(String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define BUCKETS 5
struct Entry {
    char key[20];
    int value;
    struct Entry *next;
};
int hash(char key[]) {
    int h = 0;
    for (int i = 0; key[i] != '\0'; i++) {
        h = (h * 31 + key[i]) % BUCKETS;
    }
    return h;
}
void put(struct Entry *table[], char key[], int value) {
    int b = hash(key);
    for (struct Entry *e = table[b]; e != NULL; e = e->next) {
        if (strcmp(e->key, key) == 0) {
            e->value = value;
            return;
        }
    }
    struct Entry *e = malloc(sizeof(struct Entry));
    strcpy(e->key, key);
    e->value = value;
    e->next = table[b];
    table[b] = e;
}
int get(struct Entry *table[], char key[], int *found) {
    for (struct Entry *e = table[hash(key)]; e != NULL; e = e->next) {
        if (strcmp(e->key, key) == 0) {
            *found = 1;
            return e->value;
        }
    }
    *found = 0;
    return 0;
}
int main() {
    struct Entry *table[BUCKETS] = {NULL};
    put(table, "motor", 3);
    put(table, "sensor", 8);
    put(table, "relay", 2);
    put(table, "motor", 4);
    int found;
    int v = get(table, "motor", &found);
    printf("motor %d %d\n", v, found);
    get(table, "valve", &found);
    printf("valve %d\n", found);
    printf("buckets %d %d\n", hash("motor"), hash("sensor"));
    int used = 0;
    for (int b = 0; b < BUCKETS; b++) {
        for (struct Entry *e = table[b]; e != NULL; e = e->next) {
            used++;
        }
    }
    printf("%d entries\n", used);
    return 0;
}`),
    ).toMatch(/^motor 4 1\nvalve 0\nbuckets \d \d\n3 entries\n$/);
  });

  it("builds a binary search tree with recursion", () => {
    expect(
      run(String.raw`#include <stdio.h>
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
void inOrder(struct Node *root) {
    if (root == NULL) {
        return;
    }
    inOrder(root->left);
    printf("%d ", root->value);
    inOrder(root->right);
}
int height(struct Node *root) {
    if (root == NULL) {
        return 0;
    }
    int l = height(root->left);
    int r = height(root->right);
    return 1 + (l > r ? l : r);
}
int contains(struct Node *root, int value) {
    while (root != NULL) {
        if (value == root->value) {
            return 1;
        }
        root = value < root->value ? root->left : root->right;
    }
    return 0;
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
    struct Node *root = NULL;
    int values[7] = {50, 30, 70, 20, 40, 60, 80};
    for (int i = 0; i < 7; i++) {
        root = insert(root, values[i]);
    }
    inOrder(root);
    printf("\nheight %d, has 60: %d, has 65: %d\n", height(root), contains(root, 60), contains(root, 65));
    freeTree(root);
    return 0;
}`),
    ).toBe("20 30 40 50 60 70 80 \nheight 3, has 60: 1, has 65: 0\n");
  });
});

describe("struct mistakes give clear errors", () => {
  it("names a member the struct does not have", () => {
    expect(
      error(POINT + String.raw`
int main() {
    struct Point p;
    p.z = 1;
    return 0;
}`),
    ).toMatch(/struct Point has no member named z/);
  });

  it("suggests -> when . is used on a pointer", () => {
    expect(
      error(POINT + String.raw`
int main() {
    struct Point p;
    struct Point *q = &p;
    q.x = 1;
    return 0;
}`),
    ).toMatch(/use -> instead of \./);
  });

  it("reports a struct that was never defined", () => {
    expect(
      error(String.raw`#include <stdio.h>
int main() {
    struct Missing m;
    return 0;
}`),
    ).toMatch(/struct Missing is not defined/);
  });

  it("refuses too many starting values", () => {
    expect(
      error(POINT + String.raw`
int main() {
    struct Point p = {1, 2, 3};
    return 0;
}`),
    ).toMatch(/too many values/);
  });

  it("forgets a struct between programs", () => {
    run(POINT + "int main() {\n    struct Point p;\n    return 0;\n}");
    expect(
      error(String.raw`#include <stdio.h>
int main() {
    struct Point p;
    return 0;
}`),
    ).toMatch(/struct Point is not defined/);
  });
});
