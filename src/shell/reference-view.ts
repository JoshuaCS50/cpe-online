// Reference: the CPE150S cheat sheet (format specifiers, data types, and so
// on), one topic at a time.

import { CHEATSHEET_SECTIONS } from "../legacy/js/cheatsheet.js";
import { el } from "./dom";

export function createReferenceView(host: HTMLElement): void {
  const picker = el("select", { class: "field-select", id: "reference-topic" });
  for (const section of CHEATSHEET_SECTIONS) {
    picker.append(el("option", { value: section.id }, [section.label]));
  }
  const content = el("div", { class: "reference", tabindex: "0" });

  function show(id: string): void {
    const section = CHEATSHEET_SECTIONS.find((candidate) => candidate.id === id) ?? CHEATSHEET_SECTIONS[0];
    // The sections are static markup shipped with the app, not user input.
    content.innerHTML = section?.html ?? "";
    content.scrollTop = 0;
  }

  picker.addEventListener("change", () => show(picker.value));

  host.append(
    el("div", { class: "side-header" }, [el("span", { class: "side-title" }, ["Reference"])]),
    el("div", { class: "field" }, [el("label", { class: "field-label", for: "reference-topic" }, ["Topic"]), picker]),
    content,
  );
  show(picker.value);
}
