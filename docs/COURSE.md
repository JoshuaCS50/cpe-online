# Course map

Every lesson in CPE Online, in the order to take them. This file is written from the lessons by `tests/unit/course-index.test.ts`; do not edit it by hand.

- **Follow it like a course:** tracks are subjects, units are chapters, and lessons are numbered inside each unit. Start at the top of a track and work down.
- **Look something up:** see [TOPICS.md](TOPICS.md), every topic A to Z with the lessons that teach it, or use the search box in Learn mode.
- **Where the files are:** `src/content/tracks/<track>/<unit number>-<unit name>/<lesson number>-<lesson name>.md`, the same order as here.

## Core programming

C, C++ and Python, and how to think like a developer. 83 lessons, about 19 hours.

### A1 Thinking like a developer

6 lessons, about 75 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [What is a program?](../src/content/tracks/core/a01-thinking-like-a-developer/01-what-is-a-program.md) | Lesson | 10 | Program, Instructions, Sequence, Bug |
| 2 | [Breaking a problem into steps](../src/content/tracks/core/a01-thinking-like-a-developer/02-steps.md) | Lesson | 12 | Decomposition, Sequence, Algorithm |
| 3 | [Inputs, processes, outputs](../src/content/tracks/core/a01-thinking-like-a-developer/03-inputs-outputs.md) | Lesson | 12 | Input, Process, Output, Input, process, output (IPO) |
| 4 | [Flowcharts](../src/content/tracks/core/a01-thinking-like-a-developer/04-flowcharts.md) | Lesson | 14 | Flowchart, Decision, Sequence, loop() |
| 5 | [Pseudocode](../src/content/tracks/core/a01-thinking-like-a-developer/05-pseudocode.md) | Lesson | 13 | Pseudocode, Algorithm, Translation (between languages) |
| 6 | [Tracing by hand](../src/content/tracks/core/a01-thinking-like-a-developer/06-trace-tables.md) | Lesson | 14 | Trace table, Tracing, Variables, loop() |

### A2 First C program

6 lessons, about 55 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Hello, world](../src/content/tracks/core/a02-first-c-program/01-hello-world.md) | Lesson | 8 | Program, Output, main() |
| 2 | [printf](../src/content/tracks/core/a02-first-c-program/02-printf.md) | Quick reference | 6 | Output, Format string |
| 3 | [Variables and input](../src/content/tracks/core/a02-first-c-program/03-variables.md) | Lesson | 12 | Variable, Type, Input, Assignment |
| 4 | [Operators and precedence](../src/content/tracks/core/a02-first-c-program/04-operators.md) | Lesson | 12 | Arithmetic, Precedence, Integer division, Remainder (%) |
| 5 | [scanf](../src/content/tracks/core/a02-first-c-program/05-scanf.md) | Quick reference | 7 | Input, Format string, Address |
| 6 | [Reading error messages](../src/content/tracks/core/a02-first-c-program/06-reading-errors.md) | Lesson | 10 | Error message, Syntax error, Debugging |

### A3 Decisions

5 lessons, about 63 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Comparisons and logic](../src/content/tracks/core/a03-decisions/01-comparisons.md) | Lesson | 12 | Comparison, Logic, True and false, AND, OR, NOT |
| 2 | [if and else](../src/content/tracks/core/a03-decisions/02-if-else.md) | Lesson | 12 | if, else, Condition, Block |
| 3 | [else if ladders](../src/content/tracks/core/a03-decisions/03-else-if.md) | Lesson | 12 | else if, if-else ladder, Ranges |
| 4 | [switch](../src/content/tracks/core/a03-decisions/04-switch.md) | Lesson | 12 | switch, case, break, default |
| 5 | [Bug hunt: decisions](../src/content/tracks/core/a03-decisions/05-decision-bugs.md) | Lesson | 15 | Logic error, Debugging, = versus ==, Boundary |

### A4 Loops

6 lessons, about 75 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [while loops](../src/content/tracks/core/a04-loops/01-while.md) | Lesson | 12 | loop(), while loop, Condition, Counter, Infinite loop |
| 2 | [for loops](../src/content/tracks/core/a04-loops/02-for.md) | Lesson | 12 | loop(), for loop, Counter, Increment |
| 3 | [do-while loops](../src/content/tracks/core/a04-loops/03-do-while.md) | Lesson | 10 | loop(), do-while loop, Input checking |
| 4 | [Nested loops and patterns](../src/content/tracks/core/a04-loops/04-nested-loops.md) | Lesson | 14 | Nested loop, Rows and columns, Pattern |
| 5 | [break and continue](../src/content/tracks/core/a04-loops/05-break-continue.md) | Lesson | 12 | break, continue, Sentinel value, Loop control |
| 6 | [Bug hunt: loops](../src/content/tracks/core/a04-loops/06-loop-bugs.md) | Lesson | 15 | Logic error, Debugging, Off-by-one error, Accumulator, Loop invariant, Infinite loop |

### A5 Functions

6 lessons, about 85 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Why functions](../src/content/tracks/core/a05-functions/01-functions.md) | Lesson | 12 | Function, void, Function call, Reuse |
| 2 | [Parameters and return](../src/content/tracks/core/a05-functions/02-parameters.md) | Lesson | 14 | Parameter, Arguments, Return value, Function prototype |
| 3 | [Scope and copies](../src/content/tracks/core/a05-functions/03-scope.md) | Lesson | 14 | Scope, Local variable, Global variable, Pass by value |
| 4 | [Recursion](../src/content/tracks/core/a05-functions/04-recursion.md) | Lesson | 15 | Recursion, Base case, Call stack |
| 5 | [Top-down design](../src/content/tracks/core/a05-functions/05-top-down.md) | Lesson | 15 | Top-down design, Decomposition, Stub |
| 6 | [Testing functions](../src/content/tracks/core/a05-functions/06-testing-functions.md) | Lesson | 15 | Testing, Test cases, Edge cases, Debugging |

### A6 Arrays and strings

6 lessons, about 85 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Arrays](../src/content/tracks/core/a06-arrays-and-strings/01-arrays.md) | Lesson | 14 | Array, Index, Element, sizeof |
| 2 | [Simple statistics](../src/content/tracks/core/a06-arrays-and-strings/02-array-stats.md) | Lesson | 14 | Array, Sum, Average (mean), Maximum, Minimum |
| 3 | [Searching an array](../src/content/tracks/core/a06-arrays-and-strings/03-searching.md) | Lesson | 14 | Linear search, Array parameter, Not-found result |
| 4 | [2D arrays](../src/content/tracks/core/a06-arrays-and-strings/04-2d-arrays.md) | Lesson | 14 | 2D array, Rows and columns, Nested loop |
| 5 | [Strings as character arrays](../src/content/tracks/core/a06-arrays-and-strings/05-strings.md) | Lesson | 14 | String, char array, Null terminator ('\0'), Character (char) |
| 6 | [String functions](../src/content/tracks/core/a06-arrays-and-strings/06-string-functions.md) | Lesson | 15 | strlen, strcpy, strcat, strcmp, string.h |

### A7 Algorithms

6 lessons, about 91 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Binary search](../src/content/tracks/core/a07-algorithms/01-binary-search.md) | Lesson | 15 | Binary search, Sorted data, Halving |
| 2 | [Bubble sort](../src/content/tracks/core/a07-algorithms/02-bubble-sort.md) | Lesson | 15 | Sorting, Bubble sort, Swap, Passes |
| 3 | [Selection sort](../src/content/tracks/core/a07-algorithms/03-selection-sort.md) | Lesson | 15 | Sorting, Selection sort, Minimum, Swap |
| 4 | [Insertion sort](../src/content/tracks/core/a07-algorithms/04-insertion-sort.md) | Lesson | 15 | Sorting, Insertion sort, Shifting |
| 5 | [How work grows (Big-O)](../src/content/tracks/core/a07-algorithms/05-big-o.md) | Lesson | 15 | Big-O, Efficiency, Growth, Counting steps |
| 6 | [Merge sort](../src/content/tracks/core/a07-algorithms/06-merge-sort.md) | Lesson | 16 | Merge sort, Merging, Divide and conquer, Recursion |

### A8 Memory

6 lessons, about 90 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Addresses and pointers](../src/content/tracks/core/a08-memory/01-pointers.md) | Lesson | 15 | Memory, Address, Pointer, Dereference (*p), NULL pointer |
| 2 | [Passing addresses to functions](../src/content/tracks/core/a08-memory/02-pass-by-address.md) | Lesson | 15 | Pass by reference, Pointer parameter, Swap, Out parameter |
| 3 | [Pointers and arrays](../src/content/tracks/core/a08-memory/03-pointers-arrays.md) | Lesson | 15 | Pointer arithmetic, Array decay, Pointer comparison |
| 4 | [The stack and the heap](../src/content/tracks/core/a08-memory/04-stack-heap.md) | Lesson | 15 | Stack, Heap, Lifetime, Dangling pointer, malloc, free |
| 5 | [malloc and free](../src/content/tracks/core/a08-memory/05-malloc.md) | Lesson | 15 | malloc, free, calloc, realloc, Dynamic array, sizeof |
| 6 | [Bug hunt: memory](../src/content/tracks/core/a08-memory/06-memory-bugs.md) | Lesson | 15 | Debugging, Buffer overflow, Use after free, Memory leak, Debugger |

### A9 Data structures

6 lessons, about 100 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Structs](../src/content/tracks/core/a09-data-structures/01-structs.md) | Lesson | 15 | struct, Member, typedef, Arrow operator (->) |
| 2 | [Arrays of structs](../src/content/tracks/core/a09-data-structures/02-arrays-of-structs.md) | Lesson | 15 | Array of structs, Records, Sorting records |
| 3 | [Linked lists](../src/content/tracks/core/a09-data-structures/03-linked-lists.md) | Lesson | 18 | Linked list, Node, Self-referential struct, Traversal |
| 4 | [Stacks and queues](../src/content/tracks/core/a09-data-structures/04-stacks-queues.md) | Lesson | 16 | Stack, Queue, LIFO (last in, first out), FIFO (first in, first out), Ring buffer |
| 5 | [Hash tables](../src/content/tracks/core/a09-data-structures/05-hash-tables.md) | Lesson | 18 | Hash table, Hash function, Collision, Chaining |
| 6 | [Binary search trees](../src/content/tracks/core/a09-data-structures/06-trees.md) | Lesson | 18 | Tree, Binary search tree, Traversal, Tree height |

### A10 Files and input

4 lessons, about 64 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Reading files](../src/content/tracks/core/a10-files-and-input/01-reading-files.md) | Lesson | 16 | Files, fopen, fgets, fscanf, fclose, EOF (end of file) |
| 2 | [Writing files](../src/content/tracks/core/a10-files-and-input/02-writing-files.md) | Lesson | 14 | Files, fprintf, fputs, File modes, append |
| 3 | [Reading CSV files](../src/content/tracks/core/a10-files-and-input/03-csv.md) | Lesson | 18 | CSV (comma-separated values), strtok, sscanf, Parsing, Validation |
| 4 | [Reading commands](../src/content/tracks/core/a10-files-and-input/04-commands.md) | Lesson | 16 | Command input, fgets, sscanf, argc and argv, Validation |

### A11 C++ bridge

5 lessons, about 75 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [From C to C++](../src/content/tracks/core/a11-cpp-bridge/01-cout-cin.md) | Lesson | 14 | C++, iostream, cout, cin, Namespace, iomanip |
| 2 | [References](../src/content/tracks/core/a11-cpp-bridge/02-references.md) | Lesson | 14 | Reference (&), Pass by reference, const reference, Alias |
| 3 | [Classes](../src/content/tracks/core/a11-cpp-bridge/03-classes.md) | Lesson | 18 | Class, Object, Member function (method), Constructor, private, public, Encapsulation |
| 4 | [vector and string](../src/content/tracks/core/a11-cpp-bridge/04-vector-string.md) | Lesson | 16 | vector, String, push_back, Range-based for, Standard library |
| 5 | [Overloading](../src/content/tracks/core/a11-cpp-bridge/05-overloading.md) | Lesson | 13 | Overloading, Default arguments, Signature |

### A12 Python

7 lessons, about 97 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [print](../src/content/tracks/core/a12-python/01-print.md) | Quick reference | 5 | Output, Format string |
| 2 | [Python for C programmers](../src/content/tracks/core/a12-python/02-syntax.md) | Lesson | 15 | Python syntax, Indentation, Dynamic types, Input, if / elif / else, for with range |
| 3 | [Lists and dictionaries](../src/content/tracks/core/a12-python/03-lists-dicts.md) | Lesson | 16 | list, dict, append, Slicing, Counting |
| 4 | [Functions in Python](../src/content/tracks/core/a12-python/04-functions.md) | Lesson | 15 | def, return, tuple, Default arguments, Keyword arguments, Scope |
| 5 | [Files in Python](../src/content/tracks/core/a12-python/05-files.md) | Lesson | 16 | open, with, readlines, split, write, Exceptions |
| 6 | [Modules](../src/content/tracks/core/a12-python/06-modules.md) | Lesson | 15 | import, Modules, math module, Standard library, if __name__ == "__main__" |
| 7 | [The same algorithm in C and Python](../src/content/tracks/core/a12-python/07-c-vs-python.md) | Lesson | 15 | Translation (between languages), Binary search, Integer division, Choosing a language |

### A13 Software habits

4 lessons, about 62 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Names, constants and comments](../src/content/tracks/core/a13-software-habits/01-naming.md) | Lesson | 14 | Naming, Constant, #define, Magic numbers, Comments, Refactoring |
| 2 | [A debugging strategy](../src/content/tracks/core/a13-software-habits/02-debugging-strategy.md) | Lesson | 16 | Debugging, Reproduce, Hypothesis, Tracing, Divide and conquer |
| 3 | [Tests that check themselves](../src/content/tracks/core/a13-software-habits/03-unit-tests.md) | Lesson | 16 | Unit testing, Test harness, Boundary values, Regression testing, Integer division |
| 4 | [Reading a specification](../src/content/tracks/core/a13-software-habits/04-reading-specs.md) | Lesson | 16 | Specification, Requirements, Edge cases, Hysteresis, State |

### A14 Debugging

10 lessons, about 142 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Bugs happen to everyone](../src/content/tracks/core/a14-debugging/01-kinds-of-bugs.md) | Lesson | 14 | Bug, Syntax error, Runtime error, Logic error, Division by zero |
| 2 | [Reading an error message](../src/content/tracks/core/a14-debugging/02-error-messages.md) | Lesson | 12 | Error message, Line number, Fix the first error first, Syntax error |
| 3 | [Print debugging](../src/content/tracks/core/a14-debugging/03-print-debugging.md) | Lesson | 15 | Print debugging, Tracing, Debug flag, Boundary |
| 4 | [The debugging method](../src/content/tracks/core/a14-debugging/04-debugging-method.md) | Lesson | 14 | A debugging method, Reproduce, Isolate, Hypothesis, Bug notebook |
| 5 | [Breakpoints and stepping](../src/content/tracks/core/a14-debugging/05-breakpoints.md) | Lesson | 15 | Debugger, Breakpoint, Step over, Step into, Step out |
| 6 | [Variables and the call stack](../src/content/tracks/core/a14-debugging/06-debug-variables.md) | Lesson | 14 | Variables panel, Call stack, Stack frame, Recursion, Inspecting state |
| 7 | [Rubber duck debugging](../src/content/tracks/core/a14-debugging/07-rubber-duck.md) | Lesson | 12 | Rubber duck debugging, Explaining code, Trace table, Swap |
| 8 | [Hunting common bugs](../src/content/tracks/core/a14-debugging/08-common-bugs.md) | Lesson | 16 | Common bugs, Assignment versus equality, Integer division, Missing & in scanf, Stray semicolon, Off-by-one error |
| 9 | [Bug-hunt practice](../src/content/tracks/core/a14-debugging/09-bug-hunt.md) | Lesson | 15 | Debugging practice, Assignment versus equality, Initial values, Off-by-one error |
| 10 | [Defensive habits](../src/content/tracks/core/a14-debugging/10-defensive-habits.md) | Lesson | 15 | Input validation, Small steps, scanf's return value, Assertions, Defensive programming |

## Arduino and embedded

Pins, sensors and timing on Arduino, ESP32 and PIC boards. 43 lessons, about 11 hours.

### B1 Meet the board

3 lessons, about 39 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Meet the Arduino](../src/content/tracks/embedded/b01-meet-the-board/01-meet-the-board.md) (Uno) | Lesson | 12 | Microcontroller, Arduino Uno, Sketch, setup(), loop(), Simulation |
| 2 | [Power, pins and breadboards](../src/content/tracks/embedded/b01-meet-the-board/02-power-and-pins.md) (Uno) | Lesson | 15 | Voltage, Current, Resistor, Ohm's law, Breadboard, Ground (GND), Digital pins |
| 3 | [The Serial Monitor](../src/content/tracks/embedded/b01-meet-the-board/03-serial-monitor.md) (Uno) | Lesson | 12 | Serial, Baud rate, Serial.print / println, Debugging |

### B2 Digital pins

4 lessons, about 58 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Blink](../src/content/tracks/embedded/b02-digital-pins/01-blink.md) (Uno) | Lesson + circuit | 12 | Digital output, delay(), Period, Frequency, Duty cycle, Constant |
| 2 | [Reading a button](../src/content/tracks/embedded/b02-digital-pins/02-buttons.md) (Uno) | Lesson + circuit | 14 | Digital input, digitalRead(), Pull-down resistor, if / else |
| 3 | [Pull-ups and debouncing](../src/content/tracks/embedded/b02-digital-pins/03-pullups-debounce.md) (Uno) | Lesson + circuit | 18 | INPUT_PULLUP, Active low, Contact bounce, Debouncing, Edge detection, millis() |
| 4 | [A traffic-light sequence](../src/content/tracks/embedded/b02-digital-pins/04-traffic-lights.md) (Uno) | Lesson + circuit | 14 | Sequence, Function, Timing, Outputs |

### B3 Analog input

4 lessons, about 62 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Reading a voltage with analogRead](../src/content/tracks/embedded/b03-analog-input/01-analog-read.md) (Uno) | Lesson + circuit | 14 | Analog input, ADC (analog-to-digital converter), Resolution, Integer division, float |
| 2 | [Voltage dividers and light sensors](../src/content/tracks/embedded/b03-analog-input/02-voltage-divider.md) (Uno) | Lesson + circuit | 18 | Voltage divider, LDR (light-dependent resistor), Ohm's law, long, Integer overflow |
| 3 | [Scaling readings with map and constrain](../src/content/tracks/embedded/b03-analog-input/03-map-constrain.md) (Uno) | Lesson + circuit | 14 | map(), constrain(), Scaling, Servo, Limits |
| 4 | [Thresholds and hysteresis](../src/content/tracks/embedded/b03-analog-input/04-hysteresis.md) (Uno) | Lesson | 16 | Threshold, Hysteresis, Noise, On-off control, Temperature sensor |

### B4 PWM

4 lessons, about 52 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [analogWrite and the duty cycle](../src/content/tracks/embedded/b04-pwm/01-analog-write.md) (Uno) | Lesson + circuit | 12 | PWM (pulse-width modulation), Duty cycle, Analog output, Resolution |
| 2 | [Fading an LED up and down](../src/content/tracks/embedded/b04-pwm/02-fade.md) (Uno) | Lesson + circuit | 12 | PWM (pulse-width modulation), Fading, Persistence of vision, loop() |
| 3 | [Pulses that set a position or a speed](../src/content/tracks/embedded/b04-pwm/03-servo-sweep.md) (Uno) | Lesson + circuit | 14 | Servo, Pulse width, PWM (pulse-width modulation), Off-by-one error |
| 4 | [PWM frequency and average voltage](../src/content/tracks/embedded/b04-pwm/04-average-voltage.md) (Uno) | Lesson + circuit | 14 | PWM (pulse-width modulation), Average voltage (PWM), Frequency, Integer division |

### B5 Timing

4 lessons, about 62 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [delay versus millis](../src/content/tracks/embedded/b05-timing/01-delay-vs-millis.md) (Uno) | Lesson + circuit | 16 | delay(), millis(), Blocking code, Non-blocking code |
| 2 | [Several things at once](../src/content/tracks/embedded/b05-timing/02-two-blinkers.md) (Uno) | Lesson + circuit | 14 | millis(), Non-blocking code, Multitasking (cooperative), Rollover |
| 3 | [State machines](../src/content/tracks/embedded/b05-timing/03-state-machines.md) (Uno) | Lesson + circuit | 18 | State machine, enum, switch, millis() |
| 4 | [Timers and drift](../src/content/tracks/embedded/b05-timing/04-timers-and-drift.md) (Uno) | Lesson | 14 | Timer (hardware), Drift, millis(), Timing |

### B6 Interrupts

4 lessons, about 64 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [What an interrupt is](../src/content/tracks/embedded/b06-interrupts/01-what-is-an-interrupt.md) (Uno) | Lesson + circuit | 16 | Interrupt, Polling, Interrupt service routine (ISR), attachInterrupt() |
| 2 | [Rules for interrupt routines](../src/content/tracks/embedded/b06-interrupts/02-isr-rules.md) (Uno) | Lesson + circuit | 16 | Interrupt service routine (ISR), volatile, Critical section, Flag |
| 3 | [Counting pulses from a wheel](../src/content/tracks/embedded/b06-interrupts/03-counting-pulses.md) (Uno) | Lesson + circuit | 16 | Interrupt modes, Hall-effect sensor, RPM, Critical section |
| 4 | [Timer interrupts](../src/content/tracks/embedded/b06-interrupts/04-timer-interrupts.md) (Uno) | Lesson + circuit | 16 | Timer interrupt, Timer (hardware), Microseconds (µs), Interrupt service routine (ISR) |

### B7 PIC bridge

_Coming later._

### B8 Communication

_Coming later._

### B9 Putting it together

13 lessons, about 211 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Project: a knob dimmer](../src/content/tracks/embedded/b09-putting-it-together/01-knob-dimmer.md) (Uno) | Lesson + circuit | 15 | Analog input, PWM (pulse-width modulation), map(), Scaling, Duty cycle |
| 2 | [Project: an automatic night light](../src/content/tracks/embedded/b09-putting-it-together/02-night-light.md) (Uno) | Lesson + circuit | 15 | LDR (light-dependent resistor), Voltage divider, Threshold, Analog input, if / else |
| 3 | [Project: a colour mixer](../src/content/tracks/embedded/b09-putting-it-together/03-colour-mixer.md) (Uno) | Lesson + circuit | 16 | PWM (pulse-width modulation), Colour mixing (light), Function, Duty cycle |
| 4 | [Project: play a melody](../src/content/tracks/embedded/b09-putting-it-together/04-melody.md) (Uno) | Lesson + circuit | 14 | tone(), Frequency, Array, Timing |
| 5 | [Project: a four-key piano](../src/content/tracks/embedded/b09-putting-it-together/05-mini-piano.md) (Uno) | Lesson + circuit | 16 | Array, INPUT_PULLUP, tone(), Digital input |
| 6 | [Project: an ESP32 touch lamp](../src/content/tracks/embedded/b09-putting-it-together/06-touch-lamp.md) (ESP32) | Lesson + circuit | 15 | Capacitive touch, touchRead(), Edge detection, Threshold |
| 7 | [Project: measure distance with sound](../src/content/tracks/embedded/b09-putting-it-together/07-distance-sensor.md) (Uno) | Lesson + circuit | 16 | Ultrasonic distance sensor, pulseIn(), Frequency, Timing |
| 8 | [Project: a parking sensor](../src/content/tracks/embedded/b09-putting-it-together/08-parking-sensor.md) (Uno) | Lesson + circuit | 18 | Ultrasonic distance sensor, Threshold, if / else, Function |
| 9 | [Project: a fan with a soft start](../src/content/tracks/embedded/b09-putting-it-together/09-motor-soft-start.md) (Uno) | Lesson + circuit | 16 | Transistor, PWM (pulse-width modulation), Duty cycle, Current |
| 10 | [Project: a fan thermostat](../src/content/tracks/embedded/b09-putting-it-together/10-thermostat.md) (Uno) | Lesson + circuit | 18 | Temperature sensor, Hysteresis, On-off control, Transistor |
| 11 | [Project: a stepper prize wheel](../src/content/tracks/embedded/b09-putting-it-together/11-prize-wheel.md) (Uno) | Lesson + circuit | 18 | Stepper motor, Array, Digital input, Edge detection |
| 12 | [Project: a smart plant monitor](../src/content/tracks/embedded/b09-putting-it-together/12-plant-monitor.md) (Uno) | Lesson + circuit | 18 | Soil moisture, I²C, OLED display, map() |
| 13 | [Project: a strength tester](../src/content/tracks/embedded/b09-putting-it-together/13-strength-tester.md) (Uno) | Lesson + circuit | 16 | Force sensor (FSR), map(), Servo, tone() |

### B10 Debugging the board

_Coming later._

### B11 ESP32: a faster, connected board

7 lessons, about 104 minutes.

| # | Lesson | Type | Minutes | Topics |
|---|---|---|---|---|
| 1 | [Meet the ESP32](../src/content/tracks/embedded/b11-esp32-a-faster-connected-board/01-meet-the-esp32.md) (ESP32) | Lesson | 14 | ESP32, Comparing microcontrollers, Logic levels, Porting, Baud rate |
| 2 | [The ESP32 pinout](../src/content/tracks/embedded/b11-esp32-a-faster-connected-board/02-esp32-pinout.md) (ESP32) | Lesson + circuit | 16 | Pinout, Input-only pins (ESP32), Strapping pins (ESP32), Flash pins (ESP32), Pull-up resistor, ADC1 and ADC2 (ESP32) |
| 3 | [12-bit analogRead on the ESP32](../src/content/tracks/embedded/b11-esp32-a-faster-connected-board/03-adc-12-bit.md) (ESP32) | Lesson + circuit | 14 | ADC (analog-to-digital converter), Resolution, analogReadResolution, Logic levels, Porting |
| 4 | [PWM with LEDC](../src/content/tracks/embedded/b11-esp32-a-faster-connected-board/04-ledc-pwm.md) (ESP32) | Lesson + circuit | 16 | PWM (pulse-width modulation), LEDC (ESP32 PWM), Duty cycle, Resolution, Frequency, Array |
| 5 | [Touch pins](../src/content/tracks/embedded/b11-esp32-a-faster-connected-board/05-touch-pins.md) (ESP32) | Lesson + circuit | 14 | Capacitive touch, Threshold, touchRead(), Noise |
| 6 | [True analog output with the DAC](../src/content/tracks/embedded/b11-esp32-a-faster-connected-board/06-dac-output.md) (ESP32) | Lesson + circuit | 14 | DAC (digital-to-analog converter), Analog output, PWM or DAC, Resolution, Rounding |
| 7 | [Deep sleep and waking up](../src/content/tracks/embedded/b11-esp32-a-faster-connected-board/07-deep-sleep.md) (ESP32) | Lesson | 16 | Deep sleep, Low power, RTC memory (ESP32), Wake-up timer, Wake-up cause |

### B12 ESP32 Wi-Fi and IoT

_Coming later._
