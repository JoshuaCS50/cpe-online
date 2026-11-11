import { runC, runCpp } from "./c.js";
import { runPython } from "./python.js";
import { runJava } from "./java.js";
import { canBlockForInput } from "../../../runners/input-channel";
import { runCInWorker } from "../../../runners/c/c-runner";
import { runPythonInWorker } from "../../../runners/python/python-runner";

export async function run({ language, code, consoleIO, signal, onErrorLine }) {
  switch (language) {
    case "c":
    case "cpp":
      // Normal path: run in a Web Worker. Output appears as it is printed,
      // scanf / cin pause for the user to type in the terminal, and Stop can
      // end the program. This needs shared memory (cross-origin isolation).
      // Without it, fall back to the main-thread runner: input must then be
      // queued before the run.
      if (canBlockForInput()) {
        return runCInWorker({ code, consoleIO, onErrorLine, signal });
      }
      return language === "cpp"
        ? runCpp({ code, consoleIO, signal, onErrorLine })
        : runC({ code, consoleIO, signal, onErrorLine });
    case "python":
      // Same idea as C: in a worker, input() pauses for the terminal and
      // Stop can interrupt. The main-thread runner is the fallback.
      if (canBlockForInput()) {
        return runPythonInWorker({ code, consoleIO, signal, onErrorLine });
      }
      return runPython({ code, consoleIO, signal, onErrorLine });
    case "java":
      return runJava({ code, consoleIO, signal });
    default:
      consoleIO.writeErr("Unknown language: " + language + "\n");
      return { ok: false, exitCode: -1 };
  }
}

// Languages the Stop button can end.
export const STOPPABLE_LANGUAGES = new Set(
  canBlockForInput() ? ["python", "c", "cpp"] : ["python"]
);
