// A Run button with its own small terminal, used on the Example and
// Try it tabs. Input is typed in the terminal, as in the IDE, and a failed
// run shows the same explained error card.

import { explainError } from "../diagnostics/engine";
import { createErrorCard } from "../diagnostics/error-card";
import type { LessonLanguage } from "../content/schema";
import { canStop, runProgram } from "../runners/run";
import { button, el } from "../shell/dom";
import { createConsole } from "../terminal/console";

export interface RunBoxOptions {
  language: LessonLanguage;
  fileName: string;
  getCode(): string;
  /** Whether error cards use the wording for young readers. */
  kid(): boolean;
  /** Called with the line an error points at, and with null when a new run starts. */
  onErrorLine?(line: number | null): void;
  /** Extra buttons shown after Run and Stop. */
  actions?: HTMLElement[];
}

export interface RunBox {
  element: HTMLElement;
  /** True while a program started here is running. */
  readonly running: boolean;
  run(): Promise<void>;
  stop(): void;
  /** Disables Run while something else (a check) is using the runtime. */
  setBusy(busy: boolean): void;
  dispose(): void;
}

export function createRunBox(options: RunBoxOptions): RunBox {
  const outputEl = el("pre", { class: "output runbox-output", role: "log", "aria-live": "polite", "aria-label": "Program output" });
  const consoleIO = createConsole({ outputEl });
  let running = false;
  let busy = false;
  let abort: AbortController | null = null;

  const runButton = button({ label: "Run", icon: "play", showLabel: true, class: "btn btn-run", onClick: () => void run() });
  const stopButton = button({ label: "Stop", icon: "stop", showLabel: true, class: "btn btn-stop", onClick: () => stop() });
  stopButton.disabled = true;

  function sync(): void {
    runButton.disabled = running || busy;
    stopButton.disabled = !running || !canStop(options.language);
  }

  async function run(): Promise<void> {
    if (running || busy) return;
    // Claim the run before the first await, or a second click could start another.
    running = true;
    sync();
    const code = options.getCode();
    options.onErrorLine?.(null);
    consoleIO.clear();
    consoleIO.cancelPendingReads();
    consoleIO.setInputActive(true);
    element.dataset.used = "true";
    abort = new AbortController();
    try {
      await runProgram({
        language: options.language,
        code,
        fileName: options.fileName,
        consoleIO,
        signal: abort.signal,
        onError: (raw) => {
          const explanation = explainError(raw, code);
          options.onErrorLine?.(explanation.line);
          const card = createErrorCard(explanation, {
            fileName: options.fileName,
            onJump: (line) => options.onErrorLine?.(line),
            kid: options.kid(),
          });
          consoleIO.appendElement(card);
          card.scrollIntoView({ block: "nearest" });
        },
      });
    } catch (error) {
      consoleIO.writeErr("\n" + (error instanceof Error ? error.message : String(error)) + "\n");
    } finally {
      abort = null;
      running = false;
      consoleIO.setInputActive(false);
      consoleIO.resetInput();
      sync();
    }
  }

  function stop(): void {
    if (!running) return;
    consoleIO.cancelPendingReads(new Error("Stopped by user"));
    abort?.abort();
    consoleIO.writeInfo("\n[stopped]\n");
  }

  const element = el("div", { class: "runbox" }, [
    el("div", { class: "runbox-actions" }, [runButton, stopButton, ...(options.actions ?? [])]),
    outputEl,
  ]);

  return {
    element,
    get running() {
      return running;
    },
    run,
    stop,
    setBusy(next) {
      busy = next;
      sync();
    },
    dispose() {
      stop();
    },
  };
}
