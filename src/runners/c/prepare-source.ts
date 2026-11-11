// Source fix-ups applied before code is handed to JSCPP. They never add or
// remove lines, so error and debugger line numbers match the editor.

/**
 * JSCPP's preprocessor strips spaces after commas inside string literals
 * (`"a, b"` prints as `a,b`). Writing those spaces and tabs as escapes keeps
 * them. Comments and character literals are left alone.
 */
export function escapeSpacesInStringLiterals(src: string): string {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src.charAt(i);
    if (ch === "/" && src.charAt(i + 1) === "/") {
      const end = src.indexOf("\n", i);
      const stop = end < 0 ? n : end;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    if (ch === "/" && src.charAt(i + 1) === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? n : end + 2;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    if (ch === "'") {
      out += ch;
      i += 1;
      while (i < n) {
        const c = src.charAt(i);
        out += c;
        i += 1;
        if (c === "\\" && i < n) {
          out += src.charAt(i);
          i += 1;
        } else if (c === "'") {
          break;
        }
      }
      continue;
    }
    if (ch === '"') {
      out += ch;
      i += 1;
      while (i < n) {
        const c = src.charAt(i);
        if (c === "\\" && i + 1 < n) {
          out += c + src.charAt(i + 1);
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
