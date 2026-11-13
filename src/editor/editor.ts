// CodeMirror 6 editor. Replaces the CodeMirror 5 wrapper and keeps its API,
// plus what the debugger needs: a breakpoint gutter and an execution line.
//
// Colours come from CSS custom properties (see editor.css), so switching the
// app theme restyles the editor with no editor-side work.

import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentMore, indentWithTab } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import {
  HighlightStyle,
  bracketMatching,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import type { Extension, Range } from "@codemirror/state";
import { Compartment, EditorSelection, EditorState, RangeSet, StateEffect, StateField } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import {
  Decoration,
  EditorView,
  GutterMarker,
  drawSelection,
  gutter,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import "./editor.css";

export type EditorLanguage = "c" | "cpp" | "python" | "java" | "matlab";

/** 1-based cursor position, as shown in the status bar. */
export interface CursorPosition {
  line: number;
  col: number;
}

export interface EditorOptions {
  initialDoc?: string;
  language?: EditorLanguage | string;
  wrap?: boolean;
  fontSize?: number;
  onChange?: (doc: string) => void;
  onCursor?: (position: CursorPosition) => void;
  onBreakpointsChange?: (lines: number[]) => void;
}

export interface EditorHandle {
  readonly view: EditorView;
  getDoc(): string;
  setDoc(text: string): void;
  setLanguage(language: EditorLanguage | string): void;
  setWrap(wrap: boolean): void;
  setFontSize(px: number): void;
  /** Blocks typing, for example while the debugger is using the line numbers. */
  setReadOnly(readOnly: boolean): void;
  focus(): void;
  /** Inserts text at the selection; `cursorOffset` then moves the cursor (for example -1 lands between `{}`). */
  insertText(text: string, cursorOffset?: number): void;
  insertAtCursor(text: string): void;
  /** Runs the action of a key that phone keyboards lack. Only "Tab" is supported. */
  triggerKey(key: string): void;
  getCursor(): CursorPosition;
  highlightErrorLine(line: number): void;
  clearErrorLine(): void;
  /** Marks the line the debugger is paused on; `null` clears it. */
  setExecLine(line: number | null): void;
  /** Breakpoint lines, 1-based, ascending. */
  getBreakpoints(): number[];
  setBreakpoints(lines: readonly number[]): void;
  destroy(): void;
}

const INDENT = "    ";

/**
 * C and C++ ship in the main bundle because they are the default. The other
 * grammars load on first use, which keeps the first paint small on phones.
 */
async function loadLanguage(language: string): Promise<Extension> {
  switch (language) {
    case "python":
      return (await import("@codemirror/lang-python")).python();
    case "java":
      return (await import("@codemirror/lang-java")).java();
    case "matlab": {
      // MATLAB and Octave share a syntax; the Octave mode highlights both.
      const [{ StreamLanguage }, { octave }] = await Promise.all([
        import("@codemirror/language"),
        import("@codemirror/legacy-modes/mode/octave"),
      ]);
      return StreamLanguage.define(octave);
    }
    case "text":
      return [];
    default:
      return cpp();
  }
}

function isBundled(language: string): boolean {
  return language !== "python" && language !== "java" && language !== "matlab" && language !== "text";
}

// ───── Theme: everything is a CSS variable ─────

const baseTheme = EditorView.theme({
  "&": { height: "100%", color: "var(--text)", backgroundColor: "var(--bg)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--mono)", lineHeight: "1.5", overflow: "auto" },
  ".cm-content": { caretColor: "var(--accent-strong)", padding: "6px 0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent-strong)", borderLeftWidth: "2px" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    { backgroundColor: "var(--editor-selection)" },
  ".cm-gutters": { backgroundColor: "var(--bg)", color: "var(--text-faint)", border: "none" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 4px", minWidth: "28px" },
  ".cm-activeLine": { backgroundColor: "var(--editor-active-line)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--editor-active-line)", color: "var(--text)" },
  "&.cm-focused .cm-matchingBracket": { backgroundColor: "var(--editor-bracket)", outline: "none" },
});

const highlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword, tags.modifier], color: "var(--syn-keyword)" },
  { tag: [tags.typeName, tags.className, tags.namespace], color: "var(--syn-type)" },
  { tag: [tags.string, tags.character, tags.special(tags.string)], color: "var(--syn-string)" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "var(--syn-number)" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "var(--syn-comment)", fontStyle: "italic" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "var(--syn-function)" },
  { tag: [tags.processingInstruction, tags.meta, tags.macroName], color: "var(--syn-preproc)" },
  { tag: [tags.operator, tags.punctuation, tags.bracket], color: "var(--syn-operator)" },
  { tag: tags.escape, color: "var(--syn-escape)" },
  { tag: tags.invalid, color: "var(--danger)" },
]);

// ───── Error line and execution line ─────

const setErrorLine = StateEffect.define<number | null>();
const setExecLineEffect = StateEffect.define<number | null>();

const errorLineDeco = Decoration.line({ class: "cm-error-line" });
const execLineDeco = Decoration.line({ class: "cm-exec-line" });

/** A single highlighted line that follows edits and is replaced by its effect. */
function singleLineField(effect: typeof setErrorLine, deco: Decoration): StateField<DecorationSet> {
  return StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(value, tr) {
      let next = value.map(tr.changes);
      for (const e of tr.effects) {
        if (!e.is(effect)) continue;
        if (e.value === null || e.value < 1 || e.value > tr.state.doc.lines) {
          next = Decoration.none;
        } else {
          next = Decoration.set([deco.range(tr.state.doc.line(e.value).from)]);
        }
      }
      return next;
    },
    provide: (field) => EditorView.decorations.from(field),
  });
}

const errorLineField = singleLineField(setErrorLine, errorLineDeco);
const execLineField = singleLineField(setExecLineEffect, execLineDeco);

// ───── Breakpoints ─────

class BreakpointMarker extends GutterMarker {
  override toDOM(): Node {
    const dot = document.createElement("span");
    dot.className = "cm-breakpoint-dot";
    dot.setAttribute("aria-label", "Breakpoint");
    return dot;
  }
}
const breakpointMarker = new BreakpointMarker();

/** Toggles the breakpoint on the line starting at `pos`. */
const toggleBreakpoint = StateEffect.define<{ pos: number }>({
  map: (value, mapping) => ({ pos: mapping.mapPos(value.pos) }),
});
/** Replaces all breakpoints with the given line-start positions. */
const replaceBreakpoints = StateEffect.define<number[]>();

const breakpointField = StateField.define<RangeSet<GutterMarker>>({
  create: () => RangeSet.empty,
  update(set, tr) {
    let next = set.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(replaceBreakpoints)) {
        const ranges: Range<GutterMarker>[] = e.value.map((pos) => breakpointMarker.range(pos));
        next = RangeSet.of(ranges, true);
      } else if (e.is(toggleBreakpoint)) {
        const { pos } = e.value;
        let exists = false;
        next.between(pos, pos, () => {
          exists = true;
        });
        next = exists
          ? next.update({ filter: (from) => from !== pos })
          : next.update({ add: [breakpointMarker.range(pos)] });
      }
    }
    return next;
  },
});

function breakpointLines(state: EditorState): number[] {
  const lines = new Set<number>();
  const cursor = state.field(breakpointField).iter();
  while (cursor.value) {
    lines.add(state.doc.lineAt(cursor.from).number);
    cursor.next();
  }
  return [...lines].sort((a, b) => a - b);
}

const breakpointGutter = gutter({
  class: "cm-breakpoint-gutter",
  markers: (view) => view.state.field(breakpointField),
  initialSpacer: () => breakpointMarker,
  domEventHandlers: {
    mousedown(view, line) {
      view.dispatch({ effects: toggleBreakpoint.of({ pos: line.from }) });
      return true;
    },
  },
});

// ───── Editor ─────

export function createEditor(parent: HTMLElement, options: EditorOptions = {}): EditorHandle {
  const { initialDoc = "", language = "c", wrap = false, fontSize = 15, onChange, onCursor, onBreakpointsChange } = options;

  const languageCompartment = new Compartment();
  const wrapCompartment = new Compartment();
  const readOnlyCompartment = new Compartment();

  const listener = EditorView.updateListener.of((update) => {
    if (update.docChanged) onChange?.(update.state.doc.toString());
    if (update.docChanged || update.selectionSet) onCursor?.(cursorOf(update.state));
    if (
      onBreakpointsChange &&
      update.transactions.some((tr) => tr.effects.some((e) => e.is(toggleBreakpoint) || e.is(replaceBreakpoints)))
    ) {
      onBreakpointsChange(breakpointLines(update.state));
    }
  });

  const state = EditorState.create({
    doc: initialDoc,
    extensions: [
      breakpointField,
      breakpointGutter,
      lineNumbers(),
      highlightActiveLineGutter(),
      history(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(), // beginner-friendly: { → }, ( → ), " → "
      highlightActiveLine(),
      indentUnit.of(INDENT),
      EditorState.tabSize.of(4),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      // Phone keyboards must not "correct" code.
      EditorView.contentAttributes.of({
        spellcheck: "false",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Source code",
      }),
      languageCompartment.of(isBundled(language) ? cpp() : []),
      wrapCompartment.of(wrap ? EditorView.lineWrapping : []),
      readOnlyCompartment.of(EditorState.readOnly.of(false)),
      syntaxHighlighting(highlightStyle),
      baseTheme,
      errorLineField,
      execLineField,
      listener,
    ],
  });

  parent.textContent = "";
  const view = new EditorView({ state, parent });
  parent.style.setProperty("--editor-fontsize", `${fontSize}px`);

  // The newest request wins if the user switches language while a grammar loads.
  let languageRequest = 0;
  function applyLanguage(next: string): void {
    const request = ++languageRequest;
    void loadLanguage(next).then((extension) => {
      if (request !== languageRequest) return;
      view.dispatch({ effects: languageCompartment.reconfigure(extension) });
    });
  }
  if (!isBundled(language)) applyLanguage(language);

  function cursorOf(editorState: EditorState): CursorPosition {
    const head = editorState.selection.main.head;
    const line = editorState.doc.lineAt(head);
    return { line: line.number, col: head - line.from + 1 };
  }

  function insertText(text: string, cursorOffset = 0): void {
    const range = view.state.selection.main;
    const anchor = range.from + text.length + cursorOffset;
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: text },
      selection: EditorSelection.cursor(Math.max(range.from, anchor)),
      scrollIntoView: true,
      userEvent: "input",
    });
    view.focus();
  }

  return {
    view,
    getDoc: () => view.state.doc.toString(),
    setDoc(text) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
        selection: EditorSelection.cursor(0),
        effects: [setErrorLine.of(null), setExecLineEffect.of(null)],
      });
    },
    setLanguage: applyLanguage,
    setWrap(next) {
      view.dispatch({ effects: wrapCompartment.reconfigure(next ? EditorView.lineWrapping : []) });
    },
    setReadOnly(readOnly) {
      view.dispatch({ effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)) });
    },
    setFontSize(px) {
      parent.style.setProperty("--editor-fontsize", `${px}px`);
      view.requestMeasure();
    },
    focus: () => view.focus(),
    insertText,
    insertAtCursor: (text) => insertText(text, 0),
    triggerKey(key) {
      if (key !== "Tab") return;
      if (view.state.selection.main.empty) insertText(INDENT, 0);
      else indentMore(view);
      view.focus();
    },
    getCursor: () => cursorOf(view.state),
    highlightErrorLine(line) {
      const target = Math.min(Math.max(1, line || 1), view.state.doc.lines);
      view.dispatch({
        effects: [
          setErrorLine.of(target),
          EditorView.scrollIntoView(view.state.doc.line(target).from, { y: "center" }),
        ],
      });
    },
    clearErrorLine() {
      view.dispatch({ effects: setErrorLine.of(null) });
    },
    setExecLine(line) {
      const effects: StateEffect<unknown>[] = [setExecLineEffect.of(line)];
      if (line !== null && line >= 1 && line <= view.state.doc.lines) {
        effects.push(EditorView.scrollIntoView(view.state.doc.line(line).from, { y: "center" }));
      }
      view.dispatch({ effects });
    },
    getBreakpoints: () => breakpointLines(view.state),
    setBreakpoints(lines) {
      const doc = view.state.doc;
      const positions = [...new Set(lines)]
        .filter((line) => line >= 1 && line <= doc.lines)
        .sort((a, b) => a - b)
        .map((line) => doc.line(line).from);
      view.dispatch({ effects: replaceBreakpoints.of(positions) });
    },
    destroy: () => view.destroy(),
  };
}
