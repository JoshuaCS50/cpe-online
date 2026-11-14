---
id: embedded.arduino.serial-monitor
kind: lesson
track: embedded
unit: b1
order: 3
title: The Serial Monitor
titleKid: Letting the board talk to you
language: arduino
concepts: [serial, baud-rate, serial-print, debugging]
prereqs: [embedded.arduino.power-and-pins]
links:
  - to: core.c.printf
    kind: same-idea
    note: Serial.print is the board's printf; the text travels over USB.
est_minutes: 12
checks:
  - type: stdout-equals
    ms: 3500
    expect: "Ready\nSeconds: 1\nSeconds: 2\nSeconds: 3\n"
  - type: stdout-equals
    ms: 1500
    expect: "Ready\nSeconds: 1\n"
  - type: code-contains
    pattern: 'Serial\s*\.\s*begin\s*\(\s*9600\s*\)'
    message: 'Starts Serial with Serial.begin(9600)'
hints:
  - 'In setup, start the link with Serial.begin(9600); and then print the first line with Serial.println("Ready");'
  - 'In loop, wait a second with delay(1000);, add one to seconds, then print it.'
  - 'Print the label and the number on one line: Serial.print("Seconds: "); then Serial.println(seconds);'
hintsKid:
  - 'Start talking with `Serial.begin(9600);`.'
  - 'Wait one second. Add one to `seconds`.'
  - 'Print "Seconds: " and the number.'
---
A microcontroller has no screen. The simplest way for it to tell you what it is doing is to send text back to the computer over the USB cable. The Arduino IDE shows that text in its **Serial Monitor**; here it appears in the terminal under the program.

## Starting Serial

```arduino
void setup() {
    Serial.begin(9600);
    Serial.println("Hello from the board");
}
```

`Serial.begin(9600)` starts the link at **9600 baud**, which means 9600 bits a second. Both ends must use the same speed: if the Serial Monitor is set to a different baud rate, the text arrives as nonsense. 9600 is the common default; faster rates such as 115200 also work. Nothing appears until `Serial.begin` has been called, a classic first mistake (the simulator adds a note when it happens).

## print and println

- `Serial.print(x)` sends `x` and stays on the same line.
- `Serial.println(x)` sends `x` and then a new line.

They accept text, whole numbers and numbers with fractions, and they work out the type themselves, like `cout` in C++:

```arduino
int count = 7;
float voltage = 3.29;
Serial.print("Count: ");
Serial.println(count);        // Count: 7
Serial.println(voltage);      // 3.29 (two decimals unless you say otherwise)
Serial.println(voltage, 3);   // 3.290
Serial.println(255, HEX);     // FF
```

## Serial for debugging

On a board there is often no debugger, so `Serial.print` is the main tool for finding bugs, exactly like the print debugging of unit A14. Print labelled values at the points you are unsure about:

```arduino
Serial.print("button=");
Serial.print(digitalRead(2));
Serial.print(" millis=");
Serial.println(millis());
```

Keep it quick: printing takes time on a real board (at 9600 baud, about 1 ms per character), so a loop that prints a lot runs much slower.

## Messages from the computer

The link works both ways: the computer can send text to the board, which reads it with `Serial.available()` and `Serial.read()`. That is how a PC program can send commands such as `speed 40` to a machine (unit B8). The simulator does not deliver typed text to `Serial.read()` yet.

::: kid
The board has no screen. It can send words to your computer.

Start with `Serial.begin(9600);` in setup.

Then `Serial.println` sends words or numbers.

They show up under your program.

This helps you see what the board is doing.
:::

```arduino {role=example file=counter.ino}
int count = 0;

void setup() {
    Serial.begin(9600);
    Serial.println("Counting presses...");
}

void loop() {
    count++;
    Serial.print("Loop number ");
    Serial.print(count);
    Serial.print(" at ");
    Serial.print(millis());
    Serial.println(" ms");
    delay(2500);
}
```

::: try
Write a seconds counter. When the board starts, it prints `Ready`. Then every second it prints how many seconds have passed: `Seconds: 1`, `Seconds: 2`, and so on.
:::

::: try-kid
When the board starts, print "Ready".

Then every second, print how many seconds have passed.
:::

```arduino {role=starter file=seconds.ino}
int seconds = 0;

void setup() {
    // Start Serial and print Ready.
}

void loop() {
    // Every second, print the number of seconds so far.
}
```

```arduino {role=solution file=seconds.ino}
int seconds = 0;

void setup() {
    Serial.begin(9600);
    Serial.println("Ready");
}

void loop() {
    delay(1000);
    seconds++;
    Serial.print("Seconds: ");
    Serial.println(seconds);
}
```
