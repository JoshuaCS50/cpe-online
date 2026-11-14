// "Your circuit": people build their own circuit for a sketch in Code mode.
// Pick the board, add parts, set their pins; the same checks as lessons run
// as you type, and the parts list and wiring table update underneath. The
// result is saved with the sketch and the 3D board builds it.

import "./side-window.css";

import { CIRCUIT_PARTS, LED_COLOURS, PIN_COUNTS, circuitDocs, resolveCircuitParts } from "../content/circuit";
import type { CircuitPartInput, CircuitPartKind } from "../content/circuit";
import { profileOf, resolvePin } from "../runners/arduino/profiles";
import type { BoardId } from "../runners/arduino/profiles";
import { button, el } from "../shell/dom";

/** A circuit as saved with a sketch: the board and the parts as typed. */
export interface SavedCircuit {
  board: BoardId;
  parts: CircuitPartInput[];
}

export const PART_NAMES: Record<CircuitPartKind, string> = {
  led: "LED",
  "rgb-led": "RGB LED",
  button: "Push button",
  knob: "Potentiometer (knob)",
  ldr: "Light sensor (LDR)",
  fsr: "Force sensor (FSR)",
  "temp-sensor": "Temperature sensor (TMP36)",
  "soil-sensor": "Soil-moisture sensor",
  ultrasonic: "Ultrasonic sensor (HC-SR04)",
  servo: "Servo motor",
  buzzer: "Buzzer",
  motor: "DC motor or fan (with transistor)",
  stepper: "Stepper motor + driver",
  oled: "OLED screen (I²C)",
  "touch-pad": "Touch pad (ESP32)",
};

const PIN_LABELS: Partial<Record<CircuitPartKind, string[]>> = {
  "rgb-led": ["Red", "Green", "Blue"],
  ultrasonic: ["Trig", "Echo"],
  stepper: ["IN1", "IN2", "IN3", "IN4"],
};

/** Pins to suggest for a new part, best first, by board and by what the part needs. */
const SUGGESTIONS: Record<BoardId, Record<"output" | "pwm" | "analog" | "input" | "touch", (number | string)[]>> = {
  uno: {
    output: [13, 12, 8, 7, 4, 2, 11, 10, 9, 6, 5, 3],
    pwm: [9, 10, 11, 6, 5, 3],
    analog: ["A0", "A1", "A2", "A3"],
    input: [2, 3, 4, 5, 6, 7, 8, 12],
    touch: [],
  },
  esp32: {
    output: [23, 22, 19, 18, 17, 16, 5, 13, 14, 27, 26, 25, 33, 32],
    pwm: [18, 19, 23, 22, 17, 16, 25, 26],
    analog: [34, 35, 32, 33, 36, 39],
    input: [4, 16, 17, 18, 19, 23, 22, 13, 14],
    touch: [4, 15, 13, 14, 27, 33, 32],
  },
};

function need(kind: CircuitPartKind): keyof (typeof SUGGESTIONS)["uno"] {
  if (kind === "knob" || kind === "ldr" || kind === "fsr" || kind === "temp-sensor" || kind === "soil-sensor") return "analog";
  if (kind === "button") return "input";
  if (kind === "touch-pad") return "touch";
  if (kind === "rgb-led" || kind === "motor" || kind === "servo") return "pwm";
  return "output";
}

/** A new part with free pins filled in. */
export function suggestPart(kind: CircuitPartKind, board: BoardId, existing: readonly CircuitPartInput[]): CircuitPartInput {
  const profile = profileOf(board);
  const used = new Set<number>();
  for (const part of existing) {
    for (const ref of [part.pin, ...(part.pins ?? [])]) {
      if (ref === undefined) continue;
      const pin = resolvePin(ref, profile);
      if (pin !== undefined) used.add(pin);
    }
    if (part.part === "oled") (board === "esp32" ? [21, 22] : [18, 19]).forEach((pin) => used.add(pin));
  }
  const take = (list: (number | string)[]): number | string | undefined => {
    for (const ref of list) {
      const pin = resolvePin(ref, profile);
      if (pin !== undefined && !used.has(pin)) {
        used.add(pin);
        return ref;
      }
    }
    return undefined;
  };
  const pool = SUGGESTIONS[board][need(kind)];
  const part: CircuitPartInput = { part: kind };
  const count = PIN_COUNTS[kind];
  if (kind === "oled") return part;
  if (count) {
    part.pins = Array.from({ length: count }, (_, index) => take(kind === "ultrasonic" && index === 1 ? SUGGESTIONS[board].input : pool) ?? "");
  } else {
    part.pin = take(pool) ?? "";
  }
  if (kind === "led") part.colour = LED_COLOURS[existing.filter((other) => other.part === "led").length % LED_COLOURS.length];
  if (kind === "button") part.wiring = "pull-up";
  return part;
}

function table(headings: string[], rows: string[][]): HTMLElement {
  return el("div", { class: "table-scroll" }, [
    el("table", { class: "circuit-table" }, [
      el("thead", {}, [el("tr", {}, headings.map((heading) => el("th", {}, [heading])))]),
      el("tbody", {}, rows.map((row) => el("tr", {}, row.map((cell, index) => el("td", index === 0 ? { class: "circuit-pin" } : {}, [cell]))))),
    ]),
  ]);
}

/** Opens the editor over `host`. `onSave` gets the circuit when the person saves it. */
export function openCircuitEditor(host: HTMLElement, initial: SavedCircuit, onSave: (saved: SavedCircuit) => void): void {
  const state: SavedCircuit = { board: initial.board, parts: initial.parts.map((part) => ({ ...part, ...(part.pins ? { pins: [...part.pins] } : {}) })) };

  const boardChoice = el("div", { class: "segmented", role: "radiogroup", "aria-label": "Board" });
  const rows = el("div", { class: "circuit-editor-parts" });
  const problemsEl = el("ul", { class: "circuit-editor-problems", "aria-live": "polite" });
  const preview = el("div", { class: "circuit-editor-preview" });
  const addSelect = el("select", { class: "circuit-editor-add", "aria-label": "Part to add" }) as HTMLSelectElement;
  const saveButton = button({ label: "Save circuit", icon: "check", showLabel: true, class: "btn btn-run", onClick: () => save() });

  function renderBoard(): void {
    boardChoice.replaceChildren(
      ...(["uno", "esp32"] as const).map((id) => {
        const option = el("button", { type: "button", role: "radio", class: "segment", "aria-checked": String(state.board === id) }, [id === "uno" ? "Arduino Uno" : "ESP32 DevKit"]);
        option.addEventListener("click", () => {
          if (state.board === id) return;
          state.board = id;
          // Pins differ between boards: suggest fresh ones for every part.
          const kinds = state.parts.map((part) => part.part);
          state.parts = [];
          for (const kind of kinds) if (kind !== "touch-pad" || id === "esp32") state.parts.push({ ...suggestPart(kind, id, state.parts) });
          renderAll();
        });
        return option;
      }),
    );
    addSelect.replaceChildren(
      el("option", { value: "" }, ["Add a part…"]),
      ...CIRCUIT_PARTS.filter((kind) => kind !== "touch-pad" || state.board === "esp32").map((kind) => el("option", { value: kind }, [PART_NAMES[kind]])),
    );
  }

  function field(label: string, input: HTMLElement): HTMLElement {
    return el("label", { class: "circuit-editor-field" }, [el("span", {}, [label]), input]);
  }

  function pinInput(value: number | string | undefined, onInput: (value: string) => void, label: string): HTMLElement {
    const input = el("input", { type: "text", value: value === undefined ? "" : String(value), size: "5", spellcheck: "false", "aria-label": label }) as HTMLInputElement;
    input.addEventListener("input", () => {
      onInput(input.value.trim());
      renderChecks();
    });
    return field(label, input);
  }

  function renderParts(): void {
    rows.replaceChildren(
      ...state.parts.map((part, index) => {
        const fields: HTMLElement[] = [];
        const labels = PIN_LABELS[part.part];
        if (part.part === "oled") fields.push(el("span", { class: "circuit-editor-note" }, [state.board === "esp32" ? "SDA 21, SCL 22" : "SDA A4, SCL A5"]));
        else if (labels) labels.forEach((label, slot) => fields.push(pinInput(part.pins?.[slot], (value) => ((part.pins ??= [])[slot] = value), label)));
        else fields.push(pinInput(part.pin, (value) => (part.pin = value), "Pin"));
        if (part.part === "led") {
          const colour = el("select", {}, LED_COLOURS.map((name) => el("option", { value: name, selected: part.colour === name ? "" : undefined }, [name]))) as HTMLSelectElement;
          colour.addEventListener("change", () => {
            part.colour = colour.value as CircuitPartInput["colour"];
            renderChecks();
          });
          fields.push(field("Colour", colour));
        }
        if (part.part === "button") {
          const wiring = el("select", {}, [
            el("option", { value: "pull-up", selected: part.wiring !== "pull-down" ? "" : undefined }, ["to GND (pull-up)"]),
            el("option", { value: "pull-down", selected: part.wiring === "pull-down" ? "" : undefined }, ["to power (pull-down)"]),
          ]) as HTMLSelectElement;
          wiring.addEventListener("change", () => {
            part.wiring = wiring.value as "pull-up" | "pull-down";
            renderChecks();
          });
          fields.push(field("Wiring", wiring));
        }
        const name = el("input", { type: "text", value: part.label ?? "", placeholder: "What it is for", "aria-label": "What it is for" }) as HTMLInputElement;
        name.addEventListener("input", () => {
          part.label = name.value.trim() || undefined;
          renderChecks();
        });
        fields.push(field("Label", name));
        const remove = button({
          label: `Remove ${PART_NAMES[part.part]}`,
          icon: "trash",
          class: "btn btn-icon btn-quiet",
          onClick: () => {
            state.parts.splice(index, 1);
            renderAll();
          },
        });
        return el("div", { class: "circuit-editor-row" }, [el("strong", {}, [PART_NAMES[part.part]]), el("div", { class: "circuit-editor-fields" }, fields), remove]);
      }),
    );
    if (state.parts.length === 0) rows.append(el("p", { class: "circuit-editor-empty" }, ["No parts yet. Add one below; the board on its own still runs the sketch."]));
  }

  function renderChecks(): void {
    const { circuit, problems } = resolveCircuitParts(state.parts, state.board);
    problemsEl.replaceChildren(...problems.map((problem) => el("li", {}, [problem.charAt(0).toUpperCase() + problem.slice(1)])));
    saveButton.disabled = problems.length > 0;
    if (problems.length > 0 || state.parts.length === 0) {
      preview.replaceChildren();
      return;
    }
    const docs = circuitDocs(circuit);
    preview.replaceChildren(
      el("h3", {}, ["What you need"]),
      el("ul", { class: "circuit-parts" }, docs.parts.map((part) => el("li", {}, [el("span", { class: "circuit-count" }, [`${part.count} ×`]), " ", part.name]))),
      el("h3", {}, ["Wiring"]),
      table(["Pin", "Connects to", "What it does"], docs.wiring.map((row) => [row.pin, row.to, row.does])),
    );
  }

  function renderAll(): void {
    renderBoard();
    renderParts();
    renderChecks();
  }

  addSelect.addEventListener("change", () => {
    const kind = addSelect.value as CircuitPartKind | "";
    if (!kind) return;
    state.parts.push(suggestPart(kind, state.board, state.parts));
    addSelect.value = "";
    renderAll();
  });

  function save(): void {
    onSave({ board: state.board, parts: state.parts });
    dialog.close();
  }

  const close = button({ label: "Close without saving", icon: "x", class: "btn btn-icon btn-quiet extra-close", onClick: () => dialog.close() });
  const dialog = el("dialog", { class: "extra-info circuit-editor", "aria-label": "Your circuit" }, [
    el("header", { class: "extra-head" }, [el("div", {}, [el("p", { class: "eyebrow" }, ["Code mode"]), el("h2", {}, ["Your circuit"])]), close]),
    el("div", { class: "extra-body" }, [
      el("p", { class: "circuit-editor-lead" }, ["Choose the board, add the parts your sketch uses and give them the pins it uses. Run then plays the sketch on this circuit, live: press, turn and touch the parts."]),
      el("h3", {}, ["Board"]),
      boardChoice,
      el("h3", {}, ["Parts"]),
      rows,
      addSelect,
      problemsEl,
      preview,
      el("div", { class: "circuit-editor-actions" }, [
        saveButton,
        button({
          label: "Remove all parts",
          showLabel: true,
          class: "btn btn-outline",
          onClick: () => {
            state.parts = [];
            renderAll();
          },
        }),
      ]),
    ]),
  ]) as HTMLDialogElement;
  dialog.addEventListener("close", () => dialog.remove());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  renderAll();
  host.append(dialog);
  dialog.showModal();
}
