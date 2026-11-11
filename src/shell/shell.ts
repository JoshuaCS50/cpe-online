// The IDE shell: title bar, activity rail, explorer, editor with tabs,
// terminal panel and status bar. Layout adapts in three tiers (phone, tablet,
// laptop) through data attributes on the root; CSS does the rest.

import "../theme/tokens.css";
import "./shell.css";

import { createDebugView } from "../debugger/debug-view";
import type { DebugCommand, DebugSession } from "../debugger/types";
import { createEditor } from "../editor/editor";
import type { EditorHandle } from "../editor/editor";
import { createSymbolBar } from "../editor/symbol-bar";
import { STOPPABLE_LANGUAGES, run as runProgram } from "../legacy/js/runners/index.js";
import { debugCInWorker } from "../runners/c/c-runner";
import { openStore } from "../storage/idb-store";
import { migrateLegacyState } from "../storage/migrate-localstorage";
import { createConsole } from "../terminal/console";
import { button, el } from "./dom";
import { createEditorTabs } from "./editor-tabs";
import { createExplorer } from "./explorer";
import { icon } from "./icons";
import { openWorkspace } from "./workspace";

type Tier = "phone" | "tablet" | "laptop";
/** On a phone only one of these fills the screen at a time. */
type View = "files" | "code" | "terminal";

const LANGUAGE_LABELS: Record<string, string> = { c: "C", cpp: "C++", python: "Python", java: "Java" };

function currentTier(): Tier {
  if (window.matchMedia("(max-width: 599px)").matches) return "phone";
  if (window.matchMedia("(max-width: 1023px)").matches) return "tablet";
  return "laptop";
}

export async function bootShell(): Promise<void> {
  const root = document.documentElement;
  root.dataset.mode = "code";

  const store = await openStore();
  const migration = await migrateLegacyState(store, window.localStorage);
  if (migration.status === "failed") console.warn("Could not import earlier drafts:", migration.error);
  const workspace = await openWorkspace(store);

  // ───── Frame ─────

  const pathEl = el("span", { class: "title-path" });
  const runButton = button({ label: "Run", icon: "play", showLabel: true, class: "btn btn-run", onClick: () => void run() });
  const stopButton = button({ label: "Stop", icon: "stop", showLabel: true, class: "btn btn-stop", onClick: () => stop() });
  const debugButton = button({ label: "Debug", icon: "bug", showLabel: true, class: "btn btn-outline btn-debug", onClick: () => void debug() });
  runButton.title = "Run (F5)";
  debugButton.title = "Debug: run and pause at breakpoints (F6)";
  stopButton.title = "Stop (Shift+F5)";
  stopButton.disabled = true;

  // Shown only while a debug session is active; enabled only while paused.
  const stepButton = (label: string, iconName: "resume" | "stepOver" | "stepInto" | "stepOut", command: DebugCommand): HTMLButtonElement =>
    button({ label, icon: iconName, class: "btn btn-icon btn-step", onClick: () => session?.command(command) });
  const stepButtons = [
    stepButton("Continue (F5)", "resume", "continue"),
    stepButton("Step over (F10)", "stepOver", "stepOver"),
    stepButton("Step into (F11)", "stepInto", "stepInto"),
    stepButton("Step out (Shift+F11)", "stepOut", "stepOut"),
  ];
  for (const node of stepButtons) node.disabled = true;
  const debugControls = el("div", { class: "debug-controls", role: "toolbar", "aria-label": "Debugger" }, stepButtons);

  const titleBar = el("header", { class: "titlebar" }, [
    el("span", { class: "brand" }, [
      el("span", { class: "brand-mark", "aria-hidden": "true" }, [">_"]),
      el("span", { class: "brand-name" }, ["cpe-online"]),
    ]),
    pathEl,
    el("div", { class: "title-actions" }, [runButton, debugButton, debugControls, stopButton]),
  ]);

  const explorerToggle = button({
    label: "Explorer (Ctrl+B)",
    icon: "files",
    class: "rail-btn",
    onClick: () => toggleSidebar(),
  });
  const terminalToggle = button({
    label: "Terminal (Ctrl+J)",
    icon: "terminal",
    class: "rail-btn",
    onClick: () => togglePanel(),
  });
  const rail = el("nav", { class: "rail", "aria-label": "Views" }, [explorerToggle, terminalToggle]);

  const sidebar = el("aside", { class: "sidebar", "aria-label": "Explorer" });
  const scrim = el("div", { class: "scrim" });
  scrim.addEventListener("click", () => setSidebar(false));

  const tabsEl = el("div", { class: "tabs" });
  const symbolsEl = el("div", { class: "symbols" });
  const editorHost = el("div", { class: "editor-host" });
  const emptyEditor = el("div", { class: "editor-empty" }, [
    el("p", {}, ["No file is open."]),
    button({
      label: "New file",
      icon: "plus",
      showLabel: true,
      class: "btn btn-outline",
      onClick: () => void workspace.createFile(),
    }),
  ]);
  const editorPane = el("section", { class: "editor-pane", "aria-label": "Editor" }, [
    tabsEl,
    symbolsEl,
    editorHost,
    emptyEditor,
  ]);

  const splitter = el("div", {
    class: "splitter",
    role: "separator",
    tabindex: "0",
    "aria-orientation": "horizontal",
    "aria-label": "Resize terminal",
  });

  const outputEl = el("pre", { class: "output", role: "log", "aria-live": "polite", "aria-label": "Terminal output" });
  const debugPane = el("aside", { class: "debug-pane", "aria-label": "Debugger" });
  const panel = el("section", { class: "panel", "aria-label": "Terminal" }, [
    el("div", { class: "panel-header" }, [
      el("span", { class: "panel-title" }, ["Terminal"]),
      el("div", { class: "panel-actions" }, [
        button({ label: "Copy output", icon: "copy", class: "btn btn-icon btn-quiet", onClick: () => void copyOutput() }),
        button({ label: "Clear terminal", icon: "eraser", class: "btn btn-icon btn-quiet", onClick: () => consoleIO.clear() }),
      ]),
    ]),
    el("div", { class: "panel-body" }, [outputEl, debugPane]),
  ]);

  const main = el("main", { class: "main" }, [editorPane, splitter, panel]);

  const storageChip = el("span", { class: "status-item" });
  const runChip = el("span", { class: "status-item", role: "status" }, ["Ready"]);
  const cursorChip = el("span", { class: "status-item" });
  const languageChip = el("span", { class: "status-item" });
  const onlineChip = el("span", { class: "status-item" });
  const statusBar = el("footer", { class: "statusbar" }, [
    storageChip,
    runChip,
    el("span", { class: "status-spacer" }),
    cursorChip,
    languageChip,
    onlineChip,
  ]);

  const navButton = (view: View, label: string, iconName: "files" | "code" | "terminal"): HTMLButtonElement => {
    const node = el("button", { type: "button", class: "nav-btn", "data-view": view }, [icon(iconName), el("span", {}, [label])]);
    node.addEventListener("click", () => setView(view));
    return node;
  };
  const bottomNav = el("nav", { class: "bottom-nav", "aria-label": "Screens" }, [
    navButton("files", "Files", "files"),
    navButton("code", "Code", "code"),
    navButton("terminal", "Terminal", "terminal"),
  ]);

  const shell = el("div", { class: "shell" }, [titleBar, rail, sidebar, scrim, main, statusBar, bottomNav]);

  // The legacy markup shares this document until the new shell replaces it.
  document.querySelectorAll("body > :not(script)").forEach((node) => node.remove());
  document.body.append(shell);

  // ───── Layout state ─────

  function setSidebar(open: boolean): void {
    shell.dataset.sidebar = open ? "open" : "closed";
    explorerToggle.setAttribute("aria-pressed", String(open));
  }
  function toggleSidebar(): void {
    setSidebar(shell.dataset.sidebar !== "open");
  }
  function setPanel(open: boolean): void {
    shell.dataset.panel = open ? "open" : "closed";
    terminalToggle.setAttribute("aria-pressed", String(open));
  }
  function togglePanel(): void {
    setPanel(shell.dataset.panel !== "open");
  }
  function setView(view: View): void {
    shell.dataset.view = view;
    for (const node of bottomNav.querySelectorAll<HTMLButtonElement>(".nav-btn")) {
      node.setAttribute("aria-current", node.dataset.view === view ? "page" : "false");
    }
  }
  function applyTier(): void {
    const tier = currentTier();
    if (root.dataset.tier === tier) return;
    root.dataset.tier = tier;
    // The explorer is docked on a laptop and an overlay elsewhere, so it
    // starts open only where it does not cover the editor.
    setSidebar(tier === "laptop");
  }

  setPanel(true);
  setView("code");
  applyTier();
  window.addEventListener("resize", applyTier);

  // Terminal height: drag the splitter, or use the arrow keys on it.
  function setPanelHeight(px: number): void {
    const max = Math.max(120, main.clientHeight - 120);
    shell.style.setProperty("--panel-h", `${Math.round(Math.min(max, Math.max(96, px)))}px`);
  }
  splitter.addEventListener("pointerdown", (event) => {
    splitter.setPointerCapture(event.pointerId);
    const move = (moveEvent: PointerEvent): void => setPanelHeight(main.getBoundingClientRect().bottom - moveEvent.clientY);
    const end = (): void => {
      splitter.removeEventListener("pointermove", move);
      splitter.removeEventListener("pointerup", end);
      splitter.removeEventListener("pointercancel", end);
    };
    splitter.addEventListener("pointermove", move);
    splitter.addEventListener("pointerup", end);
    splitter.addEventListener("pointercancel", end);
  });
  splitter.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    setPanelHeight(panel.getBoundingClientRect().height + (event.key === "ArrowUp" ? 24 : -24));
  });

  // ───── Editor, explorer, tabs ─────

  let loadedFileId: string | null = null;
  let loading = false;

  const editor: EditorHandle = createEditor(editorHost, {
    onChange: (doc) => {
      if (!loading && loadedFileId !== null) workspace.updateDoc(loadedFileId, doc);
    },
    onCursor: ({ line, col }) => {
      cursorChip.textContent = `Ln ${line}, Col ${col}`;
    },
    onBreakpointsChange: (lines) => {
      if (loading || loadedFileId === null) return;
      breakpointsByFile.set(loadedFileId, lines);
      if (session && loadedFileId === debugFileId) session.setBreakpoints(lines);
    },
  });

  /** Breakpoints live per file for this visit. */
  const breakpointsByFile = new Map<string, number[]>();
  let session: DebugSession | null = null;
  let debugFileId: string | null = null;
  let pausedLine: number | null = null;

  const debugView = createDebugView(debugPane, {
    onRevealLine: (line) => {
      if (debugFileId !== null) workspace.open(debugFileId);
      editor.setExecLine(line);
    },
  });
  const symbolBar = createSymbolBar(symbolsEl, () => (loadedFileId === null ? null : editor));

  createExplorer(sidebar, {
    workspace,
    onOpen: () => {
      if (root.dataset.tier === "phone") setView("code");
      else if (root.dataset.tier === "tablet") setSidebar(false);
    },
  });
  createEditorTabs(tabsEl, workspace);

  function syncEditor(): void {
    const file = workspace.activeFile;
    editorPane.classList.toggle("is-empty", file === null);
    runButton.disabled = running || file === null;
    debugButton.disabled = running || !canDebug(file?.language);
    if (!file) {
      loadedFileId = null;
      pathEl.textContent = "";
      languageChip.textContent = "";
      return;
    }
    pathEl.textContent = `~/${workspace.project.name.toLowerCase().replace(/\s+/g, "-")}/${file.name}`;
    languageChip.textContent = LANGUAGE_LABELS[file.language] ?? file.language;
    symbolBar.setLanguage(file.language);
    if (file.id !== loadedFileId) {
      loading = true;
      loadedFileId = file.id;
      editor.setDoc(file.doc);
      editor.setBreakpoints(breakpointsByFile.get(file.id) ?? []);
      loading = false;
      // The paused-line marker belongs to the file being debugged.
      editor.setExecLine(file.id === debugFileId ? pausedLine : null);
    }
    // Renaming a file can change its language without changing the file.
    editor.setLanguage(file.language);
  }

  // ───── Terminal and running ─────

  const consoleIO = createConsole({ outputEl });
  let running = false;
  let abort: AbortController | null = null;

  /** Step debugging exists for C and C++ so far. */
  function canDebug(language: string | undefined): boolean {
    return language === "c" || language === "cpp";
  }

  function setRunning(next: boolean, language?: string): void {
    running = next;
    runButton.disabled = next || workspace.activeFile === null;
    debugButton.disabled = next || !canDebug(workspace.activeFile?.language);
    stopButton.disabled = !next || !STOPPABLE_LANGUAGES.has(language ?? "");
    shell.dataset.running = String(next);
    consoleIO.setInputActive(next);
  }

  function setPaused(line: number | null): void {
    pausedLine = line;
    shell.dataset.paused = String(line !== null);
    for (const node of stepButtons) node.disabled = line === null;
    if (loadedFileId === debugFileId) editor.setExecLine(line);
  }

  async function debug(): Promise<void> {
    const file = workspace.activeFile;
    if (running || !file || !canDebug(file.language)) return;
    await workspace.flush();
    editor.clearErrorLine();
    consoleIO.clear();
    consoleIO.cancelPendingReads();
    setPanel(true);
    setRunning(true, file.language);
    shell.dataset.debugging = "true";
    debugFileId = file.id;
    // Line numbers must keep meaning what they meant when the program started.
    editor.setReadOnly(true);
    setPaused(null);
    debugView.showRunning();
    runChip.textContent = `Debugging ${file.name}`;

    const phone = (): boolean => root.dataset.tier === "phone";
    session = debugCInWorker({
      code: file.doc,
      // On a phone the terminal is a separate screen: go there when the
      // program asks for input, and come back to the code when it pauses.
      consoleIO: {
        ...consoleIO,
        readLine: () => {
          if (phone()) setView("terminal");
          return consoleIO.readLine();
        },
      },
      breakpoints: breakpointsByFile.get(file.id) ?? [],
      onErrorLine: (line) => editor.highlightErrorLine(line),
      listener: {
        onPaused: (state) => {
          if (workspace.activeFile?.id !== debugFileId && debugFileId !== null) workspace.open(debugFileId);
          if (phone()) setView("code");
          setPaused(state.line);
          debugView.showPaused(state);
          runChip.textContent = `Paused at line ${state.line}`;
        },
        onResumed: () => {
          setPaused(null);
          debugView.showRunning();
          runChip.textContent = `Debugging ${file.name}`;
        },
      },
    });

    const result = await session.finished;
    session = null;
    setPaused(null);
    debugFileId = null;
    editor.setReadOnly(false);
    shell.dataset.debugging = "false";
    debugView.reset();
    setRunning(false);
    consoleIO.resetInput();
    runChip.textContent = result.stopped ? "Stopped" : result.ok ? "Finished" : "Failed";
  }

  async function run(): Promise<void> {
    const file = workspace.activeFile;
    if (running || !file) return;
    await workspace.flush();
    editor.clearErrorLine();
    consoleIO.clear();
    consoleIO.cancelPendingReads();
    setPanel(true);
    if (root.dataset.tier === "phone") setView("terminal");
    setRunning(true, file.language);
    runChip.textContent = `Running ${file.name}`;
    abort = new AbortController();
    let outcome = "Finished";
    try {
      const result = await runProgram({
        language: file.language,
        code: file.doc,
        consoleIO,
        signal: abort.signal,
        onErrorLine: (line: number) => editor.highlightErrorLine(line),
      });
      if ("stopped" in result && result.stopped) outcome = "Stopped";
      else if (!result.ok) outcome = "Failed";
    } catch (error) {
      consoleIO.writeErr("\n" + (error instanceof Error ? error.message : String(error)) + "\n");
      outcome = "Failed";
    } finally {
      abort = null;
      setRunning(false);
      consoleIO.resetInput();
      runChip.textContent = outcome;
    }
  }

  function stop(): void {
    if (!running) return;
    consoleIO.cancelPendingReads(new Error("Stopped by user"));
    abort?.abort();
    session?.stop();
    consoleIO.writeInfo("\n[stopped]\n");
  }

  async function copyOutput(): Promise<void> {
    try {
      await navigator.clipboard.writeText(outputEl.textContent ?? "");
      runChip.textContent = "Output copied";
    } catch {
      runChip.textContent = "Copy was blocked by the browser";
    }
  }

  // ───── Status bar ─────

  storageChip.replaceChildren(
    icon(store.persistent ? "database" : "databaseOff"),
    store.persistent ? "Saved on this device" : "Not saved: private window",
  );
  if (!store.persistent) storageChip.classList.add("is-warning");

  function syncOnline(): void {
    onlineChip.replaceChildren(icon(navigator.onLine ? "wifi" : "wifiOff"), navigator.onLine ? "Online" : "Offline");
  }
  window.addEventListener("online", syncOnline);
  window.addEventListener("offline", syncOnline);
  syncOnline();

  // ───── Keyboard ─────

  window.addEventListener("keydown", (event) => {
    const command = event.ctrlKey || event.metaKey;
    if (event.key === "F5" && event.shiftKey) {
      event.preventDefault();
      stop();
    } else if (event.key === "F5" || (command && event.key === "Enter")) {
      event.preventDefault();
      // While paused in the debugger, F5 means "carry on".
      if (session) session.command("continue");
      else void run();
    } else if (event.key === "F6") {
      event.preventDefault();
      void debug();
    } else if (event.key === "F10" && session) {
      event.preventDefault();
      session.command("stepOver");
    } else if (event.key === "F11" && session) {
      event.preventDefault();
      session.command(event.shiftKey ? "stepOut" : "stepInto");
    } else if (command && event.key.toLowerCase() === "b") {
      event.preventDefault();
      toggleSidebar();
    } else if (command && event.key.toLowerCase() === "j") {
      event.preventDefault();
      togglePanel();
    } else if (command && event.key.toLowerCase() === "s") {
      // Files save themselves; stop the browser's "save page" dialog.
      event.preventDefault();
      void workspace.flush();
    }
  });

  // Do not lose the last keystrokes when the tab is closed or hidden.
  window.addEventListener("pagehide", () => void workspace.flush());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void workspace.flush();
  });

  workspace.subscribe(syncEditor);
  syncEditor();

  // Handle for manual checks in the dev server console; absent in builds.
  if (import.meta.env.DEV) {
    (window as unknown as { __cpe: unknown }).__cpe = { editor, workspace, store, consoleIO };
  }
}
