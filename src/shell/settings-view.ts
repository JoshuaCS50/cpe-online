// Settings: appearance and editor options, plus the keyboard shortcuts.

import { FONT_SIZE_MAX, FONT_SIZE_MIN } from "../storage/settings";
import type { Settings, ThemeName } from "../storage/types";
import { el } from "./dom";

export interface SettingsViewOptions {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

const THEME_CHOICES: { value: ThemeName; label: string }[] = [
  { value: "vscode", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "auto", label: "Match device" },
];

const SHORTCUTS: [string, string][] = [
  ["F5", "Run, or continue when paused"],
  ["Shift+F5", "Stop"],
  ["F6", "Debug"],
  ["F10", "Step over"],
  ["F11", "Step into"],
  ["Shift+F11", "Step out"],
  ["Ctrl+B", "Show or hide the side panel"],
  ["Ctrl+J", "Show or hide the terminal"],
];

export interface SettingsView {
  /** Shows a setting that was changed somewhere else, for example kid mode from the Learn screen. */
  sync(settings: Settings): void;
}

export function createSettingsView(host: HTMLElement, options: SettingsViewOptions): SettingsView {
  const { settings, onChange } = options;

  // Theme: one choice out of three.
  const themeGroup = el("div", { class: "segmented", role: "radiogroup", "aria-label": "Theme" });
  // Catppuccin from the earlier version is a dark theme too.
  const currentTheme: ThemeName = settings.theme === "catppuccin" ? "vscode" : settings.theme;
  for (const choice of THEME_CHOICES) {
    const option = el(
      "button",
      { type: "button", class: "segment", role: "radio", "aria-checked": String(choice.value === currentTheme) },
      [choice.label],
    );
    option.addEventListener("click", () => {
      for (const other of themeGroup.children) other.setAttribute("aria-checked", String(other === option));
      onChange({ theme: choice.value });
    });
    themeGroup.append(option);
  }

  // Font size.
  const sizeValue = el("output", { class: "field-value", for: "setting-font-size" }, [`${settings.fontSize} px`]);
  const size = el("input", {
    id: "setting-font-size",
    class: "field-range",
    type: "range",
    min: String(FONT_SIZE_MIN),
    max: String(FONT_SIZE_MAX),
    step: "1",
    value: String(settings.fontSize),
  });
  size.addEventListener("input", () => {
    sizeValue.textContent = `${size.value} px`;
    onChange({ fontSize: Number(size.value) });
  });

  const toggle = (id: string, label: string, checked: boolean, apply: (value: boolean) => void): HTMLElement => {
    const box = el("input", { id, type: "checkbox", class: "field-check", checked });
    box.addEventListener("change", () => apply(box.checked));
    return el("div", { class: "field field-row" }, [el("label", { class: "field-label", for: id }, [label]), box]);
  };

  const kidToggle = toggle("setting-kid-mode", "Simple words (for young learners)", settings.kidMode, (kidMode) => onChange({ kidMode }));

  const shortcuts = el("dl", { class: "shortcuts" });
  for (const [keys, action] of SHORTCUTS) {
    shortcuts.append(el("dt", {}, [el("kbd", {}, [keys])]), el("dd", {}, [action]));
  }

  host.append(
    el("div", { class: "side-header" }, [el("span", { class: "side-title" }, ["Settings"])]),
    el("div", { class: "field" }, [el("span", { class: "field-label" }, ["Theme"]), themeGroup]),
    el("div", { class: "field" }, [
      el("div", { class: "field-row" }, [
        el("label", { class: "field-label", for: "setting-font-size" }, ["Code size"]),
        sizeValue,
      ]),
      size,
    ]),
    toggle("setting-wrap", "Wrap long lines in the editor", settings.wrap, (wrap) => onChange({ wrap })),
    toggle("setting-output-wrap", "Wrap long lines in the terminal", settings.outputWrap, (outputWrap) =>
      onChange({ outputWrap }),
    ),
    kidToggle,
    el("h3", { class: "side-group" }, ["Keyboard shortcuts"]),
    shortcuts,
  );

  return {
    sync(next) {
      const box = kidToggle.querySelector<HTMLInputElement>("input");
      if (box) box.checked = next.kidMode;
    },
  };
}
