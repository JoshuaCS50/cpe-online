// The lessons the app ships with. The list is small and loads with the
// Learn screen; each lesson's text loads when it is opened.

import type { Lesson, LessonMeta } from "../content/schema";
import { sortLessons } from "../content/tracks";

const metaModules = import.meta.glob<LessonMeta>("../content/tracks/**/*.md", { query: "?meta", import: "default", eager: true });
const lessonModules = import.meta.glob<Lesson>("../content/tracks/**/*.md", { query: "?lesson", import: "default" });

const loaders = new Map<string, () => Promise<Lesson>>();
for (const [path, meta] of Object.entries(metaModules)) {
  const load = lessonModules[path];
  if (load) loaders.set(meta.id, load);
}

/** Every lesson, in reading order. */
export const LESSONS: readonly LessonMeta[] = sortLessons(Object.values(metaModules));

export function findLesson(id: string): LessonMeta | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export function loadLesson(id: string): Promise<Lesson> {
  const load = loaders.get(id);
  return load ? load() : Promise.reject(new Error(`No lesson with the id "${id}"`));
}

/** The lesson after this one in reading order, if any. */
export function lessonAfter(id: string): LessonMeta | undefined {
  const index = LESSONS.findIndex((lesson) => lesson.id === id);
  return index < 0 ? undefined : LESSONS[index + 1];
}
