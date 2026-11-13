// Turns JSCPP's node-by-node debugger into the line-level commands a person
// expects: continue to a breakpoint, step over, step into, step out.
//
// JSCPP steps one syntax node at a time and knows nothing about lines, call
// depth or breakpoints. This module drives it until the right place to stop
// and then reports the call stack and variables. It runs wherever the
// interpreter runs (the worker in the app, Node in tests).

import { exitCodeOf } from "../runners/c/jscpp";
import type { JscppDebugger, JscppScope } from "../runners/c/jscpp";
import type { DebugCommand, DebugFrame, DebugVariable, PausedState, StopReason } from "./types";

export type StepOutcome = { kind: "paused"; state: PausedState } | { kind: "exited"; exitCode: number };

export interface CStepper {
  /** Runs to the first breakpoint, or pauses on the first line of main when there are none. */
  start(breakpoints: ReadonlySet<number>): StepOutcome;
  /** Resumes from a pause. */
  resume(command: DebugCommand, breakpoints: ReadonlySet<number>): StepOutcome;
}

const FUNCTION_PREFIX = "function ";

function isFunctionScope(scope: JscppScope): boolean {
  return typeof scope.$name === "string" && scope.$name.startsWith(FUNCTION_PREFIX);
}

interface Position {
  line: number;
  /** Number of function calls on the stack; main is 1. */
  depth: number;
}

export function createCStepper(dbg: JscppDebugger): CStepper {
  /** callSites[d] is the line from which the function at depth d + 1 was called. */
  const callSites: number[] = [];
  let current: Position = { line: 0, depth: 0 };

  function position(): Position | null {
    let line: number;
    try {
      line = dbg.nextNode().sLine;
    } catch {
      return null;
    }
    // Synthetic nodes (for example the implicit call to main) have no line.
    if (!(line >= 1)) return null;
    return { line, depth: dbg.rt.scope.filter(isFunctionScope).length };
  }

  /** Formats the variables of scopes [from, to) using JSCPP's own formatter. */
  function variablesIn(from: number, to: number): DebugVariable[] {
    const all = dbg.rt.scope;
    dbg.rt.scope = all.slice(from, to);
    try {
      return dbg
        .variable()
        // NULL is a library constant, not a variable the student made.
        .filter((variable) => variable.value !== undefined && variable.name !== "NULL")
        .map((variable) => ({ name: variable.name, value: String(variable.value), type: variable.type }));
    } finally {
      dbg.rt.scope = all;
    }
  }

  function snapshot(reason: StopReason): PausedState {
    const scopes = dbg.rt.scope;
    const starts: number[] = [];
    scopes.forEach((scope, index) => {
      if (isFunctionScope(scope)) starts.push(index);
    });

    const frames: DebugFrame[] = starts.map((start, depthIndex) => {
      const end = starts[depthIndex + 1] ?? scopes.length;
      const isTop = depthIndex === starts.length - 1;
      return {
        name: (scopes[start]?.$name ?? "").slice(FUNCTION_PREFIX.length),
        line: isTop ? current.line : (callSites[depthIndex + 1] ?? current.line),
        variables: variablesIn(start, end),
      };
    });

    return {
      reason,
      line: current.line,
      frames: frames.reverse(),
      globals: variablesIn(0, starts[0] ?? scopes.length),
    };
  }

  function advance(mode: DebugCommand | "entry", breakpoints: ReadonlySet<number>): StepOutcome {
    const origin = current;
    for (;;) {
      const result = dbg.next();
      if (result !== false && result !== undefined) return { kind: "exited", exitCode: exitCodeOf(result) };

      const next = position();
      if (!next) continue;

      // Remember where each call came from, for the call stack.
      if (next.depth > current.depth) {
        for (let depth = current.depth; depth < next.depth; depth++) callSites[depth] = current.line;
      } else if (next.depth < current.depth) {
        callSites.length = next.depth;
      }

      const moved = next.line !== current.line || next.depth !== current.depth;
      current = next;
      if (!moved) continue;

      if (breakpoints.has(next.line)) return { kind: "paused", state: snapshot("breakpoint") };
      const stepDone =
        (mode === "entry" && next.depth >= 1) ||
        mode === "stepInto" ||
        (mode === "stepOver" && next.depth <= origin.depth) ||
        (mode === "stepOut" && next.depth < origin.depth);
      if (stepDone) return { kind: "paused", state: snapshot(mode === "entry" ? "entry" : "step") };
    }
  }

  return {
    start: (breakpoints) => advance(breakpoints.size > 0 ? "continue" : "entry", breakpoints),
    resume: (command, breakpoints) => advance(command, breakpoints),
  };
}
