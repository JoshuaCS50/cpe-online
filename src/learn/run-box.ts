// A Run button with its own small terminal, used on the Example and
// Try it tabs. Input is typed in the terminal, as in the IDE, and a failed
// run shows the same explained error card.

import { explainError } from "../diagnostics/engine";
import { createErrorCard } from "../diagnostics/error-card";
import type { DataFile, LessonLanguage } from "../content/schema";
import { createBoardView } from "../board3d/board-view";
import type { BoardView } from "../board3d/board-view";
import type { Circuit } from "../content/circuit";
import type { BoardId } from "../runners/arduino/profiles";
import { canRunLive, createLiveChannel } from "../runners/arduino/live";
import type { BoardReport } from "../runners/arduino/board";
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
  /** Data files the program can open with fopen. */
  files?: readonly DataFile[];
  /** Arduino sketches: sets of board inputs the learner can run with, such as a check's button presses. */
  scenarios?: readonly BoardScenario[];
  /** Sketches: the board they run on (default: the Uno). */
  board?: BoardId;
  /** Sketches: the lesson's circuit, shown on the board and used for every run. */
  circuit?: Circuit;
}

/** Inputs for one run of a sketch: what happens to the board's inputs, and for how long it runs. */
export interface BoardScenario {
  label: string;
  inputs: readonly string[];
  ms?: number;
}

/** Data files as the runner takes them: name -> text. */
export function fileMap(files: readonly DataFile[] | undefined): Record<string, string> {
  return Object.fromEntries((files ?? []).map((file) => [file.name, file.text]));
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

  // Sketches get the 3D board, and a choice of inputs when the lesson has some.
  const board: BoardView | null = options.language === "arduino" ? createBoardView(options.board, options.circuit) : null;
  const scenarios = options.scenarios ?? [];
  const scenarioSelect = el("select", { class: "runbox-scenario", "aria-label": "Board inputs for Run" }) as HTMLSelectElement;
  // With shared memory, Run without a check's inputs is live: the learner presses and turns the parts.
  const live = board !== null && canRunLive();
  scenarioSelect.append(el("option", { value: "-1" }, [live ? "Live: you work the parts" : "No inputs"]));
  scenarios.forEach((scenario, index) => scenarioSelect.append(el("option", { value: String(index) }, [scenario.label])));
  const scenarioField = el("label", { class: "runbox-scenario-field" }, [el("span", {}, ["Inputs"]), scenarioSelect]);
  if (scenarios.length === 0) scenarioField.hidden = true;

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
    const scenario = scenarios[Number(scenarioSelect.value)];
    const liveChannel = live && !scenario ? createLiveChannel() : null;
    const session = liveChannel && board ? board.startLive(options.board ?? "uno", liveChannel, code) : null;
    let finalReport: BoardReport | null = null;
    if (!session) board?.show(null);
    try {
      await runProgram({
        language: options.language,
        code,
        fileName: options.fileName,
        consoleIO,
        signal: abort.signal,
        files: fileMap(options.files),
        sim: liveChannel
          ? { runMs: 30 * 60_000, inputs: [], board: options.board, live: liveChannel }
          : { runMs: scenario?.ms, inputs: scenario?.inputs, board: options.board },
        onLive: session ? (events, t, modes, reads) => session.changes(events, t, modes, reads) : undefined,
        onBoard: board ? (report) => (session ? void (finalReport = report) : board.show(report, code)) : undefined,
        // Show what the program wrote, since there is no explorer here.
        onFiles: (after) => {
          const before = fileMap(options.files);
          for (const [name, text] of Object.entries(after)) {
            if (before[name] === text) continue;
            consoleIO.writeInfo(`\n--- ${name} now holds ---\n${text}${text.endsWith("\n") || text === "" ? "" : "\n"}--- end of ${name} ---\n`);
          }
        },
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
      session?.end(finalReport);
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
    el("div", { class: "runbox-actions" }, [runButton, stopButton, ...(options.actions ?? []), ...(board ? [scenarioField] : [])]),
    ...(board ? [board.element] : []),
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
      board?.dispose();
    },
  };
}
