---
id: core.c.inputs-outputs
kind: lesson
track: core
unit: a1
order: 3
title: Inputs, processes, outputs
titleKid: In, change, out
language: c
concepts: [input, process, output, ipo]
prereqs: [core.c.steps]
est_minutes: 12
checks:
  - type: io-cases
    cases:
      - stdin: ["40", "25"]
        expect: "Length in cm: Width in cm: Area: 1000 square cm\n"
      - stdin: ["12", "12"]
        expect: "Length in cm: Width in cm: Area: 144 square cm\n"
      - stdin: ["7", "3"]
        expect: "Length in cm: Width in cm: Area: 21 square cm\n"
hints:
  - 'Only the PROCESS part needs changing. The area of a rectangle is its length times its width.'
  - 'In C, times is written with a star: *. The names length and width already hold the two numbers.'
  - 'Change area = 0; to area = length * width;'
hintsKid:
  - 'Only change the line under PROCESS.'
  - 'Area is length times width. Times is a star, `*`.'
  - 'Write `area = length * width;`'
---
Almost every program, and almost every machine, does the same three things:

1. **Input**: it takes in information.
2. **Process**: it works something out from that information.
3. **Output**: it gives a result.

This is called the **IPO model**. Seeing a problem as input, process and output is often the quickest way to understand what a program has to do.

## Examples

| System | Input | Process | Output |
|---|---|---|---|
| Calculator | two numbers and `+` | add them | the sum on the screen |
| Thermostat | the room temperature | compare it with the setting | heater on or off |
| Vending machine | coins and a button | check the money, choose the item | a drink, and change |
| Parking sensor | distance to the wall | decide how close is too close | beeps, faster when closer |

In mechatronics, inputs often come from **sensors** (switches, temperature sensors, distance sensors) and outputs go to **actuators** (motors, valves, lights, buzzers). The process is the program in between.

## Start with the outputs

When you are given a problem, ask in this order:

1. **What must come out?** What should the user see, or the machine do?
2. **What must go in?** What information is needed to produce that?
3. **What is the process?** How do you get from the input to the output?

If you cannot say what the output is, you are not ready to write the program yet.

## Inputs, processes and outputs in C

In the programs in this course, input usually comes from the keyboard, read with `scanf`, and output goes to the screen with `printf`. The process is the calculation in between. Here they are, marked with comments (text after `//`, which the computer ignores):

```c
// INPUT
scanf("%d", &celsius);

// PROCESS
fahrenheit = celsius * 9 / 5 + 32;

// OUTPUT
printf("%d F\n", fahrenheit);
```

Unit A2 explains every part of these lines. For now, notice that you could describe the program in one sentence for each part.

::: kid
Most machines do three things.

First something goes in, like a number or a button press.

Then the machine works something out.

Then something comes out, like a light or a beep.

We call these in, change and out.
:::

```c {role=example file=temperature.c}
#include <stdio.h>

int main() {
    int celsius;
    int fahrenheit;

    // INPUT: the temperature in degrees Celsius
    celsius = 30;

    // PROCESS: convert to degrees Fahrenheit
    fahrenheit = celsius * 9 / 5 + 32;

    // OUTPUT: show the result
    printf("%d C is %d F\n", celsius, fahrenheit);
    return 0;
}
```

::: try
This program works out the floor area of a rectangular tank, so you can tell how big a base plate it needs. The INPUT part (reading the length and width) and the OUTPUT part (printing the area) are already written. Only the PROCESS part is missing: right now it always says the area is 0. Fix that one line.
:::

::: try-kid
The program reads how long and how wide a tank is.

It should say how much floor the tank covers.

Fix the one line in the middle.
:::

```c {role=starter file=tank.c}
#include <stdio.h>

int main() {
    int length;
    int width;
    int area;

    // INPUT
    printf("Length in cm: ");
    scanf("%d", &length);
    printf("Width in cm: ");
    scanf("%d", &width);

    // PROCESS
    area = 0;

    // OUTPUT
    printf("Area: %d square cm\n", area);
    return 0;
}
```

```c {role=solution file=tank.c}
#include <stdio.h>

int main() {
    int length;
    int width;
    int area;

    // INPUT
    printf("Length in cm: ");
    scanf("%d", &length);
    printf("Width in cm: ");
    scanf("%d", &width);

    // PROCESS
    area = length * width;

    // OUTPUT
    printf("Area: %d square cm\n", area);
    return 0;
}
```
