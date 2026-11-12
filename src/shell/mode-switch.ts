// The Code / Learn switch shown in both top bars. The two modes are
// addresses (#/code and #/learn), so the switch is a pair of links.

import { el } from "./dom";
import { icon } from "./icons";

export type Mode = "code" | "learn";

export function createModeSwitch(current: Mode): HTMLElement {
  const link = (mode: Mode, label: string, iconName: "code" | "school"): HTMLAnchorElement =>
    el("a", { class: "mode-link", href: `#/${mode}`, "aria-current": mode === current ? "page" : undefined }, [
      icon(iconName),
      el("span", {}, [label]),
    ]);
  return el("nav", { class: "mode-switch", "aria-label": "Mode" }, [link("code", "Code", "code"), link("learn", "Learn", "school")]);
}
