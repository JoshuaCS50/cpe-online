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

  function appendLine(text, cls) {
    const span = document.createElement("span");
    if (cls) span.className = cls;
    span.textContent = text;
    outputEl.appendChild(span);
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function write(text) {
    const span = document.createElement("span");
    span.textContent = text;
    outputEl.appendChild(span);
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
