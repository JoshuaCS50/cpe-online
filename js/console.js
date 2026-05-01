// Output console: collects text, exposes a stdin buffer with promise-based reads.

export function createConsole({ outputEl, stdinInputEl, stdinFormEl }) {
  let stdinBuffer = "";
  let stdinWaiters = [];

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
    // append newline so gets() and scanf-like reads terminate lines.
    stdinBuffer += text + "\n";
    appendLine("» " + text + "\n", "line-input");
    drainWaiters();
  }

  function drainWaiters() {
    while (stdinWaiters.length && stdinBuffer.length) {
      const waiter = stdinWaiters.shift();
      waiter.resolve(consumeStdin(waiter.count));
    }
  }

  function consumeStdin(count) {
    if (count == null) {
      // read one line
      const idx = stdinBuffer.indexOf("\n");
      if (idx < 0) {
        const out = stdinBuffer;
        stdinBuffer = "";
        return out;
      }
      const out = stdinBuffer.slice(0, idx);
      stdinBuffer = stdinBuffer.slice(idx + 1);
      return out;
    }
    const out = stdinBuffer.slice(0, count);
    stdinBuffer = stdinBuffer.slice(count);
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
  };
}
