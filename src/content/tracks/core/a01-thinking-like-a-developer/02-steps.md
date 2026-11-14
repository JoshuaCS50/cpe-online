---
id: core.c.steps
kind: lesson
track: core
unit: a1
order: 2
title: Breaking a problem into steps
titleKid: Big jobs are made of small jobs
language: c
concepts: [decomposition, sequence, algorithm]
prereqs: [core.c.what-is-a-program]
est_minutes: 12
checks:
  - type: stdout-equals
    expect: "Check the guard door is closed\nCheck the emergency stop is released\nReset the box counter to 0\nFlash the warning light\nStart the conveyor motor\nCount the boxes as they pass\n"
hints:
  - 'Read the rules one at a time and draw arrows: "this must happen before that". Moving whole printf lines up or down is all that is needed.'
  - 'Both safety checks come first, and the guard door check comes before the emergency stop check (rule 1). The warning light comes just before the motor starts (rule 3).'
  - 'The order is: guard door, emergency stop, reset counter, warning light, start motor, count boxes.'
hintsKid:
  - 'Move whole lines up or down. Do not change the words.'
  - 'Safety checks go first. The light flashes just before the motor.'
  - 'Door, stop button, counter, light, motor, count.'
---
Few problems can be solved in one step. "Sort the parcels", "keep the greenhouse warm" and "make the robot fetch a cup" are far too big to turn into instructions directly. The way through is to break the big job into smaller jobs, and those into smaller ones again, until each piece is a step simple enough to do directly. This is called **decomposition**, and it is the first thing a developer does with any problem.

## An example: making a cup of tea

Break it down one level:

1. Boil water.
2. Prepare the cup.
3. Make the tea.

Then break each part down again:

1. Boil water: fill the kettle, switch it on, wait until it clicks off.
2. Prepare the cup: get a cup, put a tea bag in it.
3. Make the tea: pour the water into the cup, wait three minutes, take out the tea bag.

Now every step is small enough to do without thinking. A list of steps that solves a problem is called an **algorithm**. A program is an algorithm written in a language a computer can follow.

## The order of the steps

Some steps must come before others: you cannot pour water that has not been boiled. Other steps can swap places: getting the cup can happen while the kettle boils. Before writing anything down, ask of each pair of steps: "does this one need the other one to be finished first?"

On machines the order is often a matter of **safety**. Checks come before actions, a warning comes before a machine moves, and a stop must always be possible.

## Repeats and choices

Breaking jobs down often reveals two other patterns:

- **Repetition**: "keep counting boxes until the shift ends", "stir until dissolved".
- **Decisions**: "if the water is too hot, wait", "if the door is open, do not start".

Programs have special instructions for both, which units A3 and A4 teach. For now, notice where they appear.

## How small is small enough?

A step is small enough when it is clear exactly how to do it, with no further decisions hiding inside. "Make the tea" is not; "pour the water into the cup" is. When writing a program, "small enough" means one or a few lines of code.

::: kid
A big job is made of small jobs.

Making tea is boil water, get a cup, then make the tea.

Each of those has its own little steps.

Keep cutting the job up until each step is easy.

Some steps must come before others.

You cannot pour the water before it boils.
:::

```c {role=example file=tea.c}
#include <stdio.h>

int main() {
    printf("1. Boil water\n");
    printf("   - fill the kettle\n");
    printf("   - switch it on\n");
    printf("   - wait for the click\n");
    printf("2. Prepare the cup\n");
    printf("   - get a cup\n");
    printf("   - put a tea bag in it\n");
    printf("3. Make the tea\n");
    printf("   - pour in the water\n");
    printf("   - wait three minutes\n");
    printf("   - take out the tea bag\n");
    return 0;
}
```

::: try
A conveyor belt in a packing line must be started safely. The program prints the start-up steps, but in the wrong order. Move the lines (do not change the words) so the steps follow these rules:

1. Check the guard door first, then the emergency stop, before anything else happens.
2. The box counter must be reset before the motor starts.
3. The warning light flashes straight before the motor starts.
4. Boxes can only be counted once the conveyor is moving.
:::

::: try-kid
The steps to start a moving belt are mixed up.

Move the lines into a safe order.

Check things first. Flash the light. Then start the belt.
:::

```c {role=starter file=conveyor.c}
#include <stdio.h>

int main() {
    printf("Start the conveyor motor\n");
    printf("Count the boxes as they pass\n");
    printf("Flash the warning light\n");
    printf("Check the emergency stop is released\n");
    printf("Reset the box counter to 0\n");
    printf("Check the guard door is closed\n");
    return 0;
}
```

```c {role=solution file=conveyor.c}
#include <stdio.h>

int main() {
    printf("Check the guard door is closed\n");
    printf("Check the emergency stop is released\n");
    printf("Reset the box counter to 0\n");
    printf("Flash the warning light\n");
    printf("Start the conveyor motor\n");
    printf("Count the boxes as they pass\n");
    return 0;
}
```
