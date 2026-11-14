// Shape of a lesson: what an author writes in a lesson file's header, and
// what the build turns the file into.
//
// The app imports only the types from here, so the validation library stays
// out of the shipped bundle.

import { z } from "zod";

export const TRACK_IDS = ["core", "embedded", "plc", "control"] as const;
export type TrackId = (typeof TRACK_IDS)[number];

/** Languages a lesson's code can be written in. Each one runs in the browser. */
export const LESSON_LANGUAGES = ["c", "cpp", "arduino", "python", "matlab"] as const;
export type LessonLanguage = (typeof LESSON_LANGUAGES)[number];

const stdin = z.array(z.string()).default([]);
/** Arduino lessons: inputs on the virtual board over time, such as "2 LOW at 500" or "A0 512 at 0". */
const inputs = z.array(z.string()).optional();
/** Arduino lessons: how much board time to run, in ms. */
const ms = z.number().int().positive().max(60_000).optional();

/** How "Check my answer" decides whether a program is right. */
export const checkSchema = z.discriminatedUnion("type", [
  /** Output must equal `expect`. Trailing spaces and blank lines at the end are ignored. */
  z.strictObject({ type: z.literal("stdout-equals"), stdin, expect: z.string(), inputs, ms }),
  /** Output must match the regular expression. */
  z.strictObject({ type: z.literal("stdout-regex"), stdin, pattern: z.string().min(1), message: z.string().optional() }),
  /** The program is run once per case; every case must produce its output. */
  z.strictObject({
    type: z.literal("io-cases"),
    cases: z.array(z.strictObject({ stdin, expect: z.string() })).min(1),
  }),
  /** The code itself must match, for example "uses a for loop". Comments are ignored. */
  z.strictObject({ type: z.literal("code-contains"), pattern: z.string().min(1), message: z.string().min(1) }),
  /** After the run, the file the program wrote must hold `expect` (compared like output). C only. */
  z.strictObject({ type: z.literal("file-equals"), stdin, file: z.string().min(1), expect: z.string() }),
  /** Arduino only: the pins over time must be `expect`, one change per line, such as "500 ms: pin 13 LOW". */
  z.strictObject({ type: z.literal("pins"), inputs, ms, expect: z.string() }),
]);
export type Check = z.infer<typeof checkSchema>;

const contentId = z
  .string()
  .regex(/^[a-z][a-z0-9]*(\.[a-z0-9][a-z0-9-]*){1,3}$/, 'ids look like "core.c.printf": lower case, dots between parts');

export const linkSchema = z.strictObject({
  to: contentId,
  kind: z.enum(["same-idea", "builds-on", "contrast", "next"]),
  note: z.string().min(1),
});
export type LessonLink = z.infer<typeof linkSchema>;

/** The YAML header of a lesson file. Unknown keys are rejected so typos surface. */
export const frontmatterSchema = z
  .strictObject({
    id: contentId,
    /** A lesson teaches an idea; a mini lesson is a one-page reference for one symbol. */
    kind: z.enum(["lesson", "mini"]),
    track: z.enum(TRACK_IDS),
    /** Unit id from src/content/tracks.ts, for example "a2". */
    unit: z.string().min(1),
    /** Position inside the unit, lowest first. */
    order: z.number().int().nonnegative(),
    title: z.string().min(1),
    /** Title shown in kid mode. Falls back to `title`. */
    titleKid: z.string().min(1).optional(),
    /** Mini lessons only: the symbol the page is about, for example "printf". */
    symbol: z.string().min(1).optional(),
    language: z.enum(LESSON_LANGUAGES),
    concepts: z.array(z.string().min(1)).default([]),
    /** Ids of lessons to do first. */
    prereqs: z.array(contentId).default([]),
    links: z.array(linkSchema).default([]),
    est_minutes: z.number().int().positive().max(120),
    checks: z.array(checkSchema).default([]),
    hints: z.array(z.string().min(1)).default([]),
    hintsKid: z.array(z.string().min(1)).default([]),
  })
  .superRefine((value, context) => {
    if (value.kind === "mini" && !value.symbol) {
      context.addIssue({ code: "custom", path: ["symbol"], message: "a mini lesson needs a symbol" });
    }
    if (!value.id.startsWith(`${value.track}.`)) {
      context.addIssue({ code: "custom", path: ["id"], message: `id must start with the track name "${value.track}."` });
    }
  });
export type Frontmatter = z.infer<typeof frontmatterSchema>;

export interface CodeSample {
  language: LessonLanguage;
  /** File name used when the code is opened in the editor, for example "main.c". */
  fileName: string;
  code: string;
}

/** A data file a lesson gives its programs, opened with fopen. */
export interface DataFile {
  name: string;
  text: string;
}

/** The "Try it yourself" part of a lesson. */
export interface TryIt {
  promptHtml: string;
  promptKidHtml: string;
  starter: CodeSample;
  solution: CodeSample;
  checks: Check[];
  hints: string[];
  hintsKid: string[];
}

/** What the lesson list needs. Small, loaded with the Learn screen. */
export interface LessonMeta {
  id: string;
  kind: "lesson" | "mini";
  track: TrackId;
  unit: string;
  order: number;
  title: string;
  titleKid: string;
  symbol?: string;
  language: LessonLanguage;
  concepts: string[];
  prereqs: string[];
  minutes: number;
  hasExample: boolean;
  hasTryIt: boolean;
}

/** A whole lesson, loaded when it is opened. */
export interface Lesson extends LessonMeta {
  links: LessonLink[];
  bodyHtml: string;
  /** The same lesson for a young reader: hand-written, never generated. */
  kidHtml: string;
  example?: CodeSample;
  tryIt?: TryIt;
  /** Files every run of this lesson can open (example, Run and Check). */
  files: DataFile[];
}

export function metaOf(lesson: Lesson): LessonMeta {
  const { id, kind, track, unit, order, title, titleKid, symbol, language, concepts, prereqs, minutes, hasExample, hasTryIt } = lesson;
  return { id, kind, track, unit, order, title, titleKid, ...(symbol ? { symbol } : {}), language, concepts, prereqs, minutes, hasExample, hasTryIt };
}
