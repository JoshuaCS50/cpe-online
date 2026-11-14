---
id: core.c.what-is-a-program
kind: lesson
track: core
unit: a1
order: 1
title: What is a program?
titleKid: Telling a computer what to do
language: c
concepts: [program, instructions, sequence, bug]
est_minutes: 10
checks:
  - type: stdout-regex
    pattern: '^(Forward\nForward\nTurn right\nForward\nForward|Turn right\nForward\nForward\nTurn left\nForward\nForward)$'
    message: 'The robot must end on the charger without hitting the wall or leaving the grid'
hints:
  - 'Follow the instructions on the map with your finger. Where does the robot end up after "Turn left"?'
  - 'After two Forwards the robot is in the top-left corner, still facing up. The charger is to its right.'
  - 'Change the line printf("Turn left\n"); to printf("Turn right\n");'
hintsKid:
  - 'Move your finger on the map, one step for each line.'
  - 'After two steps up, the charger is on the right.'
  - 'Change `Turn left` to `Turn right`.'
---
A **program** is a list of instructions for a computer, written down so exactly that a machine can follow them without asking any questions.

Every machine in a mechatronics lab runs programs: a washing machine deciding when to drain, a robot arm moving from point to point, a traffic light, the controller in a car's brakes. Someone wrote each of those instructions.

## Computers are fast, exact and have no common sense

A computer can follow billions of instructions every second, and it never gets bored or tired. But it does **exactly** what the instructions say, in **exactly** the order they are written, even when that is obviously silly. Tell a person "walk to the door", and they walk around the chair in the way. Tell a robot "go forward 3 steps", and it walks into the chair.

So writing a program means thinking through every step in advance, including the ones a person would never need to be told.

## Order matters

Instructions run one after another, from the top down. The same instructions in a different order can mean something completely different: "open the valve, then start the pump" is not "start the pump, then open the valve" (which can burst the pipe).

## From instructions to a running program

People write programs in a **programming language**, such as C or Python, which is precise enough for a computer and still readable for people. The text you write is called **source code**. A tool then turns it into something the machine can run, and running it carries out your instructions. On this site, pressing **Run** does all of that for you.

## Bugs

When a program does something you did not want, the computer is almost never at fault: the instructions said to do it. A mistake in a program is called a **bug**, and finding and fixing it is called **debugging**. Everyone writes bugs; good programmers are the ones who expect them and check their work.

## A first look at C

You do not need to understand every symbol yet. In the program below, each `printf` line shows one line of text. They run from top to bottom:

```c
#include <stdio.h>

int main() {
    printf("Forward\n");
    printf("Turn right\n");
    return 0;
}
```

`\n` means "start a new line". Everything else is the frame every C program needs, which the next unit explains.

::: kid
A program is a list of steps for a computer.

The computer is very fast. It never gets tired.

But it does exactly what the steps say.

It cannot guess what you meant.

So the steps must be clear and in the right order.

A mistake in the steps is called a bug.
:::

```c {role=example file=fast.c}
#include <stdio.h>

int main() {
    // The computer adds up 1 + 2 + 3 + ... + 1000 in a blink.
    int total = 0;
    for (int number = 1; number <= 1000; number++) {
        total = total + number;
    }
    printf("1 + 2 + ... + 1000 = %d\n", total);

    // It also follows silly orders exactly.
    printf("Put on shoes\n");
    printf("Put on socks\n");
    return 0;
}
```

::: try
A robot `R` starts in the bottom-left corner of this grid, facing up. It must reach the charger `C` without driving into the wall `#` or off the grid. `Forward` moves one square in the direction it faces; `Turn left` and `Turn right` turn it on the spot.

```
. . C
. # .
R . .
```

The program prints the robot's instructions, but one of them is wrong. Fix it.
:::

::: try-kid
The robot starts at R and looks up.

It must get to the charger C.

It must not hit the wall #.

One step in the list is wrong. Fix it.
:::

```c {role=starter file=robot.c}
#include <stdio.h>

int main() {
    printf("Forward\n");
    printf("Forward\n");
    printf("Turn left\n");
    printf("Forward\n");
    printf("Forward\n");
    return 0;
}
```

```c {role=solution file=robot.c}
#include <stdio.h>

int main() {
    printf("Forward\n");
    printf("Forward\n");
    printf("Turn right\n");
    printf("Forward\n");
    printf("Forward\n");
    return 0;
}
```
