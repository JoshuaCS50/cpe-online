---
id: core.c.stacks-queues
kind: lesson
track: core
unit: a9
order: 4
title: Stacks and queues
titleKid: Piles and lines
language: c
concepts: [stack, queue, lifo, fifo, ring-buffer]
prereqs: [core.c.structs]
est_minutes: 16
checks:
  - type: io-cases
    cases:
      - stdin: ["([]{})"]
        expect: "Balanced\n"
      - stdin: ["{[()()]}"]
        expect: "Balanced\n"
      - stdin: ["([)]"]
        expect: "Not balanced\n"
      - stdin: ["(("]
        expect: "Not balanced\n"
      - stdin: ["())"]
        expect: "Not balanced\n"
      - stdin: ["}"]
        expect: "Not balanced\n"
  - type: code-contains
    pattern: 'push\s*\(\s*&\s*s\s*,'
    message: Uses the stack, with push(&s, ...)
hints:
  - Walk through the text one character at a time. Push every opening bracket onto the stack.
  - "For a closing bracket: if the stack is empty, or pop(&s) is not its matching opening bracket, the text is not balanced. The helper matches(open, close) tells you whether two brackets belong together."
  - At the end the text is balanced only if nothing went wrong and the stack is empty again, s.top == 0.
hintsKid:
  - Put each opening bracket on the pile.
  - For a closing bracket, take the top one off. They must match.
  - At the end the pile must be empty.
---
Two of the most useful data structures are just rules about where items go in and come out.

A **stack** is a pile: the last item put on is the first one taken off (LIFO, last in, first out). Think of a pile of plates. Adding is called **push**, removing is called **pop**, and looking at the top without removing it is **peek**.

A **queue** is a line: the first item in is the first one out (FIFO, first in, first out). Think of people waiting at a till. Items are added at the back (**enqueue**) and removed from the front (**dequeue**).

## A stack in C

An array and a counter are enough. `top` is the number of items, which is also the index where the next one goes:

```c
#define MAX 20

struct Stack {
    char items[MAX];
    int top;
};

void push(struct Stack *s, char c) {
    s->items[s->top] = c;
    s->top++;
}

char pop(struct Stack *s) {
    s->top--;
    return s->items[s->top];
}
```

The functions take a pointer, so they change the caller's stack. Two checks keep a stack safe: pushing onto a full stack (`top == MAX`) is **overflow**, and popping an empty one (`top == 0`) is **underflow**. Real code checks before doing either.

Stacks are everywhere once you look: the undo button keeps your last actions on a stack, and the computer keeps function calls on one, which is why it is called the call stack (unit A8). Endless recursion is literally a stack overflow.

## A queue in C: the ring buffer

A queue could shift every item forward after each dequeue, but that is slow. Instead, keep the items where they are and move two positions, the front and the back, wrapping round to 0 at the end of the array with `%`. This is a **ring buffer** (or circular buffer):

```c
#define SIZE 8

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
```

Check `count == SIZE` before adding and `count == 0` before removing. Ring buffers are standard in embedded systems: a serial port receives bytes faster than the main program can handle them, so an interrupt puts each byte into a ring buffer and the program takes them out when it is ready, in the order they arrived.

## Matching brackets

A classic use of a stack is checking that brackets are balanced, as a compiler does with your code. Go through the text from left to right:

- an opening bracket `(`, `[` or `{` is pushed;
- a closing bracket must match the bracket on top of the stack, which is popped;
- at the end, the stack must be empty.

`([)]` fails because when `)` arrives, the top of the stack is `[`. `((` fails because two brackets are still waiting at the end.

## Common mistakes

- **Popping an empty stack.** `top` becomes -1 and the next access is outside the array. Check `top > 0` first.
- **Forgetting to wrap.** In a ring buffer, every position change needs `% SIZE`.
- **Passing the struct instead of its address.** `push(s, c)` would change a copy; write `push(&s, c)`.

::: kid
A stack is a pile of plates.

You put a plate on top. You take a plate from the top.

The last plate on is the first plate off.

A queue is a line at the shop.

New people join at the back.

The person at the front goes first.
:::

```c {role=example file=buffer.c}
#include <stdio.h>

#define SIZE 4

struct Queue {
    int items[SIZE];
    int front;
    int count;
};

int enqueue(struct Queue *q, int value) {
    if (q->count == SIZE) {
        return 0;
    }
    q->items[(q->front + q->count) % SIZE] = value;
    q->count++;
    return 1;
}

int dequeue(struct Queue *q) {
    int value = q->items[q->front];
    q->front = (q->front + 1) % SIZE;
    q->count--;
    return value;
}

int main() {
    struct Queue rx = {{0}, 0, 0};

    // Bytes arrive from a sensor faster than we handle them.
    for (int b = 1; b <= 5; b++) {
        if (!enqueue(&rx, b * 11)) {
            printf("Buffer full, byte %d lost\n", b * 11);
        }
    }

    printf("Handled: %d\n", dequeue(&rx));
    printf("Handled: %d\n", dequeue(&rx));
    enqueue(&rx, 66);

    printf("Still waiting:");
    while (rx.count > 0) {
        printf(" %d", dequeue(&rx));
    }
    printf("\n");
    return 0;
}
```

::: try
The program reads one line of brackets, such as `([]{})`, with no spaces. Use the stack to decide whether every bracket is closed by the right partner in the right order, and set `ok` to 0 if not. `push`, `pop` and `matches` are written for you.
:::

::: try-kid
Each opening bracket waits for its partner.

The newest one waiting must close first.

Use the pile to check this.
:::

```c {role=starter file=brackets.c}
#include <stdio.h>
#include <string.h>

#define MAX 30

struct Stack {
    char items[MAX];
    int top;
};

void push(struct Stack *s, char c) {
    s->items[s->top] = c;
    s->top++;
}

char pop(struct Stack *s) {
    s->top--;
    return s->items[s->top];
}

int matches(char open, char close) {
    return (open == '(' && close == ')') || (open == '[' && close == ']') || (open == '{' && close == '}');
}

int main() {
    char text[MAX];
    struct Stack s;
    s.top = 0;
    int ok = 1;

    scanf("%s", text);

    // Check the brackets in text with the stack s.

    if (ok) {
        printf("Balanced\n");
    } else {
        printf("Not balanced\n");
    }
    return 0;
}
```

```c {role=solution file=brackets.c}
#include <stdio.h>
#include <string.h>

#define MAX 30

struct Stack {
    char items[MAX];
    int top;
};

void push(struct Stack *s, char c) {
    s->items[s->top] = c;
    s->top++;
}

char pop(struct Stack *s) {
    s->top--;
    return s->items[s->top];
}

int matches(char open, char close) {
    return (open == '(' && close == ')') || (open == '[' && close == ']') || (open == '{' && close == '}');
}

int main() {
    char text[MAX];
    struct Stack s;
    s.top = 0;
    int ok = 1;

    scanf("%s", text);

    for (int i = 0; i < (int) strlen(text) && ok; i++) {
        char c = text[i];
        if (c == '(' || c == '[' || c == '{') {
            push(&s, c);
        } else if (s.top == 0 || !matches(pop(&s), c)) {
            ok = 0;
        }
    }
    if (s.top != 0) {
        ok = 0;
    }

    if (ok) {
        printf("Balanced\n");
    } else {
        printf("Not balanced\n");
    }
    return 0;
}
```
