// Small DOM helpers shared by the shell views.

import { icon } from "./icons";
import type { IconName } from "./icons";

type Attributes = Record<string, string | boolean | undefined>;

/** Creates an element. `false` and `undefined` attribute values are skipped; `true` sets an empty attribute. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Attributes = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === false) continue;
    if (name === "class") node.className = String(value);
    else node.setAttribute(name, value === true ? "" : value);
  }
  node.append(...children);
  return node;
}

export interface ButtonOptions {
  label: string;
  icon?: IconName;
  /** Show the label as text next to the icon. Icon-only buttons still get it as their accessible name. */
  showLabel?: boolean;
  class?: string;
  onClick: (event: MouseEvent) => void;
}

export function button(options: ButtonOptions): HTMLButtonElement {
  const node = el("button", { type: "button", class: options.class ?? "btn" });
  if (options.icon) node.append(icon(options.icon));
  if (options.showLabel || !options.icon) node.append(el("span", { class: "btn-label" }, [options.label]));
  else {
    node.setAttribute("aria-label", options.label);
    node.title = options.label;
  }
  node.addEventListener("click", options.onClick);
  return node;
}
