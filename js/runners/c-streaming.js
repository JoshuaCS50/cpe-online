// Main-thread wrapper around the c-worker. Returns once the worker reports
// done or error. Output streams via consoleIO.write as it arrives.

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

// Translate raw error strings the same way the sync runner does.
function explainJSCPPError(rawMsg) {
  const msg = String(rawMsg || "");
  const colonMatch = msg.match(/^(\d+):(\d+)\s*(.*)/);
  let line = null;
  let body = msg;
  if (colonMatch) {
    line = parseInt(colonMatch[1], 10);
    body = colonMatch[3];
  } else {
    const lineWord = msg.match(/line\s+(\d+)/i);
    if (lineWord) line = parseInt(lineWord[1], 10);
  }
  return { line, body };
}

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
        const { line, body } = explainJSCPPError(data.message);
        if (line && typeof onErrorLine === "function") onErrorLine(line);
        const lineLabel = line ? `Line ${line}: ` : "";
        consoleIO.writeErr("\n❌ " + lineLabel + (body || data.message) + "\n");
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
