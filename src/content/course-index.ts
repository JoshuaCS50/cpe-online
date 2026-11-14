// The course map and the topic index, written from the lessons themselves:
// docs/COURSE.md (every track, unit and lesson in order, to follow like a
// course) and docs/TOPICS.md (every topic A to Z, with the lessons that teach
// it, to look something up). tests/unit/course-index.test.ts keeps both up to date.

import { TERMS, conceptName } from "./glossary";
import type { Lesson } from "./schema";
import { TRACKS } from "./tracks";

const FROM_DOCS = "../src/content/tracks/";

function lessonLink(lesson: Lesson, paths: Record<string, string>): string {
  const path = paths[lesson.id];
  return path ? `[${lesson.title}](${FROM_DOCS}${path})` : lesson.title;
}

function topicName(id: string): string {
  return TERMS[id]?.term ?? conceptName(id);
}

export function courseMap(lessons: readonly Lesson[], paths: Record<string, string>): string {
  const lines: string[] = [
    "# Course map",
    "",
    "Every lesson in CPE Online, in the order to take them. This file is written from the lessons by `tests/unit/course-index.test.ts`; do not edit it by hand.",
    "",
    "- **Follow it like a course:** tracks are subjects, units are chapters, and lessons are numbered inside each unit. Start at the top of a track and work down.",
    "- **Look something up:** see [TOPICS.md](TOPICS.md), every topic A to Z with the lessons that teach it, or use the search box in Learn mode.",
    "- **Where the files are:** `src/content/tracks/<track>/<unit number>-<unit name>/<lesson number>-<lesson name>.md`, the same order as here.",
    "",
  ];
  for (const track of TRACKS) {
    const inTrack = lessons.filter((lesson) => lesson.track === track.id);
    if (inTrack.length === 0) continue;
    const minutes = inTrack.reduce((sum, lesson) => sum + lesson.minutes, 0);
    lines.push(`## ${track.title}`, "", `${track.blurb} ${inTrack.length} lessons, about ${Math.round(minutes / 60)} hours.`, "");
    for (const unit of track.units) {
      const inUnit = inTrack.filter((lesson) => lesson.unit === unit.id);
      if (inUnit.length === 0) {
        lines.push(`### ${unit.id.toUpperCase()} ${unit.title}`, "", "_Coming later._", "");
        continue;
      }
      const unitMinutes = inUnit.reduce((sum, lesson) => sum + lesson.minutes, 0);
      lines.push(`### ${unit.id.toUpperCase()} ${unit.title}`, "", `${inUnit.length} lessons, about ${unitMinutes} minutes.`, "");
      lines.push("| # | Lesson | Type | Minutes | Topics |", "|---|---|---|---|---|");
      inUnit.forEach((lesson, index) => {
        const kind = lesson.kind === "mini" ? "Quick reference" : lesson.circuit ? "Lesson + circuit" : "Lesson";
        const board = lesson.language === "arduino" ? ` (${lesson.board === "esp32" ? "ESP32" : "Uno"})` : "";
        lines.push(`| ${index + 1} | ${lessonLink(lesson, paths)}${board} | ${kind} | ${lesson.minutes} | ${lesson.concepts.map(topicName).join(", ")} |`);
      });
      lines.push("");
    }
  }
  return lines.join("\n");
}

export function topicIndex(lessons: readonly Lesson[], paths: Record<string, string>): string {
  const byTopic = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    for (const concept of lesson.concepts) byTopic.set(concept, [...(byTopic.get(concept) ?? []), lesson]);
  }
  const topics = [...byTopic.keys()].sort((a, b) => topicName(a).localeCompare(topicName(b)));
  const lines: string[] = [
    "# Topics A to Z",
    "",
    "Every topic the lessons teach, with the lessons that teach it, in course order. Written from the lessons by `tests/unit/course-index.test.ts`; do not edit it by hand. Topics marked † are explained in the lesson's Extra info window.",
    "",
  ];
  let letter = "";
  for (const topic of topics) {
    const name = topicName(topic);
    const first = name.charAt(0).toUpperCase();
    if (first !== letter) {
      letter = first;
      lines.push(`## ${letter}`, "");
    }
    const taught = byTopic.get(topic)!.map((lesson) => lessonLink(lesson, paths)).join(", ");
    lines.push(`- **${name}**${TERMS[topic] ? " †" : ""}: ${taught}`);
  }
  lines.push("");
  return lines.join("\n");
}
