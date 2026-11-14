// Compiles and runs C++ through the real clang (WebAssembly build) in Node,
// with the same options and WASI layer as the browser worker, so tests see
// what a student sees.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { CPP_FLAGS, compileCpp } from "../../src/runners/cpp/compile";
import type { CompileResult, RunClang } from "../../src/runners/cpp/compile";
import { runWasiProgram } from "../../src/runners/cpp/wasi";

let clangPromise: Promise<RunClang> | null = null;

function loadClang(): Promise<RunClang> {
  clangPromise ??= import("@yowasp/clang").then((module) => (module as unknown as { runClang: RunClang }).runClang);
  return clangPromise;
}

// Compiling takes seconds, so results are kept in node_modules/.cache, keyed
// by the compiler version, the flags and the source. Only changed programs
// are compiled again.
const CACHE_DIR = join("node_modules", ".cache", "cpe-clang");
// The package does not export its package.json; it sits one folder above the entry file.
const clangEntry = createRequire(import.meta.url).resolve("@yowasp/clang");
const clangVersion = (JSON.parse(readFileSync(join(dirname(clangEntry), "..", "package.json"), "utf8")) as { version: string }).version;

async function compileCached(code: string): Promise<CompileResult> {
  const key = createHash("sha256").update(`${clangVersion}\n${CPP_FLAGS.join(" ")}\n${code}`).digest("hex");
  const wasmFile = join(CACHE_DIR, `${key}.wasm`);
  const messagesFile = join(CACHE_DIR, `${key}.txt`);
  if (existsSync(messagesFile)) {
    return { wasm: existsSync(wasmFile) ? new Uint8Array(readFileSync(wasmFile)) : null, messages: readFileSync(messagesFile, "utf8") };
  }
  const result = await compileCpp(await loadClang(), code);
  mkdirSync(CACHE_DIR, { recursive: true });
  if (result.wasm) writeFileSync(wasmFile, result.wasm);
  writeFileSync(messagesFile, result.messages);
  return result;
}

export interface CppRun {
  stdout: string;
  /** The text the browser runner would report as the error (compiler messages or the crash), or null. */
  error: string | null;
  exitCode: number | null;
}

/** Compiles `code` and runs it with `stdin` lines (a newline is added to each). */
export async function runCpp(code: string, stdin: readonly string[] = []): Promise<CppRun> {
  const compiled = await compileCached(code);
  if (!compiled.wasm) return { stdout: "", error: compiled.messages || "The compiler stopped without a message.", exitCode: null };
  let stdout = "";
  const remaining = [...stdin];
  try {
    const module = await WebAssembly.compile(compiled.wasm as BufferSource);
    const result = runWasiProgram(module, {
      write: (_fd, text) => void (stdout += text),
      readMore: () => {
        const line = remaining.shift();
        return line === undefined ? null : line + "\n";
      },
    });
    return { stdout, error: null, exitCode: result.exitCode };
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return { stdout, error: message, exitCode: null };
  }
}
