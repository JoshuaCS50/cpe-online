import { createEditor } from "./editor.js";
import { createConsole } from "./console.js";
import {
  loadState,
  saveState,
  downloadFile,
  readFile,
  languageFromFilename,
  extensionForLanguage,
} from "./storage.js";
import { EXAMPLES, findExample } from "./examples.js";
import { run as runProgram, ASYNC_LANGUAGES } from "./runners/index.js";

// Common code snippets, language-aware. Each has { label, lang(s), text, cursor? }.
const SNIPPETS = [
  { label: "main", langs: ["c", "cpp"], text: 'int main() {\n    \n    return 0;\n}\n', cursor: -10 },
  { label: 'printf("");', langs: ["c", "cpp"], text: 'printf("");', cursor: -3 },
  { label: 'scanf("%d",&x);', langs: ["c"], text: 'scanf("%d", &);', cursor: -2 },
  { label: "for loop", langs: ["c", "cpp"], text: "for (int i = 0; i < n; i++) {\n    \n}\n", cursor: -3 },
  { label: "if/else", langs: ["c", "cpp"], text: "if () {\n    \n} else {\n    \n}\n", cursor: -19 },
  { label: "while", langs: ["c", "cpp"], text: "while () {\n    \n}\n", cursor: -10 },
  { label: "#include", langs: ["c", "cpp"], text: "#include <stdio.h>\n", cursor: 0 },
  { label: "cout", langs: ["cpp"], text: 'cout << "" << endl;', cursor: -10 },
  { label: "print()", langs: ["python"], text: 'print("")', cursor: -2 },
  { label: "input()", langs: ["python"], text: 'name = input("Enter: ")', cursor: 0 },
  { label: "for i in range", langs: ["python"], text: "for i in range(10):\n    ", cursor: 0 },
];

// ───── State ─────

const DEFAULT_STATE = {
  tabs: [
    {
      id: "t1",
      name: "hello.c",
      language: "c",
      doc: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
    },
  ],
  activeTab: "t1",
  settings: {
    theme: "auto",
    fontSize: 15,
    wrap: false,
    seenOnboarding: false,
  },
};

let state = loadState() || structuredClone(DEFAULT_STATE);
// Heal state from older/partial saves.
if (!state.tabs || state.tabs.length === 0) state = structuredClone(DEFAULT_STATE);
if (!state.settings) state.settings = structuredClone(DEFAULT_STATE.settings);
if (!state.tabs.some((t) => t.id === state.activeTab)) state.activeTab = state.tabs[0].id;

let editor;
let consoleIO;
let runAbort = null;
let saveTimer = null;

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveState(state), 250);
}

function getActiveTab() {
  return state.tabs.find((t) => t.id === state.activeTab);
}

function newTabId() {
  return "t" + Math.random().toString(36).slice(2, 8);
}

// ───── Theme & settings ─────

function applySettings() {
  const root = document.documentElement;
  root.classList.remove("theme-auto", "theme-dark", "theme-light");
  root.classList.add("theme-" + state.settings.theme);
  root.style.setProperty("--editor-fontsize", state.settings.fontSize + "px");
  if (editor) {
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const useLight =
      state.settings.theme === "light" ||
      (state.settings.theme === "auto" && prefersLight);
    editor.setTheme(useLight ? "default" : "dracula");
  }
}

// ───── Tabs ─────

function renderTabs() {
  const tabsEl = document.getElementById("tabs");
  tabsEl.innerHTML = "";
  for (const tab of state.tabs) {
    const el = document.createElement("div");
    el.className = "tab" + (tab.id === state.activeTab ? " active" : "");
    el.setAttribute("role", "tab");
    el.setAttribute("aria-selected", tab.id === state.activeTab ? "true" : "false");
    el.dataset.id = tab.id;

    const nameEl = document.createElement("span");
    nameEl.className = "tab-name";
    nameEl.textContent = tab.name;
    el.appendChild(nameEl);

    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close";
    closeBtn.setAttribute("aria-label", "Close " + tab.name);
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });
    el.appendChild(closeBtn);

    el.addEventListener("click", () => activateTab(tab.id));
    tabsEl.appendChild(el);
  }
}

function activateTab(id) {
  const tab = state.tabs.find((t) => t.id === id);
  if (!tab) return;
  state.activeTab = id;
  editor.setDoc(tab.doc);
  editor.setLanguage(tab.language);
  document.getElementById("language-select").value = tab.language;
  renderTabs();
  renderSnippets();
  persist();
}

function newTab({ name, language = "c", doc = "" } = {}) {
  const n = name || suggestName(language);
  const id = newTabId();
  state.tabs.push({ id, name: n, language, doc });
  state.activeTab = id;
  renderTabs();
  editor.setDoc(doc);
  editor.setLanguage(language);
  document.getElementById("language-select").value = language;
  persist();
}

function closeTab(id) {
  const idx = state.tabs.findIndex((t) => t.id === id);
  if (idx < 0) return;
  if (state.tabs.length === 1) {
    // Last tab — reset it rather than leaving the app empty.
    state.tabs[0] = {
      id: newTabId(),
      name: "untitled.c",
      language: "c",
      doc: "",
    };
    state.activeTab = state.tabs[0].id;
  } else {
    state.tabs.splice(idx, 1);
    if (state.activeTab === id) {
      state.activeTab = state.tabs[Math.max(0, idx - 1)].id;
    }
  }
  const next = getActiveTab();
  editor.setDoc(next.doc);
  editor.setLanguage(next.language);
  document.getElementById("language-select").value = next.language;
  renderTabs();
  persist();
}

function suggestName(language) {
  const ext = extensionForLanguage(language);
  const existing = new Set(state.tabs.map((t) => t.name));
  let i = 1;
  let name = `untitled.${ext}`;
  while (existing.has(name)) {
    i += 1;
    name = `untitled_${i}.${ext}`;
  }
  return name;
}

function renameActive() {
  const tab = getActiveTab();
  const name = prompt("Rename file:", tab.name);
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  tab.name = trimmed;
  tab.language = languageFromFilename(trimmed);
  document.getElementById("language-select").value = tab.language;
  editor.setLanguage(tab.language);
  renderTabs();
  persist();
}

// ───── Run / Stop ─────

async function runCode() {
  const tab = getActiveTab();
  tab.doc = editor.getDoc();
  persist();
  editor.clearErrorLine();
  consoleIO.clear();
  // Cancel any *async* waiters from a previous Python run, but DO NOT wipe
  // the stdin buffer — the user may have just typed input lines that they
  // expect this run to consume.
  consoleIO.cancelPendingReads();
  setRunning(true, tab.language);
  try {
    await runProgram({
      language: tab.language,
      code: tab.doc,
      consoleIO,
      onErrorLine: (lineNum) => editor.highlightErrorLine(lineNum),
    });
  } catch (err) {
    consoleIO.writeErr("\n" + ((err && err.message) || String(err)) + "\n");
  } finally {
    setRunning(false, tab.language);
    // After the run, drop any input the program didn't consume so it doesn't
    // leak into the next run.
    consoleIO.resetInput();
  }
}

function stopCode() {
  // JSCPP is synchronous so there's no clean mid-run abort for C/C++ beyond the
  // interpreter's internal timeout. For Python, we drop the pending promise so
  // the user can at least unfreeze the stdin row.
  consoleIO.cancelPendingReads(new Error("Stopped by user"));
  consoleIO.writeInfo("\n[stop requested]\n");
  setRunning(false);
}

function setRunning(running, language) {
  const runBtn = document.getElementById("run-button");
  const stopBtn = document.getElementById("stop-button");
  runBtn.disabled = running;
  runBtn.classList.toggle("is-busy", running);
  // Stop button is only meaningful for async runners (currently Python).
  // Hide it entirely for synchronous JSCPP-based runs to avoid confusion.
  const showStop = ASYNC_LANGUAGES.has(language);
  stopBtn.style.display = showStop ? "" : "none";
  stopBtn.disabled = !running || !showStop;
}

// ───── Save / Open ─────

function saveCurrent() {
  const tab = getActiveTab();
  tab.doc = editor.getDoc();
  downloadFile(tab.name, tab.doc);
  persist();
}

async function openFromDevice(fileList) {
  for (const file of fileList) {
    try {
      const text = await readFile(file);
      const language = languageFromFilename(file.name);
      newTab({ name: file.name, language, doc: text });
    } catch (err) {
      consoleIO.writeErr(`Could not open ${file.name}: ${err.message}\n`);
    }
  }
}

// ───── Menu ─────

function openMenu() {
  document.getElementById("menu").hidden = false;
  document.getElementById("menu-backdrop").hidden = false;
  document.getElementById("menu-button").setAttribute("aria-expanded", "true");
  document.getElementById("menu").setAttribute("aria-hidden", "false");
}

function closeMenu() {
  document.getElementById("menu").hidden = true;
  document.getElementById("menu-backdrop").hidden = true;
  document.getElementById("menu-button").setAttribute("aria-expanded", "false");
  document.getElementById("menu").setAttribute("aria-hidden", "true");
}

function renderExamples() {
  const list = document.getElementById("examples-list");
  list.innerHTML = "";
  for (const ex of EXAMPLES) {
    const btn = document.createElement("button");
    btn.className = "example";
    btn.dataset.id = ex.id;
    btn.innerHTML = `<span>${ex.name}</span><span class="tag">${ex.filename}</span>`;
    btn.addEventListener("click", () => {
      newTab({ name: ex.filename, language: ex.lang, doc: ex.code });
      closeMenu();
    });
    list.appendChild(btn);
  }
}

// Filter snippets to ones relevant for the current language and render in menu.
function renderSnippets() {
  const list = document.getElementById("snippets-list");
  if (!list) return;
  const lang = getActiveTab().language;
  list.innerHTML = "";
  for (const sn of SNIPPETS) {
    if (!sn.langs.includes(lang)) continue;
    const btn = document.createElement("button");
    btn.className = "snippet";
    btn.textContent = sn.label;
    btn.addEventListener("click", () => {
      editor.insertText(sn.text, sn.cursor || 0);
      closeMenu();
    });
    list.appendChild(btn);
  }
}

// One-tap symbol bar above the editor (mobile keyboard helper).
function wireSymbolBar() {
  const bar = document.getElementById("symbol-bar");
  if (!bar) return;
  bar.addEventListener("click", (e) => {
    const btn = e.target.closest(".sym");
    if (!btn) return;
    e.preventDefault();
    const insert = btn.dataset.insert;
    const cursor = btn.dataset.cursor ? parseInt(btn.dataset.cursor, 10) : 0;
    const key = btn.dataset.key;
    if (key) {
      editor.triggerKey(key);
    } else if (typeof insert === "string") {
      // The HTML data-insert "\\n" arrives literally as "\n" (two chars).
      // Beginners almost certainly want a real newline escape *inside a string*,
      // so we keep it as the two-character sequence — that's the right thing
      // when typing inside a printf format string.
      editor.insertText(insert, cursor);
    }
  });
  // Keep editor focused so the on-screen keyboard stays open.
  bar.addEventListener("mousedown", (e) => e.preventDefault());
  bar.addEventListener("touchstart", (e) => {
    // don't blur the editor
  }, { passive: true });
}

// Quick Start modal
function openQuickStart() {
  document.getElementById("quickstart").hidden = false;
  document.getElementById("quickstart-backdrop").hidden = false;
}

function closeQuickStart() {
  document.getElementById("quickstart").hidden = true;
  document.getElementById("quickstart-backdrop").hidden = true;
  state.settings.seenOnboarding = true;
  persist();
}

function maybeShowQuickStart() {
  if (!state.settings.seenOnboarding) {
    openQuickStart();
  }
}

function resetToHelloWorld() {
  const tab = getActiveTab();
  tab.doc = DEFAULT_STATE.tabs[0].doc;
  tab.language = "c";
  if (!tab.name.endsWith(".c")) tab.name = "hello.c";
  editor.setDoc(tab.doc);
  editor.setLanguage("c");
  document.getElementById("language-select").value = "c";
  renderTabs();
  persist();
}

// ───── Divider (resize) ─────

function wireDivider() {
  const divider = document.getElementById("divider");
  const workspace = document.getElementById("workspace");
  let dragging = false;

  const getMode = () => (window.matchMedia("(min-width: 820px)").matches ? "col" : "row");

  function onMove(clientX, clientY) {
    if (!dragging) return;
    const rect = workspace.getBoundingClientRect();
    if (getMode() === "col") {
      const right = Math.max(220, Math.min(rect.width - 240, rect.right - clientX));
      workspace.style.gridTemplateColumns = `1fr 6px ${right}px`;
    } else {
      const bottom = Math.max(120, Math.min(rect.height - 180, rect.bottom - clientY));
      workspace.style.gridTemplateRows = `1fr 6px ${bottom}px`;
    }
  }

  divider.addEventListener("pointerdown", (e) => {
    dragging = true;
    divider.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  divider.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY));
  divider.addEventListener("pointerup", (e) => {
    dragging = false;
    try { divider.releasePointerCapture(e.pointerId); } catch (_) {}
  });
  divider.addEventListener("pointercancel", () => { dragging = false; });

  window.addEventListener("resize", () => {
    // Reset inline styles when crossing breakpoints to avoid a stuck size.
    workspace.style.gridTemplateColumns = "";
    workspace.style.gridTemplateRows = "";
  });
}

// (Quick Start replaces the old toast — see openQuickStart / maybeShowQuickStart.)

// ───── Service worker ─────

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  // Only register when served over http(s); file:// won't work.
  if (location.protocol !== "http:" && location.protocol !== "https:") return;
  navigator.serviceWorker.register("sw.js").catch((err) => {
    console.warn("SW registration failed:", err);
  });
}

// ───── Init ─────

function init() {
  // Editor
  editor = createEditor(document.getElementById("editor"), {
    initialDoc: getActiveTab().doc,
    language: getActiveTab().language,
    wrap: state.settings.wrap,
    fontSize: state.settings.fontSize,
    onChange: (doc) => {
      const tab = getActiveTab();
      tab.doc = doc;
      persist();
    },
  });

  // Console
  consoleIO = createConsole({
    outputEl: document.getElementById("output"),
    stdinInputEl: document.getElementById("stdin-input"),
    stdinFormEl: document.getElementById("stdin-form"),
    queueEl: document.getElementById("stdin-queue"),
  });

  // Tabs
  renderTabs();
  document.getElementById("language-select").value = getActiveTab().language;

  // Settings UI
  applySettings();
  document.getElementById("theme-select").value = state.settings.theme;
  document.getElementById("font-size").value = state.settings.fontSize;
  document.getElementById("line-wrap").checked = state.settings.wrap;

  // Wire controls
  document.getElementById("run-button").addEventListener("click", runCode);
  document.getElementById("stop-button").addEventListener("click", stopCode);
  document.getElementById("save-button").addEventListener("click", saveCurrent);
  document.getElementById("open-button").addEventListener("click", () =>
    document.getElementById("file-input").click()
  );
  document.getElementById("file-input").addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length) openFromDevice(e.target.files);
    e.target.value = "";
  });
  document.getElementById("clear-output").addEventListener("click", () => consoleIO.clear());
  document.getElementById("new-tab").addEventListener("click", () => newTab());

  document.getElementById("language-select").addEventListener("change", (e) => {
    const tab = getActiveTab();
    tab.language = e.target.value;
    // If filename extension doesn't match, update it only when file is untouched ("untitled").
    if (tab.name.startsWith("untitled")) {
      tab.name = `untitled.${extensionForLanguage(tab.language)}`;
    }
    editor.setLanguage(tab.language);
    renderTabs();
    renderSnippets();
    persist();
  });

  document.getElementById("menu-button").addEventListener("click", openMenu);
  document.getElementById("menu-close").addEventListener("click", closeMenu);
  document.getElementById("menu-backdrop").addEventListener("click", closeMenu);
  document.querySelectorAll(".menu-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      closeMenu();
      if (action === "new") newTab();
      else if (action === "open") document.getElementById("file-input").click();
      else if (action === "save") saveCurrent();
      else if (action === "rename") renameActive();
      else if (action === "close-tab") closeTab(state.activeTab);
      else if (action === "reset-default") resetToHelloWorld();
      else if (action === "show-help") openQuickStart();
    });
  });

  // Quick Start modal
  document.getElementById("quickstart-close").addEventListener("click", closeQuickStart);
  document.getElementById("quickstart-backdrop").addEventListener("click", closeQuickStart);
  document.getElementById("quickstart-try").addEventListener("click", closeQuickStart);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.getElementById("quickstart").hidden) {
      closeQuickStart();
    }
  });

  document.getElementById("theme-select").addEventListener("change", (e) => {
    state.settings.theme = e.target.value;
    applySettings();
    persist();
  });
  document.getElementById("font-size").addEventListener("input", (e) => {
    state.settings.fontSize = parseInt(e.target.value, 10);
    editor.setFontSize(state.settings.fontSize);
    applySettings();
    persist();
  });
  document.getElementById("line-wrap").addEventListener("change", (e) => {
    state.settings.wrap = e.target.checked;
    editor.setWrap(state.settings.wrap);
    persist();
  });

  renderExamples();
  renderSnippets();
  wireSymbolBar();
  wireDivider();
  maybeShowQuickStart();
  registerSW();

  // Keyboard shortcut: Ctrl/Cmd + Enter to run.
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runCode();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
