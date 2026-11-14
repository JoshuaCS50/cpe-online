// Live (interactive) runs: the sketch runs in real time in the worker, and
// the page changes its inputs while it runs (a held button, a turned knob, a
// touched pad) through shared memory. The worker never waits for messages:
// it reads the inputs whenever the sketch reads a pin.
//
// Buffer layout (Int32):
//   [0]       stop flag: 0 running, 1 stop now
//   [1 + pin] the value the page puts on that pin, or NO_INPUT

export const NO_INPUT = -1;
const PIN_SLOTS = 64;

export function canRunLive(): boolean {
  return typeof SharedArrayBuffer !== "undefined" && globalThis.crossOriginIsolated === true;
}

export function createLiveChannel(): SharedArrayBuffer {
  const channel = new SharedArrayBuffer((1 + PIN_SLOTS) * 4);
  new Int32Array(channel).fill(NO_INPUT, 1);
  return channel;
}

/** Page side: puts a value on a pin (null takes the page's hand off it). */
export function setLiveInput(channel: SharedArrayBuffer, pin: number, value: number | null): void {
  if (pin < 0 || pin >= PIN_SLOTS) return;
  Atomics.store(new Int32Array(channel), 1 + pin, value ?? NO_INPUT);
}

/** Page side: asks the sketch to stop, and wakes it if it is waiting in delay(). */
export function stopLive(channel: SharedArrayBuffer): void {
  const view = new Int32Array(channel);
  Atomics.store(view, 0, 1);
  Atomics.notify(view, 0);
}

/** Worker side: what the page puts on a pin, or undefined. */
export function liveInput(view: Int32Array, pin: number): number | undefined {
  if (pin < 0 || pin >= PIN_SLOTS) return undefined;
  const value = Atomics.load(view, 1 + pin);
  return value === NO_INPUT ? undefined : value;
}

export function liveStopped(view: Int32Array): boolean {
  return Atomics.load(view, 0) !== 0;
}

/** Worker side: sleeps for `ms`, waking early if the page asks to stop. */
export function liveSleep(view: Int32Array, ms: number): void {
  if (ms <= 0) return;
  Atomics.wait(view, 0, 0, ms);
}
