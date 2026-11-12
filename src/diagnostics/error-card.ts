// The card shown in the terminal when a program fails: what went wrong,
// where, why, and how to fix it. The runtime's own message stays one click
// away, and is open by default when the catalog had no real explanation.

import "./diagnostics.css";

import { el } from "../shell/dom";
import { icon } from "../shell/icons";
import type { ErrorExplanation } from "./types";

export interface ErrorCardOptions {
  /** Shown in the location chip, for example "hello.c". */
  fileName: string;
  /** Called when the user taps the location chip. */
  onJump: (line: number) => void;
}

function section(heading: string, body: (Node | string)[]): HTMLElement {
  return el("div", { class: "error-section" }, [el("h4", { class: "error-heading" }, [heading]), ...body]);
}

export function createErrorCard(explanation: ErrorExplanation, options: ErrorCardOptions): HTMLElement {
  const { line, column } = explanation;
  const header = el("div", { class: "error-card-header" }, [
    icon("alertTriangle"),
    el("h3", { class: "error-title" }, [explanation.title]),
  ]);

  if (line !== null) {
    const where = `${options.fileName}:${line}${column !== null ? `:${column}` : ""}`;
    const chip = el("button", { type: "button", class: "error-where", "aria-label": `Go to ${options.fileName} line ${line}` }, [where]);
    chip.addEventListener("click", () => options.onJump(line));
    header.append(chip);
  }

  const steps = el("ol", { class: "error-steps" });
  for (const step of explanation.fix) steps.append(el("li", {}, [step]));

  const card = el("article", { class: "error-card", "data-confidence": explanation.confidence }, [
    header,
    section(explanation.confidence === "likely" ? "Most likely" : "What happened", [el("p", {}, [explanation.what])]),
    section("Why", [el("p", {}, [explanation.why])]),
    section("How to fix it", [steps]),
  ]);

  if (explanation.example) {
    card.append(
      el("div", { class: "error-example" }, [
        el("div", {}, [el("span", { class: "error-example-label" }, ["Before"]), el("pre", {}, [explanation.example.before])]),
        el("div", {}, [el("span", { class: "error-example-label" }, ["After"]), el("pre", {}, [explanation.example.after])]),
      ]),
    );
  }

  card.append(
    el("details", { class: "error-raw", open: explanation.confidence === "fallback" }, [
      el("summary", {}, ["Original message"]),
      el("pre", {}, [explanation.raw.trimEnd()]),
    ]),
  );
  return card;
}
