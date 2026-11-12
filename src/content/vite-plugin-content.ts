// Build plugin: lesson files become JavaScript modules.
//
//   lesson.md?meta    -> what the lesson list needs (small)
//   lesson.md?lesson  -> the whole lesson (loaded when opened)
//
// A build stops if any lesson is broken, so a bad lesson cannot ship.

import { readFileSync } from "node:fs";

import type { Plugin } from "vite";

import { compileLesson } from "./compile";
import { loadLibraryFromDisk } from "./disk";
import { metaOf } from "./schema";

const LESSON_FILE = /\/src\/content\/tracks\/.+\.md$/;

export function contentPlugin(): Plugin {
  return {
    name: "cpe-content",
    enforce: "pre",

    buildStart() {
      const { lessons, problems } = loadLibraryFromDisk();
      if (problems.length > 0) {
        this.error(`Lesson content has problems:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`);
      }
      this.info(`lessons: ${lessons.length} compiled`);
    },

    load(id) {
      const [path = "", query = ""] = id.split("?");
      const file = path.replace(/\\/g, "/");
      if (!LESSON_FILE.test(file)) return null;
      const parts = new Set(query.split("&"));
      if (!parts.has("meta") && !parts.has("lesson")) return null;
      this.addWatchFile(path);
      const lesson = compileLesson(readFileSync(path, "utf8"), file.slice(file.indexOf("/src/content/tracks/") + 20));
      return { code: `export default ${JSON.stringify(parts.has("meta") ? metaOf(lesson) : lesson)};`, map: null };
    },
  };
}
