// Terminal panel: program output plus inline input.
//
// Works like the terminal of a desktop IDE. While a program runs, a text
// cursor sits at the end of the output; the user types there and presses
// Enter, and the line goes to the program. The input buffer itself lives in
// stdin-queue.ts; this module only owns the DOM.

import { createStdinQueue } from "./stdin-queue";
import "./terminal.css";

export interface ConsoleElements {
  outputEl: HTMLElement;
  /** Optional status line showing how many lines are queued before a run. */
  queueEl?: HTMLElement | null;
}

/** What runners use to print output and read input. */
export interface ConsoleIO {
  write(text: string): void;
  writeLine(text: string): void;
  writeErr(text: string): void;
  writeInfo(text: string): void;
  clear(): void;
  readLine(): Promise<string>;
  tryReadLineSync(): string | null;
  /** Queues input from outside the terminal (for example the menu's input list). */
  pushStdin(text: string): void;
  resetInput(): void;
  cancelPendingReads(reason?: Error): void;
  drainBuffer(): string;
  bufferedLineCount(): number;
  /** Shows the typing cursor while a program runs, hides it when idle. */
  setInputActive(active: boolean): void;
  focusInput(): void;
}

// Auto-fold older lines once the output grows past MAX_VISIBLE child nodes
// so phones don't have to scroll through 500 spans. The most recent
// KEEP_RECENT spans stay visible; everything older collapses into a
// <details> block the user can re-expand.
const MAX_VISIBLE = 200;
const KEEP_RECENT = 100;

function createInputElement(): HTMLSpanElement {
  const input = document.createElement("span");
  input.className = "term-input";
  try {
    input.contentEditable = "plaintext-only";
  } catch {
    // Older browsers reject the value; paste is flattened by hand below.
    input.contentEditable = "true";
  }
  input.spellcheck = false;
  input.setAttribute("role", "textbox");
  input.setAttribute("aria-label", "Program input. Type, then press Enter.");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("enterkeyhint", "enter");
  input.setAttribute("inputmode", "text");
  return input;
}

export function createConsole(elements: ConsoleElements): ConsoleIO {
  const { outputEl, queueEl } = elements;

  const queue = createStdinQueue(updateQueueIndicator);
  const inputEl = createInputElement();
  let inputActive = false;

  const inputAttached = (): boolean => inputEl.parentNode === outputEl;

  // Update the on-screen queue indicator (e.g. "📥 2 lines ready").
  function updateQueueIndicator(): void {
    if (!queueEl) return;
    const lines = inputActive ? 0 : queue.lineCount();
    if (lines === 0) {
      queueEl.hidden = true;
      queueEl.textContent = "";
    } else {
      queueEl.hidden = false;
      queueEl.textContent = `📥 ${lines} input line${lines === 1 ? "" : "s"} ready — press ▶ Run`;
    }
  }

  function scrollToEnd(): void {
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  /** Output always goes above the typing cursor. */
  function appendNode(node: Node): void {
    outputEl.insertBefore(node, inputAttached() ? inputEl : null);
    maybeFoldOldOutput();
    scrollToEnd();
  }

  function maybeFoldOldOutput(): void {
    // The typing cursor is not output and must never be folded away.
    const extra = inputAttached() ? 1 : 0;
    if (outputEl.childNodes.length - extra <= MAX_VISIBLE) return;

    // If there's already an active fold at the top, push more into it.
    const existing = outputEl.firstElementChild;
    let fold: Element;
    if (existing && existing.tagName === "DETAILS" && existing.classList.contains("output-fold")) {
      fold = existing;
    } else {
      const details = document.createElement("details");
      details.className = "output-fold";
      const summaryEl = document.createElement("summary");
      summaryEl.textContent = "Show earlier output";
      details.appendChild(summaryEl);
      const content = document.createElement("span");
      content.className = "fold-content";
      details.appendChild(content);
      outputEl.insertBefore(details, outputEl.firstChild);
      fold = details;
    }
    const summary = fold.querySelector("summary");
    const foldContent = fold.querySelector(".fold-content");
    if (!summary || !foldContent) return;

    // Move spans (everything between the fold and the last KEEP_RECENT) into the fold.
    while (outputEl.childNodes.length - extra > KEEP_RECENT + 1) {
      const second = fold.nextSibling;
      if (!second || second === inputEl) break;
      foldContent.appendChild(second);
    }
    const hidden = foldContent.childNodes.length;
    summary.textContent = `Show earlier output (${hidden} line${hidden === 1 ? "" : "s"})`;
  }

  function appendLine(text: string, cls?: string): void {
    const span = document.createElement("span");
    if (cls) span.className = cls;
    span.textContent = text;
    appendNode(span);
  }

  function clear(): void {
    outputEl.textContent = "";
    inputEl.textContent = "";
    if (inputActive) outputEl.appendChild(inputEl);
  }

  /** Sends one typed line to the program and leaves it on screen, as a terminal does. */
  function submitTyped(line: string): void {
    appendLine(line + "\n", "line-input");
    queue.push(line);
  }

  function submitInputElement(): void {
    const line = inputEl.textContent ?? "";
    inputEl.textContent = "";
    submitTyped(line);
  }

  function focusInput(): void {
    if (!inputAttached()) return;
    inputEl.focus();
    // Put the caret after any text already typed.
    const selection = window.getSelection();
    if (selection) {
      selection.selectAllChildren(inputEl);
      selection.collapseToEnd();
    }
    scrollToEnd();
  }

  function setInputActive(active: boolean): void {
    inputActive = active;
    if (active) {
      if (!inputAttached()) outputEl.appendChild(inputEl);
    } else {
      inputEl.textContent = "";
      inputEl.remove();
    }
    outputEl.classList.toggle("is-running", active);
    updateQueueIndicator();
  }

  // Desktop keyboards report Enter here.
  inputEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.isComposing) return;
    e.preventDefault();
    submitInputElement();
  });

  // Phone keyboards often report no usable key; they do report the edit.
  inputEl.addEventListener("beforeinput", (e) => {
    if (e.inputType !== "insertParagraph" && e.inputType !== "insertLineBreak") return;
    e.preventDefault();
    submitInputElement();
  });

  // Paste as plain text. Every complete line is sent; the rest stays editable.
  inputEl.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = e.clipboardData?.getData("text/plain") ?? "";
    const parts = ((inputEl.textContent ?? "") + pasted).split(/\r?\n/);
    const rest = parts.pop() ?? "";
    for (const line of parts) submitTyped(line);
    inputEl.textContent = rest;
    focusInput();
  });

  // Tapping anywhere in the terminal starts typing, unless text is being selected.
  outputEl.addEventListener("click", () => {
    if (!inputActive) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;
    focusInput();
  });

  return {
    write: (text) => appendLine(text),
    writeLine: (t) => appendLine(t + (t.endsWith("\n") ? "" : "\n")),
    writeErr: (text) => appendLine(text, "line-err"),
    writeInfo: (text) => appendLine(text, "line-info"),
    clear,
    readLine() {
      // The program is waiting: bring the cursor to the user.
      if (inputActive && queue.lineCount() === 0) focusInput();
      return queue.readLine();
    },
    tryReadLineSync: () => queue.tryReadLineSync(),
    pushStdin(text) {
      // Echo first: the queue resolves waiting reads inside push(), and the
      // program may keep printing as soon as those promises settle, so the
      // echoed input has to already be on screen.
      for (const ln of text.split(/\r?\n/)) appendLine("» " + ln + "\n", "line-input");
      queue.push(text);
    },
    resetInput: () => queue.reset(),
    cancelPendingReads: (reason) => queue.cancelPendingReads(reason),
    drainBuffer: () => queue.drain(),
    bufferedLineCount: () => queue.lineCount(),
    setInputActive,
    focusInput,
  };
}
