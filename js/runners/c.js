// C and C++ runner using JSCPP (pure-JS C/C++ interpreter).
// JSCPP is loaded via <script> in index.html and exposed as window.JSCPP.

function getJSCPP() {
  return (typeof window !== "undefined" && window.JSCPP) || null;
}

// JSCPP's preprocessor strips spaces after commas inside string literals
// (e.g. printf("Hello, World!") prints "Hello,World!"). Workaround: replace
// literal space (0x20) inside any string literal with the escape \x20, which
// JSCPP renders correctly. We also leave char literals and comments alone.
function escapeSpacesInStringLiterals(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    // Line comment
    if (ch === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      const stop = end < 0 ? n : end;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    // Block comment
    if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? n : end + 2;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    // Char literal — pass through unmodified
    if (ch === "'") {
      out += ch;
      i += 1;
      while (i < n) {
        const c = src[i];
        out += c;
        i += 1;
        if (c === "\\" && i < n) {
          out += src[i];
          i += 1;
        } else if (c === "'") {
          break;
        }
      }
      continue;
    }
    // String literal — escape spaces
    if (ch === '"') {
      out += ch;
      i += 1;
      while (i < n) {
        const c = src[i];
        if (c === "\\" && i + 1 < n) {
          out += c + src[i + 1];
          i += 2;
        } else if (c === '"') {
          out += c;
          i += 1;
          break;
        } else if (c === " ") {
          out += "\\x20";
          i += 1;
        } else if (c === "\t") {
          out += "\\x09";
          i += 1;
        } else {
          out += c;
          i += 1;
        }
      }
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

// Pattern → plain-English explanations. Keep this list ordered most-specific
// first so a generic rule (e.g. "Parsing Failure") doesn't shadow a precise
// one (e.g. missing semicolon).
//
// Each entry is [regex, explanation-string-or-function]. Exported so the
// streaming worker (runners/c-streaming.js) can use the same rule set.
export const ERROR_RULES = [
  // ── Phase 1 (already shipping) ──
  [/missing declarator for argument/i,
    "You have an empty argument list with `void` or stray text inside the parentheses. Try `int main()` instead of `int main(void)`."],
  [/Expected\s+";"/i,
    "You're missing a `;` at the end of the statement above the highlighted line. Almost every C statement ends with `;`."],
  [/Expected\s+"\}"/i,
    "You're missing a closing `}` for a block. Count your `{` and `}` — they must match exactly."],
  [/Expected\s+"\)"/i,
    "You're missing a closing `)`. Check the parentheses around your `if`, `for`, `while`, or function call."],
  [/Expected\s+"\("/i,
    "You're missing an opening `(`. Function calls and `if` / `for` / `while` always need `(...)`."],
  // ── scanf / printf / format-specifier mistakes ──
  [/no method scanf in global accepts/i,
    "Wrong types passed to `scanf`. Remember the `&` — `scanf(\"%d\", &x);` not `scanf(\"%d\", x);`. The `&` means \"store the value in this address\"."],
  [/no method printf in global accepts/i,
    "Wrong types passed to `printf`. Match the format specifier to the variable: `%d` int, `%f` float, `%lf` (in scanf only) double, `%c` char, `%s` string."],
  [/no method (\w+) in global accepts/i,
    (m) => `\`${m[1]}\` was called with the wrong types. Check each argument: \`%d\` expects an int, \`%f\` a float, \`%s\` a char[].`],
  // ── Header / include problems ──
  [/cannot find library/i,
    "That `#include` header isn't bundled in the in-browser interpreter. Supported: `stdio.h`, `stdlib.h`, `string.h`, `math.h`, `ctype.h`, `time.h` (and the C++ `cstdio` / `iostream` family)."],
  [/(printf|scanf|puts|gets|fgets)\s+is\s+not\s+(declared|defined)/i,
    (m) => `You used \`${m[1]}\` without including its header. Add \`#include <stdio.h>\` at the very top of your file.`],
  [/(sqrt|pow|sin|cos|tan|fabs|log|log10|round|ceil|floor)\s+is\s+not\s+(declared|defined)/i,
    (m) => `You used a math function (\`${m[1]}\`) without including its header. Add \`#include <math.h>\` at the very top of your file.`],
  // ── Identifier / spelling ──
  [/undefined reference|undeclared identifier|cannot resolve|is not declared/i,
    "That name hasn't been declared. Check spelling, capitalisation, and that you have the right `#include` (`stdio.h` for printf, `math.h` for sqrt, etc.). Variables must be declared before use: `int x;` then `x = 5;`."],
  // ── Type / assignment-vs-equality ──
  [/assignment used as condition|assignment in condition/i,
    "You probably typed `=` (assign) where you meant `==` (compare). Inside `if (...)` and `while (...)`, comparison is `==`."],
  [/cannot convert|incompatible (type|types)|type mismatch/i,
    "Type mismatch. Common cause: storing a `double` into an `int`, or passing the wrong format specifier (`%d` for a `double` should be `%lf`/`%f`)."],
  // ── Function returns ──
  [/control reaches end of non-void function|missing return statement/i,
    "A non-`void` function has no `return` statement on this path. Add `return <value>;` (e.g. `return 0;` at the end of `main`)."],
  // ── Runtime ──
  [/memory overflow|invalid memory access|null pointer/i,
    "Probably a missing `&` in `scanf`. Use `scanf(\"%d\", &x);` not `scanf(\"%d\", x);` — the `&` says \"store the value at this address\". Also possible: writing past the end of an array."],
  [/division by zero/i,
    "Division by zero. Add an `if` to check the divisor first."],
  [/segmentation|out of bounds|index .* out of range|access violation/i,
    "Out-of-bounds memory access. Most often: an array index past `size − 1` (arrays start at 0!), or a null pointer being dereferenced."],
  [/timed? out|infinite loop/i,
    "Your program ran too long — likely an infinite loop. Check that your `while` / `for` condition can become false."],
  [/stack overflow|too much recursion/i,
    "Stack overflow — usually unbounded recursion. Make sure your recursive function has a base case that returns."],
  // ── Generic / parser ──
  [/Parsing Failure/i,
    "Syntax error. Look at the line shown — most often a missing `;`, mismatched braces, or a stray character."],
];

// Translate a raw JSCPP error into a beginner-friendly message + extract a line number.
// Returns { line: number|null, friendly: string }.
export function explainJSCPPError(rawMsg) {
  const msg = String(rawMsg || "");
  // JSCPP errors usually start with "<line>:<col> ..." or include "line N".
  const colonMatch = msg.match(/^(\d+):(\d+)\s*(.*)/);
  let line = null;
  let body = msg;
  if (colonMatch) {
    line = parseInt(colonMatch[1], 10);
    body = colonMatch[3];
  } else {
    const lineWord = msg.match(/line\s+(\d+)/i);
    if (lineWord) line = parseInt(lineWord[1], 10);
  }

  for (const [re, expl] of ERROR_RULES) {
    const m = body.match(re) || msg.match(re);
    if (m) {
      const explanation = typeof expl === "function" ? expl(m) : expl;
      return {
        line,
        friendly: `${explanation}\n  → original: ${body.trim() || msg.trim()}`,
      };
    }
  }
  return { line, friendly: body.trim() || msg.trim() };
}

export async function runC({ code, consoleIO, signal, onErrorLine }) {
  const JSCPP = getJSCPP();
  if (!JSCPP) {
    consoleIO.writeErr(
      "❌ C / C++ runtime failed to load.\n" +
        "This usually means the page didn't finish downloading on the first visit.\n" +
        "Reload the page once with internet, then it will work offline forever.\n"
    );
    return { ok: false, exitCode: -1 };
  }

  // Drain anything the user has pre-typed in the stdin row. This is the
  // primary input channel for synchronous JSCPP programs.
  let initialStdin = consoleIO.drainBuffer();

  // Mid-run fallback: if JSCPP exhausts the buffered input but the program
  // keeps reading (scanf, gets, cin >>), pop a synchronous prompt() so the
  // user can supply more input without aborting the run. This works on
  // every desktop browser; on iOS Safari prompt() may be suppressed inside
  // tight loops, in which case the runner gracefully returns "" (EOF).
  let promptCount = 0;
  const config = {
    stdio: {
      write: (s) => {
        consoleIO.write(s);
      },
    },
    unsigned_overflow: "warn",
    maxTimeout: 30000,
    includes: {},
    getInput: () => {
      // First, consume anything else the user typed in the stdin row before
      // we got here (rare for sync runs, but possible).
      const buffered = consoleIO.drainBuffer();
      if (buffered) return buffered;

      // Fall back to a blocking prompt(). Read the trailing un-newlined text
      // from the output panel and use it as the prompt label, so the user
      // sees exactly what the program just printed (e.g. "Enter A:").
      promptCount += 1;
      if (promptCount > 100) {
        // Safety: refuse to keep prompting forever in case of an infinite read.
        return "";
      }
      let label = "Program is asking for input";
      try {
        const outputEl = document.getElementById("output");
        if (outputEl) {
          const fullText = outputEl.textContent || "";
          // Find text after the last newline — this is the un-flushed prompt.
          const lastNl = fullText.lastIndexOf("\n");
          const tail = lastNl >= 0 ? fullText.slice(lastNl + 1) : fullText;
          const cleaned = tail.trim();
          if (cleaned) {
            label = cleaned;
          } else {
            // No tail — show recent context (last non-empty line).
            const lines = fullText.split("\n").filter((s) => s.trim());
            if (lines.length) label = lines[lines.length - 1].trim();
          }
        }
      } catch (_) { /* fall back to default label */ }

      let answer = null;
      try {
        answer = window.prompt(label, "");
      } catch (_) {
        answer = null;
      }
      if (answer == null) {
        // User cancelled — feed EOF.
        return "";
      }
      // Echo what the user typed into the output panel so it appears inline.
      consoleIO.pushStdin(answer);
      return consoleIO.drainBuffer();
    },
  };

  try {
    const patched = escapeSpacesInStringLiterals(code);
    const exitCode = JSCPP.run(patched, initialStdin, config);
    consoleIO.writeInfo(`\n[program exited with code ${exitCode}]\n`);
    return { ok: exitCode === 0, exitCode };
  } catch (err) {
    const rawMsg = (err && err.message) || String(err);
    const { line, friendly } = explainJSCPPError(rawMsg);
    if (line && typeof onErrorLine === "function") onErrorLine(line);
    const lineLabel = line ? `Line ${line}: ` : "";
    consoleIO.writeErr("\n❌ " + lineLabel + friendly + "\n");
    return { ok: false, exitCode: -1, error: err };
  }
}

export const runCpp = runC;
