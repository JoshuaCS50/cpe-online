// Terms from the core track: thinking like a developer, the C language,
// decisions, loops, functions, debugging and testing habits. Keyed by the
// concept ids lessons list in their header. Written by hand, in plain words.

import type { GlossaryEntry } from "./types";

export const CORE_BASIC_TERMS: Record<string, GlossaryEntry> = {
  // Thinking like a developer
  program: {
    term: "Program",
    meaning: "A list of exact instructions a computer follows, one after another, to do a job.",
    usedFor: "Everything a computer, phone or microcontroller does is a program: games, washing machines, cars, websites.",
  },
  instructions: {
    term: "Instructions",
    meaning: "The single steps of a program. A computer does exactly what they say, nothing more and nothing less.",
    watchOut: "People fill in missing steps without noticing; a computer never does. Spell out every step.",
  },
  algorithm: {
    term: "Algorithm",
    meaning: "A step-by-step method that solves a problem and always finishes. A recipe is an algorithm for a meal.",
    usedFor: "Searching, sorting, route finding, controlling a motor: the method comes first, the code second.",
  },
  ipo: {
    term: "Input, process, output (IPO)",
    meaning: "A way to describe any program: what goes in, what it does with it, and what comes out.",
    howTo: "Before coding, write three lists: the inputs, the steps, the outputs. Gaps in the lists are gaps in the plan.",
  },
  input: {
    term: "Input",
    meaning: "Data a program receives from outside: typed text, a file, a sensor reading, a button press.",
    code: "scanf(\"%d\", &age);        // C\nage = int(input(\"Age? \"))  # Python",
    watchOut: "Input can be wrong or missing. Check it before trusting it.",
  },
  output: {
    term: "Output",
    meaning: "What a program gives back: text on the screen, a file, a lit LED, a moving motor.",
    code: "printf(\"%d\\n\", total);   // C\nprint(total)              # Python",
  },
  process: {
    term: "Process",
    meaning: "The work a program does between taking its input and giving its output: the calculations and decisions.",
  },
  flowchart: {
    term: "Flowchart",
    meaning: "A drawing of an algorithm: ovals for start and end, boxes for steps, diamonds for yes/no questions, arrows for the order.",
    usedFor: "Planning a program, explaining it to others, finding missing cases before writing code.",
  },
  pseudocode: {
    term: "Pseudocode",
    meaning: "An algorithm written in plain, code-like English, without worrying about the rules of a real language.",
    code: "SET total TO 0\nFOR each mark\n    ADD mark TO total\nPRINT total / count",
    usedFor: "Planning and exam answers; it turns into real code line by line.",
  },
  "trace-table": {
    term: "Trace table",
    meaning: "A table with one column per variable and one row per step, filled in by hand as you follow the program.",
    usedFor: "Predicting output, finding logic errors, checking loops without a computer.",
  },
  tracing: {
    term: "Tracing",
    meaning: "Following a program step by step, by hand or in a debugger, and writing down what each variable holds.",
    howTo: "Go one line at a time. Never skip a line because you think you know what it does.",
  },
  decomposition: {
    term: "Decomposition",
    meaning: "Breaking a big problem into small parts that can each be solved on their own.",
    usedFor: "Every real project: a robot becomes sensing, deciding and moving; each becomes functions.",
  },
  "top-down-design": {
    term: "Top-down design",
    meaning: "Starting with the whole job as a few big steps, then splitting each step until every piece is easy to code.",
    howTo: "Write main() as calls to functions that do not exist yet, then write each one.",
  },
  specification: {
    term: "Specification",
    meaning: "An exact description of what a program must do: its inputs, outputs and rules, including the unusual cases.",
    usedFor: "Agreeing with a customer or lecturer before coding, and writing tests from it.",
  },
  requirements: {
    term: "Requirements",
    meaning: "The things a program must do (and must not do), as the user needs them.",
    watchOut: "Unclear requirements lead to the right code for the wrong problem. Ask before you build.",
  },
  translation: {
    term: "Translation (between languages)",
    meaning: "Turning an algorithm or a program from one language into another, such as pseudocode to C, or C to Python.",
    howTo: "Translate the idea, not the words: each language has its own natural way to loop, read input and print.",
  },

  // Decisions and logic
  decision: {
    term: "Decision",
    meaning: "A point where a program chooses what to do next, based on a condition.",
    code: "if (temp > 30) {\n    fanOn();\n}",
  },
  condition: {
    term: "Condition",
    meaning: "A question with a yes or no answer, such as temp > 30. In C, 0 means false and anything else means true.",
  },
  logic: {
    term: "Logic",
    meaning: "The reasoning of a program: which conditions it checks and what it does for each answer.",
  },
  "true-false": {
    term: "True and false",
    meaning: "The two answers a condition can give. C uses 1 and 0 (or true and false from stdbool.h); Python uses True and False.",
    code: "#include <stdbool.h>\nbool done = false;",
  },
  "and-or-not": {
    term: "AND, OR, NOT",
    meaning: "Ways to join conditions. AND (&&): both must be true. OR (||): at least one. NOT (!): flips true and false.",
    code: "if (age >= 13 && age <= 19)  // a teenager\nif (!(door == OPEN))",
    watchOut: "Python spells them and, or, not.",
  },
  comparison: {
    term: "Comparison",
    meaning: "Checking how two values relate: == equal, != not equal, <, >, <=, >=.",
    watchOut: "Compare strings in C with strcmp, not ==; == compares their addresses.",
  },
  assignment: {
    term: "Assignment",
    meaning: "Storing a value in a variable with =. The right side is worked out first, then stored on the left.",
    code: "count = count + 1;",
  },
  "assignment-vs-comparison": {
    term: "= versus ==",
    meaning: "= stores a value; == asks whether two values are equal.",
    code: "if (x = 5)   // wrong: sets x to 5, always true\nif (x == 5)  // right: asks the question",
    watchOut: "Turn on compiler warnings: they catch an assignment inside an if.",
  },
  "assignment-vs-equality": {
    term: "Assignment versus equality",
    meaning: "x = 5 makes x equal to 5 from now on; x == 5 only checks whether it already is.",
  },
  precedence: {
    term: "Precedence",
    meaning: "The order operators are worked out in: * and / before + and -, comparisons before && and ||.",
    code: "2 + 3 * 4     // 14, not 20\n(2 + 3) * 4   // 20",
    howTo: "When unsure, add brackets. They cost nothing and make the meaning clear.",
  },
  arithmetic: {
    term: "Arithmetic",
    meaning: "Calculations with + - * / and % (remainder).",
    watchOut: "In C, int / int drops the fraction: 7 / 2 is 3. Use 7 / 2.0 to get 3.5.",
  },
  remainder: {
    term: "Remainder (%)",
    meaning: "What is left over after whole-number division: 17 % 5 is 2.",
    usedFor: "Even or odd (n % 2), wrapping around (index % size), taking digits off a number (n % 10).",
  },
  "division-by-zero": {
    term: "Division by zero",
    meaning: "Dividing by 0 has no answer. In C an integer division by zero crashes the program; Python raises ZeroDivisionError.",
    howTo: "Check the divisor first: if (count > 0) average = total / count;",
  },
  increment: {
    term: "Increment",
    meaning: "Adding one to a variable: count++ or count += 1. Decrement takes one away: count--.",
  },
  variable: {
    term: "Variable",
    meaning: "A named box in memory that holds one value, which can change while the program runs.",
    code: "int score = 0;\nscore = score + 10;",
  },
  variables: {
    term: "Variables",
    meaning: "Named places to keep values. In C each has a type (int, float, char) that sets what it can hold.",
  },
  type: {
    term: "Type",
    meaning: "What kind of value a variable holds and how much memory it uses: int for whole numbers, float and double for decimals, char for one character.",
    watchOut: "An int has limits (often ±2.1 billion); going past them wraps around without warning.",
  },
  character: {
    term: "Character (char)",
    meaning: "One letter, digit or symbol, stored as a small number (its ASCII code). 'A' is 65.",
    code: "char grade = 'A';\nprintf(\"%c\", grade);",
    watchOut: "Single quotes for one char ('A'), double quotes for a string (\"A\").",
  },
  "initial-values": {
    term: "Initial values",
    meaning: "The value a variable starts with. In C a local variable that is never given one holds leftover garbage.",
    howTo: "Give every variable a value when you create it: int total = 0;",
  },
  naming: {
    term: "Naming",
    meaning: "Choosing names that say what a thing is or does: totalMarks, not t; isPressed, not flag.",
    usedFor: "Code is read far more often than it is written. Good names are free documentation.",
  },
  "magic-numbers": {
    term: "Magic numbers",
    meaning: "Unexplained numbers in code, like if (x > 37). Nobody knows what 37 means or where else it is used.",
    howTo: "Give them names: const int MAX_STUDENTS = 37; or #define MAX_STUDENTS 37.",
  },
  define: {
    term: "#define",
    meaning: "Tells the preprocessor to replace a name with text before compiling. Often used for constants.",
    code: "#define PI 3.14159\n#define MAX 100",
    watchOut: "No = and no semicolon. A const variable is often safer because it has a type.",
  },
  comments: {
    term: "Comments",
    meaning: "Notes for people that the compiler ignores: // to the end of the line, or /* ... */.",
    howTo: "Explain why, not what. The code already says what it does.",
  },
  main: {
    term: "main()",
    meaning: "The function where every C and C++ program starts. Its return value tells the system whether it worked (0 means OK).",
    code: "int main(void) {\n    return 0;\n}",
  },
  block: {
    term: "Block",
    meaning: "Statements grouped in { } in C (or by indentation in Python). A block runs as one unit and has its own scope.",
  },
  scope: {
    term: "Scope",
    meaning: "The part of the program where a name can be used. A variable made inside a block or function only exists there.",
    watchOut: "Two variables with the same name in different scopes are different variables.",
  },
  "local-variable": {
    term: "Local variable",
    meaning: "A variable made inside a function. It exists only while the function runs and other functions cannot see it.",
  },
  "global-variable": {
    term: "Global variable",
    meaning: "A variable made outside all functions, which every function can read and change.",
    watchOut: "Any function might change it, which makes bugs hard to trace. Prefer parameters and return values.",
  },
  lifetime: {
    term: "Lifetime",
    meaning: "How long a variable exists: locals until their function returns, globals and statics for the whole run, malloc'd memory until free.",
  },

  // Choosing
  if: {
    term: "if",
    meaning: "Runs a block only when its condition is true.",
    code: "if (mark >= 50) {\n    printf(\"Pass\\n\");\n}",
  },
  else: {
    term: "else",
    meaning: "The block that runs when the if's condition is false.",
  },
  "else-if": {
    term: "else if",
    meaning: "Tests another condition when the ones before it were false. Only the first true branch runs.",
    code: "if (mark >= 75) grade = 'A';\nelse if (mark >= 60) grade = 'B';\nelse grade = 'C';",
    watchOut: "Order matters: put the narrowest test first.",
  },
  ladder: {
    term: "if-else ladder",
    meaning: "A chain of if ... else if ... else that picks exactly one of many options.",
  },
  switch: {
    term: "switch",
    meaning: "Picks one of several blocks by comparing a whole number or char with fixed values.",
    code: "switch (choice) {\n    case 1: start(); break;\n    case 2: stop(); break;\n    default: printf(\"?\\n\");\n}",
  },
  case: {
    term: "case",
    meaning: "One value a switch can match. Running continues from that case until a break.",
    watchOut: "Forgetting break makes it fall through into the next case.",
  },
  default: {
    term: "default",
    meaning: "The part of a switch that runs when no case matches. Use it to catch unexpected values.",
  },
  break: {
    term: "break",
    meaning: "Leaves the nearest loop or switch straight away.",
  },
  continue: {
    term: "continue",
    meaning: "Skips the rest of this pass of a loop and goes on to the next one.",
  },

  // Repeating
  while: {
    term: "while loop",
    meaning: "Repeats a block as long as its condition is true. The condition is checked before each pass.",
    code: "while (count < 10) {\n    count++;\n}",
  },
  "do-while": {
    term: "do-while loop",
    meaning: "Like while, but the condition is checked after each pass, so the block always runs at least once.",
    usedFor: "Menus and asking for input until it is valid.",
  },
  for: {
    term: "for loop",
    meaning: "A loop with its start, condition and step on one line. Best when you know how many times to repeat.",
    code: "for (int i = 0; i < 10; i++) {\n    printf(\"%d\\n\", i);\n}",
  },
  "loop-control": {
    term: "Loop control",
    meaning: "What decides how often a loop runs: its condition, and break and continue inside it.",
  },
  "infinite-loop": {
    term: "Infinite loop",
    meaning: "A loop whose condition never becomes false, so it never ends.",
    watchOut: "Usually a bug (forgot to change the counter), but on a microcontroller loop() runs forever on purpose.",
  },
  "nested-loop": {
    term: "Nested loop",
    meaning: "A loop inside another loop. The inner loop runs completely for every pass of the outer one.",
    usedFor: "Tables, grids, 2D arrays, comparing every pair of items.",
  },
  counter: {
    term: "Counter",
    meaning: "A variable that counts how many times something happened: start at 0, add 1 each time.",
  },
  accumulator: {
    term: "Accumulator",
    meaning: "A variable that collects a running result, such as a total: start at 0, add each value to it.",
    code: "int total = 0;\nfor (int i = 0; i < n; i++) total += marks[i];",
  },
  sum: {
    term: "Sum",
    meaning: "The total of a set of numbers, built with an accumulator.",
  },
  average: {
    term: "Average (mean)",
    meaning: "The sum divided by how many values there are.",
    watchOut: "Divide as a decimal (total / (double)count) and check count is not 0.",
  },
  maximum: {
    term: "Maximum",
    meaning: "The largest value. Start with the first value as the best so far, then replace it whenever a bigger one turns up.",
    watchOut: "Starting the best-so-far at 0 fails when every value is negative.",
  },
  minimum: {
    term: "Minimum",
    meaning: "The smallest value, found the same way as the maximum with < instead of >.",
  },
  sentinel: {
    term: "Sentinel value",
    meaning: "A special input that means \"stop\", such as -1 when reading marks.",
    watchOut: "Do not count or add the sentinel itself.",
  },
  pattern: {
    term: "Pattern",
    meaning: "A common shape of code that solves a common problem, such as count, total, find the largest, or search.",
  },
  state: {
    term: "State",
    meaning: "What a program remembers between steps: the values of its variables at one moment.",
    usedFor: "Traffic lights, menus, games: what to do next depends on the current state.",
  },

  // Functions
  function: {
    term: "Function",
    meaning: "A named block of code that does one job. You call it by its name, give it inputs, and it can return a result.",
    code: "int square(int x) {\n    return x * x;\n}",
    usedFor: "Avoiding repeated code, splitting a big program into understandable pieces, testing pieces on their own.",
  },
  call: {
    term: "Function call",
    meaning: "Running a function by writing its name with values in brackets. The program jumps there and comes back when it finishes.",
  },
  parameter: {
    term: "Parameter",
    meaning: "A variable in a function's header that receives a value when the function is called.",
  },
  "argument-passing": {
    term: "Arguments",
    meaning: "The actual values given to a function when it is called. They are matched to the parameters by position.",
  },
  "return-value": {
    term: "Return value",
    meaning: "The result a function hands back with return. The call is replaced by this value.",
    code: "int area = width(r) * height(r);",
  },
  void: {
    term: "void",
    meaning: "\"Nothing\": a void function returns no value, and (void) in a header means it takes no parameters.",
  },
  prototype: {
    term: "Function prototype",
    meaning: "A function's header followed by a semicolon, written before main so the compiler knows the function exists.",
    code: "int square(int x);",
  },
  reuse: {
    term: "Reuse",
    meaning: "Using one piece of code in many places instead of copying it. Fix a bug once, and it is fixed everywhere.",
  },
  stub: {
    term: "Stub",
    meaning: "A placeholder function that returns a fixed value, so the rest of the program can be built and tested first.",
  },
  "pass-by-value": {
    term: "Pass by value",
    meaning: "The function gets a copy of the argument. Changing the copy does not change the caller's variable.",
    watchOut: "That is why a swap(a, b) with plain ints does not work in C.",
  },
  "out-parameter": {
    term: "Out parameter",
    meaning: "A pointer parameter a function writes its result through, to give back more than one value.",
    code: "void minMax(int a[], int n, int *min, int *max);",
  },
  recursion: {
    term: "Recursion",
    meaning: "A function that calls itself on a smaller version of the same problem until it reaches a case it can answer directly.",
    code: "int fact(int n) {\n    if (n <= 1) return 1;\n    return n * fact(n - 1);\n}",
  },
  "base-case": {
    term: "Base case",
    meaning: "The case a recursive function answers without calling itself. Without it, the calls never stop.",
  },
  "call-stack": {
    term: "Call stack",
    meaning: "The memory that holds a frame for every function call that has not finished yet, newest on top.",
    watchOut: "Recursion that goes too deep fills it up: a stack overflow.",
  },
  frames: {
    term: "Stack frame",
    meaning: "The space one function call uses on the call stack: its parameters, local variables and where to return to.",
  },

  // Input and output details
  "format-string": {
    term: "Format string",
    meaning: "Text with placeholders that are filled with values: %d whole number, %f decimal, %c char, %s string.",
    code: "printf(\"%-10s %5.1f\\n\", name, mark);   // C\nprint(f\"{name:<10} {mark:5.1f}\")         # Python",
  },
  "input-checking": {
    term: "Input checking",
    meaning: "Making sure input is the right kind and in range before using it.",
  },
  "input-validation": {
    term: "Input validation",
    meaning: "Rejecting input that breaks the rules and asking again, instead of carrying on with bad data.",
    code: "while (scanf(\"%d\", &age) != 1 || age < 0) {\n    printf(\"Try again: \");\n    while (getchar() != '\\n');\n}",
  },
  validation: {
    term: "Validation",
    meaning: "Checking that data makes sense: in range, the right type, the right length.",
  },
  "scanf-result": {
    term: "scanf's return value",
    meaning: "scanf returns how many values it read successfully, or EOF at the end of input.",
    howTo: "Check it: if (scanf(\"%d\", &n) != 1) { /* not a number */ }",
  },
  "missing-ampersand": {
    term: "Missing & in scanf",
    meaning: "scanf needs the address of the variable (&x) so it can store the value there. Without & it writes to a random place.",
    watchOut: "Strings (char arrays) are the exception: the array name is already an address.",
  },
  "command-input": {
    term: "Command input",
    meaning: "Text commands a program reads and acts on, such as \"add 5\" or \"quit\".",
  },
  "argc-argv": {
    term: "argc and argv",
    meaning: "main's parameters for command-line arguments: argc counts them, argv holds them as strings. argv[0] is the program's name.",
    code: "int main(int argc, char *argv[])",
  },

  // Bugs and debugging
  bug: {
    term: "Bug",
    meaning: "A mistake in a program that makes it do the wrong thing or stop.",
  },
  "syntax-error": {
    term: "Syntax error",
    meaning: "Code that breaks the language's grammar, like a missing semicolon. The compiler refuses to build it.",
  },
  "runtime-error": {
    term: "Runtime error",
    meaning: "An error that only shows up while the program runs, such as dividing by zero or using a bad pointer.",
  },
  "logic-error": {
    term: "Logic error",
    meaning: "The program runs but gives the wrong answer, because the steps are wrong. No error message helps you.",
    howTo: "Trace by hand or in a debugger and compare with what you expected.",
  },
  "error-message": {
    term: "Error message",
    meaning: "The compiler's or interpreter's report of a problem: file, line, and a description.",
    howTo: "Read it slowly. The line it names is where it noticed the problem; the cause may be just above.",
  },
  "first-error": {
    term: "Fix the first error first",
    meaning: "One mistake can cause a cascade of later errors. Fix the first one and build again.",
  },
  "line-number": {
    term: "Line number",
    meaning: "Where in the file the compiler found a problem.",
  },
  "stray-semicolon": {
    term: "Stray semicolon",
    meaning: "A ; straight after if (...) or for (...) ends the statement there, so the block below always runs or runs only once.",
    code: "if (x > 5);      // wrong\n{\n    ...\n}",
  },
  "off-by-one": {
    term: "Off-by-one error",
    meaning: "Going one step too far or stopping one too early, such as i <= 10 on a 10-element array.",
    howTo: "Check the first and last pass of every loop.",
  },
  "common-bugs": {
    term: "Common bugs",
    meaning: "Mistakes almost everyone makes: = for ==, off-by-one, uninitialised variables, missing break, missing &.",
  },
  "edge-cases": {
    term: "Edge cases",
    meaning: "Unusual inputs at the limits: empty, zero, one item, the largest value, negative numbers.",
    usedFor: "Writing tests that catch the bugs ordinary inputs miss.",
  },
  boundary: {
    term: "Boundary",
    meaning: "The point where behaviour changes, such as 50 for pass or fail.",
  },
  "boundary-values": {
    term: "Boundary values",
    meaning: "Test inputs on and either side of a boundary: 49, 50 and 51.",
  },
  debugger: {
    term: "Debugger",
    meaning: "A tool that runs a program one step at a time and shows every variable as it changes.",
  },
  breakpoint: {
    term: "Breakpoint",
    meaning: "A marked line where the debugger pauses the program, so you can look at its state.",
  },
  "step-into": {
    term: "Step into",
    meaning: "Run the next line; if it calls a function, go inside that function.",
  },
  "step-over": {
    term: "Step over",
    meaning: "Run the next line, including any function it calls, as one step.",
  },
  "step-out": {
    term: "Step out",
    meaning: "Run the rest of the current function and pause where it returns to.",
  },
  "inspect-state": {
    term: "Inspecting state",
    meaning: "Looking at variables while the program is paused, to compare what they hold with what you expected.",
  },
  "variables-panel": {
    term: "Variables panel",
    meaning: "The part of a debugger that lists the variables in scope and their current values.",
  },
  "print-debugging": {
    term: "Print debugging",
    meaning: "Adding temporary printf or print lines to see which code runs and what the values are.",
    watchOut: "Remove them, or put them behind a debug flag, when done.",
  },
  "debug-flag": {
    term: "Debug flag",
    meaning: "A constant that switches extra debug output on or off without deleting it.",
    code: "#define DEBUG 1\nif (DEBUG) printf(\"i=%d\\n\", i);",
  },
  "debug-method": {
    term: "A debugging method",
    meaning: "Reproduce the bug, form a guess about the cause, test the guess, fix, then test again.",
  },
  "debugging-practice": {
    term: "Debugging practice",
    meaning: "Finding bugs is a skill that improves with a method and with practice.",
  },
  hypothesis: {
    term: "Hypothesis",
    meaning: "A specific guess about a bug's cause that you can test: \"total is wrong because it is never reset\".",
  },
  reproduce: {
    term: "Reproduce",
    meaning: "Find the exact input and steps that make the bug happen every time. A bug you can repeat is half fixed.",
  },
  isolate: {
    term: "Isolate",
    meaning: "Narrow down where the bug lives, by halving the code or the input until only the faulty part is left.",
  },
  "rubber-duck": {
    term: "Rubber duck debugging",
    meaning: "Explaining your code line by line to someone, or something, else. Saying it out loud often reveals the bug.",
  },
  explaining: {
    term: "Explaining code",
    meaning: "Describing what each part of a program does in plain words. If you cannot explain it, you do not yet understand it.",
  },
  "bug-notebook": {
    term: "Bug notebook",
    meaning: "A list of the bugs you have made and how you found them. Patterns appear, and you stop repeating them.",
  },
  "small-steps": {
    term: "Small steps",
    meaning: "Write a little, build, test, repeat. A bug is then always in the few lines you just added.",
  },

  // Testing and habits
  testing: {
    term: "Testing",
    meaning: "Running a program with chosen inputs and checking the outputs are what they should be.",
  },
  "test-cases": {
    term: "Test cases",
    meaning: "Pairs of input and expected output. Include normal, boundary and wrong inputs.",
  },
  "test-harness": {
    term: "Test harness",
    meaning: "Code that calls your functions with test inputs and reports which tests passed.",
  },
  "unit-testing": {
    term: "Unit testing",
    meaning: "Testing each function on its own, so a failure points straight at the faulty unit.",
  },
  "regression-testing": {
    term: "Regression testing",
    meaning: "Running all the old tests again after a change, to catch anything the change broke.",
  },
  assertions: {
    term: "Assertions",
    meaning: "Checks in code that stop the program if something that must be true is false.",
    code: "#include <assert.h>\nassert(count >= 0);",
  },
  "defensive-programming": {
    term: "Defensive programming",
    meaning: "Writing code that expects bad input and impossible states and handles them safely.",
  },
  refactoring: {
    term: "Refactoring",
    meaning: "Improving the structure of code (names, functions, repetition) without changing what it does.",
    howTo: "Have tests first, change in small steps, and run the tests after each one.",
  },
};
