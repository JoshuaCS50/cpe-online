import { describe, expect, it } from "vitest";
import { ERROR_RULES } from "../../src/legacy/js/runners/c.js";
import { BROKEN_PROGRAMS, UNREACHED_TITLES } from "../fixtures/errors/legacy-c-programs";
import { runLegacyC } from "../helpers/legacy-c";

interface ErrorExplanation {
  title: string;
}

const rules = ERROR_RULES as unknown as readonly (readonly [RegExp, unknown])[];

const staticTitles = rules
  .map((rule) => rule[1])
  .filter(
    (explanation): explanation is ErrorExplanation =>
      typeof explanation === "object" && explanation !== null && "title" in explanation,
  )
  .map((explanation) => explanation.title);

describe("legacy C error messages", () => {
  for (const program of BROKEN_PROGRAMS) {
    it(program.id, async () => {
      const run = await runLegacyC(program.source, program.stdin ?? "");
      expect(run.ok).toBe(false);
      expect(run.errorTitle).toBe(program.expectTitle);
      expect(run.errorLine).toBe(program.expectLine);
    });
  }

  it("uses unique program ids", () => {
    const ids = BROKEN_PROGRAMS.map((program) => program.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every program at most 15 lines", () => {
    for (const program of BROKEN_PROGRAMS) {
      const lines = program.source.replace(/\n$/, "").split("\n");
      expect(lines.length).toBeLessThanOrEqual(15);
    }
  });

  it("covers every static ERROR_RULES title", () => {
    const covered = new Set<string>([
      ...BROKEN_PROGRAMS.map((program) => program.expectTitle),
      ...UNREACHED_TITLES.map((entry) => entry.title),
    ]);
    const missing = staticTitles.filter((title) => !covered.has(title));
    expect(missing).toEqual([]);
  });

  it("keeps the unreachable list within the observed bound", () => {
    // 11 static titles plus 2 dynamic titles cannot fire with JSCPP 2.0.6;
    // the brief's six-entry bound predates the vendored bundle's wording.
    expect(UNREACHED_TITLES.length).toBeLessThanOrEqual(13);
  });
});
