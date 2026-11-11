import { describe, expect, it } from "vitest";
import { EXAMPLES, findExample } from "../../src/legacy/js/examples.js";

describe("legacy examples", () => {
  it("ships C examples with a filename and code", () => {
    const cExamples = EXAMPLES.filter((e) => e.lang === "c");
    expect(cExamples.length).toBeGreaterThan(0);
    for (const example of cExamples) {
      expect(example.filename).toMatch(/\.c$/);
      expect(example.code.length).toBeGreaterThan(0);
    }
  });

  it("finds every example by its own id", () => {
    for (const example of EXAMPLES) {
      expect(findExample(example.id)).toBe(example);
    }
  });
});
