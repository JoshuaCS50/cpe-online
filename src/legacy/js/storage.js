// localStorage-backed project storage + download/upload helpers.
//
// v2 schema (Iteration 2): tabs renamed to "drafts" with a savedAt
// timestamp. We migrate v1 state on load.
//
// state shape:
//   {
//     drafts: [{ id, name, language, doc, savedAt }, ...],
//     activeDraft: <id>,
//     settings: { theme, fontSize, wrap, seenOnboarding,
//                 streamingMode, dismissedInstallBanner }
//   }

const KEY_V1 = "cpe-online.state.v1";
const KEY = "cpe-online.state.v2";

export const MAX_DRAFTS = 8;

function migrateV1(v1) {
  if (!v1 || typeof v1 !== "object") return null;
  const tabs = Array.isArray(v1.tabs) ? v1.tabs : [];
  const drafts = tabs.map((t) => ({
    id: t.id || ("d" + Math.random().toString(36).slice(2, 8)),
    name: t.name || "untitled.c",
    language: t.language || "c",
    doc: t.doc || "",
    savedAt: Date.now(),
  }));
  return {
    drafts,
    activeDraft: v1.activeTab || (drafts[0] && drafts[0].id) || null,
    settings: v1.settings || {},
    _migratedFromV1: true,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
    // Try v1 migration as a one-shot.
    const rawV1 = localStorage.getItem(KEY_V1);
    if (rawV1) {
      const migrated = migrateV1(JSON.parse(rawV1));
      if (migrated) {
        try { localStorage.setItem(KEY, JSON.stringify(migrated)); } catch (_) {}
        return migrated;
      }
    }
    return null;
  } catch (err) {
    console.warn("Failed to load state", err);
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn("Failed to save state (quota?)", err);
    return false;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY_V1);
  } catch (_) {
    /* ignore */
  }
}

export function downloadFile(name, contents, mime = "text/plain") {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function languageFromFilename(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".c") || lower.endsWith(".h")) return "c";
  if (
    lower.endsWith(".cpp") ||
    lower.endsWith(".cc") ||
    lower.endsWith(".cxx") ||
    lower.endsWith(".hpp") ||
    lower.endsWith(".hh")
  )
    return "cpp";
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".java")) return "java";
  return "c";
}

export function extensionForLanguage(lang) {
  switch (lang) {
    case "cpp":
      return "cpp";
    case "python":
      return "py";
    case "java":
      return "java";
    case "c":
    default:
      return "c";
  }
}
