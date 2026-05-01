import { runC, runCpp } from "./c.js";
import { runPython } from "./python.js";
import { runJava } from "./java.js";

export async function run({ language, code, consoleIO, signal, onErrorLine }) {
  switch (language) {
    case "c":
      return runC({ code, consoleIO, signal, onErrorLine });
    case "cpp":
      return runCpp({ code, consoleIO, signal, onErrorLine });
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
