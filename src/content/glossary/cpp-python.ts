// Terms from the C++ bridge and the Python lessons.

import type { GlossaryEntry } from "./types";

export const CPP_PYTHON_TERMS: Record<string, GlossaryEntry> = {
  // C++
  cpp: {
    term: "C++",
    meaning: "A language built on C that adds classes, references, overloading and a large standard library. Arduino sketches are C++.",
    usedFor: "Games, robotics, embedded firmware, simulators, anything that must be fast.",
  },
  iostream: {
    term: "iostream",
    meaning: "The C++ header for input and output streams: cout, cin and cerr.",
    code: "#include <iostream>",
  },
  cout: {
    term: "cout",
    meaning: "The C++ output stream. << sends values to it, in order, without format codes.",
    code: "std::cout << \"Total: \" << total << \"\\n\";",
  },
  cin: {
    term: "cin",
    meaning: "The C++ input stream. >> reads a value into a variable of any type.",
    code: "int age;\nstd::cin >> age;\nif (!std::cin) { /* not a number */ }",
  },
  iomanip: {
    term: "iomanip",
    meaning: "The C++ header for formatting output: setw for width, setprecision and fixed for decimals.",
    code: "std::cout << std::fixed << std::setprecision(2) << price;",
  },
  namespace: {
    term: "Namespace",
    meaning: "A named group that keeps names apart. The standard library lives in std, so cout is std::cout.",
    watchOut: "using namespace std; is handy in small programs but can cause name clashes in big ones.",
  },
  reference: {
    term: "Reference (&)",
    meaning: "Another name for an existing variable. A reference parameter lets a function change the caller's variable without pointers.",
    code: "void addOne(int &x) { x++; }",
  },
  alias: {
    term: "Alias",
    meaning: "A second name for the same thing in memory. Changing it through either name changes it for both.",
  },
  "const-reference": {
    term: "const reference",
    meaning: "A reference the function promises not to change: no copy is made, and the caller's value is safe.",
    code: "void show(const std::string &name);",
  },
  overloading: {
    term: "Overloading",
    meaning: "Several functions with the same name but different parameter types. The compiler picks the one that matches.",
    code: "int area(int side);\nint area(int w, int h);",
  },
  "default-arguments": {
    term: "Default arguments",
    meaning: "A value a parameter takes when the caller leaves it out. Works in C++ and Python.",
    code: "void beep(int ms = 100);      // C++\ndef beep(ms=100):              # Python",
  },
  signatures: {
    term: "Signature",
    meaning: "A function's name with its parameter types. Overloads must differ in their signatures.",
  },
  vector: {
    term: "vector",
    meaning: "C++'s growable array: it keeps track of its own size and grows as you add items.",
    code: "std::vector<int> marks;\nmarks.push_back(75);\nmarks.size();",
  },
  "push-back": {
    term: "push_back",
    meaning: "Adds an item to the end of a vector, growing it if needed.",
  },
  "range-for": {
    term: "Range-based for",
    meaning: "A C++ loop that visits every element of a container without an index.",
    code: "for (int m : marks) total += m;",
  },
  class: {
    term: "Class",
    meaning: "A type that bundles data and the functions that work on it. Servo and Serial in Arduino are classes.",
    code: "class Counter {\npublic:\n    void add() { count++; }\nprivate:\n    int count = 0;\n};",
  },
  object: {
    term: "Object",
    meaning: "One variable made from a class. Many objects can be made from one class, each with its own data.",
  },
  "member-function": {
    term: "Member function (method)",
    meaning: "A function that belongs to a class and works on an object's data, called with a dot: servo.write(90).",
  },
  constructor: {
    term: "Constructor",
    meaning: "A special member function with the class's name that runs when an object is made, to give it its starting values.",
  },
  public: {
    term: "public",
    meaning: "Members any code can use: the class's interface.",
  },
  private: {
    term: "private",
    meaning: "Members only the class's own functions can use, so no outside code can put the object in a bad state.",
  },
  encapsulation: {
    term: "Encapsulation",
    meaning: "Keeping an object's data private and changing it only through its functions, which can check every change.",
  },
  "standard-library": {
    term: "Standard library",
    meaning: "The ready-made functions and types that come with a language: string, vector and algorithms in C++; math, random and many more in Python.",
    howTo: "Look in it before writing something yourself: it is tested and fast.",
  },

  // Python
  "python-syntax": {
    term: "Python syntax",
    meaning: "Python uses indentation instead of braces, no semicolons, and no type declarations.",
    code: "if mark >= 50:\n    print(\"Pass\")",
  },
  indentation: {
    term: "Indentation",
    meaning: "The spaces at the start of a line. In Python they decide which lines belong to an if, loop or function.",
    watchOut: "Use four spaces and never mix tabs with spaces.",
  },
  "dynamic-types": {
    term: "Dynamic types",
    meaning: "In Python a variable has no fixed type; it takes the type of whatever value it holds now.",
    watchOut: "input() always gives a str. Convert it: int(input()).",
  },
  "if-elif": {
    term: "if / elif / else",
    meaning: "Python's way of choosing between several branches. elif is short for else if.",
  },
  "for-range": {
    term: "for with range",
    meaning: "Repeats a block for each number in a range. range(5) gives 0 to 4; range(1, 6) gives 1 to 5.",
    code: "for i in range(5):\n    print(i)",
  },
  def: {
    term: "def",
    meaning: "Starts a function definition in Python.",
    code: "def square(x):\n    return x * x",
  },
  return: {
    term: "return",
    meaning: "Ends a function and hands a value back. A Python function without return gives None.",
  },
  "keyword-arguments": {
    term: "Keyword arguments",
    meaning: "Passing arguments by name, so the order does not matter and the call explains itself.",
    code: "print(\"a\", \"b\", sep=\", \")",
  },
  list: {
    term: "list",
    meaning: "Python's ordered, growable collection. It can hold any mix of values.",
    code: "marks = [70, 82, 55]\nmarks[0]     # 70\nlen(marks)   # 3",
  },
  append: {
    term: "append",
    meaning: "Adds an item to the end of a list (or, for files, writing to the end with mode \"a\").",
    code: "marks.append(91)",
  },
  slicing: {
    term: "Slicing",
    meaning: "Taking part of a list or string with [start:end]. The end is not included.",
    code: "word[0:3]   # first three\nmarks[-1]   # last item",
  },
  tuple: {
    term: "tuple",
    meaning: "An ordered collection that cannot be changed after it is made, written with brackets ( ).",
    code: "point = (3, 4)\nx, y = point",
  },
  dict: {
    term: "dict",
    meaning: "Python's key-to-value table, such as names to marks. Looking up a key is fast.",
    code: "ages = {\"Ada\": 36}\nages[\"Ada\"]   # 36",
  },
  split: {
    term: "split",
    meaning: "Breaks a string into a list of pieces, at spaces or at a separator you choose.",
    code: "\"3,4,5\".split(\",\")   # ['3', '4', '5']",
  },
  counting: {
    term: "Counting",
    meaning: "Tallying how often each thing appears, often with a dict.",
    code: "counts[word] = counts.get(word, 0) + 1",
  },
  import: {
    term: "import",
    meaning: "Brings in a module so its functions can be used.",
    code: "import math\nmath.sqrt(16)",
  },
  modules: {
    term: "Modules",
    meaning: "Python files of ready-made code. Your own .py files can be imported as modules too.",
  },
  math: {
    term: "math module",
    meaning: "Python's module of maths functions and constants: sqrt, sin, cos, pi, floor and more.",
  },
  "name-main": {
    term: "if __name__ == \"__main__\"",
    meaning: "Code under this line runs only when the file is run directly, not when it is imported as a module.",
  },
  open: {
    term: "open",
    meaning: "Opens a file in Python and returns a file object. Modes are like C's: \"r\", \"w\", \"a\".",
    code: "with open(\"data.txt\") as f:\n    text = f.read()",
  },
  with: {
    term: "with",
    meaning: "Opens something (such as a file) and closes it automatically when the block ends, even after an error.",
  },
  readlines: {
    term: "readlines",
    meaning: "Reads all the lines of a file into a list. Looping over the file itself does the same, one line at a time.",
  },
  write: {
    term: "write",
    meaning: "Writes a string to a file. It does not add a newline for you.",
    code: "f.write(f\"{name},{mark}\\n\")",
  },
  exceptions: {
    term: "Exceptions",
    meaning: "Python's way of reporting errors at run time. try ... except catches them so the program can recover.",
    code: "try:\n    n = int(text)\nexcept ValueError:\n    print(\"Not a number\")",
  },
  "choosing-a-language": {
    term: "Choosing a language",
    meaning: "C for small, fast code close to the hardware; C++ for big fast programs and Arduino; Python for quick scripts, data and tools.",
  },
};
