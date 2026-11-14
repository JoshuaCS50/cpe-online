// The board panel: a 3D board that replays a sketch's run, with view
// controls, a play bar and the moment described in words (for screen readers,
// and for devices without WebGL). three.js is loaded the first time a panel
// is shown.

import "./board3d.css";

import type { BoardEvent, BoardReport, PinReads } from "../runners/arduino/board";
import { setLiveInput } from "../runners/arduino/live";
import { pinName, profileOf } from "../runners/arduino/profiles";
import type { BoardId } from "../runners/arduino/profiles";
import { button, el } from "../shell/dom";
import type { BoardScene } from "./scene";
import type { Circuit } from "../content/circuit";
import { TOUCH_IDLE, colourHints, describeMoment, planFromCircuit, planParts } from "./state";
import type { PartPlan } from "./state";

export interface BoardView {
  element: HTMLElement;
  /** Shows a finished run and plays it from the start, or the idle board for `null`. The sketch's code names LED colours. */
  show(report: BoardReport | null, code?: string): void;
  /** Puts another circuit (or none) and board in place, for circuits people build themselves. */
  setCircuit(board: BoardId, circuit: Circuit | null): void;
  /** Starts a live run: the scene follows the sketch in real time and the parts can be pressed, turned and touched. */
  startLive(board: BoardId, channel: SharedArrayBuffer, code?: string): LiveSession;
  dispose(): void;
}

/** What a live run tells the board view while it runs, and when it ends. */
export interface LiveSession {
  changes(events: BoardEvent[], t: number, modes: number[], reads: PinReads): void;
  /** The run ended; with its final report the board replays the whole session. */
  end(report: BoardReport | null): void;
}

/** A touched pad reads well below the untouched value. */
const TOUCHED = 15;

const SPEEDS = [0.25, 1, 4];

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * `board` is the board shown before the first run (a run on another board swaps it).
 * With a lesson's `circuit`, the scene shows that circuit from the start and every run uses it.
 */
export function createBoardView(board: BoardId = "uno", circuit?: Circuit): BoardView {
  let circuitPlan = circuit ? planFromCircuit(circuit) : null;
  let idleText = circuit ? "This is the circuit. Press Run to start the sketch on it." : "Run the sketch to see the board come to life.";
  const labelLayer = el("div", {
    class: "board3d-labels",
    "aria-hidden": "true",
  });
  const notice = el("p", { class: "board3d-notice" }, [
    "Loading the 3D board…",
  ]);
  const stage = el("div", { class: "board3d-stage" }, [labelLayer, notice]);

  let scene: BoardScene | null = null;
  let disposed = false;
  let report: BoardReport | null = null;
  let plan: PartPlan | null = null;
  let t = 0;
  let playing = false;
  let speed = 1;
  let frame = 0;
  let last = 0;
  let labelsOn = true;

  const viewButton = (
    label: string,
    iconName: Parameters<typeof button>[0]["icon"],
    onClick: () => void,
  ): HTMLButtonElement =>
    button({
      label,
      icon: iconName,
      class: "btn btn-ghost board3d-tool",
      onClick,
    });
  const labelsButton = button({
    label: "Labels",
    showLabel: true,
    class: "btn btn-ghost board3d-tool board3d-labels-toggle",
    onClick: () => toggleLabels(),
  });
  labelsButton.setAttribute("aria-pressed", "true");
  const toolbar = el(
    "div",
    { class: "board3d-toolbar", role: "toolbar", "aria-label": "Board view" },
    [
      viewButton("Turn the board", "rotate", () => scene?.rotate(-30)),
      viewButton("Zoom out", "zoomOut", () => scene?.zoom(1.25)),
      viewButton("Zoom in", "zoomIn", () => scene?.zoom(0.8)),
      viewButton("Reset view", "focusCentered", () => scene?.resetView()),
      labelsButton,
    ],
  );
  stage.append(toolbar);

  const playButton = button({
    label: "Play",
    icon: "play",
    showLabel: true,
    class: "btn btn-outline board3d-play",
    onClick: () => togglePlay(),
  });
  const scrubber = el("input", {
    type: "range",
    class: "board3d-scrubber",
    min: "0",
    max: "1000",
    step: "1",
    value: "0",
    "aria-label": "Board time",
  }) as HTMLInputElement;
  const clock = el("span", { class: "board3d-clock" }, ["0.00 s"]);
  const speedButton = button({
    label: "Speed 1×",
    showLabel: true,
    class: "btn btn-ghost board3d-speed",
    onClick: () => cycleSpeed(),
  });
  speedButton.textContent = "1×";
  speedButton.setAttribute("aria-label", "Playback speed 1×");
  const player = el("div", { class: "board3d-player" }, [
    playButton,
    scrubber,
    clock,
    speedButton,
  ]);
  const status = el("p", { class: "board3d-status", "aria-live": "polite" }, [
    idleText,
  ]);

  // Live runs: buttons to hold, sliders to turn, pads to touch. The 3D parts work the same way.
  const controls = el("div", { class: "board3d-controls", role: "group", "aria-label": "Inputs while the sketch runs" });
  controls.hidden = true;

  const element = el(
    "section",
    { class: "board3d", "aria-label": "Virtual board" },
    [stage, controls, player, status],
  );

  /** The live run in progress, if any. */
  let live: { channel: SharedArrayBuffer; board: BoardId; code: string; lastT: number; lastAt: number; frame: number; planKey: string; started: boolean } | null = null;

  // Board time of a live run; it starts with the sketch's first message, not while it compiles.
  const liveNow = (): number => (live?.started ? live.lastT + (performance.now() - live.lastAt) : 0);

  /** Puts a value on a pin of the running sketch, and shows it in the scene at once. */
  function setInput(pin: number, value: number): void {
    if (!live || !report) return;
    setLiveInput(live.channel, pin, value);
    report.inputs.push({ pin, at: liveNow(), value });
  }

  /** The value an input part is showing now. */
  function currentInput(pin: number): number | undefined {
    if (!report) return undefined;
    for (let i = report.inputs.length - 1; i >= 0; i--) if (report.inputs[i]!.pin === pin) return report.inputs[i]!.value;
    return undefined;
  }

  const fullScale = (): number => 2 ** profileOf(live?.board ?? board).adcBits - 1;
  const pinText = (pin: number): string => (live?.board === "esp32" ? pinName(pin, profileOf("esp32")) : `pin ${pinName(pin)}`);

  /** Presses (or releases) a button or touches a pad, the way its wiring reads it. */
  function press(pin: number, down: boolean, kind: "button" | "touch"): void {
    if (kind === "touch") return setInput(pin, down ? TOUCHED : TOUCH_IDLE);
    const pullUp = (plan?.buttonWiring[pin] ?? "pull-up") === "pull-up";
    setInput(pin, pullUp ? (down ? 0 : 1) : down ? 1 : 0);
  }

  /** An ultrasonic sensor's Echo pin takes a distance in cm (2 to 400); other inputs an analog reading. */
  const isDistance = (pin: number): boolean => plan?.ultrasonics.some(([, echo]) => echo === pin) ?? false;
  const rangeOf = (pin: number): [number, number] => (isDistance(pin) ? [2, 400] : [0, fullScale()]);

  /** Turns a knob, presses a force sensor or moves an obstacle by `delta` (a fraction of the full range). */
  function turn(pin: number, delta: number): void {
    const [low, high] = rangeOf(pin);
    const start = currentInput(pin) ?? (isDistance(pin) ? 60 : 0);
    const value = Math.max(low, Math.min(high, Math.round(start + delta * (high - low))));
    setInput(pin, value);
    const slider = controls.querySelector<HTMLInputElement>(`input[data-pin="${pin}"]`);
    if (slider) slider.value = String(value);
  }

  function holdButton(label: string, pin: number, kind: "button" | "touch"): HTMLButtonElement {
    const control = el("button", { type: "button", class: "btn btn-outline board3d-hold" }, [label]) as HTMLButtonElement;
    const down = (event: Event): void => {
      event.preventDefault();
      control.dataset.down = "true";
      press(pin, true, kind);
    };
    const up = (): void => {
      if (control.dataset.down !== "true") return;
      control.dataset.down = "false";
      press(pin, false, kind);
    };
    control.addEventListener("pointerdown", down);
    control.addEventListener("pointerup", up);
    control.addEventListener("pointerleave", up);
    control.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") down(event);
    });
    control.addEventListener("keyup", up);
    return control;
  }

  function slider(label: string, pin: number): HTMLElement {
    const [low, high] = rangeOf(pin);
    const input = el("input", { type: "range", min: String(low), max: String(high), step: "1", value: String(currentInput(pin) ?? (isDistance(pin) ? 60 : low)), "data-pin": String(pin), "aria-label": label }) as HTMLInputElement;
    input.addEventListener("input", () => setInput(pin, Number(input.value)));
    return el("label", { class: "board3d-slider" }, [el("span", {}, [label]), input]);
  }

  function renderControls(): void {
    if (!live || !plan) {
      controls.hidden = true;
      controls.replaceChildren();
      return;
    }
    const items: HTMLElement[] = [
      ...plan.buttons.map((pin) => holdButton(`Hold button (${pinText(pin)})`, pin, "button")),
      ...plan.touchPads.map((pin) => holdButton(`Touch pad (${pinText(pin)})`, pin, "touch")),
      ...plan.knobs.map((pin) => slider(`Knob (${pinText(pin)})`, pin)),
      ...plan.ldrs.map((pin) => slider(`Light (${pinText(pin)})`, pin)),
      ...plan.fsrs.map((pin) => slider(`Press (${pinText(pin)})`, pin)),
      ...plan.temps.map((pin) => slider(`Temperature (${pinText(pin)})`, pin)),
      ...plan.soils.map((pin) => slider(`Soil wetness (${pinText(pin)})`, pin)),
      ...plan.ultrasonics.map(([, echo]) => slider(`Distance, cm (echo ${pinText(echo!)})`, echo!)),
    ];
    controls.hidden = items.length === 0;
    controls.replaceChildren(...(items.length ? [el("span", { class: "board3d-live-badge" }, ["LIVE"]), ...items] : []));
  }

  /** Live runs without a lesson circuit: the parts follow what the sketch uses, so new ones may appear. */
  function updateLivePlan(): void {
    if (!live || !report || circuitPlan) return;
    const next = planParts(report, colourHints(live.code));
    const key = JSON.stringify(next);
    if (key === live.planKey) return;
    live.planKey = key;
    plan = next;
    scene?.setRun(report, plan);
    renderControls();
  }

  function liveFrame(): void {
    if (!live) return;
    const now = liveNow();
    scene?.setTime(now);
    clock.textContent = live.started ? `LIVE ${seconds(now)}` : "Starting…";
    if (report && plan) {
      const text = describeMoment(report, plan, now);
      if (text !== lastStatus) {
        status.textContent = text;
        lastStatus = text;
      }
    }
    live.frame = requestAnimationFrame(liveFrame);
  }

  function syncPlayer(): void {
    const ready = report !== null;
    playButton.disabled = !ready;
    scrubber.disabled = !ready;
    speedButton.disabled = !ready;
    const atEnd = report !== null && t >= report.runMs;
    const label = playing ? "Pause" : atEnd ? "Replay" : "Play";
    const labelEl = playButton.querySelector(".btn-label");
    if (labelEl) labelEl.textContent = label;
    playButton.setAttribute("aria-label", label);
    playButton.dataset.playing = String(playing);
  }

  let lastStatus = "";
  function apply(): void {
    scene?.setTime(t);
    if (!report || !plan) return;
    scrubber.value = String(Math.round(t));
    clock.textContent = `${seconds(t)} / ${seconds(report.runMs)}`;
    const text = `At ${seconds(t)}: ${describeMoment(report, plan, t)}`;
    if (
      text.replace(/At [\d.]+ s: /, "") !==
        lastStatus.replace(/At [\d.]+ s: /, "") ||
      !playing
    ) {
      status.textContent = text;
      lastStatus = text;
    }
  }

  function tick(now: number): void {
    if (!report) return;
    t = Math.min(report.runMs, t + (now - last) * speed);
    last = now;
    apply();
    if (t >= report.runMs) {
      playing = false;
      frame = 0;
      syncPlayer();
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  function play(): void {
    if (!report || playing) return;
    if (t >= report.runMs) t = 0;
    playing = true;
    last = performance.now();
    frame = requestAnimationFrame(tick);
    syncPlayer();
  }

  function pause(): void {
    playing = false;
    cancelAnimationFrame(frame);
    frame = 0;
    syncPlayer();
    apply();
  }

  function togglePlay(): void {
    if (playing) pause();
    else play();
  }

  function cycleSpeed(): void {
    speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!;
    const text = speed === 0.25 ? "¼×" : `${speed}×`;
    speedButton.textContent = text;
    speedButton.setAttribute("aria-label", `Playback speed ${text}`);
  }

  function toggleLabels(): void {
    labelsOn = !labelsOn;
    labelsButton.setAttribute("aria-pressed", String(labelsOn));
    scene?.setLabels(labelsOn);
  }

  scrubber.addEventListener("input", () => {
    if (playing) pause();
    t = Number(scrubber.value);
    apply();
    syncPlayer();
  });

  // The Fusion models are optional: without them the board is drawn from simple shapes.
  function startScene(): void {
    import("./scene")
      .then(async ({ createBoardScene, loadModels }) => {
        const models = await loadModels().catch((error: unknown) => {
          console.warn(
            "3D board models not loaded; using simple shapes",
            error,
          );
          return null;
        });
        if (disposed) return;
        scene = createBoardScene(stage, labelLayer, models, board);
        notice.remove();
        scene.setLabels(labelsOn);
        scene.setInteraction({
          press: (pin, down, kind) => live && press(pin, down, kind),
          turn: (pin, delta) => live && turn(pin, delta),
        });
        if (report) {
          scene.setRun(report, plan);
          apply();
        } else if (circuitPlan) scene.setRun(null, circuitPlan);
      })
      .catch((error: unknown) => {
        notice.textContent = `The 3D board can't be shown on this device (${error instanceof Error ? error.message : String(error)}). The pin changes are listed in the output.`;
        toolbar.hidden = true;
      });
  }

  // A board starts (three.js, WebGL) only when it is first on screen: a lesson
  // keeps its hidden tabs in the page, and each 3D view holds a WebGL context.
  const visibility = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    visibility.disconnect();
    startScene();
  });
  visibility.observe(stage);

  syncPlayer();

  const view: BoardView = {
    element,
    startLive(liveBoard, channel, code = "") {
      pause();
      if (live) cancelAnimationFrame(live.frame);
      live = { channel, board: liveBoard, code, lastT: 0, lastAt: performance.now(), frame: 0, planKey: "", started: false };
      report = { board: liveBoard, runMs: 30 * 60_000, timeline: [], warnings: [], events: [], inputs: [], modes: [], touchPins: [], reads: { digital: [], analog: [] } };
      plan = circuitPlan ?? planParts(report, colourHints(code));
      live.planKey = JSON.stringify(plan);
      t = 0;
      lastStatus = "";
      scene?.setRun(report, plan);
      renderControls();
      for (const control of [playButton, scrubber, speedButton]) control.disabled = true;
      status.textContent = "Live: press, turn and touch the parts while the sketch runs.";
      live.frame = requestAnimationFrame(liveFrame);
      return {
        changes: (events, now, modes, reads) => {
          if (!live || !report) return;
          report.events.push(...events);
          report.modes = modes;
          report.reads = reads;
          live.lastT = now;
          live.lastAt = performance.now();
          live.started = true;
          updateLivePlan();
        },
        end: (final) => {
          if (!live) return;
          cancelAnimationFrame(live.frame);
          const session = report;
          const sessionCode = live.code;
          live = null;
          renderControls();
          // Replay the whole session: the final report has every change and every input given.
          const replay = final ?? (session ? { ...session, runMs: Math.max(1, ...session.events.map((event) => event.t), ...session.inputs.map((input) => input.at)) } : null);
          view.show(replay, sessionCode);
          pause();
          t = replay?.runMs ?? 0;
          apply();
          syncPlayer();
        },
      };
    },
    show(next, code = "") {
      pause();
      report = next;
      plan = next ? (circuitPlan ?? planParts(next, colourHints(code))) : circuitPlan;
      t = 0;
      lastStatus = "";
      scrubber.max = String(next?.runMs ?? 1000);
      scene?.setRun(next, plan);
      if (next) {
        apply();
        play();
      } else {
        clock.textContent = "0.00 s";
        status.textContent = idleText;
        scene?.setTime(0);
      }
      syncPlayer();
    },
    setCircuit(nextBoard, nextCircuit) {
      pause();
      board = nextBoard;
      circuitPlan = nextCircuit && nextCircuit.parts.length > 0 ? planFromCircuit(nextCircuit) : null;
      idleText = circuitPlan ? "This is your circuit. Press Run to start the sketch on it." : "Run the sketch to see the board come to life.";
      report = null;
      plan = circuitPlan;
      t = 0;
      scene?.setRun(null, circuitPlan, board);
      clock.textContent = "0.00 s";
      status.textContent = idleText;
      syncPlayer();
    },
    dispose() {
      disposed = true;
      visibility.disconnect();
      cancelAnimationFrame(frame);
      if (live) cancelAnimationFrame(live.frame);
      scene?.dispose();
      scene = null;
    },
  };
  return view;
}
