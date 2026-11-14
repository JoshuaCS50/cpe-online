// docs/COURSE.md and docs/TOPICS.md are written from the lessons. When a
// lesson changes, this test rewrites them and fails once, so the change to
// the docs is noticed and committed with the lesson.

import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { courseMap, topicIndex } from "../../src/content/course-index";
import { loadLibraryFromDisk } from "../../src/content/disk";

const library = loadLibraryFromDisk();

function keepUpToDate(path: string, text: string): void {
  let current = "";
  try {
    current = readFileSync(path, "utf8");
  } catch {
    // Not written yet.
  }
  if (current.replace(/\r\n/g, "\n") === text) return;
  writeFileSync(path, text);
  expect.fail(`${path} was out of date and has been rewritten; commit it with the lesson change.`);
}

describe("course structure", () => {
  it("lays every lesson out like a course", () => {
    expect(library.problems.filter((problem) => problem.includes("should be at"))).toEqual([]);
  });

  it("keeps docs/COURSE.md up to date", () => {
    keepUpToDate("docs/COURSE.md", courseMap(library.lessons, library.paths));
  });

  it("keeps docs/TOPICS.md up to date", () => {
    keepUpToDate("docs/TOPICS.md", topicIndex(library.lessons, library.paths));
  });
});
