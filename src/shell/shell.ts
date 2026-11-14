// The IDE shell: title bar, activity rail, explorer, editor with tabs,
// terminal panel and status bar. Layout adapts in three tiers (phone, tablet,
// laptop) through data attributes on the root; CSS does the rest.

import "../theme/tokens.css";
import "./shell.css";

import { createDebugView } from "../debugger/debug-view";
import { explainError } from "../diagnostics/engine";
import { createErrorCard } from "../diagnostics/error-card";
import type { ErrorExplanation, RawError } from "../diagnostics/types";
import type { AppStore, FileRecord, Settings } from "../storage/types";
import type { DebugCommand, DebugSession } from "../debugger/types";
import { createEditor } from "../editor/editor";
import type { EditorHandle } from "../editor/editor";
import { createSymbolBar } from "../editor/symbol-bar";
import { createBoardView } from "../board3d/board-view";
import { PART_NAMES, openCircuitEditor } from "../board3d/circuit-editor";
import type { SavedCircuit } from "../board3d/circuit-editor";
import { resolveCircuitParts } from "../content/circuit";
import type { BoardView } from "../board3d/board-view";
import { canRunLive, createLiveChannel } from "../runners/arduino/live";
import type { BoardReport } from "../runners/arduino/board";
import { canStop, runProgram } from "../runners/run";
import { debugCInWorker } from "../runners/c/c-runner";
import { canBlockForInput } from "../runners/input-channel";
import { debugPythonInWorker } from "../runners/python/python-runner";
import { openStore } from "../storage/idb-store";
import { migrateLegacyState } from "../storage/migrate-localstorage";
import { loadSettings, saveSettings } from "../storage/settings";
import { createConsole } from "../terminal/console";
import { button, el } from "./dom";
import { createEditorTabs } from "./editor-tabs";
import { createExamplesView } from "./examples-view";
import { createExplorer } from "./explorer";
import { icon } from "./icons";
import { createModeSwitch } from "./mode-switch";
import type { Mode } from "./mode-switch";
import { createReferenceView } from "./reference-view";
import { createSettingsView } from "./settings-view";
import { openWorkspace } from "./workspace";

type Tier = "phone" | "tablet" | "laptop";
/** On a phone only one of these fills the screen at a time. */
type View = "files" | "code" | "terminal";
/** What the side panel is showing. */
type SideView = "files" | "examples" | "reference" | "settings";

const LANGUAGE_LABELS: Record<string, string> = { c: "C", cpp: "C++", arduino: "Arduino", python: "Python", java: "Java", matlab: "MATLAB", text: "Text" };

function currentTier(): Tier {
  if (window.matchMedia("(max-width: 599px)").matches) return "phone";
  if (window.matchMedia("(max-width: 1023px)").matches) return "tablet";
  return "laptop";
}

/** What the rest of the app may ask of the IDE shell. */
export interface ShellHandle {
  store: AppStore;
  getSettings(): Settings;
  /** Applies and saves a change to the settings. */
  updateSettings(patch: Partial<Settings>): void;
  onSettingsChange(listener: (settings: Settings) => void): void;
  /** Switches the page between the IDE and the lessons. */
  setMode(mode: Mode): void;
  /** Adds a file to the explorer and opens it. */
  /** Adds the code as a new file and shows it. Data files are added too, unless a file of that name exists. */
  openInEditor(fileName: string, code: string, dataFiles?: Record<string, string>): Promise<void>;
}

export async function bootShell(): Promise<ShellHandle> {
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
    createModeSwitch("code"),
    pathEl,
    el("div", { class: "title-actions" }, [runButton, debugButton, debugControls, stopButton]),
  ]);

  // The side panel shows one view at a time. The rail picks it on tablets and
  // laptops; phones get a row of tabs at the top of the panel instead.
  const SIDE_VIEWS: { id: SideView; label: string; icon: "files" | "bulb" | "book" | "settings" }[] = [
    { id: "files", label: "Explorer", icon: "files" },
    { id: "examples", label: "Examples", icon: "bulb" },
    { id: "reference", label: "Reference", icon: "book" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];
  const sideSections = new Map<SideView, HTMLElement>();
  const railButtons = new Map<SideView, HTMLButtonElement>();
  const sideTabs = el("div", { class: "side-tabs", role: "tablist", "aria-label": "Side panel" });
  for (const view of SIDE_VIEWS) {
    sideSections.set(view.id, el("section", { class: "side-view", "data-side": view.id, "aria-label": view.label }));
    railButtons.set(
      view.id,
      button({ label: view.label, icon: view.icon, class: "rail-btn", onClick: () => pickSideView(view.id) }),
    );
    const tab = el("button", { type: "button", class: "side-tab", role: "tab", "data-side": view.id }, [view.label]);
    tab.addEventListener("click", () => showSideView(view.id));
    sideTabs.append(tab);
  }
  const sideSection = (id: SideView): HTMLElement => sideSections.get(id) as HTMLElement;

  const terminalToggle = button({
    label: "Terminal (Ctrl+J)",
    icon: "terminal",
    class: "rail-btn",
    onClick: () => togglePanel(),
  });
  const rail = el("nav", { class: "rail", "aria-label": "Views" }, [
    ...SIDE_VIEWS.filter((view) => view.id !== "settings").map((view) => railButtons.get(view.id) as HTMLElement),
    terminalToggle,
    el("span", { class: "rail-spacer" }),
    railButtons.get("settings") as HTMLElement,
  ]);

  const sidebar = el("aside", { class: "sidebar", "aria-label": "Side panel" }, [sideTabs, ...sideSections.values()]);
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
  // The panel has two tabs: the terminal, and the list of problems from the last run.
  const problemsEl = el("div", { class: "problems", role: "list", "aria-label": "Problems" });
  const problemsCount = el("span", { class: "panel-count" });
  const terminalTab = el("button", { type: "button", class: "panel-tab", role: "tab" }, ["Terminal"]);
  const problemsTab = el("button", { type: "button", class: "panel-tab", role: "tab" }, ["Problems", problemsCount]);
  // A third tab for sketches: the 3D board replaying the last run. Built the first time it is shown.
  const boardTab = el("button", { type: "button", class: "panel-tab", role: "tab" }, ["Board"]);
  boardTab.hidden = true;
  // Each sketch can have a circuit of its own, built in the circuit editor and kept on the device.
  const circuits = new Map<string, SavedCircuit>();
  const circuitKey = (fileId: string): string => `circuit.file.${fileId}`;
  async function loadCircuit(fileId: string): Promise<SavedCircuit> {
    const known = circuits.get(fileId);
    if (known) return known;
    const stored = (await store.getValue(circuitKey(fileId))) as SavedCircuit | undefined;
    const saved = stored && Array.isArray(stored.parts) ? stored : { board: "uno" as const, parts: [] };
    circuits.set(fileId, saved);
    return saved;
  }
  const boardLabel = el("span", { class: "board-panel-label" });
  const editCircuitButton = button({ label: "Edit circuit", icon: "pencil", showLabel: true, class: "btn btn-outline", onClick: () => void editCircuit() });
  const boardBar = el("div", { class: "board-panel-bar" }, [editCircuitButton, boardLabel]);
  const boardPanel = el("div", { class: "board-panel" }, [boardBar]);
  let boardView: BoardView | null = null;
  function ensureBoard(): BoardView {
    if (!boardView) {
      boardView = createBoardView();
      boardView.element.classList.add("board3d-fill");
      boardPanel.append(boardView.element);
      void applyCircuit();
    }
    return boardView;
  }
  /** Shows the active sketch's circuit on the board. */
  async function applyCircuit(): Promise<SavedCircuit | null> {
    const file = workspace.activeFile;
    if (!file || file.language !== "arduino") return null;
    const saved = await loadCircuit(file.id);
    if (workspace.activeFile?.id !== file.id) return saved;
    const { circuit, problems } = resolveCircuitParts(saved.parts, saved.board);
    boardView?.setCircuit(saved.board, problems.length === 0 ? circuit : null);
    const names = saved.parts.map((part) => PART_NAMES[part.part]);
    boardLabel.textContent = `${saved.board === "esp32" ? "ESP32 DevKit" : "Arduino Uno"}${names.length ? ` · ${names.length} ${names.length === 1 ? "part" : "parts"}` : " · no parts yet"}`;
    return saved;
  }
  async function editCircuit(): Promise<void> {
    const file = workspace.activeFile;
    if (!file || file.language !== "arduino") return;
    const saved = await loadCircuit(file.id);
    openCircuitEditor(document.body, saved, (next) => {
      circuits.set(file.id, next);
      void store.setValue(circuitKey(file.id), next).catch(console.warn);
      showPanelTab("board");
      void applyCircuit();
    });
  }
  terminalTab.addEventListener("click", () => showPanelTab("terminal"));
  problemsTab.addEventListener("click", () => showPanelTab("problems"));
  boardTab.addEventListener("click", () => showPanelTab("board"));

  // The panel can sit under the editor or beside it; the button moves it to the other place.
  const panelSideButton = el("button", { type: "button", class: "btn btn-icon btn-quiet panel-side" });
  panelSideButton.addEventListener("click", () => updateSettings({ panelSide: settings.panelSide === "right" ? "bottom" : "right" }));
  const panel = el("section", { class: "panel", "aria-label": "Terminal and problems" }, [
    el("div", { class: "panel-header" }, [
      el("div", { class: "panel-tabs", role: "tablist" }, [terminalTab, problemsTab, boardTab]),
      el("div", { class: "panel-actions" }, [
        panelSideButton,
        button({ label: "Copy output", icon: "copy", class: "btn btn-icon btn-quiet", onClick: () => void copyOutput() }),
        button({ label: "Clear terminal", icon: "eraser", class: "btn btn-icon btn-quiet", onClick: () => consoleIO.clear() }),
      ]),
    ]),
    el("div", { class: "panel-body" }, [outputEl, problemsEl, boardPanel, debugPane]),
  ]);

  const main = el("main", { class: "main" }, [editorPane, splitter, panel]);

  const storageChip = el("span", { class: "status-item" });
  const isolationChip = el("span", { class: "status-item is-warning" });
  const runChip = el("span", { class: "status-item", role: "status" }, ["Ready"]);
  const cursorChip = el("span", { class: "status-item" });
  const languageChip = el("span", { class: "status-item" });
  const onlineChip = el("span", { class: "status-item" });
  const statusBar = el("footer", { class: "statusbar" }, [
    storageChip,
    isolationChip,
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

  document.body.replaceChildren(shell);

  // ───── Layout state ─────

  let sideView: SideView = "files";

  function syncSideControls(): void {
    const open = shell.dataset.sidebar === "open";
    for (const [id, node] of railButtons) node.setAttribute("aria-pressed", String(open && id === sideView));
    for (const tab of sideTabs.children) {
      tab.setAttribute("aria-selected", String((tab as HTMLElement).dataset.side === sideView));
    }
  }
  function setSidebar(open: boolean): void {
    shell.dataset.sidebar = open ? "open" : "closed";
    syncSideControls();
  }
  function toggleSidebar(): void {
    setSidebar(shell.dataset.sidebar !== "open");
  }
  function showSideView(view: SideView): void {
    sideView = view;
    shell.dataset.side = view;
    syncSideControls();
  }
  /** Rail behaviour: picking the view that is already showing closes the panel. */
  function pickSideView(view: SideView): void {
    if (shell.dataset.sidebar === "open" && sideView === view) {
      setSidebar(false);
    } else {
      showSideView(view);
      setSidebar(true);
    }
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

  // Panel size: drag the splitter, or use the arrow keys on it. Height under the editor, width beside it.
  const besideEditor = (): boolean => shell.dataset.panelSide === "right" && root.dataset.tier !== "phone";
  function setPanelHeight(px: number): void {
    const max = Math.max(120, main.clientHeight - 120);
    shell.style.setProperty("--panel-h", `${Math.round(Math.min(max, Math.max(96, px)))}px`);
  }
  function setPanelWidth(px: number): void {
    const max = Math.max(260, main.clientWidth - 260);
    shell.style.setProperty("--panel-w", `${Math.round(Math.min(max, Math.max(240, px)))}px`);
  }
  splitter.addEventListener("pointerdown", (event) => {
    splitter.setPointerCapture(event.pointerId);
    const move = (moveEvent: PointerEvent): void => {
      if (besideEditor()) setPanelWidth(main.getBoundingClientRect().right - moveEvent.clientX);
      else setPanelHeight(main.getBoundingClientRect().bottom - moveEvent.clientY);
    };
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
    if (besideEditor()) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      setPanelWidth(panel.getBoundingClientRect().width + (event.key === "ArrowLeft" ? 24 : -24));
      return;
    }
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

  /** After a file is chosen, get the side panel out of the way where it covers the editor. */
  const revealEditor = (): void => {
    if (root.dataset.tier === "phone") setView("code");
    else if (root.dataset.tier === "tablet") setSidebar(false);
  };
  createExplorer(sideSection("files"), { workspace, onOpen: revealEditor });
  createExamplesView(sideSection("examples"), { workspace, onOpen: revealEditor });
  createReferenceView(sideSection("reference"));
  createEditorTabs(tabsEl, workspace);

  // ───── Settings ─────

  let settings = await loadSettings(store);
  const systemLight = window.matchMedia("(prefers-color-scheme: light)");

  function applyPanelSide(): void {
    const side = settings.panelSide;
    shell.dataset.panelSide = side;
    splitter.setAttribute("aria-orientation", side === "right" ? "vertical" : "horizontal");
    splitter.setAttribute("aria-label", side === "right" ? "Resize panel width" : "Resize terminal");
    const label = side === "right" ? "Move the panel under the editor" : "Move the panel to the right of the editor";
    panelSideButton.replaceChildren(icon(side === "right" ? "layoutBottom" : "layoutRight"));
    panelSideButton.setAttribute("aria-label", label);
    panelSideButton.title = label;
  }

  function applySettings(): void {
    applyPanelSide();
    // Both modes follow the theme: Learn is paper when light and night paper when dark.
    const light = settings.theme === "light" || (settings.theme === "auto" && systemLight.matches);
    root.dataset.theme = light ? "light" : "dark";
    // The editor's syntax colours are keyed on this class.
    root.classList.toggle("theme-light", light);
    editor.setFontSize(settings.fontSize);
    editor.setWrap(settings.wrap);
    outputEl.classList.toggle("no-wrap", !settings.outputWrap);
  }

  const settingsListeners: ((settings: Settings) => void)[] = [];
  function updateSettings(patch: Partial<Settings>): void {
    settings = { ...settings, ...patch };
    applySettings();
    settingsView.sync(settings);
    for (const listener of settingsListeners) listener(settings);
    // Save the whole object, not the patch: two quick changes would
    // otherwise each merge into the old stored value and one would be lost.
    void saveSettings(store, settings).catch(console.warn);
  }
  const settingsView = createSettingsView(sideSection("settings"), { settings, onChange: updateSettings });
  systemLight.addEventListener("change", applySettings);
  applySettings();
  showSideView("files");

  function syncEditor(): void {
    const file = workspace.activeFile;
    editorPane.classList.toggle("is-empty", file === null);
    // A data file is read by programs, not run.
    runButton.disabled = running || file === null || file.language === "text";
    debugButton.disabled = running || !canDebug(file?.language);
    boardTab.hidden = file?.language !== "arduino";
    if (boardTab.hidden && shell.dataset.panelTab === "board") showPanelTab("terminal");
    if (!boardTab.hidden) void applyCircuit();
    if (!file) {
      loadedFileId = null;
      pathEl.textContent = "";
      languageChip.textContent = "";
      return;
    }
    pathEl.textContent = `~/${workspace.project.name.toLowerCase().replace(/\s+/g, "-")}/${file.name}`;
    languageChip.textContent = LANGUAGE_LABELS[file.language] ?? file.language;
    symbolBar.setLanguage(file.language);
    // A program may also have rewritten the open file with fopen.
    if (file.id !== loadedFileId || editor.getDoc() !== file.doc) {
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

  /** Python pauses by sleeping on shared memory, so it needs cross-origin isolation. */
  function canDebug(language: string | undefined): boolean {
    // C++ runs on a real compiler, which has no step debugger here yet.
    return language === "c" || (language === "python" && canBlockForInput());
  }

  function setRunning(next: boolean, language?: string): void {
    running = next;
    runButton.disabled = next || workspace.activeFile === null || workspace.activeFile.language === "text";
    debugButton.disabled = next || !canDebug(workspace.activeFile?.language);
    stopButton.disabled = !next || !canStop(language);
    shell.dataset.running = String(next);
    consoleIO.setInputActive(next);
  }

  function setPaused(line: number | null): void {
    pausedLine = line;
    shell.dataset.paused = String(line !== null);
    for (const node of stepButtons) node.disabled = line === null;
    if (loadedFileId === debugFileId) editor.setExecLine(line);
  }

  // ───── Problems: errors from the last run, explained ─────

  interface Problem {
    explanation: ErrorExplanation;
    fileId: string;
    fileName: string;
  }
  let problems: Problem[] = [];

  function showPanelTab(tab: "terminal" | "problems" | "board"): void {
    shell.dataset.panelTab = tab;
    terminalTab.setAttribute("aria-selected", String(tab === "terminal"));
    problemsTab.setAttribute("aria-selected", String(tab === "problems"));
    boardTab.setAttribute("aria-selected", String(tab === "board"));
    if (tab === "board") ensureBoard();
  }

  function jumpToProblem(problem: Problem): void {
    workspace.open(problem.fileId);
    if (problem.explanation.line !== null) editor.highlightErrorLine(problem.explanation.line);
    if (root.dataset.tier === "phone") setView("code");
  }

  function renderProblems(): void {
    problemsCount.textContent = problems.length > 0 ? String(problems.length) : "";
    if (problems.length === 0) {
      problemsEl.replaceChildren(el("p", { class: "problems-empty" }, ["No problems in the last run."]));
      return;
    }
    problemsEl.replaceChildren(
      ...problems.map((problem) => {
        const { title, line, column } = problem.explanation;
        const where = line === null ? problem.fileName : `${problem.fileName}:${line}${column !== null ? `:${column}` : ""}`;
        const row = el("button", { type: "button", class: "problem-row", role: "listitem" }, [
          icon("alertTriangle"),
          el("span", { class: "problem-title" }, [title]),
          el("span", { class: "problem-where" }, [where]),
        ]);
        row.addEventListener("click", () => jumpToProblem(problem));
        return row;
      }),
    );
  }

  function clearProblems(): void {
    problems = [];
    renderProblems();
    showPanelTab("terminal");
  }

  /** Explains a runtime's error, shows the card in the terminal and lists it under Problems. */
  function reportError(file: FileRecord, raw: RawError): void {
    const explanation = explainError(raw, file.doc);
    const problem: Problem = { explanation, fileId: file.id, fileName: file.name };
    if (explanation.line !== null && workspace.activeFile?.id === file.id) editor.highlightErrorLine(explanation.line);
    const card = createErrorCard(explanation, { fileName: file.name, onJump: () => jumpToProblem(problem), kid: settings.kidMode });
    consoleIO.appendElement(card);
    // The terminal follows new output to the bottom; a card is read from its top.
    card.scrollIntoView({ block: "start" });
    problems = [...problems, problem];
    renderProblems();
  }

  renderProblems();
  showPanelTab("terminal");

  /** Every file in the project, for fopen: a program can read any of them. */
  function programFiles(): Record<string, string> {
    return Object.fromEntries(workspace.files.map((file) => [file.name, file.doc]));
  }

  /** Keeps what the program wrote and says so in the terminal. */
  async function saveWrittenFiles(written: Record<string, string>): Promise<void> {
    try {
      const names = await workspace.saveProgramFiles(written);
      if (names.length) consoleIO.writeInfo(`\n[saved ${names.join(", ")} in the explorer]\n`);
    } catch (error) {
      consoleIO.writeErr(`\nCould not save the files the program wrote: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  async function debug(): Promise<void> {
    const file = workspace.activeFile;
    if (running || !file || !canDebug(file.language)) return;
    // Claim the run before the first await, or a second click could start another.
    running = true;
    await workspace.flush();
    editor.clearErrorLine();
    clearProblems();
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
    const startDebug = file.language === "python" ? debugPythonInWorker : debugCInWorker;
    session = startDebug({
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
      onError: (text) => reportError(file, { language: file.language, text }),
      files: programFiles(),
      onFiles: (written) => void saveWrittenFiles(written),
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
    // Claim the run before the first await, or a second click could start another.
    running = true;
    await workspace.flush();
    editor.clearErrorLine();
    clearProblems();
    consoleIO.clear();
    consoleIO.cancelPendingReads();
    setPanel(true);
    if (root.dataset.tier === "phone") setView("terminal");
    setRunning(true, file.language);
    runChip.textContent = `Running ${file.name}`;
    abort = new AbortController();
    let outcome = "Finished";
    // A sketch runs live when the browser allows it: the Board tab shows it and its parts can be used.
    // A sketch runs on its own circuit's board (the Uno unless the circuit says ESP32).
    const sketchBoard = file.language === "arduino" ? ((await applyCircuit())?.board ?? "uno") : "uno";
    const liveChannel = file.language === "arduino" && canRunLive() ? createLiveChannel() : null;
    const session = liveChannel ? ensureBoard().startLive(sketchBoard, liveChannel, file.doc) : null;
    if (session) showPanelTab("board");
    let finalReport: BoardReport | null = null;
    try {
      const result = await runProgram({
        language: file.language,
        code: file.doc,
        fileName: file.name,
        consoleIO,
        signal: abort.signal,
        onError: (error) => reportError(file, error),
        files: programFiles(),
        onFiles: (written) => void saveWrittenFiles(written),
        // A sketch that changed pins is replayed on the board; its Serial output stays in the terminal.
        sim: liveChannel ? { runMs: 30 * 60_000, live: liveChannel, board: sketchBoard } : { board: sketchBoard },
        onLive: session ? (events, t, modes, reads) => session.changes(events, t, modes, reads) : undefined,
        onBoard: (report) => {
          if (session) {
            finalReport = report;
            return;
          }
          ensureBoard().show(report, file.doc);
          if (report.events.length > 0) showPanelTab("board");
        },
      });
      if (result.stopped) outcome = "Stopped";
      else if (!result.ok) outcome = "Failed";
    } catch (error) {
      consoleIO.writeErr("\n" + (error instanceof Error ? error.message : String(error)) + "\n");
      outcome = "Failed";
    } finally {
      session?.end(finalReport);
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

  // Without cross-origin isolation programs still run, but cannot wait for
  // typed input and Python cannot be debugged. Say so instead of failing quietly.
  if (!canBlockForInput()) {
    isolationChip.replaceChildren(icon("alertTriangle"), "Typed input is unavailable on this address");
    isolationChip.title = "This site is not cross-origin isolated, so running programs cannot pause for input.";
  }

  // A newer version of the app has been installed by the service worker.
  document.addEventListener("cpe:updated", () => {
    runChip.textContent = "New version ready. Reload to use it.";
  });

  function syncOnline(): void {
    onlineChip.replaceChildren(icon(navigator.onLine ? "wifi" : "wifiOff"), navigator.onLine ? "Online" : "Offline");
  }
  window.addEventListener("online", syncOnline);
  window.addEventListener("offline", syncOnline);
  syncOnline();

  // ───── Keyboard ─────

  window.addEventListener("keydown", (event) => {
    // These shortcuts belong to the IDE; the lessons have their own buttons.
    if (root.dataset.mode !== "code") return;
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

  return {
    store,
    getSettings: () => settings,
    updateSettings,
    onSettingsChange: (listener) => void settingsListeners.push(listener),
    setMode(mode) {
      root.dataset.mode = mode;
      applySettings();
    },
    async openInEditor(fileName, code, dataFiles = {}) {
      const taken = new Set(workspace.files.map((existing) => existing.name));
      await workspace.saveProgramFiles(Object.fromEntries(Object.entries(dataFiles).filter(([name]) => !taken.has(name))));
      const file = await workspace.addFile(fileName, code);
      workspace.open(file.id);
      revealEditor();
    },
  };
}
