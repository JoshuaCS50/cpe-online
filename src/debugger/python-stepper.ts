// Python side of the debugger: a trace function that pauses the program at
// breakpoints and steps, and reports the call stack and variables.
//
// It runs inside Pyodide. At each pause it calls `pause(state_json)`, which
// must block until the user chooses what to do and return the reply as JSON:
// {"command": "continue" | "stepOver" | "stepInto" | "stepOut" | "stop",
//  "breakpoints": [line, ...]}.
//
// Only the user's own file is traced, so stepping never wanders into the
// standard library, and only data is listed as variables (not modules,
// functions or classes).

import type { DebugCommand } from "./types";

export interface PauseReply {
  command: DebugCommand | "stop";
  breakpoints: number[];
}

export const PYTHON_DEBUG_DRIVER = `
import json as _cpe_json
import linecache as _cpe_linecache
import sys as _cpe_sys
import types as _cpe_types

_CPE_NOT_DATA = (_cpe_types.ModuleType, _cpe_types.FunctionType, _cpe_types.BuiltinFunctionType, type)


def _cpe_format(value):
    try:
        text = repr(value)
    except Exception as error:
        text = "<cannot show: " + type(error).__name__ + ">"
    if len(text) > 200:
        text = text[:197] + "..."
    return text


class _CpeStepper:
    def __init__(self, filename, pause, breakpoints):
        self.filename = filename
        self.pause = pause
        self.breakpoints = set(breakpoints)
        # With no breakpoints, stop on the first line so there is something to look at.
        self.mode = "continue" if self.breakpoints else "entry"
        self.origin = 0

    def user_frames(self, frame):
        frames = []
        while frame is not None:
            if frame.f_code.co_filename == self.filename:
                frames.append(frame)
            frame = frame.f_back
        return frames  # innermost first

    def trace(self, frame, event, arg):
        if frame.f_code.co_filename != self.filename:
            return None
        if event == "line":
            self.line(frame)
        return self.trace

    def line(self, frame):
        frames = self.user_frames(frame)
        depth = len(frames)
        if frame.f_lineno in self.breakpoints:
            reason = "breakpoint"
        elif self.mode == "entry":
            reason = "entry"
        elif (
            self.mode == "stepInto"
            or (self.mode == "stepOver" and depth <= self.origin)
            or (self.mode == "stepOut" and depth < self.origin)
        ):
            reason = "step"
        else:
            return
        state = {
            "reason": reason,
            "line": frame.f_lineno,
            "frames": [self.describe(f) for f in frames],
            "globals": [],
        }
        reply = _cpe_json.loads(self.pause(_cpe_json.dumps(state)))
        if reply.get("command") == "stop":
            raise KeyboardInterrupt()
        self.mode = reply["command"]
        self.breakpoints = set(reply.get("breakpoints", []))
        self.origin = depth

    def describe(self, frame):
        variables = []
        for name, value in frame.f_locals.items():
            if name.startswith("__") or isinstance(value, _CPE_NOT_DATA):
                continue
            variables.append({"name": name, "value": _cpe_format(value), "type": type(value).__name__})
        return {"name": frame.f_code.co_name, "line": frame.f_lineno, "variables": variables}


def _cpe_debug(code, filename, pause, breakpoints, namespace):
    # Lets tracebacks quote the user's source lines.
    _cpe_linecache.cache[filename] = (len(code), None, code.splitlines(True), filename)
    stepper = _CpeStepper(filename, pause, [int(line) for line in breakpoints])
    compiled = compile(code, filename, "exec")
    _cpe_sys.settrace(stepper.trace)
    try:
        exec(compiled, namespace)
    finally:
        _cpe_sys.settrace(None)
`;

/** Runs `code` under the stepper. Throws what the program throws. */
export type PythonDebugFunction = (
  code: string,
  filename: string,
  pause: (stateJson: string) => string,
  breakpoints: number[],
  namespace: unknown,
) => void;

interface PyodideForDebug {
  runPython(code: string): unknown;
  /** The interpreter's global namespace; typed loosely because Pyodide's own type hides `get`. */
  globals: unknown;
}

/** Defines the driver in the interpreter and returns its entry point. */
export function installPythonDebugger(pyodide: PyodideForDebug): PythonDebugFunction {
  pyodide.runPython(PYTHON_DEBUG_DRIVER);
  const globals = pyodide.globals as { get(name: string): unknown };
  return globals.get("_cpe_debug") as PythonDebugFunction;
}
