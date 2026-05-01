// Example programs shown in the menu.

export const EXAMPLES = [
  {
    id: "c-hello",
    lang: "c",
    name: "Hello, World (C)",
    filename: "hello.c",
    code: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
  },
  {
    id: "c-input",
    lang: "c",
    name: "Scanf input (C)",
    filename: "greet.c",
    code: `#include <stdio.h>

int main() {
    char name[64];
    printf("What is your name? ");
    scanf("%s", name);
    printf("Hello, %s!\\n", name);
    return 0;
}
`,
  },
  {
    id: "c-loop",
    lang: "c",
    name: "Loops & sum (C)",
    filename: "sum.c",
    code: `#include <stdio.h>

int main() {
    int n;
    printf("How many numbers? ");
    scanf("%d", &n);

    int total = 0;
    for (int i = 1; i <= n; i++) {
        int x;
        scanf("%d", &x);
        total += x;
    }
    printf("Sum = %d\\n", total);
    return 0;
}
`,
  },
  {
    id: "c-array",
    lang: "c",
    name: "Array max (C)",
    filename: "array_max.c",
    code: `#include <stdio.h>

int main() {
    int a[] = {3, 7, 2, 9, 4, 1, 8};
    int n = sizeof(a) / sizeof(a[0]);
    int max = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] > max) max = a[i];
    }
    printf("Max = %d\\n", max);
    return 0;
}
`,
  },
  {
    id: "cpp-hello",
    lang: "cpp",
    name: "Hello, World (C++)",
    filename: "hello.cpp",
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
  },
  {
    id: "py-hello",
    lang: "python",
    name: "Hello, World (Python)",
    filename: "hello.py",
    code: `name = input("What is your name? ")
print(f"Hello, {name}!")
`,
  },
  {
    id: "java-hello",
    lang: "java",
    name: "Hello, World (Java)",
    filename: "Hello.java",
    code: `public class Hello {
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
