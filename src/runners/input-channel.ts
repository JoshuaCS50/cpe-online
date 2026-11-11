// Lets a worker stop and wait for a line of input from the page.
//
// The worker posts a request, then sleeps on a shared buffer with
// Atomics.wait. The page writes the line into the buffer and wakes it. This
// is what makes scanf / cin behave like a real terminal: the program pauses
// exactly where it asks, for as long as the user needs.
//
// Shared memory needs cross-origin isolation (the COOP/COEP headers in
// public/_headers). Without it `canBlockForInput()` is false and callers fall
// back to a runner that does not need to block.
//
// Buffer layout (also hard-coded in the classic worker, which cannot import):
//   Int32[0]  state: 0 = waiting, 1 = line ready, 2 = end of input
//   Int32[1]  byte length of the line
//   bytes 8.. UTF-8 text

export const INPUT_STATE_WAITING = 0;
export const INPUT_STATE_READY = 1;
export const INPUT_STATE_END = 2;

const HEADER_BYTES = 8;
const CAPACITY_BYTES = 64 * 1024;

export function canBlockForInput(): boolean {
  return typeof SharedArrayBuffer !== "undefined" && globalThis.crossOriginIsolated === true;
}

export function createInputChannel(): SharedArrayBuffer {
  return new SharedArrayBuffer(HEADER_BYTES + CAPACITY_BYTES);
}

/**
 * Worker side: asks the page for a line and sleeps until it answers.
 * Returns the line, or null for end of input. `request` must post the
 * "stdin-request" message to the page.
 */
export function waitForInput(channel: SharedArrayBuffer, request: () => void): string | null {
  const header = new Int32Array(channel, 0, 2);
  Atomics.store(header, 0, INPUT_STATE_WAITING);
  request();
  Atomics.wait(header, 0, INPUT_STATE_WAITING);
  if (Atomics.load(header, 0) !== INPUT_STATE_READY) return null;
  // Copy out of shared memory: TextDecoder cannot read it directly.
  const bytes = new Uint8Array(channel, HEADER_BYTES, Atomics.load(header, 1)).slice();
  return new TextDecoder().decode(bytes);
}

/** Hands `text` to the waiting worker, or signals end of input with `null`. */
export function answerInput(channel: SharedArrayBuffer, text: string | null): void {
  const header = new Int32Array(channel, 0, 2);
  if (text === null) {
    Atomics.store(header, 1, 0);
    Atomics.store(header, 0, INPUT_STATE_END);
  } else {
    // Encode into ordinary memory first: TextEncoder cannot write to shared memory.
    const bytes = new TextEncoder().encode(text).subarray(0, CAPACITY_BYTES);
    new Uint8Array(channel, HEADER_BYTES, bytes.length).set(bytes);
    Atomics.store(header, 1, bytes.length);
    Atomics.store(header, 0, INPUT_STATE_READY);
  }
  Atomics.notify(header, 0);
}
