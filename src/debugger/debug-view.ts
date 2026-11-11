// Debug pane: where the program is paused, the call stack, and the variables
// of each call. Values that changed since the previous pause are marked.

import { el } from "../shell/dom";
import type { DebugVariable, PausedState } from "./types";

export interface DebugView {
  showPaused(state: PausedState): void;
  showRunning(): void;
  /** Back to the idle message, forgetting earlier values. */
  reset(): void;
}

export interface DebugViewOptions {
  /** Called when the user picks a frame, with the line that frame is at. */
  onRevealLine: (line: number) => void;
}

const REASONS: Record<PausedState["reason"], string> = {
  entry: "start of main",
  breakpoint: "breakpoint",
  step: "step",
};

export function createDebugView(host: HTMLElement, options: DebugViewOptions): DebugView {
  const status = el("p", { class: "debug-status", role: "status" });
  const body = el("div", { class: "debug-body" });
  host.append(status, body);

  /** Values at the previous pause, keyed by frame position and name. */
  let previous = new Map<string, string>();

  function variableRows(variables: DebugVariable[], frameKey: string, seen: Map<string, string>): HTMLElement {
    if (variables.length === 0) return el("p", { class: "debug-empty" }, ["No variables yet."]);
    const list = el("dl", { class: "debug-vars" });
    for (const variable of variables) {
      const key = `${frameKey}/${variable.name}`;
      seen.set(key, variable.value);
      const before = previous.get(key);
      const changed = before !== undefined && before !== variable.value;
      list.append(
        el("dt", { title: variable.type }, [variable.name]),
        el("dd", { class: changed ? "is-changed" : undefined, title: changed ? `was ${before}` : variable.type }, [
          variable.value,
        ]),
      );
    }
    return list;
  }

  function idle(): void {
    status.textContent = "Not debugging.";
    body.replaceChildren(
      el("p", { class: "debug-empty" }, [
        "Click beside a line number to set a breakpoint, then press Debug. The program pauses there so you can look at its variables.",
      ]),
    );
  }

  idle();

  return {
    showPaused(state) {
      status.textContent = `Paused at line ${state.line} (${REASONS[state.reason]})`;
      const seen = new Map<string, string>();
      const sections: HTMLElement[] = [];

      state.frames.forEach((frame, index) => {
        // Count from the outermost call so the key survives calls and returns above it.
        const frameKey = `${state.frames.length - index}:${frame.name}`;
        const header = el("button", { type: "button", class: "debug-frame" }, [
          el("span", { class: "debug-frame-name" }, [`${frame.name}()`]),
          el("span", { class: "debug-frame-line" }, [`line ${frame.line}`]),
        ]);
        header.addEventListener("click", () => options.onRevealLine(frame.line));
        sections.push(
          el("section", { class: index === 0 ? "debug-section is-current" : "debug-section" }, [
            header,
            variableRows(frame.variables, frameKey, seen),
          ]),
        );
      });

      if (state.globals.length > 0) {
        sections.push(
          el("section", { class: "debug-section" }, [
            el("div", { class: "debug-frame is-static" }, [el("span", { class: "debug-frame-name" }, ["Globals"])]),
            variableRows(state.globals, "globals", seen),
          ]),
        );
      }

      previous = seen;
      body.replaceChildren(...sections);
    },
    showRunning() {
      status.textContent = "Running…";
    },
    reset() {
      previous = new Map();
      idle();
    },
  };
}
