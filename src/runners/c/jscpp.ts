// The parts of the vendored JSCPP interpreter this app uses.

export interface JscppStdio {
  write: (text: string) => void;
  /** Called when the program reads and its buffer is empty; null means end of input. */
  drain?: () => string | null;
}

export interface JscppConfig {
  stdio: JscppStdio;
  debug?: boolean;
  unsigned_overflow?: "error" | "warn" | "ignore";
  includes?: Record<string, unknown>;
}

export interface JscppNode {
  type: string;
  sLine: number;
  sColumn: number;
}

export interface JscppVariable {
  name: string;
  value: unknown;
  type: string;
}

/** One lexical scope. `$name` is "global", "function <name>", or a statement kind. */
export type JscppScope = Record<string, unknown> & { $name?: string };

export interface JscppDebugger {
  /** Runs one step. Returns false while the program is still running, otherwise its exit value. */
  next(): unknown;
  /** The node about to run. */
  nextNode(): JscppNode;
  /** Variables visible from the innermost scope outwards, formatted for display. */
  variable(): JscppVariable[];
  rt: { scope: JscppScope[] };
}

export interface Jscpp {
  run(code: string, input: string, config: JscppConfig & { debug: true }): JscppDebugger;
  run(code: string, input: string, config: JscppConfig): number;
}

/** Exit code from the value `next()` returns when the program ends. */
export function exitCodeOf(result: unknown): number {
  if (typeof result === "number") return result;
  if (typeof result === "object" && result !== null && "v" in result) {
    const value = (result as { v: unknown }).v;
    if (typeof value === "number") return value;
  }
  return 0;
}
