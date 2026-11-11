// MATLAB worker. Runs MATLAB code with RunMat, an open-source
// MATLAB-compatible runtime compiled to WebAssembly.
//
// The runtime is large (about 69 MB, 23 MB compressed), so it is fetched on
// the first MATLAB run only. It is stored in parts under /vendor/runmat (see
// scripts/vendor-runmat.mjs); the worker fetches them in order, reports
// progress, and joins them.
//
// Input: RunMat lets the host answer input() with a Promise, so the worker
// simply asks the page and awaits the reply message.
//
// Each run gets a fresh session, so variables never leak between runs.

import type { RunMatExecutionError, RunMatSessionHandle } from "runmat";
import type {
  MatlabErrorReport,
  MatlabRunRequest,
  MatlabWorkerMessage,
  MatlabWorkerRequest,
  RuntimeManifest,
} from "./protocol";

type RunMatModule = typeof import("runmat");

const scope = self as unknown as { name: string; postMessage(message: MatlabWorkerMessage): void };
const post = (message: MatlabWorkerMessage): void => scope.postMessage(message);

/** Folder holding the vendored runtime; the page passes it as the worker's name. */
const baseUrl = scope.name;

interface Runtime {
  module: RunMatModule;
  wasm: Uint8Array;
}

let runtimePromise: Promise<Runtime> | null = null;

async function fetchRuntimeBytes(): Promise<Uint8Array> {
  const manifestResponse = await fetch(`${baseUrl}runtime.json`);
  if (!manifestResponse.ok) throw new Error(`runtime manifest not found (${manifestResponse.status})`);
  const manifest = (await manifestResponse.json()) as RuntimeManifest;

  const bytes = new Uint8Array(manifest.totalBytes);
  let offset = 0;
  post({ type: "loading", loadedBytes: 0, totalBytes: manifest.totalBytes });
  for (const part of manifest.parts) {
    const response = await fetch(`${baseUrl}${part.file}`);
    if (!response.ok) throw new Error(`runtime part ${part.file} not found (${response.status})`);
    const chunk = new Uint8Array(await response.arrayBuffer());
    if (chunk.length !== part.bytes) throw new Error(`runtime part ${part.file} is incomplete`);
    bytes.set(chunk, offset);
    offset += chunk.length;
    post({ type: "loading", loadedBytes: offset, totalBytes: manifest.totalBytes });
  }
  return bytes;
}

function loadRuntime(): Promise<Runtime> {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const [module, wasm] = await Promise.all([
        import(/* @vite-ignore */ `${baseUrl}index.js`) as Promise<RunMatModule>,
        fetchRuntimeBytes(),
      ]);
      post({ type: "ready" });
      return { module, wasm };
    })();
    // A failed download must not poison later attempts.
    runtimePromise.catch(() => {
      runtimePromise = null;
    });
  }
  return runtimePromise;
}

/** Resolves the read that is waiting for a typed line. */
let answerInput: ((line: string | null) => void) | null = null;

function waitForLine(): Promise<string | null> {
  return new Promise((resolve) => {
    answerInput = resolve;
    post({ type: "stdin-request" });
  });
}

/** The fields shared by a thrown RunMatExecutionError and a result's `error`. */
type RuntimeError = Pick<RunMatExecutionError, "diagnostic" | "message" | "identifier" | "span">;

function describeError(error: unknown): MatlabErrorReport {
  const details = error as Partial<RuntimeError> | null;
  if (details && typeof details === "object" && typeof details.diagnostic === "string") {
    return {
      diagnostic: details.diagnostic,
      message: details.message ?? details.diagnostic,
      identifier: details.identifier,
      line: details.span?.line ?? null,
      column: details.span?.column ?? null,
    };
  }
  const text = error instanceof Error ? error.message : String(error);
  return { diagnostic: text, message: text, line: null, column: null };
}

async function run(request: MatlabRunRequest): Promise<void> {
  let runtime: Runtime;
  try {
    runtime = await loadRuntime();
  } catch (error) {
    post({ type: "load-failed", message: error instanceof Error ? error.message : String(error) });
    return;
  }

  const { module, wasm } = runtime;
  let session: RunMatSessionHandle | null = null;
  let subscription: number | null = null;
  try {
    session = await module.initRunMat({
      wasmModule: wasm,
      language: { compat: "matlab" },
      // Nothing about the user's code or device leaves the browser.
      telemetryConsent: false,
      enableGpu: false,
      fsProvider: module.createInMemoryFsProvider(),
    });
    subscription = await module.subscribeStdout((entry) => {
      if (entry.stream === "stdout" || entry.stream === "stderr") post({ type: entry.stream, text: entry.text });
    });
    await session.setInputHandler(async (inputRequest) => {
      // RunMat does not print the prompt itself.
      if (inputRequest.prompt) post({ type: "stdout", text: inputRequest.prompt });
      return (await waitForLine()) ?? "";
    });

    const result = await session.executeRequest({ source: { kind: "text", name: request.fileName, text: request.code } });
    if (result.error) {
      post({ type: "error", error: describeError(result.error) });
    } else {
      post({ type: "done" });
    }
  } catch (error) {
    post({ type: "error", error: describeError(error) });
  } finally {
    if (subscription !== null) void module.unsubscribeStdout(subscription).catch(() => {});
    session?.dispose();
  }
}

self.addEventListener("message", (event: MessageEvent<MatlabWorkerRequest>) => {
  const message = event.data;
  if (message.type === "run") {
    void run(message);
  } else if (message.type === "stdin-reply") {
    const answer = answerInput;
    answerInput = null;
    answer?.(message.line);
  }
});
