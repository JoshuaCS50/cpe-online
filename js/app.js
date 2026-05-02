import { createEditor } from "./editor.js";
import { createConsole } from "./console.js";
import {
  loadState,
  saveState,
  downloadFile,
  readFile,
  languageFromFilename,
  extensionForLanguage,
  MAX_DRAFTS,
} from "./storage.js";
import { EXAMPLES, findExample } from "./examples.js";
import {
  CHEATSHEET_SECTIONS,
  findCheatsheetSection,
  FORMAT_SPECIFIERS,
} from "./cheatsheet.js";
import { createZip } from "./zip.js";
import {
  run as runProgram,
  ASYNC_LANGUAGES,
  STREAMABLE_LANGUAGES,
} from "./runners/index.js";

// Common code snippets, language-aware. { label, langs, text, cursor? }.
// CPE150S-flavoured comments come from the cheat-sheet PDF.
const SNIPPETS = [
  { label: "main", langs: ["c", "cpp"], text: '// step 1: toolbox\n#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n', cursor: -10 },
  { label: 'printf("");', langs: ["c", "cpp"], text: 'printf("");', cursor: -3 },
  { label: 'printf int', langs: ["c", "cpp"], text: 'printf("%d\\n", );', cursor: -3 },
  { label: 'printf float', langs: ["c", "cpp"], text: 'printf("%.2f\\n", );', cursor: -3 },
  { label: 'scanf int', langs: ["c"], text: 'scanf("%d", &);', cursor: -2 },
  { label: 'scanf double', langs: ["c"], text: 'scanf("%lf", &);', cursor: -2 },
  { label: 'scanf 2 ints', langs: ["c"], text: 'scanf("%d %d", &, &);', cursor: -8 },
  { label: "for loop", langs: ["c", "cpp"], text: "for (int i = 0; i < n; i++) {\n    \n}\n", cursor: -3 },
  { label: "while", langs: ["c", "cpp"], text: "while () {\n    \n}\n", cursor: -10 },
  { label: "do-while", langs: ["c", "cpp"], text: "do {\n    \n} while ();\n", cursor: -4 },
  { label: "if/else", langs: ["c", "cpp"], text: "if () {\n    \n} else {\n    \n}\n", cursor: -19 },
  { label: "ternary", langs: ["c", "cpp"], text: '/* hint: cond ? if-true : if-false */\nresult = (cond) ? a : b;\n', cursor: 0 },
  { label: "switch", langs: ["c", "cpp"], text: "switch (x) {\n    case 1: break;\n    case 2: break;\n    default: break;\n}\n", cursor: 0 },
  { label: "sum loop", langs: ["c", "cpp"], text: "// merry-go-round: add up n inputs\nint n, total = 0;\nscanf(\"%d\", &n);\nfor (int i = 0; i < n; i++) {\n    int x; scanf(\"%d\", &x);\n    total += x;\n}\nprintf(\"sum = %d\\n\", total);\n", cursor: 0 },
  { label: "array average", langs: ["c", "cpp"], text: "int a[] = {3, 7, 2, 9};\nint n = sizeof(a) / sizeof(a[0]);\nint sum = 0;\nfor (int i = 0; i < n; i++) sum += a[i];\nfloat avg = (float) sum / n;  // cast keeps the decimals\nprintf(\"avg = %.2f\\n\", avg);\n", cursor: 0 },
  { label: "#include", langs: ["c", "cpp"], text: "#include <stdio.h>\n", cursor: 0 },
  { label: "math.h", langs: ["c", "cpp"], text: "#include <math.h>\n// then use sqrt, pow, sin, cos, round\n", cursor: 0 },
  { label: "cout", langs: ["cpp"], text: 'cout << "" << endl;', cursor: -10 },
  { label: "print()", langs: ["python"], text: 'print("")', cursor: -2 },
  { label: "input()", langs: ["python"], text: 'name = input("Enter: ")', cursor: 0 },
  { label: "for i in range", langs: ["python"], text: "for i in range(10):\n    ", cursor: 0 },
];

// ───── Default state ─────

const DEFAULT_HELLO_DOC = `// CPE150S — C is like a recipe book. 4 steps:
//   Step 1: pack toolbox       -> #include <stdio.h>
//   Step 2: open the front door -> int main()
//   Step 3: write the steps inside { ... }
//   Step 4: close the door     -> return 0;

#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`;

const DEFAULT_STATE = {
  drafts: [
    {
      id: "d1",
      name: "hello.c",
      language: "c",
      doc: DEFAULT_HELLO_DOC,
      savedAt: Date.now(),
    },
  ],
  activeDraft: "d1",
  settings: {
    theme: "vscode",
    fontSize: 15,
    wrap: false,
    seenOnboarding: false,
    streamingMode: false,
    dismissedInstallBanner: false,
  },
};

let state = loadState() || structuredClone(DEFAULT_STATE);
// Heal state from older / partial saves and from v1 migration.
if (!Array.isArray(state.drafts) || state.drafts.length === 0) {
  // Migration safety: v1 used `tabs`. If we see them, port over.
  if (Array.isArray(state.tabs) && state.tabs.length) {
    state.drafts = state.tabs.map((t) => ({
      id: t.id,
      name: t.name,
      language: t.language,
      doc: t.doc,
      savedAt: Date.now(),
    }));
    state.activeDraft = state.activeTab || state.drafts[0].id;
    delete state.tabs;
    delete state.activeTab;
  } else {
    state = structuredClone(DEFAULT_STATE);
  }
}
if (!state.settings) state.settings = structuredClone(DEFAULT_STATE.settings);
// Backfill any new settings flags.
for (const k of Object.keys(DEFAULT_STATE.settings)) {
  if (state.settings[k] === undefined) state.settings[k] = DEFAULT_STATE.settings[k];
}
if (!state.drafts.some((d) => d.id === state.activeDraft)) {
  state.activeDraft = state.drafts[0].id;
}

let editor;
let consoleIO;
let saveTimer = null;
let deferredInstallPrompt = null;

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveState(state), 250);
}

function getActiveDraft() {
  return state.drafts.find((d) => d.id === state.activeDraft);
}

function newDraftId() {
  return "d" + Math.random().toString(36).slice(2, 8);
}

// ───── Theme & settings ─────

function applySettings() {
  const root = document.documentElement;
  root.classList.remove(
    "theme-auto",
    "theme-light",
    "theme-vscode",
    "theme-catppuccin"
  );
  root.classList.add("theme-" + state.settings.theme);
  root.style.setProperty("--editor-fontsize", state.settings.fontSize + "px");
  if (editor) {
    const prefersLight =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches;
    const useLight =
      state.settings.theme === "light" ||
      (state.settings.theme === "auto" && prefersLight);
    // CodeMirror 5 themes: 'default' is light. Otherwise pick a matching dark.
    let cmTheme;
    if (useLight) cmTheme = "default";
    else if (state.settings.theme === "catppuccin") cmTheme = "dracula";
    else cmTheme = "dracula"; // best built-in approximation of VS Code Dark+
    editor.setTheme(cmTheme);
  }
  // Update the status-bar online pill colour because palette changed.
  updateStatusBar();
}

// ───── Drafts (formerly tabs) ─────

function renderDraftTabs() {
  const tabsEl = document.getElementById("tabs");
  tabsEl.innerHTML = "";
  for (const draft of state.drafts) {
    const el = document.createElement("div");
    el.className = "tab" + (draft.id === state.activeDraft ? " active" : "");
    el.setAttribute("role", "tab");
    el.setAttribute(
      "aria-selected",
      draft.id === state.activeDraft ? "true" : "false"
    );
    el.dataset.id = draft.id;

    const nameEl = document.createElement("span");
    nameEl.className = "tab-name";
    nameEl.textContent = draft.name;
    el.appendChild(nameEl);

    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close";
    closeBtn.setAttribute("aria-label", "Delete draft " + draft.name);
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteDraft(draft.id);
    });
    el.appendChild(closeBtn);

    el.addEventListener("click", () => activateDraft(draft.id));
    tabsEl.appendChild(el);
  }
}

function renderDraftsList() {
  const list = document.getElementById("drafts-list");
  if (!list) return;
  list.innerHTML = "";
  for (const draft of state.drafts) {
    const row = document.createElement("div");
    row.className =
      "draft-row" + (draft.id === state.activeDraft ? " active" : "");

    const open = document.createElement("button");
    open.className = "draft-name";
    open.textContent = draft.name;
    open.title = "Open this draft";
    open.addEventListener("click", () => {
      activateDraft(draft.id);
      closeMenu();
    });
    row.appendChild(open);

    const meta = document.createElement("span");
    meta.className = "draft-meta";
    meta.textContent = (draft.language || "c").toUpperCase();
    row.appendChild(meta);

    const del = document.createElement("button");
    del.className = "draft-delete";
    del.title = "Delete this draft";
    del.setAttribute("aria-label", "Delete draft " + draft.name);
    del.textContent = "🗑";
    del.addEventListener("click", () => {
      if (state.drafts.length <= 1) {
        deleteDraft(draft.id); // resets to a fresh blank
      } else if (confirm("Delete draft \"" + draft.name + "\"?")) {
        deleteDraft(draft.id);
      }
    });
    row.appendChild(del);

    list.appendChild(row);
  }
}

function activateDraft(id) {
  const draft = state.drafts.find((d) => d.id === id);
  if (!draft) return;
  state.activeDraft = id;
  editor.setDoc(draft.doc);
  editor.setLanguage(draft.language);
  document.getElementById("language-select").value = draft.language;
  renderDraftTabs();
  renderDraftsList();
  renderSnippets();
  updateRunModeBadge();
  updateStatusBar();
  persist();
}

function newDraft({ name, language = "c", doc = "" } = {}) {
  if (state.drafts.length >= MAX_DRAFTS) {
    alert(
      "You already have " +
        MAX_DRAFTS +
        " drafts. Delete one before creating a new draft."
    );
    return;
  }
  const n = name || suggestName(language);
  const id = newDraftId();
  state.drafts.push({
    id,
    name: n,
    language,
    doc,
    savedAt: Date.now(),
  });
  state.activeDraft = id;
  renderDraftTabs();
  renderDraftsList();
  editor.setDoc(doc);
  editor.setLanguage(language);
  document.getElementById("language-select").value = language;
  updateStatusBar();
  persist();
}

function deleteDraft(id) {
  const idx = state.drafts.findIndex((d) => d.id === id);
  if (idx < 0) return;
  if (state.drafts.length === 1) {
    // Last draft — reset rather than leave the app empty.
    state.drafts[0] = {
      id: newDraftId(),
      name: "untitled.c",
      language: "c",
      doc: "",
      savedAt: Date.now(),
    };
    state.activeDraft = state.drafts[0].id;
  } else {
    state.drafts.splice(idx, 1);
    if (state.activeDraft === id) {
      state.activeDraft = state.drafts[Math.max(0, idx - 1)].id;
    }
  }
  const next = getActiveDraft();
  editor.setDoc(next.doc);
  editor.setLanguage(next.language);
  document.getElementById("language-select").value = next.language;
  renderDraftTabs();
  renderDraftsList();
  updateStatusBar();
  persist();
}

function suggestName(language) {
  const ext = extensionForLanguage(language);
  const existing = new Set(state.drafts.map((d) => d.name));
  let i = 1;
  let name = `untitled.${ext}`;
  while (existing.has(name)) {
    i += 1;
    name = `untitled_${i}.${ext}`;
  }
  return name;
}

function renameActive() {
  const draft = getActiveDraft();
  const name = prompt("Rename draft:", draft.name);
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  draft.name = trimmed;
  draft.language = languageFromFilename(trimmed);
  document.getElementById("language-select").value = draft.language;
  editor.setLanguage(draft.language);
  renderDraftTabs();
  renderDraftsList();
  updateStatusBar();
  persist();
}

// ───── Run / Stop ─────

async function runCode() {
  const draft = getActiveDraft();
  draft.doc = editor.getDoc();
  persist();
  editor.clearErrorLine();
  consoleIO.clear();
  consoleIO.cancelPendingReads();
  setRunning(true, draft.language);
  try {
    const useStreaming =
      !!state.settings.streamingMode &&
      STREAMABLE_LANGUAGES.has(draft.language);
    await runProgram({
      language: draft.language,
      code: draft.doc,
      consoleIO,
      streaming: useStreaming,
      onErrorLine: (lineNum) => editor.highlightErrorLine(lineNum),
    });
  } catch (err) {
    consoleIO.writeErr("\n" + ((err && err.message) || String(err)) + "\n");
  } finally {
    setRunning(false, draft.language);
    consoleIO.resetInput();
  }
}

function stopCode() {
  consoleIO.cancelPendingReads(new Error("Stopped by user"));
  consoleIO.writeInfo("\n[stop requested]\n");
  setRunning(false);
}

function setRunning(running, language) {
  const runBtn = document.getElementById("run-button");
  const stopBtn = document.getElementById("stop-button");
  runBtn.disabled = running;
  runBtn.classList.toggle("is-busy", running);
  const showStop = ASYNC_LANGUAGES.has(language);
  stopBtn.style.display = showStop ? "" : "none";
  stopBtn.disabled = !running || !showStop;
}

function updateRunModeBadge() {
  const badge = document.getElementById("run-mode-badge");
  if (!badge) return;
  const lang = getActiveDraft().language;
  const streamable = STREAMABLE_LANGUAGES.has(lang);
  if (streamable && state.settings.streamingMode) {
    badge.hidden = false;
    badge.textContent = "live";
  } else {
    badge.hidden = true;
  }
}

// ───── Save / Open ─────

function saveCurrent() {
  const draft = getActiveDraft();
  draft.doc = editor.getDoc();
  downloadFile(draft.name, draft.doc);
  persist();
}

// Save EVERY draft into a single .zip and trigger one download.
// Useful when a student wants to back up or hand in all their work at once.
function saveAllDrafts() {
  // Make sure the in-editor changes are reflected in the active draft first.
  const active = getActiveDraft();
  if (active) {
    active.doc = editor.getDoc();
    persist();
  }

  // De-duplicate filenames inside the archive so two drafts named "hello.c"
  // don't collide (the second becomes "hello (2).c").
  const seen = new Map();
  const files = [];
  for (const draft of state.drafts) {
    let name = draft.name || "untitled.txt";
    if (seen.has(name)) {
      const n = seen.get(name) + 1;
      seen.set(name, n);
      const dot = name.lastIndexOf(".");
      name =
        dot > 0
          ? name.slice(0, dot) + " (" + n + ")" + name.slice(dot)
          : name + " (" + n + ")";
    } else {
      seen.set(name, 1);
    }
    files.push({ name, text: draft.doc || "" });
  }

  if (files.length === 0) {
    alert("There are no drafts to save.");
    return;
  }

  const blob = createZip(files);
  // Filename includes today's date so multiple backups don't overwrite.
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `cpe-online-drafts-${stamp}.zip`;
  downloadFile(filename, blob, "application/zip");
}

async function openFromDevice(fileList) {
  for (const file of fileList) {
    try {
      const text = await readFile(file);
      const language = languageFromFilename(file.name);
      newDraft({ name: file.name, language, doc: text });
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
  renderDraftsList();
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
      newDraft({ name: ex.filename, language: ex.lang, doc: ex.code });
      closeMenu();
    });
    list.appendChild(btn);
  }
}

function renderSnippets() {
  const list = document.getElementById("snippets-list");
  if (!list) return;
  const lang = getActiveDraft().language;
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

  // Long-press tracking for the % button → format-specifier popover.
  let longPressTimer = null;
  let longPressFired = false;
  let longPressTarget = null;

  bar.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".sym-percent");
    if (!btn) return;
    longPressFired = false;
    longPressTarget = btn;
    longPressTimer = setTimeout(() => {
      longPressFired = true;
      openFormatPopover(btn);
    }, 480);
  });
  function cancelLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }
  bar.addEventListener("pointerup", cancelLongPress);
  bar.addEventListener("pointerleave", cancelLongPress);
  bar.addEventListener("pointercancel", cancelLongPress);

  bar.addEventListener("click", (e) => {
    const btn = e.target.closest(".sym");
    if (!btn) return;
    e.preventDefault();
    if (longPressFired && btn === longPressTarget) {
      // Suppress the click that follows a long-press.
      longPressFired = false;
      return;
    }
    const insert = btn.dataset.insert;
    const cursor = btn.dataset.cursor ? parseInt(btn.dataset.cursor, 10) : 0;
    const key = btn.dataset.key;
    if (key) {
      editor.triggerKey(key);
    } else if (typeof insert === "string") {
      editor.insertText(insert, cursor);
    }
  });

  bar.addEventListener("mousedown", (e) => e.preventDefault());
  bar.addEventListener("touchstart", () => {}, { passive: true });
}

function openFormatPopover(anchor) {
  const pop = document.getElementById("format-popover");
  if (!pop) return;
  pop.innerHTML = "";
  for (const sp of FORMAT_SPECIFIERS) {
    const row = document.createElement("button");
    row.className = "fmt-row";
    row.type = "button";
    row.innerHTML =
      '<span class="fmt-token">' +
      sp.token.replace(/&/g, "&amp;").replace(/</g, "&lt;") +
      '</span><span class="fmt-desc">' +
      sp.desc +
      "</span>";
    row.addEventListener("click", () => {
      editor.insertText(sp.token, 0);
      closeFormatPopover();
    });
    pop.appendChild(row);
  }
  // Position above the anchor button.
  const r = anchor.getBoundingClientRect();
  const popWidth = 240;
  let left = Math.max(8, Math.min(r.left, window.innerWidth - popWidth - 8));
  let top = r.top - 8;
  pop.style.left = left + "px";
  pop.style.top = "auto";
  pop.style.bottom = window.innerHeight - top + "px";
  pop.hidden = false;
  // Dismiss on next outside tap.
  setTimeout(() => {
    document.addEventListener("pointerdown", outsideCloseFormatPopover, {
      once: true,
    });
  }, 0);
}
function outsideCloseFormatPopover(e) {
  const pop = document.getElementById("format-popover");
  if (!pop) return;
  if (!pop.contains(e.target)) closeFormatPopover();
}
function closeFormatPopover() {
  const pop = document.getElementById("format-popover");
  if (pop) pop.hidden = true;
}

// ───── Quick Start ─────

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
  if (!state.settings.seenOnboarding) openQuickStart();
}

function resetToHelloWorld() {
  const draft = getActiveDraft();
  draft.doc = DEFAULT_HELLO_DOC;
  draft.language = "c";
  if (!draft.name.endsWith(".c")) draft.name = "hello.c";
  editor.setDoc(draft.doc);
  editor.setLanguage("c");
  document.getElementById("language-select").value = "c";
  renderDraftTabs();
  renderDraftsList();
  updateStatusBar();
  persist();
}

// ───── Cheat sheet ─────

let activeCheatSection = "format";

function openCheatsheet() {
  document.getElementById("cheatsheet").hidden = false;
  document.getElementById("cheatsheet-backdrop").hidden = false;
  renderCheatsheetTabs();
  renderCheatsheetSection(activeCheatSection);
}
function closeCheatsheet() {
  document.getElementById("cheatsheet").hidden = true;
  document.getElementById("cheatsheet-backdrop").hidden = true;
}
function renderCheatsheetTabs() {
  const nav = document.getElementById("cheatsheet-tabs");
  nav.innerHTML = "";
  for (const sec of CHEATSHEET_SECTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cs-tab" + (sec.id === activeCheatSection ? " active" : "");
    btn.textContent = sec.label;
    btn.addEventListener("click", () => {
      activeCheatSection = sec.id;
      renderCheatsheetTabs();
      renderCheatsheetSection(sec.id);
    });
    nav.appendChild(btn);
  }
}
function renderCheatsheetSection(id) {
  const sec = findCheatsheetSection(id);
  const content = document.getElementById("cheatsheet-content");
  if (!content) return;
  content.innerHTML = sec ? sec.html : "<p>Section not found.</p>";
  content.scrollTop = 0;
}

// ───── Copy output ─────

async function copyOutput() {
  const txt = document.getElementById("output").textContent || "";
  if (!txt) {
    showCopyToast("Output is empty");
    return;
  }
  try {
    await navigator.clipboard.writeText(txt);
    showCopyToast("Copied!");
  } catch (_) {
    // Fallback: hidden textarea + execCommand
    const ta = document.createElement("textarea");
    ta.value = txt;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) {}
    ta.remove();
    showCopyToast(ok ? "Copied!" : "Copy failed");
  }
}

let copyToastTimer = null;
function showCopyToast(msg) {
  const el = document.getElementById("copy-toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(copyToastTimer);
  copyToastTimer = setTimeout(() => { el.hidden = true; }, 1500);
}

// ───── Install banner (PWA) ─────

function isStandalone() {
  return (
    (window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iPhone|iPad|iPod/.test(window.navigator.userAgent);
}

function showInstallBanner({ ios = false } = {}) {
  const banner = document.getElementById("install-banner");
  const action = document.getElementById("install-banner-action");
  const instr = document.getElementById("install-banner-instructions");
  if (!banner) return;
  if (ios) {
    instr.textContent =
      "iPhone / iPad: tap Share ⤴ → 'Add to Home Screen'.";
    action.textContent = "Got it";
    action.onclick = () => dismissInstallBanner();
  } else {
    instr.textContent =
      "No laptop needed — installs as an app, works offline.";
    action.textContent = "Install";
    action.onclick = async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      try { await deferredInstallPrompt.userChoice; } catch (_) {}
      deferredInstallPrompt = null;
      dismissInstallBanner();
    };
  }
  banner.hidden = false;
}

function dismissInstallBanner() {
  const banner = document.getElementById("install-banner");
  if (banner) banner.hidden = true;
  state.settings.dismissedInstallBanner = true;
  persist();
}

function wireInstallBanner() {
  if (state.settings.dismissedInstallBanner) return;
  if (isStandalone()) return; // already installed

  // Android / Chrome: capture beforeinstallprompt and surface it.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallBanner({ ios: false });
  });

  // iOS Safari: no event — show static instructions on phones.
  if (isIOS() && !isStandalone()) {
    // Defer slightly so the page paints first.
    setTimeout(() => showInstallBanner({ ios: true }), 800);
  }

  document
    .getElementById("install-banner-dismiss")
    .addEventListener("click", dismissInstallBanner);
}

// ───── Status bar (Phase 3.15) + offline state (Phase 2.11) ─────

function updateStatusBar() {
  const draft = getActiveDraft();
  const langPill = document.getElementById("status-language");
  if (langPill) langPill.textContent = (draft.language || "c").toUpperCase();
  const cursorPill = document.getElementById("status-cursor");
  if (cursorPill && editor && editor.cm) {
    const c = editor.cm.getCursor();
    cursorPill.textContent = "Ln " + (c.line + 1) + ", Col " + (c.ch + 1);
  }
  const onlinePill = document.getElementById("status-online");
  const badge = document.getElementById("offline-badge");
  if (onlinePill) {
    if (navigator.onLine === false) {
      onlinePill.textContent = "● offline";
      onlinePill.classList.remove("status-pill--ok");
      onlinePill.classList.add("status-pill--err");
    } else {
      onlinePill.textContent = "● online";
      onlinePill.classList.remove("status-pill--err");
      onlinePill.classList.add("status-pill--ok");
    }
  }
  if (badge) {
    badge.hidden = navigator.onLine !== false;
  }
}

function wireOnlineOffline() {
  window.addEventListener("online", () => updateStatusBar());
  window.addEventListener("offline", () => updateStatusBar());
}

// ───── Divider ─────

function wireDivider() {
  const divider = document.getElementById("divider");
  const workspace = document.getElementById("workspace");
  let dragging = false;

  const isLandscapeSplit = () =>
    window.matchMedia(
      "(orientation: landscape) and (min-width: 640px) and (max-width: 1023px)"
    ).matches;
  const getMode = () =>
    window.matchMedia("(min-width: 820px)").matches || isLandscapeSplit()
      ? "col"
      : "row";

  function onMove(clientX, clientY) {
    if (!dragging) return;
    const rect = workspace.getBoundingClientRect();
    if (getMode() === "col") {
      const right = Math.max(
        220,
        Math.min(rect.width - 240, rect.right - clientX)
      );
      workspace.style.gridTemplateColumns = `1fr 6px ${right}px`;
    } else {
      const bottom = Math.max(
        120,
        Math.min(rect.height - 180, rect.bottom - clientY)
      );
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
    workspace.style.gridTemplateColumns = "";
    workspace.style.gridTemplateRows = "";
  });
}

// ───── Service worker ─────

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "http:" && location.protocol !== "https:") return;
  navigator.serviceWorker.register("sw.js").catch((err) => {
    console.warn("SW registration failed:", err);
  });
}

// ───── Init ─────

function init() {
  editor = createEditor(document.getElementById("editor"), {
    initialDoc: getActiveDraft().doc,
    language: getActiveDraft().language,
    wrap: state.settings.wrap,
    fontSize: state.settings.fontSize,
    onChange: (doc) => {
      const d = getActiveDraft();
      d.doc = doc;
      d.savedAt = Date.now();
      persist();
    },
  });

  // Cursor → status bar
  if (editor.cm) {
    editor.cm.on("cursorActivity", () => updateStatusBar());
  }

  consoleIO = createConsole({
    outputEl: document.getElementById("output"),
    stdinInputEl: document.getElementById("stdin-input"),
    stdinFormEl: document.getElementById("stdin-form"),
    queueEl: document.getElementById("stdin-queue"),
  });

  renderDraftTabs();
  document.getElementById("language-select").value = getActiveDraft().language;

  applySettings();
  document.getElementById("theme-select").value = state.settings.theme;
  document.getElementById("font-size").value = state.settings.fontSize;
  document.getElementById("line-wrap").checked = state.settings.wrap;
  document.getElementById("streaming-mode").checked = !!state.settings.streamingMode;

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
  document.getElementById("copy-output").addEventListener("click", copyOutput);
  document.getElementById("new-tab").addEventListener("click", () => newDraft());

  document.getElementById("language-select").addEventListener("change", (e) => {
    const draft = getActiveDraft();
    draft.language = e.target.value;
    if (draft.name.startsWith("untitled")) {
      draft.name = `untitled.${extensionForLanguage(draft.language)}`;
    }
    editor.setLanguage(draft.language);
    renderDraftTabs();
    renderSnippets();
    updateRunModeBadge();
    updateStatusBar();
    persist();
  });

  document.getElementById("menu-button").addEventListener("click", openMenu);
  document.getElementById("menu-close").addEventListener("click", closeMenu);
  document.getElementById("menu-backdrop").addEventListener("click", closeMenu);
  document.querySelectorAll(".menu-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      closeMenu();
      if (action === "new") newDraft();
      else if (action === "open") document.getElementById("file-input").click();
      else if (action === "save") saveCurrent();
      else if (action === "save-all") saveAllDrafts();
      else if (action === "rename") renameActive();
      else if (action === "close-tab") deleteDraft(state.activeDraft);
      else if (action === "reset-default") resetToHelloWorld();
      else if (action === "show-help") openQuickStart();
    });
  });

  // Cheat sheet
  document.getElementById("cheatsheet-button").addEventListener("click", openCheatsheet);
  document.getElementById("cheatsheet-close").addEventListener("click", closeCheatsheet);
  document.getElementById("cheatsheet-backdrop").addEventListener("click", closeCheatsheet);

  // Quick Start modal
  document.getElementById("quickstart-close").addEventListener("click", closeQuickStart);
  document.getElementById("quickstart-backdrop").addEventListener("click", closeQuickStart);
  document.getElementById("quickstart-try").addEventListener("click", closeQuickStart);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!document.getElementById("quickstart").hidden) closeQuickStart();
      if (!document.getElementById("cheatsheet").hidden) closeCheatsheet();
      if (!document.getElementById("format-popover").hidden) closeFormatPopover();
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
  document.getElementById("streaming-mode").addEventListener("change", (e) => {
    state.settings.streamingMode = e.target.checked;
    updateRunModeBadge();
    persist();
  });

  // Inputs panel
  document.getElementById("inputs-queue").addEventListener("click", () => {
    const ta = document.getElementById("inputs-textarea");
    const text = (ta.value || "").trim();
    if (!text) return;
    consoleIO.pushStdin(text);
    ta.value = "";
    closeMenu();
  });
  document.getElementById("inputs-clear").addEventListener("click", () => {
    consoleIO.resetInput();
    document.getElementById("inputs-textarea").value = "";
  });

  renderExamples();
  renderSnippets();
  renderDraftsList();
  wireSymbolBar();
  wireDivider();
  wireInstallBanner();
  wireOnlineOffline();
  updateRunModeBadge();
  updateStatusBar();
  maybeShowQuickStart();
  registerSW();

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
