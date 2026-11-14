// Picks the catalog entry that explains an error and fills in its text.
//
// Entries are tried in order, most specific first; the last entry for each
// language is a catch-all. The first one whose kind, pattern and source-code
// condition all hold wins.

import { C_CATALOG } from "./catalog-c";
import { CPP_CATALOG } from "./catalog-cpp";
import { MATLAB_CATALOG } from "./catalog-matlab";
import { PYTHON_CATALOG } from "./catalog-python";
import { parseRawError } from "./parse";
import type { CatalogEntry, ErrorExplanation, Fields, MatchContext, ParsedError, RawError, Text } from "./types";

export const CATALOG: readonly CatalogEntry[] = [...C_CATALOG, ...CPP_CATALOG, ...PYTHON_CATALOG, ...MATLAB_CATALOG];

function isCode(line: string): boolean {
  const trimmed = line.trim();
  return trimmed !== "" && !trimmed.startsWith("//") && !trimmed.startsWith("#") && !trimmed.startsWith("%");
}

function createContext(parsed: ParsedError, fields: Fields, source: string): MatchContext {
  const lines = source.split(/\r?\n/);
  return {
    parsed,
    fields,
    lines,
    lineText: (line) => lines[line - 1] ?? "",
    previousCodeLine(line) {
      for (let candidate = Math.min(line - 1, lines.length); candidate >= 1; candidate--) {
        if (isCode(lines[candidate - 1] ?? "")) return candidate;
      }
      return null;
    },
  };
}

const render = (text: Text, fields: Fields): string => (typeof text === "function" ? text(fields) : text);

/** Explains `raw`, using `source` (the program text) for clues the message alone does not give. */
export function explainError(raw: RawError, source: string): ErrorExplanation {
  const parsed = parseRawError(raw);

  for (const entry of CATALOG) {
    if (!entry.languages.includes(raw.language)) continue;
    if (entry.kind !== undefined && entry.kind !== parsed.kind) continue;
    const match = entry.pattern.exec(parsed.message);
    if (!match) continue;

    const fields: Fields = { ...match.groups };
    const context = createContext(parsed, fields, source);
    if (entry.when && !entry.when(context)) continue;

    const line = entry.line ? entry.line(context) : parsed.line;
    fields.line = line === null ? undefined : String(line);
    return {
      entryId: entry.id,
      language: raw.language,
      confidence: entry.confidence ?? "exact",
      title: render(entry.title, fields),
      what: render(entry.what, fields),
      why: render(entry.why, fields),
      fix: entry.fix.map((step) => render(step, fields)),
      kid: { what: render(entry.kid.what, fields), fix: render(entry.kid.fix, fields) },
      example: entry.example,
      line,
      // A column only makes sense on the line the runtime reported.
      column: entry.line ? null : parsed.column,
      raw: raw.text,
    };
  }

  // Languages without a catalog (Java) still get an honest card.
  return {
    entryId: "unknown",
    language: raw.language,
    confidence: "fallback",
    title: "The program stopped with an error",
    what: "The program could not finish. The original message below says what the computer saw.",
    why: "This error is not in the list of explained errors yet.",
    fix: ["Read the original message for a line number.", "Check that line for typing mistakes."],
    kid: { what: "Something went wrong and the program stopped.", fix: "Look at the line it points to. Is anything spelled wrong?" },
    line: parsed.line,
    column: parsed.column,
    raw: raw.text,
  };
}
