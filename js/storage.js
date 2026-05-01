// localStorage-backed project storage + download/upload helpers.

const KEY = "cpe-online.state.v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
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
