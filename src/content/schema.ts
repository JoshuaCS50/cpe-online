// Shape of a lesson: what an author writes in a lesson file's header, and
// what the build turns the file into.
//
// The app imports only the types from here, so the validation library stays
// out of the shipped bundle.

import { z } from "zod";
import { BOARD_IDS } from "../runners/arduino/profiles";
import type { BoardId } from "../runners/arduino/profiles";
import { CIRCUIT_PARTS, LED_COLOURS } from "./circuit";
import type { Circuit } from "./circuit";

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

/** A pin as an author writes it: 13, "A0", "GPIO 23". */
const pinRef = z.union([z.number().int().nonnegative(), z.string().min(1)]);

/** Arduino lessons: one part of the circuit, as written in the header. */
const circuitPartSchema = z.strictObject({
  part: z.enum(CIRCUIT_PARTS),
  pin: pinRef.optional(),
  /** Several pins: RGB LED [red, green, blue], ultrasonic [trig, echo], stepper [IN1, IN2, IN3, IN4]. */
  pins: z.array(pinRef).min(2).max(4).optional(),
  colour: z.enum(LED_COLOURS).optional(),
  wiring: z.enum(["pull-up", "pull-down"]).optional(),
  ohms: z.number().int().positive().optional(),
  label: z.string().min(1).optional(),
});
export type CircuitPartInput = z.infer<typeof circuitPartSchema>;

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
  /** Arduino only: the simulator has no notes about the run (no wiring mistakes, no delay or Serial in an interrupt routine). */
  z.strictObject({ type: z.literal("no-board-notes"), inputs, ms, message: z.string().min(1) }),
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
    /** Arduino lessons: the board the sketch runs on (default: the Uno). */
    board: z.enum(BOARD_IDS).optional(),
    /** Arduino lessons: the parts on the breadboard and their pins. */
    circuit: z.array(circuitPartSchema).min(1).optional(),
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
  /** Arduino lessons: the board and the parts of the circuit, as glossary ids ("board-uno", "led"). */
  parts?: string[];
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
  /** Arduino lessons: the board, when it is not the Uno. */
  board?: BoardId;
  /** Arduino lessons: the circuit on the breadboard. */
  circuit?: Circuit;
}

export function metaOf(lesson: Lesson): LessonMeta {
  const { id, kind, track, unit, order, title, titleKid, symbol, language, concepts, prereqs, minutes, hasExample, hasTryIt } = lesson;
  const parts = language === "arduino" ? [`board-${lesson.board ?? "uno"}`, ...new Set((lesson.circuit?.parts ?? []).map((part) => part.part))] : [];
  return { id, kind, track, unit, order, title, titleKid, ...(symbol ? { symbol } : {}), language, concepts, prereqs, minutes, hasExample, hasTryIt, ...(parts.length ? { parts } : {}) };
}
