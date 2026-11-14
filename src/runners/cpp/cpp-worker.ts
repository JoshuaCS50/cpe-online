// C++ worker. Compiles the program with clang (built for WebAssembly) and
// runs the result, all off the main thread.
//
// The compiler is large (about 105 MB, 20 MB compressed), so it is fetched on
// the first C++ run only and then kept for later runs. It is stored under
// /vendor/clang (see scripts/vendor-clang.mjs); files too big for the host are
// in parts, which this worker joins when the compiler asks for them.
//
// Input: as in the C worker, input queued before the run is used first; after
// that the worker sleeps on a shared buffer until the user types a line.
// Stop ends the worker, which is the only way to end a program in a loop.

import { waitForInput } from "../input-channel";
import { compileCpp } from "./compile";
import type { RunClang } from "./compile";
import type { ClangManifest, CppRunRequest, CppWorkerMessage } from "./protocol";
import { runWasiProgram } from "./wasi";

const scope = self as unknown as { name: string; postMessage(message: CppWorkerMessage): void };
const post = (message: CppWorkerMessage): void => scope.postMessage(message);

/** Folder holding the vendored compiler; the page passes it as the worker's name. */
const baseUrl = scope.name;

let clangPromise: Promise<RunClang> | null = null;

/** The most recently compiled program, reused when the same code runs again. */
let lastProgram: { source: string; module: WebAssembly.Module; warnings: string } | null = null;

/** Fetches a split file's parts in order, reporting progress, and joins them. */
async function fetchJoined(url: (file: string) => string, entry: ClangManifest["split"][string], progress: (bytes: number) => void): Promise<Uint8Array> {
  const joined = new Uint8Array(entry.bytes);
  let offset = 0;
  for (const part of entry.parts) {
    const response = await fetch(url(part.file));
    if (!response.ok) throw new Error(`${part.file}: ${response.status}`);
    const chunk = new Uint8Array(await response.arrayBuffer());
    joined.set(chunk, offset);
    offset += chunk.length;
    progress(chunk.length);
  }
  return joined;
}

function loadClang(): Promise<RunClang> {
  clangPromise ??= (async () => {
    const response = await fetch(`${baseUrl}clang.json`);
    if (!response.ok) throw new Error(`compiler manifest not found (${response.status})`);
    const manifest = (await response.json()) as ClangManifest;
    const dirUrl = new URL(manifest.dir, new URL(baseUrl, self.location.href)).href;

    // The big files come first, in parts, so progress can be shown and the
    // compile that follows does not stall on a download.
    const total = Object.values(manifest.split).reduce((sum, entry) => sum + entry.bytes, 0);
    let loaded = 0;
    let lastReport = -1;
    const progress = (bytes: number): void => {
      loaded += bytes;
      const step = Math.floor((loaded / total) * 10);
      if (step !== lastReport) {
        lastReport = step;
        post({ type: "loading", loaded, total });
      }
    };
    const joined = new Map<string, Uint8Array>();
    for (const [name, entry] of Object.entries(manifest.split)) {
      joined.set(name, await fetchJoined((file) => dirUrl + file, entry, progress));
    }

    // The compiler fetches its files next to its own script. Answer the
    // requests for split files with the joined parts.
    const responseNames = new WeakMap<Response, string>();
    const realFetch = self.fetch.bind(self);
    self.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const name = url.slice(url.lastIndexOf("/") + 1);
      const bytes = url.startsWith(dirUrl) ? joined.get(name) : undefined;
      if (!bytes) return realFetch(input, init);
      const response = new Response(bytes as BlobPart, {
        headers: { "Content-Type": name.endsWith(".wasm") ? "application/wasm" : "application/octet-stream" },
      });
      responseNames.set(response, name);
      return Promise.resolve(response);
    };

    // The compiler compiles its 75 MB module again on every run. A response
    // built here has no URL, so the browser cannot reuse its compiled code:
    // keep the compiled module and hand it back instead.
    const compiledModules = new Map<string, Promise<WebAssembly.Module>>();
    const realCompileStreaming = WebAssembly.compileStreaming.bind(WebAssembly);
    WebAssembly.compileStreaming = async (source: Response | PromiseLike<Response>): Promise<WebAssembly.Module> => {
      const response = await source;
      const name = responseNames.get(response);
      if (!name) return realCompileStreaming(response);
      let compiled = compiledModules.get(name);
      if (!compiled) {
        compiled = realCompileStreaming(response);
        compiledModules.set(name, compiled);
      }
      return compiled;
    };

    const module = (await import(/* @vite-ignore */ `${dirUrl}bundle.js`)) as { runClang: RunClang };
    return module.runClang;
  })();
  // A failed download must not stick: the next run tries again.
  clangPromise.catch(() => {
    clangPromise = null;
  });
  return clangPromise;
}

async function run(request: CppRunRequest): Promise<void> {
  let runClang: RunClang;
  try {
    runClang = await loadClang();
  } catch (error) {
    post({ type: "load-failed", message: error instanceof Error ? error.message : String(error) });
    return;
  }

  // The checker runs the same code once per test input: compile it once.
  let program = lastProgram?.source === request.code ? lastProgram : null;
  if (!program) {
    post({ type: "compiling" });
    const compiled = await compileCpp(runClang, request.code);
    if (!compiled.wasm) {
      post({ type: "error", stage: "compile", message: compiled.messages || "The compiler stopped without a message." });
      return;
    }
    program = { source: request.code, module: await WebAssembly.compile(compiled.wasm as BufferSource), warnings: compiled.messages };
    lastProgram = program;
  }
  if (program.warnings) post({ type: "warnings", text: program.warnings });

  let queued = request.stdin;
  try {
    const module = program.module;
    const result = runWasiProgram(module, {
      write: (_fd, text) => post({ type: "stdout", text }),
      readMore: () => {
        if (queued) {
          const text = queued;
          queued = "";
          return text;
        }
        return request.input ? waitForInput(request.input, () => post({ type: "stdin-request" })) : null;
      },
    });
    post({ type: "done", exitCode: result.exitCode });
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    post({ type: "error", stage: "runtime", message });
  }
}

self.addEventListener("message", (event: MessageEvent<CppRunRequest>) => {
  if (event.data?.type === "run") void run(event.data);
});
