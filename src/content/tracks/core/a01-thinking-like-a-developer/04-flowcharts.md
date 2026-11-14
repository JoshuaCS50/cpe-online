---
id: core.c.flowcharts
kind: lesson
track: core
unit: a1
order: 4
title: Flowcharts
titleKid: Drawing the steps as a map
language: c
concepts: [flowchart, decision, sequence, loop]
prereqs: [core.c.inputs-outputs]
est_minutes: 14
checks:
  - type: io-cases
    cases:
      - stdin: ["10"]
        expect: "Distance in cm: STOP\n"
      - stdin: ["35"]
        expect: "Distance in cm: Slow\n"
      - stdin: ["60"]
        expect: "Distance in cm: Clear\n"
      - stdin: ["20"]
        expect: "Distance in cm: Slow\n"
      - stdin: ["50"]
        expect: "Distance in cm: Clear\n"
hints:
  - 'Put your finger on Start and follow the chart, then look for the same step in the code. Compare every number and every word.'
  - 'The second diamond in the chart asks "d < 50?". What number does the code use there?'
  - 'Change 30 to 50, and the text "Stop" to "STOP", exactly as the chart shows.'
hintsKid:
  - 'Follow the map with your finger. Then look at the code.'
  - 'Check each number and each word. Are they the same?'
  - 'Two things are different. Make them match the map.'
---
A **flowchart** draws an algorithm as a picture: boxes for the steps and arrows for the order. It shows at a glance where a program makes decisions and where it repeats, which a list of steps can hide. Engineers use flowcharts to plan programs, to explain machines to each other, and in exams.

## The symbols

Each shape has one meaning. Since this page shows text only, the shapes are drawn with keyboard characters, as you might in a quick sketch:

| Shape | Drawn here as | Meaning |
|---|---|---|
| Rounded box (oval) | `( Start )` | where the algorithm starts or ends |
| Parallelogram | `/ Read d /` | input or output |
| Rectangle | `[ total = 0 ]` | a process: a calculation or an action |
| Diamond | `< d < 20 ? >` | a decision: a yes or no question, with two arrows out |
| Arrow | a line, or `-->` | the order: follow it to the next step |

On paper, draw the real shapes: an oval, a slanted box, a rectangle and a diamond.

## Sequence: one step after another

```
   ( Start )
       |
  / Read price /
       |
 [ total = price * 2 ]
       |
  / Print total /
       |
    ( End )
```

## Decision: two ways out

A diamond holds a question whose answer is yes or no. Each answer has its own arrow, labelled, and the paths usually join again later:

```
        < temperature > 25 ? >
           |yes          |no
   [ Fan on ]       [ Fan off ]
           |             |
           +------+------+
                  |
```

## Loop: an arrow that goes back

When an arrow leads back to an earlier step, those steps repeat. A decision decides when to stop:

```
    [ count = 0 ]
         |
  +-> < count < 3 ? > --no--> ( End )
  |      | yes
  |  [ Beep ]
  |      |
  |  [ count = count + 1 ]
  |      |
  +------+
```

This beeps three times: the question is asked four times, and on the fourth it is "no".

## Good habits

- One Start and at least one End.
- Every arrow points somewhere, and every diamond has exactly two exits, labelled yes and no.
- Keep the text in each box short; the box is a step, not a paragraph.
- Follow your own chart with a test value before writing any code. If you get lost, so will the program.

::: kid
A flowchart is a map of the steps.

Boxes are steps. Arrows show which step comes next.

A diamond asks a yes or no question.

Each answer has its own arrow.

An arrow that goes back means do it again.
:::

```c {role=example file=fan.c}
#include <stdio.h>

int main() {
    // The flowchart from "Decision: two ways out", for three temperatures.
    int temperatures[3] = {22, 27, 25};

    for (int i = 0; i < 3; i++) {
        int temperature = temperatures[i];
        printf("%d degrees: ", temperature);
        if (temperature > 25) {
            printf("Fan on\n");
        } else {
            printf("Fan off\n");
        }
    }
    return 0;
}
```

::: try
Here is the flowchart for a car's parking sensor, which measures the distance `d` to the wall in centimetres:

```
          ( Start )
              |
     / Read distance d /
              |
       < d < 20 ? > --yes--> / Print "STOP" /
              | no
       < d < 50 ? > --yes--> / Print "Slow" /
              | no
       / Print "Clear" /
```

The program below was written from this chart, but it does not match it in two places. Compare the chart and the code carefully, and make the code do exactly what the chart says.
:::

::: try-kid
The map shows what the car beeper should say.

The program does not match the map in two places.

Find them and fix them.
:::

```c {role=starter file=parking.c}
#include <stdio.h>

int main() {
    int d;
    printf("Distance in cm: ");
    scanf("%d", &d);

    if (d < 20) {
        printf("Stop\n");
    } else if (d < 30) {
        printf("Slow\n");
    } else {
        printf("Clear\n");
    }
    return 0;
}
```

```c {role=solution file=parking.c}
#include <stdio.h>

int main() {
    int d;
    printf("Distance in cm: ");
    scanf("%d", &d);

    if (d < 20) {
        printf("STOP\n");
    } else if (d < 50) {
        printf("Slow\n");
    } else {
        printf("Clear\n");
    }
    return 0;
}
```
