import { describe, expect, it } from "vitest";
import { EXAMPLES, findExample } from "../../src/content/examples";
import { MATLAB_EXAMPLES } from "../../src/content/examples-matlab";
import { languageFromFilename } from "../../src/storage/file-types";

const ALL = [...EXAMPLES, ...MATLAB_EXAMPLES];

describe("starter examples", () => {
  it("covers C, C++, Python and MATLAB", () => {
    const languages = new Set(ALL.map((example) => example.lang));
    for (const language of ["c", "cpp", "python", "matlab"]) expect(languages.has(language), language).toBe(true);
  });

  it("gives every example a unique id, a name and code", () => {
    expect(new Set(ALL.map((example) => example.id)).size).toBe(ALL.length);
    for (const example of ALL) {
      expect(example.name.trim().length, example.id).toBeGreaterThan(0);
      expect(example.code.trim().length, example.id).toBeGreaterThan(0);
    }
  });

  it("names each file so that it opens in the example's own language", () => {
    for (const example of ALL) expect(languageFromFilename(example.filename), example.id).toBe(example.lang);
  });

  it("finds every example by its own id", () => {
    for (const example of EXAMPLES) expect(findExample(example.id)).toBe(example);
  });
});
