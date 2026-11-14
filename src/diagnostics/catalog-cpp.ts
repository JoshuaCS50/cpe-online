// Explanations for C++ errors, matched against what clang (WebAssembly build)
// reports. A starter set: more entries, and a test suite that runs each
// sample through the real compiler, are still to come.
//
// Order matters: specific entries first, the catch-all last.

import type { CatalogEntry } from "./types";

const CPP: CatalogEntry["languages"] = ["cpp"];

export const CPP_CATALOG: CatalogEntry[] = [
  {
    id: "cpp.missing-semicolon",
    languages: CPP,
    kind: "compile",
    pattern: /expected ';'/,
    title: "Missing semicolon ;",
    what: "A line of code is not finished: C++ expected a semicolon where the line ends.",
    why: "Every statement in C++ ends with ;. Without it, the next line is read as part of this one.",
    fix: ["Add ; at the end of the line shown (the marker points where it belongs)."],
    kid: { what: "A line is missing its full stop, the `;`.", fix: "Put `;` at the end of that line." },
    example: { before: "int x = 5\nstd::cout << x;", after: "int x = 5;\nstd::cout << x;" },
    tests: [{ source: "#include <iostream>\nint main() {\n    int x = 5\n    std::cout << x;\n    return 0;\n}\n", line: 3 }],
  },
  {
    id: "cpp.missing-std",
    languages: CPP,
    kind: "compile",
    pattern: /use of undeclared identifier '(?<name>cout|cin|endl|string|vector|getline)'/,
    title: (f) => `${f.name} needs std:: or an #include`,
    what: (f) => `C++ does not know ${f.name} here.`,
    why: "The standard library's names live in the std namespace and in headers such as <iostream>, <string> and <vector>.",
    fix: [(f) => `Write std::${f.name}, or add using namespace std; after the #include lines.`, "Check that the matching #include is at the top of the file."],
    kid: { what: (f) => `The computer does not know the word ${f.name} yet.`, fix: "Add `using namespace std;` at the top." },
    tests: [{ source: "#include <iostream>\nint main() {\n    cout << 5;\n    return 0;\n}\n", line: 3 }],
  },
  {
    id: "cpp.undeclared",
    languages: CPP,
    kind: "compile",
    pattern: /use of undeclared identifier '(?<name>[^']+)'/,
    title: (f) => `${f.name} has not been declared`,
    what: (f) => `The program uses ${f.name}, but nothing called ${f.name} exists at that point.`,
    why: "A variable or function must be declared before the line that uses it, with exactly the same spelling and capital letters.",
    fix: [(f) => `Check the spelling of ${f.name}.`, "Declare it before it is used, or move the use below the declaration."],
    kid: { what: (f) => `The computer does not know ${f.name}.`, fix: "Check the spelling. Make the box before you use it." },
    tests: [{ source: "#include <iostream>\nint main() {\n    std::cout << totl;\n    return 0;\n}\n", line: 3 }],
  },
  {
    id: "cpp.private-member",
    languages: CPP,
    kind: "compile",
    pattern: /'(?<name>[^']+)' is a private member of '(?<type>[^']+)'/,
    title: "That member is private",
    what: (f) => `${f.name} is private in ${f.type}, so code outside the class cannot use it.`,
    why: "Members under private: can only be used by the class's own functions. That keeps the object's data safe from mistakes elsewhere.",
    fix: ["Use one of the class's public functions instead.", "If outside code really needs it, add a public function to the class."],
    kid: { what: "That part of the object is kept private.", fix: "Ask the object with one of its public helpers." },
    tests: [{ source: "class Motor {\n    int rpm = 0;\n};\nint main() {\n    Motor m;\n    return m.rpm;\n}\n", line: 6 }],
  },
  {
    id: "cpp.no-member",
    languages: CPP,
    kind: "compile",
    pattern: /no member named '(?<name>[^']+)' in '(?<type>[^']+)'/,
    title: "No member with that name",
    what: (f) => `${f.type} has nothing called ${f.name}.`,
    why: "Member names must match the class or struct exactly, including capital letters.",
    fix: ["Compare the name with the class definition.", "If it is missing, add it to the class."],
    kid: { what: (f) => `There is no part called ${f.name}.`, fix: "Use a name from the class." },
    tests: [{ source: "struct Point {\n    int x;\n};\nint main() {\n    Point p;\n    return p.z;\n}\n", line: 6 }],
  },
  {
    id: "cpp.crash",
    languages: CPP,
    kind: "runtime",
    pattern: /(?<text>divide by zero|memory access out of bounds|unreachable|Maximum call stack size exceeded)/,
    title: "The program crashed while running",
    what: (f) => `The program stopped with "${f.text}".`,
    why: "divide by zero: a whole number was divided by 0. memory access out of bounds: an index or pointer went far outside its array. unreachable: the program stopped itself, for example vector::at with a bad position. Call stack: a recursion that never stops.",
    fix: ["Find the input that causes it and check the divisions, indexes and recursion.", "Print values just before the crash to see which one is wrong."],
    kid: { what: "The program crashed in the middle.", fix: "Check for dividing by 0 and boxes past the end." },
    tests: [{ source: "#include <iostream>\nint main() {\n    int a, b;\n    std::cin >> a >> b;\n    std::cout << a / b;\n    return 0;\n}\n", stdin: ["7 0"] }],
  },
  {
    id: "cpp.unknown",
    languages: CPP,
    pattern: /[\s\S]*/,
    confidence: "fallback",
    title: "The compiler found a problem",
    what: "The C++ compiler reported a problem this guide does not explain yet.",
    why: "The original message below is clang's own explanation. Its first line names the line and column.",
    fix: ["Read the first error in the original message, and look at that line.", "Fix the first error, then run again."],
    kid: { what: "The computer found a mistake.", fix: "Look closely at the marked line." },
    tests: [{ source: "int main() {\n    return undefined_function_here(;\n}\n" }],
  },
];
