// The Extra info window's entries: terms by concept id, components by part.

import type { Circuit } from "../circuit";
import { COMPONENTS } from "./components";
import { CORE_BASIC_TERMS } from "./core-basics";
import { CORE_DATA_TERMS } from "./core-data";
import { CPP_PYTHON_TERMS } from "./cpp-python";
import { EMBEDDED_TERMS } from "./embedded";
import type { GlossaryEntry } from "./types";

export type { GlossaryEntry } from "./types";

// Embedded entries last: where a term means something special on a board, that wins.
export const TERMS: Record<string, GlossaryEntry> = { ...CORE_BASIC_TERMS, ...CORE_DATA_TERMS, ...CPP_PYTHON_TERMS, ...EMBEDDED_TERMS };

/** A concept id as words, for terms that have no entry yet: "pull-up" -> "Pull up". */
export function conceptName(id: string): string {
  const words = id.replace(/[-_]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export interface ExtraInfo {
  terms: { id: string; entry: GlossaryEntry }[];
  components: { id: string; entry: GlossaryEntry }[];
  /** Concepts with no entry yet. */
  missing: string[];
}

/** What the Extra info window shows for a lesson: its terms, then its board and parts. */
export function extraInfo(concepts: readonly string[], circuit?: Circuit, board?: "uno" | "esp32"): ExtraInfo {
  const terms: ExtraInfo["terms"] = [];
  const missing: string[] = [];
  for (const id of concepts) {
    const entry = TERMS[id];
    if (entry) terms.push({ id, entry });
    else missing.push(id);
  }
  const componentIds: string[] = [];
  const boardId = circuit?.board ?? board;
  if (boardId) componentIds.push(`board-${boardId}`);
  if (circuit) {
    componentIds.push("breadboard", "jumper-wire");
    for (const part of circuit.parts) {
      componentIds.push(part.part);
      if (part.part === "led" || part.part === "rgb-led" || part.part === "ldr" || (part.part === "button" && part.wiring === "pull-down")) componentIds.push("resistor");
    }
  }
  const components = [...new Set(componentIds)].filter((id) => COMPONENTS[id]).map((id) => ({ id, entry: COMPONENTS[id]! }));
  return { terms, components, missing };
}
