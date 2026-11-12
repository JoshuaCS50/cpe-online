// Reads and compiles every lesson file on disk. Node only: used by the
// build plugin and by tests.

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { ContentError, compileLesson, validateLibrary } from "./compile";
import type { Lesson } from "./schema";
import { sortLessons } from "./tracks";

export const TRACKS_DIR = "src/content/tracks";

function lessonFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...lessonFiles(path));
    else if (entry.name.endsWith(".md")) files.push(path);
  }
  return files.sort();
}

export interface Library {
  lessons: Lesson[];
  /** Every problem found, one line each. Empty when the content is sound. */
  problems: string[];
}

export function loadLibraryFromDisk(dir: string = TRACKS_DIR): Library {
  const lessons: Lesson[] = [];
  const problems: string[] = [];
  for (const file of lessonFiles(dir)) {
    const name = relative(dir, file).replace(/\\/g, "/");
    try {
      lessons.push(compileLesson(readFileSync(file, "utf8"), name));
    } catch (error) {
      if (error instanceof ContentError) problems.push(...error.problems.map((problem) => `${name}: ${problem}`));
      else throw error;
    }
  }
  problems.push(...validateLibrary(lessons));
  return { lessons: sortLessons(lessons), problems };
}
