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

/** "a1" -> "a01": unit folders sort in course order. */
export function unitFolderPrefix(unit: string): string {
  return unit.replace(/^([a-z])(\d+)$/, (_, letter: string, number: string) => letter + number.padStart(2, "0"));
}

/**
 * Lessons are laid out like a course, so the folders read as a syllabus:
 *   <track>/<unit, two digits>-<unit name>/<order, two digits>-<lesson name>.md
 * for example embedded/b11-esp32-a-faster-connected-board/05-touch-pins.md.
 */
export function layoutProblems(name: string, lesson: Pick<Lesson, "track" | "unit" | "order">): string[] {
  const parts = name.split("/");
  const expected = `${lesson.track}/${unitFolderPrefix(lesson.unit)}-<unit name>/${String(lesson.order).padStart(2, "0")}-<lesson name>.md`;
  const fits =
    parts.length === 3 &&
    parts[0] === lesson.track &&
    parts[1]!.startsWith(`${unitFolderPrefix(lesson.unit)}-`) &&
    parts[2]!.startsWith(`${String(lesson.order).padStart(2, "0")}-`);
  return fits ? [] : [`${name}: should be at ${expected} (track, unit and order from its header)`];
}

export interface Library {
  lessons: Lesson[];
  /** Every problem found, one line each. Empty when the content is sound. */
  problems: string[];
  /** Each lesson's file, relative to the tracks folder, by lesson id. */
  paths: Record<string, string>;
}

export function loadLibraryFromDisk(dir: string = TRACKS_DIR): Library {
  const lessons: Lesson[] = [];
  const problems: string[] = [];
  const paths: Record<string, string> = {};
  for (const file of lessonFiles(dir)) {
    const name = relative(dir, file).replace(/\\/g, "/");
    try {
      const lesson = compileLesson(readFileSync(file, "utf8"), name);
      problems.push(...layoutProblems(name, lesson));
      lessons.push(lesson);
      paths[lesson.id] = name;
    } catch (error) {
      if (error instanceof ContentError) problems.push(...error.problems.map((problem) => `${name}: ${problem}`));
      else throw error;
    }
  }
  problems.push(...validateLibrary(lessons));
  return { lessons: sortLessons(lessons), problems, paths };
}
