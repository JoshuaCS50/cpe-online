// Broken C programs used to pin down the legacy runner's error messages.
//
// Every expectation below was read from a real run of runLegacyC against the
// vendored JSCPP bundle. Programs appear in ERROR_RULES table order; the
// fallback program comes last. Rules that the bundle cannot produce are
// recorded in UNREACHED_TITLES instead.

export interface BrokenProgram {
  /** Short kebab-case id, unique, for example "missing-semicolon". */
  id: string;
  /** One sentence: the beginner mistake this program contains. */
  mistake: string;
  /** Complete C source. Keep it under 15 lines. */
  source: string;
  /** Input lines to queue before the run, each ending in "\n". Omit if the program reads nothing. */
  stdin?: string;
  /** Exact friendly title the legacy runner shows for this program. */
  expectTitle: string;
  /** 1-based line the legacy runner highlights, or null if it highlights none. */
  expectLine: number | null;
}

export const BROKEN_PROGRAMS: readonly BrokenProgram[] = [
  {
    id: "missing-opening-parenthesis",
    mistake: "The if keyword is not followed by an opening parenthesis.",
    source: '#include <stdio.h>\nint main() {\n    int x = 3;\n    if x > 0 {\n        printf("yes\\n");\n    }\n    return 0;\n}\n',
    expectTitle: "Missing opening parenthesis",
    expectLine: 4,
  },
  {
    id: "empty-argument-list",
    mistake: "main is declared with void in the parameter list.",
    source: '#include <stdio.h>\nint main(void) {\n    printf("hi\\n");\n    return 0;\n}\n',
    expectTitle: "Empty argument list problem",
    expectLine: 2,
  },
  {
    id: "scanf-wrong-argument",
    mistake: "scanf is called with a number instead of a format string.",
    source: "#include <stdio.h>\nint main() {\n    scanf(5);\n    return 0;\n}\n",
    expectTitle: "Wrong arguments to scanf",
    expectLine: 3,
  },
  {
    id: "printf-wrong-argument",
    mistake: "printf is called with a number instead of a format string.",
    source: "#include <stdio.h>\nint main() {\n    printf(5);\n    return 0;\n}\n",
    expectTitle: "Wrong arguments to printf",
    expectLine: 3,
  },
  {
    id: "strlen-wrong-argument",
    mistake: "strlen is given an integer instead of a string.",
    source: "#include <stdio.h>\n#include <string.h>\nint main() {\n    int n = strlen(42);\n    printf(\"%d\\\\n\", n);\n    return 0;\n}\n",
    expectTitle: "strlen called with the wrong types",
    expectLine: 4,
  },
  {
    id: "unsupported-header",
    mistake: "The program includes conio.h, which the interpreter does not bundle.",
    source: "#include <conio.h>\nint main() {\n    return 0;\n}\n",
    expectTitle: "Header not supported",
    expectLine: 1,
  },
  {
    id: "scanf-without-ampersand",
    mistake: "scanf is given the value of x instead of its address.",
    source: '#include <stdio.h>\nint main() {\n    int x;\n    scanf("%d", x);\n    printf("%d\\n", x);\n    return 0;\n}\n',
    stdin: "7\n",
    expectTitle: "Probably a missing & in scanf",
    expectLine: 4,
  },
  {
    id: "missing-expression",
    mistake: "The declaration has no value after the equals sign.",
    source: '#include <stdio.h>\nint main() {\n    int x = ;\n    printf("%d\\n", x);\n    return 0;\n}\n',
    expectTitle: "Syntax error",
    expectLine: 3,
  },
  {
    id: "undeclared-variable-fallback",
    mistake: "total is used without being declared.",
    source: '#include <stdio.h>\nint main() {\n    total = 5;\n    printf("%d\\n", total);\n    return 0;\n}\n',
    expectTitle: "Something went wrong on this line.",
    expectLine: 3,
  },
];

/**
 * Titles from ERROR_RULES that no program in BROKEN_PROGRAMS triggers.
 *
 * The vendored JSCPP 2.0.6 bundle reports a different error vocabulary from
 * the one ERROR_RULES was written for, so these rules cannot fire at all.
 */
export const UNREACHED_TITLES: readonly { title: string; reason: string }[] = [
  {
    title: "Missing semicolon",
    reason: "Tried a missing semicolon after a declaration, an assignment and a for-loop body; JSCPP lists every token it would accept, sorted so the message never begins with Expected \";\".",
  },
  {
    title: "Missing closing brace",
    reason: "Tried an unclosed function body, if body and while body; at end of input JSCPP again lists its whole sorted expectation set, which never begins with Expected \"}\".",
  },
  {
    title: "Missing closing parenthesis",
    reason: "Tried an unclosed printf call, nested parentheses, a for header and a function parameter list; the expected-token list begins with \"!\" or \"(\", never with \")\".",
  },
  {
    title: "Name not declared",
    reason: "Tried an undeclared variable, an undefined function and an unknown struct type; JSCPP says variable X does not exist or type ... is not defined, neither of which the rule matches.",
  },
  {
    title: "Did you mean == instead of = ?",
    reason: "Tried an assignment inside if and inside while; JSCPP accepts both as valid C and raises no warning, so the program exits normally.",
  },
  {
    title: "Type mismatch",
    reason: "Tried storing a string in an int, an array in an int and an int in a char pointer; JSCPP reports cast failed from type ... or throws a bare JavaScript TypeError, neither of which the rule matches.",
  },
  {
    title: "Function is missing a return",
    reason: "Tried a non-void function that falls off the end; JSCPP raises you must return a value, which does not contain the rule's wording.",
  },
  {
    title: "Division by zero",
    reason: "Tried integer division, remainder and double division by zero; JSCPP reports overflow of Infinity(...) or overflow of NaN(...) and never says division by zero.",
  },
  {
    title: "Array index out of range",
    reason: "Tried a[5] on an int array, a[-1], a multi-dimensional overflow and a pointer index; JSCPP says index out of bound or negative index, never out of bounds or out of range.",
  },
  {
    title: "Program ran too long (likely infinite loop)",
    reason: "Tried a while(1) loop; this JSCPP bundle does not implement the runner's maxTimeout option at all, so it never returns a timeout error and the program exceeds the five-second budget.",
  },
  {
    title: "Stack overflow (recursion too deep)",
    reason: "Tried unbounded self-recursion; the host JavaScript engine throws Maximum call stack size exceeded, which does not match the rule's wording.",
  },
  {
    title: "printf is not declared",
    reason: "Tried printf without including stdio.h; JSCPP reports variable printf does not exist rather than the rule's printf is not declared wording.",
  },
  {
    title: "sqrt is not declared",
    reason: "Tried sqrt without including math.h; JSCPP reports variable sqrt does not exist rather than the rule's sqrt is not declared wording.",
  },
];
