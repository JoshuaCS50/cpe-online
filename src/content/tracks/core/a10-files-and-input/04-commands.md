---
id: core.c.commands
kind: lesson
track: core
unit: a10
order: 4
title: Reading commands
titleKid: A robot that follows typed orders
language: c
concepts: [command-input, fgets, sscanf, argc-argv, validation]
prereqs: [core.c.reading-files, core.c.string-functions]
est_minutes: 16
checks:
  - type: io-cases
    cases:
      - stdin: ["status", "start", "speed 40", "status", "stop", "status"]
        expect: "Status: stopped, 50%\nRunning at 50%\nSpeed set to 40%\nStatus: running, 40%\nStopped\nStatus: stopped, 40%\n"
      - stdin: ["speed 150", "speed -5", "speed 100", "start", "jump"]
        expect: "Speed must be 0 to 100\nSpeed must be 0 to 100\nSpeed set to 100%\nRunning at 100%\nUnknown command: jump\n"
      - stdin: ["speed", "", "start", "speed 0"]
        expect: "Speed needs a number\nRunning at 50%\nSpeed set to 0%\n"
  - type: code-contains
    pattern: 'strcmp\s*\(\s*command'
    message: Compares the command with strcmp
hints:
  - "Inside the loop, use an else-if ladder on the command word: if (strcmp(command, \"start\") == 0) { ... } else if (strcmp(command, \"stop\") == 0) { ... } and so on, ending with else for unknown commands."
  - "speed needs its number: parts tells you how many pieces sscanf found. If parts < 2, print Speed needs a number. Otherwise check 0 <= value <= 100 before storing it."
  - Keep two variables between commands, running (1 or 0) and speed (starting at 50), and print from them for status.
hintsKid:
  - Look at the first word with strcmp.
  - Do a different job for each word.
  - Remember if the belt runs and how fast.
---
Many programs are driven by **commands**: short lines of text such as `speed 40` or `stop`. A shell on a computer works this way, so do the commands a PC sends to an Arduino over a serial cable, and the G-code lines (`G1 X10 Y20`) that drive 3D printers and CNC machines. The pattern is always the same: read a line, split it into words, look at the first word, and act.

## Reading one line at a time

`scanf("%d")` and `scanf("%s")` read words and skip line breaks, so they cannot tell where one command ends and the next begins. Read whole lines instead:

```c
char line[80];
while (fgets(line, sizeof(line), stdin) != NULL) {
    // handle one command
}
```

`stdin`, the keyboard, is a `FILE *` like any file, so the loop ends when the input does (end of file). Many programs also stop on a word such as `quit`.

## Splitting the line

`sscanf` pulls the pieces out and says how many it found:

```c
char command[20];
int value;
int parts = sscanf(line, "%s %d", command, &value);
```

| Line | `parts` | Meaning |
|---|---|---|
| `speed 40` | 2 | command and number |
| `stop` | 1 | command only |
| `speed` | 1 | the number is missing |
| empty | -1 (`EOF`) | nothing on the line: skip it |

## Acting on the command

Compare the command word with each known word, using `strcmp` (not `==`), in an else-if ladder that ends with a message for anything unknown:

```c
if (strcmp(command, "stop") == 0) {
    running = 0;
    printf("Stopped\n");
} else if (strcmp(command, "speed") == 0) {
    // check parts and the range, then store value
} else {
    printf("Unknown command: %s\n", command);
}
```

**Never trust input.** Check that a number was given and that it is in range before using it. A machine that accepts `speed 900` because nobody checked is a real hazard.

## The command line: argc and argv

On a desktop, a program can also get words when it is started, typed after its name: `./logger temps.csv 10`. C hands them to `main`:

```c
int main(int argc, char *argv[]) {
    // argc = 3, argv[0] = "./logger", argv[1] = "temps.csv", argv[2] = "10"
    if (argc < 3) {
        printf("Use: logger <file> <minutes>\n");
        return 1;
    }
    int minutes = atoi(argv[2]);
    ...
}
```

`argc` counts the words, the program's own name included, and `argv` is an array of strings holding them. This site has no command line to start programs from, so the programs here read their commands as typed input instead; the parsing is exactly the same.

## Common mistakes

- **Comparing strings with `==`.** It compares addresses, so it is never true here. Use `strcmp(...) == 0`.
- **Using a number that was not given.** If `parts` is 1, `value` holds whatever was there before.
- **Forgetting the `else`.** Without it, typos are silently ignored and the user never knows.

::: kid
Imagine a robot that listens to typed orders.

You type one order on each line, like `start` or `stop`.

The robot looks at the first word.

Then it does the job for that word.

Some orders need a number, like `speed 40`.

The robot checks the number is safe first.
:::

```c {role=example file=menu.c}
#include <stdio.h>
#include <string.h>

int main() {
    char line[80];
    char command[20];
    int value;
    int total = 0;

    char *orders[4] = {"add 5", "add 10", "sub 3", "show"};
    for (int i = 0; i < 4; i++) {
        strcpy(line, orders[i]);
        printf("> %s\n", line);
        int parts = sscanf(line, "%s %d", command, &value);

        if (strcmp(command, "add") == 0 && parts == 2) {
            total += value;
        } else if (strcmp(command, "sub") == 0 && parts == 2) {
            total -= value;
        } else if (strcmp(command, "show") == 0) {
            printf("Total is %d\n", total);
        } else {
            printf("I do not understand %s\n", line);
        }
    }
    return 0;
}
```

::: try
Write the controller for a conveyor belt. Each typed line is one command: `start`, `stop`, `speed N` (0 to 100), or `status`. The belt starts stopped, at 50%. Reply exactly as shown here, and say `Unknown command: <word>` for anything else. Empty lines are already skipped for you.

| Command | Reply |
|---|---|
| `start` | `Running at 50%` |
| `stop` | `Stopped` |
| `speed 40` | `Speed set to 40%` |
| `speed 150` | `Speed must be 0 to 100` |
| `speed` | `Speed needs a number` |
| `status` | `Status: running, 40%` or `Status: stopped, 40%` |
:::

::: try-kid
You are the boss of a moving belt.

Each line is one order for the belt.

Do what the order says, and answer like the table.
:::

```c {role=starter file=conveyor.c}
#include <stdio.h>
#include <string.h>

int main() {
    char line[80];
    char command[20];
    int value;
    int running = 0;
    int speed = 50;

    while (fgets(line, sizeof(line), stdin) != NULL) {
        int parts = sscanf(line, "%s %d", command, &value);
        if (parts < 1) {
            continue;    // an empty line
        }

        // Act on command here.
    }
    return 0;
}
```

```c {role=solution file=conveyor.c}
#include <stdio.h>
#include <string.h>

int main() {
    char line[80];
    char command[20];
    int value;
    int running = 0;
    int speed = 50;

    while (fgets(line, sizeof(line), stdin) != NULL) {
        int parts = sscanf(line, "%s %d", command, &value);
        if (parts < 1) {
            continue;    // an empty line
        }

        if (strcmp(command, "start") == 0) {
            running = 1;
            printf("Running at %d%%\n", speed);
        } else if (strcmp(command, "stop") == 0) {
            running = 0;
            printf("Stopped\n");
        } else if (strcmp(command, "speed") == 0) {
            if (parts < 2) {
                printf("Speed needs a number\n");
            } else if (value < 0 || value > 100) {
                printf("Speed must be 0 to 100\n");
            } else {
                speed = value;
                printf("Speed set to %d%%\n", speed);
            }
        } else if (strcmp(command, "status") == 0) {
            if (running) {
                printf("Status: running, %d%%\n", speed);
            } else {
                printf("Status: stopped, %d%%\n", speed);
            }
        } else {
            printf("Unknown command: %s\n", command);
        }
    }
    return 0;
}
```
