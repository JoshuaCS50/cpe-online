// Debugger model shared by every language and by the UI. The shapes follow
// the Debug Adapter Protocol (stack frames, scopes, variables, stop reasons),
// trimmed to what a beginner's debugger needs.

export type DebugCommand = "continue" | "stepOver" | "stepInto" | "stepOut";

export type StopReason = "entry" | "breakpoint" | "step";

export interface DebugVariable {
  name: string;
  /** Value formatted for display, for example `3`, `'k'`, `[4,5,6]`. */
  value: string;
  type: string;
}

/** One function call on the stack, innermost first in lists. */
export interface DebugFrame {
  name: string;
  /** Line this frame is at: the paused line for the top frame, the call site for callers. */
  line: number;
  variables: DebugVariable[];
}

export interface PausedState {
  reason: StopReason;
  /** 1-based line about to run. */
  line: number;
  /** Innermost frame first. */
  frames: DebugFrame[];
  globals: DebugVariable[];
}

export interface DebugListener {
  onPaused(state: PausedState): void;
  onResumed(): void;
}

export interface DebugResult {
  ok: boolean;
  exitCode: number;
  stopped?: boolean;
}

/** A running debug session. Commands are ignored unless the program is paused. */
export interface DebugSession {
  command(command: DebugCommand): void;
  /** Replaces the breakpoint lines; takes effect at the next command. */
  setBreakpoints(lines: readonly number[]): void;
  stop(): void;
  /** Settles when the program ends, fails or is stopped. */
  readonly finished: Promise<DebugResult>;
}
