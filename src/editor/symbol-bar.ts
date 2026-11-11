// One-tap symbols for phone keyboards, where { } ; and friends hide behind
// several layers. Shown on touch devices only (see shell.css).

import type { EditorHandle } from "./editor";

interface SymbolKey {
  /** Text on the key. */
  label: string;
  /** Text to insert; defaults to the label. */
  insert?: string;
  /** Where the cursor lands relative to the end of the inserted text. */
  cursor?: number;
  name: string;
}

const pair = (open: string, close: string, name: string): SymbolKey => ({
  label: `${open} ${close}`,
  insert: open + close,
  cursor: -1,
  name,
});

const C_KEYS: SymbolKey[] = [
  pair("{", "}", "curly braces"),
  pair("(", ")", "parentheses"),
  pair("[", "]", "square brackets"),
  { label: ";", name: "semicolon" },
  pair('"', '"', "double quotes"),
  pair("<", ">", "angle brackets"),
  { label: "#", name: "hash" },
  { label: "&", name: "ampersand" },
  { label: "*", name: "asterisk" },
  { label: "=", name: "equals" },
  { label: "==", name: "equal to" },
  { label: "!=", name: "not equal to" },
  { label: "&&", name: "logical and" },
  { label: "||", name: "logical or" },
  { label: "%", name: "percent" },
  { label: "++", name: "increment" },
  { label: "--", name: "decrement" },
  { label: "->", name: "arrow" },
  { label: "\\n", name: "newline escape" },
];

const PYTHON_KEYS: SymbolKey[] = [
  { label: ":", name: "colon" },
  pair("(", ")", "parentheses"),
  pair("[", "]", "square brackets"),
  pair("{", "}", "curly braces"),
  pair('"', '"', "double quotes"),
  pair("'", "'", "single quotes"),
  { label: "#", name: "hash" },
  { label: "=", name: "equals" },
  { label: "==", name: "equal to" },
  { label: "!=", name: "not equal to" },
  { label: "_", name: "underscore" },
  { label: ".", name: "dot" },
  { label: ",", name: "comma" },
  { label: "+", name: "plus" },
  { label: "-", name: "minus" },
  { label: "*", name: "asterisk" },
  { label: "/", name: "slash" },
  { label: "%", name: "percent" },
];

function keysFor(language: string): SymbolKey[] {
  return language === "python" ? PYTHON_KEYS : C_KEYS;
}

export interface SymbolBar {
  setLanguage(language: string): void;
}

export function createSymbolBar(host: HTMLElement, getEditor: () => EditorHandle | null): SymbolBar {
  host.setAttribute("role", "toolbar");
  host.setAttribute("aria-label", "Insert symbol");

  function render(language: string): void {
    host.replaceChildren();
    const indent = document.createElement("button");
    indent.type = "button";
    indent.className = "sym";
    indent.textContent = "tab";
    indent.setAttribute("aria-label", "Indent");
    indent.dataset.key = "Tab";
    host.append(indent);

    for (const key of keysFor(language)) {
      const node = document.createElement("button");
      node.type = "button";
      node.className = "sym";
      node.textContent = key.label;
      node.setAttribute("aria-label", `Insert ${key.name}`);
      node.dataset.insert = key.insert ?? key.label;
      node.dataset.cursor = String(key.cursor ?? 0);
      host.append(node);
    }
  }

  // pointerdown + preventDefault keeps focus (and the on-screen keyboard) in the editor.
  host.addEventListener("pointerdown", (event) => event.preventDefault());
  host.addEventListener("click", (event) => {
    const key = (event.target as HTMLElement).closest<HTMLButtonElement>(".sym");
    const editor = getEditor();
    if (!key || !editor) return;
    if (key.dataset.key) editor.triggerKey(key.dataset.key);
    else editor.insertText(key.dataset.insert ?? "", Number(key.dataset.cursor ?? 0));
  });

  render("c");
  return { setLanguage: render };
}
