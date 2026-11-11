// Error translator: turns what a runtime says into something a beginner can
// act on. A runner reports a RawError; the catalog explains it.

import type { Language } from "../storage/types";

/** What a runner reports when a program fails. */
export interface RawError {
  language: Language;
  /** The runtime's own message, untouched. Always shown on request. */
  text: string;
  /** For runtimes that report structure as well as text (MATLAB). */
  details?: { message: string; identifier?: string; line?: number; column?: number };
}

/** A raw error reduced to the parts the catalog matches on. */
export interface ParsedError {
  /** "parse" / "runtime" / "internal" for C, the exception name for Python, the identifier for MATLAB. */
  kind: string;
  message: string;
  line: number | null;
  column: number | null;
}

/** Named regex groups plus anything an entry computes. */
export type Fields = Record<string, string | undefined>;

/** Fixed text, or text built from the captured fields. */
export type Text = string | ((fields: Fields) => string);

export interface MatchContext {
  parsed: ParsedError;
  fields: Fields;
  /** Source lines, index 0 = line 1. */
  lines: string[];
  /** Text of a 1-based line, or "" if there is no such line. */
  lineText(line: number): string;
  /** Last line above `line` that holds code (not blank, not a comment), or null. */
  previousCodeLine(line: number): number | null;
}

/** How sure the catalog is. Heuristic matches say "most likely". */
export type Confidence = "exact" | "likely" | "fallback";

export interface CatalogEntry {
  /** language.slug, unique. */
  id: string;
  languages: Language[];
  /** Required ParsedError.kind, if any. */
  kind?: string;
  pattern: RegExp;
  /** Extra condition that looks at the source code. */
  when?: (context: MatchContext) => boolean;
  /** The line to point at, when it is not the one the runtime reported. */
  line?: (context: MatchContext) => number | null;
  confidence?: Confidence;
  title: Text;
  /** What went wrong, in plain words. */
  what: Text;
  /** Why this usually happens. */
  why: Text;
  /** Steps to fix it. */
  fix: Text[];
  /** The same for a young reader: short words, one idea. */
  kid: { what: Text; fix: Text };
  example?: { before: string; after: string };
  /** Programs that must produce this entry when run for real. */
  tests: { source: string; stdin?: string[]; line?: number }[];
}

/** A translated error, ready to show. */
export interface ErrorExplanation {
  entryId: string;
  language: Language;
  confidence: Confidence;
  title: string;
  what: string;
  why: string;
  fix: string[];
  kid: { what: string; fix: string };
  example?: { before: string; after: string };
  line: number | null;
  column: number | null;
  /** The runtime's original message. */
  raw: string;
}
