// File name ↔ language mapping.

import type { Language } from "./types";

const EXTENSIONS: Record<string, Language> = {
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  hh: "cpp",
  py: "python",
  java: "java",
};

/** Language for a file name, by extension. Unknown or missing extensions count as C. */
export function languageFromFilename(name: string): Language {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "c";
  return EXTENSIONS[name.slice(dot + 1).toLowerCase()] ?? "c";
}

/** Extension, without the dot, used when saving a file of this language. */
export function extensionForLanguage(language: Language): string {
  switch (language) {
    case "cpp":
      return "cpp";
    case "python":
      return "py";
    case "java":
      return "java";
    case "c":
      return "c";
  }
}
