// Main-thread wrapper around the c-worker. Returns once the worker reports
// done or error. Output streams via consoleIO.write as it arrives.

import { explainJSCPPError } from "./c.js";
import { answerInput, canBlockForInput, createInputChannel } from "../../../runners/input-channel";

let cachedWorker = null;
let cachedWorkerBusy = false;

function getWorker() {
  if (cachedWorker && !cachedWorkerBusy) return cachedWorker;
  if (cachedWorker && cachedWorkerBusy) {
    // Old worker still running — terminate so we can start fresh.
    cachedWorker.terminate();
  }
  const jscppUrl = new URL("vendor/JSCPP.es5.min.js", document.baseURI).href;
  cachedWorker = new Worker(new URL("./c-worker.js", import.meta.url), {
    type: "classic",
    name: jscppUrl,
  });
  cachedWorkerBusy = false;
  return cachedWorker;
}

export function terminateStreamingWorker() {
  if (cachedWorker) {
    cachedWorker.terminate();
    cachedWorker = null;
    cachedWorkerBusy = false;
  }
}

// Error explanation is shared with the sync runner via runners/c.js.

export async function runCStreaming({ code, consoleIO, onErrorLine, signal }) {
  const worker = getWorker();
  cachedWorkerBusy = true;

  // Drain any pre-typed input lines as a single string for the worker.
  const stdin = consoleIO.drainBuffer();
  // Shared buffer the worker sleeps on while the user types a line.
  const input = canBlockForInput() ? createInputChannel() : null;

  return new Promise((resolve) => {
    let resolved = false;
    function done(result) {
      if (resolved) return;
      resolved = true;
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      if (signal) signal.removeEventListener("abort", onAbort);
      cachedWorkerBusy = false;
      resolve(result);
    }

    // Stop button: the worker may be deep in a loop or asleep waiting for
    // input, so the only reliable stop is to end it.
    function onAbort() {
      terminateStreamingWorker();
      done({ ok: false, exitCode: -1, stopped: true });
    }

    function onMessage(e) {
      const data = e.data || {};
      if (data.type === "stdout") {
        consoleIO.write(data.text);
      } else if (data.type === "stdin-request") {
        // The program is paused on scanf / cin. Answer when the user has
        // typed a line; a cancelled read ends the input.
        consoleIO.readLine().then(
          (line) => answerInput(input, line + "\n"),
          () => answerInput(input, null)
        );
      } else if (data.type === "done") {
        consoleIO.writeInfo(`\n[program exited with code ${data.exitCode}]\n`);
        done({ ok: data.exitCode === 0, exitCode: data.exitCode });
      } else if (data.type === "error") {
        const { line, friendly } = explainJSCPPError(data.message);
        if (line && typeof onErrorLine === "function") onErrorLine(line);
        const where = line ? "Line " + line + " — " : "";
        consoleIO.writeErr("\n❌ " + where + friendly + "\n");
        done({ ok: false, exitCode: -1 });
      }
    }

    function onError(e) {
      consoleIO.writeErr(
        "\n❌ Streaming runner crashed: " +
          (e.message || String(e)) +
          "\nFalling back to standard mode for the next run.\n"
      );
      // Drop the broken worker so we recreate it next time.
      terminateStreamingWorker();
      done({ ok: false, exitCode: -1 });
    }

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort);
    }
    worker.postMessage({ type: "run", code, stdin, input });
  });
}
