// Compiling C++ with clang (WebAssembly build from @yowasp/clang). Shared by
// the browser worker and the tests, so both compile with the same options.

/** The function @yowasp/clang exports. */
export type RunClang = (
  args: string[],
  files: Record<string, string>,
  options?: { stdout?: (bytes: Uint8Array | null) => void; stderr?: (bytes: Uint8Array | null) => void; fetchProgress?: () => void },
) => Promise<Record<string, unknown>>;

/** The file name the program is compiled as; it is what clang's messages show. */
export const CPP_SOURCE_FILE = "main.cpp";

/**
 * -fno-exceptions: the C++ library in this build has no exception support,
 * so code that could throw would not link. -O1 keeps compiling quick while
 * removing the slowest code. -I. lets `#include <Servo.h>` find the headers
 * placed next to the source, as the Arduino IDE finds library headers.
 */
export const CPP_FLAGS = ["-std=c++17", "-fno-exceptions", "-O1", "-I."];

export interface CompileResult {
  /** The compiled program, or null when compiling failed. */
  wasm: Uint8Array | null;
  /** Everything clang printed: errors, or warnings when it succeeded. */
  messages: string;
}

/** `extraFiles` are placed next to the source, for example headers it includes. */
export async function compileCpp(runClang: RunClang, source: string, extraFiles: Record<string, string> = {}): Promise<CompileResult> {
  let messages = "";
  const decoder = new TextDecoder();
  const collect = (bytes: Uint8Array | null): void => {
    if (bytes) messages += decoder.decode(bytes, { stream: true });
  };
  try {
    const files = await runClang(["clang++", ...CPP_FLAGS, CPP_SOURCE_FILE, "-o", "main.wasm"], { ...extraFiles, [CPP_SOURCE_FILE]: source }, {
      stdout: collect,
      stderr: collect,
      fetchProgress: () => {},
    });
    const wasm = files["main.wasm"];
    return { wasm: wasm instanceof Uint8Array ? wasm : null, messages: messages.trimEnd() };
  } catch (error) {
    // A failed compile throws "Exited with status 1" after printing the errors.
    const extra = /Exited with status \d+/.test(String(error)) ? "" : `\n${String(error)}`;
    return { wasm: null, messages: (messages + extra).trimEnd() };
  }
}
