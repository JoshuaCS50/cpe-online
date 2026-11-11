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

// Each rule is [regex, { title, hint }] — title is a one-line headline,
// hint is one short paragraph in plain English. No markdown / no backticks
// so the message reads cleanly inside the output panel. Most-specific
// patterns come first so a generic "Parsing Failure" never shadows a
// precise diagnosis.
//
// Exported so the streaming worker (runners/c-streaming.js) can use the
// same rule set.
export const ERROR_RULES = [
  // ── Punctuation / structure ──
  [/Expected\s+";"/i, {
    title: "Missing semicolon",
    hint: "Almost every C statement ends with a semicolon ( ; ). Add one to the end of the line just above the highlighted line.",
  }],
  [/Expected\s+"\}"/i, {
    title: "Missing closing brace",
    hint: "A block opened with { is not closed. Count your { and } — every opening brace needs a matching closing brace.",
  }],
  [/Expected\s+"\)"/i, {
    title: "Missing closing parenthesis",
    hint: "A ( is not closed. Check the parentheses around your if, for, while, or function call.",
  }],
  [/Expected\s+"\("/i, {
    title: "Missing opening parenthesis",
    hint: "Function calls and if / for / while always need parentheses around their condition or arguments.",
  }],
  [/missing declarator for argument/i, {
    title: "Empty argument list problem",
    hint: "Use   int main()   instead of   int main(void)   in this in-browser interpreter.",
  }],

  // ── scanf / printf / format-specifier ──
  [/no method scanf in global accepts/i, {
    title: "Wrong arguments to scanf",
    hint: "Most likely you forgot the & before the variable name. It must be   scanf(\"%d\", &x);   not   scanf(\"%d\", x);   — the & means \"store the value into this variable\".",
  }],
  [/no method printf in global accepts/i, {
    title: "Wrong arguments to printf",
    hint: "Match the format specifier to the variable type:  %d int,  %f float,  %c single character,  %s string. (For double, use %lf in scanf, %f in printf.)",
  }],
  [/no method (\w+) in global accepts/i, (m) => ({
    title: m[1] + " called with the wrong types",
    hint: "Check each argument matches what " + m[1] + " expects. Common mix-ups: passing an int where a double is needed, or forgetting the & in scanf.",
  })],

  // ── Header / include ──
  [/cannot find library/i, {
    title: "Header not supported",
    hint: "That #include header isn't bundled in the in-browser C interpreter. Supported headers are: stdio.h, stdlib.h, string.h, math.h, ctype.h, time.h (and the C++ cstdio / iostream family).",
  }],
  [/(printf|scanf|puts|gets|fgets)\s+is\s+not\s+(declared|defined)/i, (m) => ({
    title: m[1] + " is not declared",
    hint: "You used " + m[1] + " without including its header. Add this line at the very top of your file:    #include <stdio.h>",
  })],
  [/(sqrt|pow|sin|cos|tan|fabs|log|log10|round|ceil|floor)\s+is\s+not\s+(declared|defined)/i, (m) => ({
    title: m[1] + " is not declared",
    hint: "You used a math function (" + m[1] + ") without including its header. Add this line at the top of your file:    #include <math.h>",
  })],

  // ── Identifier / spelling ──
  [/undefined reference|undeclared identifier|cannot resolve|is not declared/i, {
    title: "Name not declared",
    hint: "C is case-sensitive. Check the spelling and capitalisation. Also make sure variables are declared before use (e.g.   int x;   before   x = 5;  ) and that you have the right #include at the top.",
  }],

  // ── = vs == / type mismatch ──
  [/assignment used as condition|assignment in condition/i, {
    title: "Did you mean == instead of = ?",
    hint: "Inside if ( ... ) and while ( ... ) the comparison operator is == (two equals signs). A single = means assign.",
  }],
  [/cannot convert|incompatible (type|types)|type mismatch/i, {
    title: "Type mismatch",
    hint: "The value's type does not match what's expected. Common causes: storing a decimal in an int, or using %d when the variable is actually a double (use %lf in scanf, %f in printf).",
  }],

  // ── Function returns ──
  [/control reaches end of non-void function|missing return statement/i, {
    title: "Function is missing a return",
    hint: "A function declared with a non-void return type (like int) must reach a   return <value>;   on every path. Add   return 0;   at the end of main.",
  }],

  // ── Runtime ──
  [/memory overflow|invalid memory access|null pointer/i, {
    title: "Probably a missing & in scanf",
    hint: "scanf needs the address of the variable. Write   scanf(\"%d\", &x);   not   scanf(\"%d\", x);   . If your scanf is fine, this can also mean you accessed an array slot that doesn't exist.",
  }],
  [/division by zero/i, {
    title: "Division by zero",
    hint: "You divided a number by zero at runtime. Add an if check before the division to make sure the divisor isn't 0.",
  }],
  [/segmentation|out of bounds|index .* out of range|access violation/i, {
    title: "Array index out of range",
    hint: "You read or wrote past the end of an array. Remember array indexes start at 0 and go up to size − 1. Check your loop condition and the index value.",
  }],
  [/timed? out|infinite loop/i, {
    title: "Program ran too long (likely infinite loop)",
    hint: "The interpreter stopped your program after 30 seconds. Check that your while / for condition can become false — otherwise the loop never ends.",
  }],
  [/stack overflow|too much recursion/i, {
    title: "Stack overflow (recursion too deep)",
    hint: "A function called itself too many times without stopping. Make sure your recursive function has a base case that returns without recursing.",
  }],

  // ── Generic parser fallback ──
  [/Parsing Failure/i, {
    title: "Syntax error",
    hint: "Something is structurally wrong on the highlighted line. Look for: a missing semicolon, a brace or parenthesis that doesn't match, or a stray character.",
  }],
];

// Translate a raw JSCPP error into a beginner-friendly message + extract
// the line number. Returns { line: number|null, friendly: string }.
//
// The returned `friendly` string is the only text shown in the output
// panel — we deliberately do NOT echo back the raw JSCPP parser dump
// (it scares beginners with text like "Expected !=, %, %=, &, &&, &= …").
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
      const out = typeof expl === "function" ? expl(m) : expl;
      return {
        line,
        friendly: out.title + "\n" + out.hint,
      };
    }
  }
  // Unknown pattern — keep it short and useful, don't dump the parser noise.
  return {
    line,
    friendly:
      "Something went wrong on this line.\n" +
      "Check the line for: missing semicolon, mismatched braces or parentheses, wrong types, or a typo in a variable / function name.",
  };
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
    const where = line ? "Line " + line + " — " : "";
    consoleIO.writeErr("\n❌ " + where + friendly + "\n");
    return { ok: false, exitCode: -1, error: err };
  }
}

export const runCpp = runC;
