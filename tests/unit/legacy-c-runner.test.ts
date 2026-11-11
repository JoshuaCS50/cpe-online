import { describe, expect, it } from "vitest";
import { rawJscppError, runLegacyC } from "../helpers/legacy-c";

describe("legacy C runner under Node", () => {
  it("runs a program and captures its output", async () => {
    const run = await runLegacyC('#include <stdio.h>\nint main() {\n    printf("%d\\n", 6 * 7);\n    return 0;\n}\n');
    expect(run).toMatchObject({ ok: true, exitCode: 0, stdout: "42\n", errorTitle: null, errorLine: null });
  });

  it("feeds queued input to scanf", async () => {
    const code = '#include <stdio.h>\nint main() {\n    int a, b;\n    scanf("%d", &a);\n    scanf("%d", &b);\n    printf("%d\\n", a + b);\n    return 0;\n}\n';
    const run = await runLegacyC(code, "7\n35\n");
    expect(run.stdout).toBe("42\n");
  });

  it("reports a missing semicolon with the friendly title and a line", async () => {
    const code = '#include <stdio.h>\nint main() {\n    int x = 5\n    printf("%d\\n", x);\n    return 0;\n}\n';
    const run = await runLegacyC(code);
    expect(run.ok).toBe(false);
    expect(run.exitCode).toBe(-1);
    expect(run.errorLine).toBe(4);
    expect(run.errorTitle).not.toBeNull();
    expect(rawJscppError(code)).toMatch(/line 4 \(column \d+\)/);
  });
});
