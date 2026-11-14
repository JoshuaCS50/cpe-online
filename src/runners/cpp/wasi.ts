// The small part of WASI (preview 1) that a compiled C++ program needs:
// writing to the screen, reading typed input, and exiting. Programs compiled
// by clang for wasm32-wasip1 import these functions by name.
//
// The same code runs the program in the browser worker and in the tests, so
// both see exactly the same behaviour.

const ERRNO_SUCCESS = 0;
const ERRNO_BADF = 8;
const ERRNO_SPIPE = 70;

/** Thrown by proc_exit to stop the program; carries the exit code. */
export class WasiExit extends Error {
  constructor(readonly code: number) {
    super(`exit ${code}`);
    this.name = "WasiExit";
  }
}

export interface WasiHost {
  /** Text the program wrote to stdout (fd 1) or stderr (fd 2). */
  write(fd: 1 | 2, text: string): void;
  /** More input for stdin, or null at the end of input. Called when the program has read everything given so far. */
  readMore(): string | null;
}

export interface WasiRun {
  exitCode: number;
}

/** Runs a compiled wasm32-wasip1 program to the end. A crash (a WebAssembly trap) is thrown. */
/** `extraImports` supplies other import modules the program uses, by module name. */
export function runWasiProgram(
  module: WebAssembly.Module,
  host: WasiHost,
  extraImports: Record<string, Record<string, (...args: never[]) => unknown>> = {},
  /** Called with the program's memory just before it starts, for imports that read or write it. */
  onStart?: (memory: WebAssembly.Memory, instance: WebAssembly.Instance) => void,
): WasiRun {
  let memory: WebAssembly.Memory | null = null;
  const view = (): DataView => new DataView(memory!.buffer);
  const bytes = (): Uint8Array => new Uint8Array(memory!.buffer);
  const encoder = new TextEncoder();
  // One decoder per stream, so a character split across two writes is kept whole.
  const decoders = { 1: new TextDecoder(), 2: new TextDecoder() };
  let pending = new Uint8Array(0);
  let inputEnded = false;

  const imports: Record<string, (...args: never[]) => number> = {
    environ_sizes_get(countPtr: number, sizePtr: number) {
      view().setUint32(countPtr, 0, true);
      view().setUint32(sizePtr, 0, true);
      return ERRNO_SUCCESS;
    },
    environ_get() {
      return ERRNO_SUCCESS;
    },
    args_sizes_get(countPtr: number, sizePtr: number) {
      view().setUint32(countPtr, 0, true);
      view().setUint32(sizePtr, 0, true);
      return ERRNO_SUCCESS;
    },
    args_get() {
      return ERRNO_SUCCESS;
    },
    // No folders are opened, so the program sees no files.
    fd_prestat_get() {
      return ERRNO_BADF;
    },
    fd_prestat_dir_name() {
      return ERRNO_BADF;
    },
    fd_fdstat_get(fd: number, ptr: number) {
      if (fd > 2) return ERRNO_BADF;
      const v = view();
      v.setUint8(ptr, 2); // a character device, like a terminal
      v.setUint16(ptr + 2, 0, true);
      v.setBigUint64(ptr + 8, 0xffffffffffffffffn, true);
      v.setBigUint64(ptr + 16, 0xffffffffffffffffn, true);
      return ERRNO_SUCCESS;
    },
    fd_write(fd: number, iovs: number, iovsLength: number, writtenPtr: number) {
      if (fd !== 1 && fd !== 2) return ERRNO_BADF;
      const v = view();
      let written = 0;
      let text = "";
      for (let i = 0; i < iovsLength; i++) {
        const ptr = v.getUint32(iovs + i * 8, true);
        const length = v.getUint32(iovs + i * 8 + 4, true);
        text += decoders[fd].decode(bytes().subarray(ptr, ptr + length), { stream: true });
        written += length;
      }
      if (text) host.write(fd, text);
      v.setUint32(writtenPtr, written, true);
      return ERRNO_SUCCESS;
    },
    fd_read(fd: number, iovs: number, iovsLength: number, readPtr: number) {
      if (fd !== 0) return ERRNO_BADF;
      if (pending.length === 0 && !inputEnded) {
        const more = host.readMore();
        if (more === null) inputEnded = true;
        else pending = encoder.encode(more);
      }
      const v = view();
      let read = 0;
      for (let i = 0; i < iovsLength && pending.length > 0; i++) {
        const ptr = v.getUint32(iovs + i * 8, true);
        const length = v.getUint32(iovs + i * 8 + 4, true);
        const chunk = pending.subarray(0, length);
        bytes().set(chunk, ptr);
        pending = pending.subarray(chunk.length);
        read += chunk.length;
      }
      v.setUint32(readPtr, read, true);
      return ERRNO_SUCCESS;
    },
    fd_seek() {
      return ERRNO_SPIPE;
    },
    fd_close() {
      return ERRNO_SUCCESS;
    },
    clock_time_get(_id: number, _precision: bigint, timePtr: number) {
      view().setBigUint64(timePtr, BigInt(Math.round(performance.now() * 1e6)), true);
      return ERRNO_SUCCESS;
    },
    random_get(ptr: number, length: number) {
      const random = new Uint8Array(length);
      crypto.getRandomValues(random);
      bytes().set(random, ptr);
      return ERRNO_SUCCESS;
    },
    sched_yield() {
      return ERRNO_SUCCESS;
    },
    proc_exit(code: number) {
      throw new WasiExit(code);
    },
  };

  // Anything else the program imports reports "not supported" instead of failing to start.
  const wasi: Record<string, unknown> = {};
  for (const entry of WebAssembly.Module.imports(module)) {
    if (entry.module !== "wasi_snapshot_preview1" || entry.kind !== "function") continue;
    wasi[entry.name] = imports[entry.name] ?? (() => 52); // ENOSYS
  }

  const instance = new WebAssembly.Instance(module, {
    ...(extraImports as Record<string, WebAssembly.ModuleImports>),
    wasi_snapshot_preview1: wasi as WebAssembly.ModuleImports,
  });
  memory = instance.exports.memory as WebAssembly.Memory;
  onStart?.(memory, instance);
  try {
    (instance.exports._start as () => void)();
  } catch (error) {
    if (error instanceof WasiExit) return { exitCode: error.code };
    throw error;
  }
  return { exitCode: 0 };
}
