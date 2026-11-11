// User settings, stored under one key.

import type { AppStore, Settings, ThemeName } from "./types";

export const SETTINGS_KEY = "settings";

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  theme: "vscode",
  fontSize: 15,
  wrap: false,
  outputWrap: false,
  seenOnboarding: false,
  dismissedInstallBanner: false,
};

export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 22;

const THEMES: readonly ThemeName[] = ["vscode", "catppuccin", "auto", "light"];

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Builds valid settings from anything: stored data, legacy data, or junk.
 * Unknown keys are dropped and wrong types fall back to the defaults.
 */
export function sanitizeSettings(raw: unknown): Settings {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const theme = THEMES.find((name) => name === source.theme) ?? DEFAULT_SETTINGS.theme;
  const size = typeof source.fontSize === "number" && Number.isFinite(source.fontSize) ? source.fontSize : DEFAULT_SETTINGS.fontSize;
  return {
    theme,
    fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(size))),
    wrap: flag(source.wrap, DEFAULT_SETTINGS.wrap),
    outputWrap: flag(source.outputWrap, DEFAULT_SETTINGS.outputWrap),
    seenOnboarding: flag(source.seenOnboarding, DEFAULT_SETTINGS.seenOnboarding),
    dismissedInstallBanner: flag(source.dismissedInstallBanner, DEFAULT_SETTINGS.dismissedInstallBanner),
  };
}

export async function loadSettings(store: AppStore): Promise<Settings> {
  return sanitizeSettings(await store.getValue(SETTINGS_KEY));
}

/** Merges `patch` into the stored settings and returns the result. */
export async function saveSettings(store: AppStore, patch: Partial<Settings>): Promise<Settings> {
  const next = sanitizeSettings({ ...(await loadSettings(store)), ...patch });
  await store.setValue(SETTINGS_KEY, next);
  return next;
}
