// Output console: collects text, exposes a stdin buffer with promise-based reads.
//
// Ported from src/legacy/js/console.js. The input buffer itself lives in
// stdin-queue.ts; this module only owns the DOM — appending output spans,
// folding old output, the queue indicator, and the stdin form.

import { createStdinQueue } from "./stdin-queue";

export interface ConsoleElements {
  outputEl: HTMLElement;
  stdinInputEl: HTMLInputElement;
  stdinFormEl: HTMLFormElement;
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
  pushStdin(text: string): void;
  resetInput(): void;
  cancelPendingReads(reason?: Error): void;
  drainBuffer(): string;
  bufferedLineCount(): number;
}

// Auto-fold older lines once the output grows past MAX_VISIBLE child nodes
// so phones don't have to scroll through 500 spans. The most recent
// KEEP_RECENT spans stay visible; everything older collapses into a
// <details> block the user can re-expand.
const MAX_VISIBLE = 200;
const KEEP_RECENT = 100;

export function createConsole(elements: ConsoleElements): ConsoleIO {
  const { outputEl, stdinInputEl, stdinFormEl, queueEl } = elements;

  const queue = createStdinQueue(updateQueueIndicator);

  // Update the on-screen queue indicator (e.g. "📥 2 lines ready").
  function updateQueueIndicator(): void {
    if (!queueEl) return;
    const lines = queue.lineCount();
    if (lines === 0) {
      queueEl.hidden = true;
      queueEl.textContent = "";
    } else {
      queueEl.hidden = false;
      queueEl.textContent = `📥 ${lines} input line${lines === 1 ? "" : "s"} ready — press ▶ Run`;
    }
  }

  function maybeFoldOldOutput(): void {
    const childCount = outputEl.childNodes.length;
    if (childCount <= MAX_VISIBLE) return;

    // If there's already an active fold at the top, push more into it.
    const existing = outputEl.firstElementChild;
    let fold: Element;
    if (
      existing &&
      existing.tagName === "DETAILS" &&
      existing.classList.contains("output-fold")
    ) {
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
    while (
      outputEl.childNodes.length > KEEP_RECENT + 1 &&
      outputEl.lastChild !== fold
    ) {
      const second = fold.nextSibling;
      if (!second) break;
      foldContent.appendChild(second);
    }
    const hidden = foldContent.childNodes.length;
    summary.textContent = `Show earlier output (${hidden} line${hidden === 1 ? "" : "s"})`;
  }

  function appendLine(text: string, cls?: string): void {
    const span = document.createElement("span");
    if (cls) span.className = cls;
    span.textContent = text;
    outputEl.appendChild(span);
    maybeFoldOldOutput();
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function write(text: string): void {
    const span = document.createElement("span");
    span.textContent = text;
    outputEl.appendChild(span);
    maybeFoldOldOutput();
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function writeErr(text: string): void {
    appendLine(text, "line-err");
  }

  function writeInfo(text: string): void {
    appendLine(text, "line-info");
  }

  function clear(): void {
    outputEl.textContent = "";
  }

  function pushStdin(text: string): void {
    // Allow multi-line paste / typed multi-line via "\n" inside the value.
    // Each non-empty submission becomes one or more lines in the buffer.
    //
    // Echo first: the queue resolves waiting reads inside push(), and the
    // program may keep printing as soon as those promises settle, so the
    // echoed input has to already be on screen.
    for (const ln of text.split(/\r?\n/)) {
      appendLine("» " + ln + "\n", "line-input");
    }
    queue.push(text);
  }

  stdinFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = stdinInputEl.value;
    stdinInputEl.value = "";
    pushStdin(val);
    stdinInputEl.focus();
  });

  return {
    write,
    writeLine: (t) => appendLine(t + (t.endsWith("\n") ? "" : "\n")),
    writeErr,
    writeInfo,
    clear,
    readLine: () => queue.readLine(),
    tryReadLineSync: () => queue.tryReadLineSync(),
    pushStdin,
    resetInput: () => queue.reset(),
    cancelPendingReads: (reason) => queue.cancelPendingReads(reason),
    drainBuffer: () => queue.drain(),
    bufferedLineCount: () => queue.lineCount(),
  };
}
