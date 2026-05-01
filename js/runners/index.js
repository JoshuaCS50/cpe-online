import { runC, runCpp } from "./c.js";
import { runCStreaming } from "./c-streaming.js";
import { runPython } from "./python.js";
import { runJava } from "./java.js";

export async function run({ language, code, consoleIO, signal, onErrorLine, streaming }) {
  switch (language) {
    case "c":
    case "cpp":
      // Streaming mode: Web Worker, output appears progressively, no
      // interactive scanf prompts (input must be pre-queued).
      // Sync mode: main-thread JSCPP, prompt() per scanf for missing input.
      if (streaming) {
        return runCStreaming({ code, consoleIO, onErrorLine });
      }
      return language === "cpp"
        ? runCpp({ code, consoleIO, signal, onErrorLine })
        : runC({ code, consoleIO, signal, onErrorLine });
    case "python":
      return runPython({ code, consoleIO, signal, onErrorLine });
    case "java":
      return runJava({ code, consoleIO, signal });
    default:
      consoleIO.writeErr("Unknown language: " + language + "\n");
      return { ok: false, exitCode: -1 };
  }
}

// Async runners we can actually interrupt via the Stop button.
export const ASYNC_LANGUAGES = new Set(["python"]);

// Languages where streaming mode is supported.
export const STREAMABLE_LANGUAGES = new Set(["c", "cpp"]);
