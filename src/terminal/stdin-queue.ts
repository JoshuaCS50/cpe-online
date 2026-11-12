// Buffered program input with promise-based line reads.
//
// Split out of src/legacy/js/console.js so the buffering rules can be unit
// tested without a DOM and reused by workers. The observable behaviour is the
// legacy one: input is appended one line at a time, reads that arrive before
// input wait, and each push resolves as many waiting reads as it can.

/** Buffered program input with promise-based line reads. No DOM access. */
export interface StdinQueue {
  /** Splits `text` on /\r?\n/, appends each part plus "\n" to the buffer, resolves waiting reads, and returns the parts in order. */
  push(text: string): string[];
  /** Resolves with the next line (no trailing newline). Waits if no complete line is buffered. */
  readLine(): Promise<string>;
  /** Returns the next line, or null if no complete line is buffered. Never waits. */
  tryReadLineSync(): string | null;
  /** Returns the whole buffer as one string and empties it. Pending reads stay pending. */
  drain(): string;
  /** Empties the buffer and rejects every pending read. */
  reset(): void;
  /** Rejects every pending read with `reason`, or with `new Error("cancelled")`. The buffer is kept. */
  cancelPendingReads(reason?: Error): void;
  /** Number of non-empty lines currently buffered. */
  lineCount(): number;
  /** Number of reads currently waiting for input. */
  readonly pendingReads: number;
}

/** One waiting `readLine()` call. */
interface Waiter {
  resolve: (line: string) => void;
  reject: (reason: Error) => void;
}

/** `onChange` is called after every operation that changes the buffer contents. */
export function createStdinQueue(onChange?: () => void): StdinQueue {
  let buffer = "";
  let waiters: Waiter[] = [];

  function notify(): void {
    if (onChange) onChange();
  }

  // Remove one line from the front of the buffer. Does not notify; the caller
  // reports the change once its whole operation is finished.
  function takeLine(): string {
    const idx = buffer.indexOf("\n");
    let out: string;
    if (idx < 0) {
      out = buffer;
      buffer = "";
    } else {
      out = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
    }
    return out;
  }

  function drainWaiters(): void {
    while (waiters.length && buffer.length) {
      const waiter = waiters.shift();
      if (!waiter) break;
      waiter.resolve(takeLine());
    }
  }

  function push(text: string): string[] {
    // Allow multi-line paste / typed multi-line via "\n" inside the value.
    // Each non-empty submission becomes one or more lines in the buffer.
    const lines = text.split(/\r?\n/);
    for (const ln of lines) buffer += ln + "\n";
    drainWaiters();
    notify();
    return lines;
  }

  // Returns a Promise<string> resolving to one line of input (no trailing newline).
  function readLine(): Promise<string> {
    if (buffer.indexOf("\n") >= 0) {
      const line = takeLine();
      notify();
      return Promise.resolve(line);
    }
    return new Promise<string>((resolve, reject) => {
      waiters.push({ resolve, reject });
    });
  }

  // Synchronous attempt — returns null if no line is buffered.
  function tryReadLineSync(): string | null {
    const idx = buffer.indexOf("\n");
    if (idx < 0) return null;
    const line = takeLine();
    notify();
    return line;
  }

  // Read the entire buffered input as a single string, drain it, return it.
  // Used by synchronous runners (JSCPP) to feed scanf via initialStdin.
  function drain(): string {
    const out = buffer;
    buffer = "";
    notify();
    return out;
  }

  function cancelPendingReads(reason?: Error): void {
    const err = reason ?? new Error("cancelled");
    for (const w of waiters) w.reject(err);
    waiters = [];
  }

  function reset(): void {
    buffer = "";
    cancelPendingReads();
    notify();
  }

  function lineCount(): number {
    return buffer.split("\n").filter((s) => s !== "").length;
  }

  return {
    push,
    readLine,
    tryReadLineSync,
    drain,
    reset,
    cancelPendingReads,
    lineCount,
    get pendingReads(): number {
      return waiters.length;
    },
  };
}
