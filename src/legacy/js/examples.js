// CPE150S example programs. Comments mirror the analogies from the
// CPE150S cheat sheet PDF so students see the same language in the IDE
// that they read in the handout.

export const EXAMPLES = [
  // ───────── C ─────────
  {
    id: "c-hello",
    lang: "c",
    name: "Hello, World — recipe book",
    filename: "hello.c",
    code: `// CPE150S — C is like a recipe book. Follow 4 steps:
//   Step 1: pack your toolbox  -> #include <stdio.h>
//   Step 2: open the front door -> int main()
//   Step 3: write the steps inside { ... }
//   Step 4: close the door     -> return 0;

#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
  },
  {
    id: "c-year-of-birth",
    lang: "c",
    name: "Year of Birth — your age in 2026",
    filename: "year_of_birth.c",
    code: `// CPE150S — Variables are kitchen containers.
//   int = a box for whole apples.
//   We ask the user for their birth year (a whole number),
//   then subtract from the current year.

#include <stdio.h>

int main() {
    int year;
    printf("Enter your year of birth: ");
    scanf("%d", &year);   // & = "store the value HERE in memory"

    int age = 2026 - year;
    printf("In 2026 you are %d years old.\\n", age);
    return 0;
}
`,
  },
  {
    id: "c-positive-negative",
    lang: "c",
    name: "Positive / Negative checker",
    filename: "pos_neg.c",
    code: `// CPE150S — IF-ELSE = "what to wear today?"
//   IF raining   -> umbrella
//   ELSE IF sunny -> sunglasses
//   ELSE          -> normal jacket
// Watch out: == compares, =  assigns. Don't mix them up!

#include <stdio.h>

int main() {
    int n;
    printf("Type a number: ");
    scanf("%d", &n);

    if (n > 0) {
        printf("%d is POSITIVE.\\n", n);
    } else if (n < 0) {
        printf("%d is NEGATIVE.\\n", n);
    } else {
        printf("Zero is neither positive nor negative.\\n");
    }
    return 0;
}
`,
  },
  {
    id: "c-even-odd",
    lang: "c",
    name: "Even/Odd ternary",
    filename: "even_odd.c",
    code: `// CPE150S — Ternary = ordering food.
//   Hungry? YES -> pizza : NO -> water
// Shape:  condition ? value-if-true : value-if-false

#include <stdio.h>

int main() {
    int n;
    printf("Number? ");
    scanf("%d", &n);

    // n % 2 == 0  is true when n is even.
    printf("%d is %s.\\n", n, (n % 2 == 0) ? "Even" : "Odd");
    return 0;
}
`,
  },
  {
    id: "c-biggest-of-4",
    lang: "c",
    name: "Biggest of 4 numbers",
    filename: "biggest_of_4.c",
    code: `// CPE150S — Track the running winner.
//   Start by assuming the first number is the biggest,
//   then dethrone it whenever a bigger one shows up.

#include <stdio.h>

int main() {
    int a, b, c, d, max;
    printf("Enter 4 numbers separated by spaces: ");
    scanf("%d %d %d %d", &a, &b, &c, &d);

    max = a;
    if (b > max) max = b;
    if (c > max) max = c;
    if (d > max) max = d;

    printf("Biggest = %d\\n", max);
    return 0;
}
`,
  },
  {
    id: "c-sum-loop",
    lang: "c",
    name: "Sum loop (merry-go-round)",
    filename: "sum.c",
    code: `// CPE150S — Loops are a merry-go-round.
//   Write the steps once, but do many turns.
// We collect N numbers and add them up.

#include <stdio.h>

int main() {
    int n, total = 0;
    printf("How many numbers? ");
    scanf("%d", &n);

    for (int i = 1; i <= n; i++) {
        int x;
        printf("Number %d: ", i);
        scanf("%d", &x);
        total += x;            // total = total + x
    }

    printf("Sum = %d\\n", total);
    return 0;
}
`,
  },
  {
    id: "c-array-average",
    lang: "c",
    name: "Array average (lockers)",
    filename: "average.c",
    code: `// CPE150S — Arrays are a row of school lockers,
//   numbered starting from 0 (not 1).
// Note the (float) cast — without it, integer division
// throws away the fractional part of the average.

#include <stdio.h>

int main() {
    int marks[] = {72, 85, 91, 64, 78};
    int n = sizeof(marks) / sizeof(marks[0]);
    int sum = 0;

    for (int i = 0; i < n; i++) {
        sum += marks[i];
    }

    float average = (float) sum / n;
    printf("Average = %.2f\\n", average);
    return 0;
}
`,
  },
  {
    id: "c-switch-calc",
    lang: "c",
    name: "Switch calculator",
    filename: "calc.c",
    code: `// CPE150S — switch is a multi-way IF.
//   Each case ends with break; otherwise it "falls through"
//   to the next case. default = ELSE.

#include <stdio.h>

int main() {
    double a, b;
    char op;
    printf("Enter: number op number (e.g. 12 + 5): ");
    scanf("%lf %c %lf", &a, &op, &b);

    switch (op) {
        case '+': printf("= %.2f\\n", a + b); break;
        case '-': printf("= %.2f\\n", a - b); break;
        case '*': printf("= %.2f\\n", a * b); break;
        case '/':
            if (b == 0.0) printf("Cannot divide by zero!\\n");
            else printf("= %.2f\\n", a / b);
            break;
        default: printf("Unknown operator '%c'.\\n", op);
    }
    return 0;
}
`,
  },
  {
    id: "c-arduino-template",
    lang: "c",
    name: "Arduino blink (template)",
    filename: "blink.c",
    code: `// CPE150S → Embedded systems bridge.
// On a real Arduino, the structure is:
//
//   void setup() {     // runs ONCE at power-on
//       pinMode(LED, OUTPUT);
//   }
//
//   void loop() {      // runs FOREVER
//       digitalWrite(LED, HIGH);
//       delay(500);
//       digitalWrite(LED, LOW);
//       delay(500);
//   }
//
// In plain C the equivalent is "do setup, then while(1) { loop }":

#include <stdio.h>

void setup() {
    printf("[setup] LED pin set to OUTPUT.\\n");
}

void loop_step(int n) {
    printf("[loop %d] LED ON\\n", n);
    printf("[loop %d] LED OFF\\n", n);
}

int main() {
    setup();
    // Real Arduino: while (1) { loop_step(...); }
    // Here we just simulate 3 ticks so the program ends.
    for (int i = 1; i <= 3; i++) loop_step(i);
    return 0;
}
`,
  },

  // ───────── C++ ─────────
  {
    id: "cpp-hello",
    lang: "cpp",
    name: "Hello, World (C++)",
    filename: "hello.cpp",
    code: `// CPE150S — Same recipe, C++ flavour.
//   <iostream> brings in the I/O streams (cin, cout).
//   "using namespace std" lets us drop the std:: prefix.

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
  },

  // ───────── Python ─────────
  {
    id: "py-hello",
    lang: "python",
    name: "Hello, Python",
    filename: "hello.py",
    code: `# Python equivalent of the C "Hello, World".
# input() reads a line; print() writes one.

name = input("What is your name? ")
print(f"Hello, {name}!")
`,
  },

  // ───────── Java ─────────
  {
    id: "java-hello",
    lang: "java",
    name: "Hello, Java",
    filename: "Hello.java",
    code: `// Java equivalent. The Java runner is preview-only in CPE Online v2;
// you can edit and save the file but execution is coming soon.

public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  },
];

export function findExample(id) {
  return EXAMPLES.find((ex) => ex.id === id);
}
