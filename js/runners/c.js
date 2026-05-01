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

// Translate a raw JSCPP error into a beginner-friendly message + extract a line number.
// Returns { line: number|null, friendly: string }.
function explainJSCPPError(rawMsg) {
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

  // Pattern → plain-English explanations.
  const rules = [
    [/missing declarator for argument/i,
      "You have an empty argument list with `void` or stray text inside the parentheses. Try `int main()` instead of `int main(void)` here."],
    [/no method (\w+) in global accepts/i,
      (m) => `\`${m[1]}\` was called with the wrong types. Check that each argument matches the function's expected types (e.g. \`%d\` needs an int, \`%s\` needs a char*).`],
    [/cannot find library/i,
      (m) => `That \`#include\` header isn't supported by the in-browser C interpreter. Supported headers: stdio.h, stdlib.h, string.h, math.h, ctype.h, time.h (and the C++ \`cstdio\` / \`iostream\` family).`],
    [/Parsing Failure/i,
      "There's a syntax error — check your braces, parentheses, and semicolons. Look at the line shown."],
    [/Expected\s+";"/i,
      "You're missing a `;` at the end of a statement."],
    [/Expected\s+"\}"/i,
      "You're missing a closing `}` for a block."],
    [/Expected\s+"\)"/i,
      "You're missing a closing `)` for a parenthesised expression or argument list."],
    [/undefined reference|undeclared identifier|cannot resolve/i,
      (m) => `An identifier hasn't been declared. Check spelling and that you've included the right header (\`#include <stdio.h>\` for printf, etc.).`],
    [/division by zero/i, "You divided by zero at runtime."],
    [/segmentation|out of bounds|access violation/i,
      "Out-of-bounds memory access (likely a bad array index or a null pointer)."],
    [/timed? out/i,
      "Your program ran too long (possible infinite loop). The interpreter stopped it after 30 seconds."],
  ];

  for (const [re, expl] of rules) {
    const m = body.match(re) || msg.match(re);
    if (m) {
      const explanation = typeof expl === "function" ? expl(m) : expl;
      return { line, friendly: `${explanation}\n  → original: ${body.trim() || msg.trim()}` };
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

  // Collect any pre-typed stdin so scripted programs work without interaction.
  let pendingStdin = "";

  // JSCPP stdin is provided synchronously via config.stdio.read / getInput.
  // Because its run loop expects a string up-front, we support two modes:
  //   1. Any input already pushed into the console buffer is consumed first.
  //   2. If more input is needed mid-run, JSCPP will call getInput repeatedly;
  //      we block the JS main thread briefly by returning buffered content or
  //      an empty string (the interpreter tolerates eof).
  const config = {
    stdio: {
      write: (s) => {
        consoleIO.write(s);
      },
    },
    unsigned_overflow: "warn",
    maxTimeout: 30000,
    includes: {},
    // Provide a synchronous input source. The user can pre-fill the stdin row;
    // we bias toward non-blocking UX by returning "" when empty rather than
    // freezing the tab.
    getInput: () => {
      if (pendingStdin.length > 0) {
        const out = pendingStdin;
        pendingStdin = "";
        return out;
      }
      // Read whatever lines the user has typed so far.
      let all = "";
      let line = consoleIO.tryReadLineSync();
      while (line !== null) {
        all += line + "\n";
        line = consoleIO.tryReadLineSync();
      }
      return all;
    },
  };

  // JSCPP v3 accepts pre-supplied stdin as the second argument.
  let initialStdin = "";
  let line = consoleIO.tryReadLineSync();
  while (line !== null) {
    initialStdin += line + "\n";
    line = consoleIO.tryReadLineSync();
  }

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
