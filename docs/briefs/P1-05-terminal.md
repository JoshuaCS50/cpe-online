# P1-05 Port the output console and stdin queue to TypeScript

## Context
CPE Online is a browser IDE being migrated from plain JavaScript to Vite + strict TypeScript. The legacy app lives in `src/legacy/`. This package ports the output console (`src/legacy/js/console.js`) and splits its input-buffer logic into a separate module that has no DOM dependency, so it can be unit tested and later reused by workers.

## Files
Create:
- `src/terminal/stdin-queue.ts`
- `src/terminal/console.ts`
- `tests/unit/stdin-queue.test.ts`

Edit:
- none

Do not touch any other file. Do not edit or delete `src/legacy/js/console.js`.

## Interface
```ts
// src/terminal/stdin-queue.ts

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

/** `onChange` is called after every operation that changes the buffer contents. */
export function createStdinQueue(onChange?: () => void): StdinQueue;
```

```ts
// src/terminal/console.ts

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

export function createConsole(elements: ConsoleElements): ConsoleIO;
```

## Behaviour
1. Read `src/legacy/js/console.js` first. Every method of `ConsoleIO` must behave exactly like the legacy method with the same name, including CSS class names (`line-err`, `line-info`, `line-input`, `output-fold`, `fold-content`), the folding thresholds (200 visible, keep 100), the echo format `"» " + line + "\n"`, the queue indicator text, and auto-scrolling.
2. `createConsole` must build one `StdinQueue` with `createStdinQueue` and delegate all input-buffer work to it. `console.ts` must not keep its own copy of the buffer. Pass the queue-indicator update function as `onChange`.
3. `StdinQueue` semantics, matching the legacy code:
   - `push("a\nb")` buffers `"a\nb\n"` and returns `["a", "b"]`. `push("")` buffers `"\n"` and returns `[""]`.
   - After a push, waiting reads are resolved in the order they were requested, one line each, while the buffer is not empty.
   - `readLine()` resolves immediately when the buffer contains a newline; otherwise it waits.
   - `lineCount()` is `buffer.split("\n").filter((s) => s !== "").length`.
   - `reset()` empties the buffer, then rejects pending reads with `new Error("cancelled")`.
4. In `pushStdin`, echo each pushed line to the output (class `line-input`) before waiting reads are resolved from the user's point of view; the visible order must stay: echoed input first, then whatever the program prints next.
5. Keep the explanatory comments from the legacy file where they still apply.

## Tests
`tests/unit/stdin-queue.test.ts`, using Vitest (`import { describe, expect, it, vi } from "vitest"`). The test environment is Node, with no DOM, so test only `stdin-queue.ts`.

1. `push` returns the split parts and `drain` returns them joined with trailing newlines.
2. `push` splits on both `\n` and `\r\n`.
3. `readLine` resolves immediately when a line is already buffered, and lines come out in the order pushed.
4. `readLine` called before any input waits, then resolves with the first line after `push`.
5. Two waiting reads are resolved in request order by one `push("a\nb")`.
6. `tryReadLineSync` returns `null` on an empty queue and the line otherwise, consuming it.
7. `drain` empties the buffer and `lineCount` becomes 0.
8. `lineCount` ignores empty lines: after `push("a\n\nb")` it is 2.
9. `cancelPendingReads()` rejects a waiting read with an error whose message is `"cancelled"`, and `pendingReads` becomes 0.
10. `cancelPendingReads(new Error("stopped"))` rejects with that error.
11. `reset` empties the buffer and rejects waiting reads.
12. `onChange` is called on `push`, on a consuming `readLine`, on `tryReadLineSync` that returns a line, on `drain`, and on `reset`. Use `vi.fn()`.
13. A read that was cancelled does not consume input pushed later: after cancel, `push("x")` leaves `lineCount()` at 1.

## Acceptance
All three must pass, run from the repository root. Run each command exactly as written: no pipes, no redirection, no extra flags.
```
npm run typecheck
npx vitest run tests/unit/stdin-queue.test.ts
npm run lint
```

## Constraints
- TypeScript strict mode with `noUncheckedIndexedAccess`. No `any`, no `@ts-ignore`, no `@ts-expect-error`.
- No new dependencies. No network access. No changes to config files.
- Do not commit. Leave the changes in the working tree.

## Output
Only the three files listed above. No summary document.
