import { runC, runCpp } from "./c.js";
import { runPython } from "./python.js";
import { runJava } from "./java.js";

export async function run({ language, code, consoleIO, signal }) {
  switch (language) {
    case "c":
      return runC({ code, consoleIO, signal });
    case "cpp":
      return runCpp({ code, consoleIO, signal });
    case "python":
      return runPython({ code, consoleIO, signal });
    case "java":
      return runJava({ code, consoleIO, signal });
    default:
      consoleIO.writeErr("Unknown language: " + language + "\n");
      return { ok: false, exitCode: -1 };
  }
}
