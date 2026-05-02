// Main-thread wrapper around the c-worker. Returns once the worker reports
// done or error. Output streams via consoleIO.write as it arrives.

import { explainJSCPPError } from "./c.js";

let cachedWorker = null;
let cachedWorkerBusy = false;

function getWorker() {
  if (cachedWorker && !cachedWorkerBusy) return cachedWorker;
  if (cachedWorker && cachedWorkerBusy) {
    // Old worker still running — terminate so we can start fresh.
    cachedWorker.terminate();
  }
  cachedWorker = new Worker(new URL("./c-worker.js", import.meta.url), { type: "classic" });
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

export async function runCStreaming({ code, consoleIO, onErrorLine }) {
  const worker = getWorker();
  cachedWorkerBusy = true;

  // Drain any pre-typed input lines as a single string for the worker.
  const stdin = consoleIO.drainBuffer();

  return new Promise((resolve) => {
    let resolved = false;
    function done(result) {
      if (resolved) return;
      resolved = true;
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      cachedWorkerBusy = false;
      resolve(result);
    }

    function onMessage(e) {
      const data = e.data || {};
      if (data.type === "stdout") {
        consoleIO.write(data.text);
      } else if (data.type === "done") {
        consoleIO.writeInfo(`\n[program exited with code ${data.exitCode}]\n`);
        done({ ok: data.exitCode === 0, exitCode: data.exitCode });
      } else if (data.type === "error") {
        const { line, friendly } = explainJSCPPError(data.message);
        if (line && typeof onErrorLine === "function") onErrorLine(line);
        const lineLabel = line ? `Line ${line}: ` : "";
        consoleIO.writeErr(
          "\n❌ " + lineLabel + (friendly || data.message) + "\n"
        );
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
    worker.postMessage({ type: "run", code, stdin });
  });
}
