// Examples: ready-made programs, grouped by language. Picking one adds it to
// the project as a new file, so the user's own files are never overwritten.

import { MATLAB_EXAMPLES } from "../content/examples-matlab";
import type { Example } from "../content/examples-matlab";
import { EXAMPLES } from "../legacy/js/examples.js";
import { el } from "./dom";
import { icon } from "./icons";
import type { Workspace } from "./workspace";

const LANGUAGE_TITLES: Record<string, string> = { c: "C", cpp: "C++", python: "Python", java: "Java", matlab: "MATLAB" };

const ALL_EXAMPLES: Example[] = [...EXAMPLES, ...MATLAB_EXAMPLES];

export interface ExamplesViewOptions {
  workspace: Workspace;
  /** Called after an example has been opened (phones switch to the editor). */
  onOpen: () => void;
}

export function createExamplesView(host: HTMLElement, options: ExamplesViewOptions): void {
  const { workspace, onOpen } = options;

  host.append(
    el("div", { class: "side-header" }, [el("span", { class: "side-title" }, ["Examples"])]),
    el("p", { class: "side-note" }, ["Pick a program to open a copy of it in your files."]),
  );

  const groups = new Map<string, Example[]>();
  for (const example of ALL_EXAMPLES) {
    const group = groups.get(example.lang) ?? [];
    group.push(example);
    groups.set(example.lang, group);
  }

  for (const [language, examples] of groups) {
    const list = el("ul", { class: "file-list", role: "list" });
    for (const example of examples) {
      const open = el("button", { type: "button", class: "file-open" }, [
        icon("fileCode"),
        el("span", { class: "file-name" }, [example.name]),
      ]);
      open.addEventListener("click", () => {
        void workspace.addFile(example.filename, example.code).then(onOpen);
      });
      list.append(el("li", { class: "file-row" }, [open]));
    }
    host.append(el("h3", { class: "side-group" }, [LANGUAGE_TITLES[language] ?? language]), list);
  }
}
