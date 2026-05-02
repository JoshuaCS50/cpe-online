// Output console: collects text, exposes a stdin buffer with promise-based reads.

export function createConsole({ outputEl, stdinInputEl, stdinFormEl, queueEl }) {
  let stdinBuffer = "";
  let stdinWaiters = [];

  // Update the on-screen queue indicator (e.g. "📥 2 lines ready").
  function updateQueueIndicator() {
    if (!queueEl) return;
    const lines = stdinBuffer.split("\n").filter((s) => s !== "").length;
    if (lines === 0) {
      queueEl.hidden = true;
      queueEl.textContent = "";
    } else {
      queueEl.hidden = false;
      queueEl.textContent = `📥 ${lines} input line${lines === 1 ? "" : "s"} ready — press ▶ Run`;
    }
  }

  // Auto-fold older lines once the output grows past MAX_VISIBLE child nodes
  // so phones don't have to scroll through 500 spans. The most recent
  // KEEP_RECENT spans stay visible; everything older collapses into a
  // <details> block the user can re-expand.
  const MAX_VISIBLE = 200;
  const KEEP_RECENT = 100;

  function maybeFoldOldOutput() {
    const childCount = outputEl.childNodes.length;
    if (childCount <= MAX_VISIBLE) return;

    // If there's already an active fold at the top, push more into it.
    let fold = outputEl.firstElementChild;
    if (!(fold && fold.tagName === "DETAILS" && fold.classList.contains("output-fold"))) {
      fold = document.createElement("details");
      fold.className = "output-fold";
      const summary = document.createElement("summary");
      summary.textContent = "Show earlier output";
      fold.appendChild(summary);
      const content = document.createElement("span");
      content.className = "fold-content";
      fold.appendChild(content);
      outputEl.insertBefore(fold, outputEl.firstChild);
    }
    const summary = fold.querySelector("summary");
    const foldContent = fold.querySelector(".fold-content");

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

  function appendLine(text, cls) {
    const span = document.createElement("span");
    if (cls) span.className = cls;
    span.textContent = text;
    outputEl.appendChild(span);
    maybeFoldOldOutput();
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function write(text) {
    const span = document.createElement("span");
    span.textContent = text;
    outputEl.appendChild(span);
    maybeFoldOldOutput();
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function writeErr(text) {
    appendLine(text, "line-err");
  }

  function writeInfo(text) {
    appendLine(text, "line-info");
  }

  function clear() {
    outputEl.textContent = "";
  }

  function pushStdin(text) {
    // Allow multi-line paste / typed multi-line via "\n" inside the value.
    // Each non-empty submission becomes one or more lines in the buffer.
    const lines = String(text).split(/\r?\n/);
    for (const ln of lines) {
      stdinBuffer += ln + "\n";
      appendLine("» " + ln + "\n", "line-input");
    }
    drainWaiters();
    updateQueueIndicator();
  }

  function drainWaiters() {
    while (stdinWaiters.length && stdinBuffer.length) {
      const waiter = stdinWaiters.shift();
      waiter.resolve(consumeStdin(waiter.count));
    }
  }

  function consumeStdin(count) {
    let out;
    if (count == null) {
      // read one line
      const idx = stdinBuffer.indexOf("\n");
      if (idx < 0) {
        out = stdinBuffer;
        stdinBuffer = "";
      } else {
        out = stdinBuffer.slice(0, idx);
        stdinBuffer = stdinBuffer.slice(idx + 1);
      }
    } else {
      out = stdinBuffer.slice(0, count);
      stdinBuffer = stdinBuffer.slice(count);
    }
    updateQueueIndicator();
    return out;
  }

  // Returns a Promise<string> resolving to one line of input (no trailing newline).
  function readLine() {
    if (stdinBuffer.indexOf("\n") >= 0) {
      return Promise.resolve(consumeStdin());
    }
    return new Promise((resolve, reject) => {
      stdinWaiters.push({ resolve, reject, count: null });
    });
  }

  // Synchronous attempt — returns null if no line is buffered.
  function tryReadLineSync() {
    const idx = stdinBuffer.indexOf("\n");
    if (idx < 0) return null;
    return consumeStdin();
  }

  function cancelPendingReads(reason) {
    stdinWaiters.forEach((w) => w.reject(reason || new Error("cancelled")));
    stdinWaiters = [];
  }

  function resetInput() {
    stdinBuffer = "";
    cancelPendingReads();
    updateQueueIndicator();
  }

  // Read the entire buffered input as a single string, drain it, return it.
  // Used by synchronous runners (JSCPP) to feed scanf via initialStdin.
  function drainBuffer() {
    const out = stdinBuffer;
    stdinBuffer = "";
    updateQueueIndicator();
    return out;
  }

  function bufferedLineCount() {
    return stdinBuffer.split("\n").filter((s) => s !== "").length;
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
    readLine,
    tryReadLineSync,
    pushStdin,
    resetInput,
    cancelPendingReads,
    drainBuffer,
    bufferedLineCount,
  };
}
