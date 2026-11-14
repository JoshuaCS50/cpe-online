// Turns a lesson file into a Lesson, and checks a set of lessons against
// each other. Runs at build time and in tests, never in the browser.
//
// A lesson file is Markdown with a YAML header:
//
//   ---
//   id: core.c.printf
//   ...
//   ---
//   Normal explanation, in Markdown.
//
//   ::: kid
//   The same idea for a young reader. Required.
//   :::
//
//   ```c {role=example}
//   code shown on the Example tab
//   ```
//
//   ::: try
//   What to do in "Try it yourself".
//   :::
//   ::: try-kid
//   The same task for a young reader.
//   :::
//   ```c {role=starter}
//   ```
//   ```c {role=solution}
//   ```
//
//   ```text {role=file file=temps.txt}
//   a data file the lesson's programs can open; it is shown in the text too
//   ```
//
// Fenced blocks without a role stay inside the text they appear in.

import { Marked } from "marked";
import { parse as parseYaml } from "yaml";

import { frontmatterSchema } from "./schema";
import type { CodeSample, DataFile, Frontmatter, Lesson, LessonLanguage } from "./schema";
import { findTrack, findUnit } from "./tracks";

/** Everything wrong with one lesson file, reported together. */
export class ContentError extends Error {
  readonly file: string;
  readonly problems: string[];

  constructor(file: string, problems: string[]) {
    super(`${file}\n${problems.map((problem) => `  - ${problem}`).join("\n")}`);
    this.name = "ContentError";
    this.file = file;
    this.problems = problems;
  }
}

/** Kid text reads aloud well when sentences are short. */
export const KID_MAX_WORDS = 12;

/** Words a seven-year-old has not met. Use a plain word, or explain the idea instead. */
export const KID_BANNED_WORDS = [
  "initialise",
  "initialize",
  "parameter",
  "argument",
  "syntax",
  "compile",
  "compiler",
  "execute",
  "allocate",
  "iterate",
  "boolean",
  "expression",
  "statement",
  "declaration",
  "operand",
  "operator",
  "function call",
  "data type",
] as const;

const FENCE_LANGUAGES: Record<string, LessonLanguage> = {
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  python: "python",
  py: "python",
  matlab: "matlab",
  octave: "matlab",
};

const DEFAULT_FILE: Record<LessonLanguage, string> = { c: "main.c", cpp: "main.cpp", python: "main.py", matlab: "main.m" };

const ROLES = ["example", "starter", "solution"] as const;
type Role = (typeof ROLES)[number];

const CONTAINERS = ["kid", "try", "try-kid"] as const;
type Container = (typeof CONTAINERS)[number];
type Section = "body" | Container;

const FENCE_OPEN = /^(`{3,})[ \t]*([A-Za-z0-9+#-]*)[ \t]*(\{[^}]*\})?[ \t]*$/;
const CONTAINER_OPEN = /^:::[ \t]*([a-z-]+)[ \t]*$/;
const CONTAINER_CLOSE = /^:::[ \t]*$/;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Lesson files are plain Markdown. Raw HTML in one is shown as text, never run.
const markdown = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
  },
});

function render(source: string): string {
  return markdown.parse(source.trim(), { async: false }).trim();
}

function parseAttributes(raw: string | undefined): Record<string, string> {
  const attributes: Record<string, string> = {};
  if (!raw) return attributes;
  for (const pair of raw.slice(1, -1).trim().split(/\s+/)) {
    if (!pair) continue;
    const equals = pair.indexOf("=");
    if (equals <= 0) attributes[pair] = "";
    else attributes[pair.slice(0, equals)] = pair.slice(equals + 1);
  }
  return attributes;
}

interface ParsedBody {
  sections: Record<Section, string>;
  samples: Partial<Record<Role, { language: string; fileName?: string; code: string }>>;
  files: DataFile[];
}

/** A data file name: no folders, so it means the same in every run. */
const DATA_FILE_NAME = /^[A-Za-z0-9_.-]+$/;

function parseBody(text: string, problems: string[]): ParsedBody {
  const buffers: Record<Section, string[]> = { body: [], kid: [], try: [], "try-kid": [] };
  const seen = new Set<Container>();
  const samples: ParsedBody["samples"] = {};
  const files: DataFile[] = [];
  const lines = text.split("\n");
  let section: Section = "body";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const fence = FENCE_OPEN.exec(line);
    if (fence) {
      const marker = fence[1] ?? "```";
      const attributes = parseAttributes(fence[3]);
      const closing = new RegExp(`^\`{${marker.length},}[ \\t]*$`);
      const code: string[] = [];
      let end = index + 1;
      while (end < lines.length && !closing.test(lines[end] ?? "")) {
        code.push(lines[end] ?? "");
        end += 1;
      }
      if (end >= lines.length) problems.push(`line ${index + 1}: code block is never closed`);

      const role = attributes.role;
      if (role === "file") {
        const name = attributes.file ?? "";
        if (section !== "body") problems.push(`line ${index + 1}: a {role=file} block must sit outside "::: ${section}"`);
        else if (!DATA_FILE_NAME.test(name)) problems.push(`line ${index + 1}: a {role=file} block needs file=<name>: letters, digits, dots, dashes and underscores only`);
        else if (files.some((file) => file.name === name)) problems.push(`line ${index + 1}: second data file called ${name}`);
        else {
          files.push({ name, text: code.length > 0 ? code.join("\n") + "\n" : "" });
          // The learner sees the file in the text, under its name.
          buffers.body.push(`File \`${name}\`:`, "", `${marker}${fence[2] ?? ""}`, ...code, marker);
        }
      } else if (role === undefined) {
        // Ordinary code block: keep it in the text, fences and all, without its attributes.
        buffers[section].push(`${marker}${fence[2] ?? ""}`, ...code, marker);
      } else if (!(ROLES as readonly string[]).includes(role)) {
        problems.push(`line ${index + 1}: unknown role "${role}" (use ${ROLES.join(", ")})`);
      } else if (section !== "body") {
        problems.push(`line ${index + 1}: a {role=${role}} block must sit outside "::: ${section}"`);
      } else if (samples[role as Role]) {
        problems.push(`line ${index + 1}: second {role=${role}} block; a lesson has one`);
      } else {
        samples[role as Role] = { language: fence[2] ?? "", fileName: attributes.file, code: code.join("\n") };
      }
      index = end;
      continue;
    }

    const open = CONTAINER_OPEN.exec(line);
    if (open) {
      const name = open[1] ?? "";
      if (section !== "body") {
        problems.push(`line ${index + 1}: "::: ${name}" opened inside "::: ${section}"; close that one first with ":::"`);
      } else if (!(CONTAINERS as readonly string[]).includes(name)) {
        problems.push(`line ${index + 1}: unknown block "::: ${name}" (use ${CONTAINERS.join(", ")})`);
      } else if (seen.has(name as Container)) {
        problems.push(`line ${index + 1}: second "::: ${name}" block; a lesson has one`);
      } else {
        section = name as Container;
        seen.add(section);
      }
      continue;
    }
    if (CONTAINER_CLOSE.test(line)) {
      if (section === "body") problems.push(`line ${index + 1}: ":::" closes nothing`);
      section = "body";
      continue;
    }
    buffers[section].push(line);
  }
  if (section !== "body") problems.push(`"::: ${section}" is never closed`);

  return {
    sections: {
      body: buffers.body.join("\n").trim(),
      kid: buffers.kid.join("\n").trim(),
      try: buffers.try.join("\n").trim(),
      "try-kid": buffers["try-kid"].join("\n").trim(),
    },
    samples,
    files,
  };
}

/** Markdown reduced to the words a reader hears: no code, no markup. */
function proseOf(source: string): string {
  return source
    .replace(/^(`{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, " ")
    .replace(/`[^`\n]*`/g, " it ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]*(#{1,6}|>|[-*+]|\d+\.)[ \t]+/gm, "")
    .replace(/[*_~]/g, "");
}

/** Problems with text written for a young reader. Empty when it reads well. */
export function kidTextProblems(source: string, where: string): string[] {
  const problems: string[] = [];
  const prose = proseOf(source);
  for (const sentence of prose.split(/(?<=[.!?:])\s+|\n+/)) {
    const words = sentence.match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) ?? [];
    if (words.length > KID_MAX_WORDS) {
      problems.push(`${where}: sentence has ${words.length} words (at most ${KID_MAX_WORDS}): "${sentence.trim()}"`);
    }
  }
  const lower = prose.toLowerCase();
  for (const word of KID_BANNED_WORDS) {
    if (new RegExp(`\\b${word}s?\\b`).test(lower)) problems.push(`${where}: uses the grown-up word "${word}"`);
  }
  return problems;
}

function sampleOf(
  raw: { language: string; fileName?: string; code: string },
  role: Role,
  frontmatter: Frontmatter,
  problems: string[],
): CodeSample {
  let language = frontmatter.language;
  if (raw.language !== "") {
    const named = FENCE_LANGUAGES[raw.language.toLowerCase()];
    if (named) language = named;
    else problems.push(`{role=${role}} block: unknown language "${raw.language}"`);
  }
  if (raw.code.trim() === "") problems.push(`{role=${role}} block is empty`);
  return { language, fileName: raw.fileName || DEFAULT_FILE[language], code: raw.code.replace(/\s+$/, "") + "\n" };
}

/** Compiles one lesson file. Throws a ContentError listing everything wrong with it. */
export function compileLesson(source: string, file: string): Lesson {
  const normalized = source.replace(/\r\n?/g, "\n");
  // Some editors put an invisible byte-order mark first; the header check must not trip on it.
  const text = normalized.charCodeAt(0) === 0xfeff ? normalized.slice(1) : normalized;
  if (!text.startsWith("---\n")) throw new ContentError(file, ['the file must start with a "---" header']);
  const headerEnd = text.indexOf("\n---", 4);
  if (headerEnd < 0) throw new ContentError(file, ['the header is never closed with "---"']);

  let header: unknown;
  try {
    header = parseYaml(text.slice(4, headerEnd));
  } catch (error) {
    throw new ContentError(file, [`header is not valid YAML: ${error instanceof Error ? error.message : String(error)}`]);
  }
  const parsed = frontmatterSchema.safeParse(header);
  if (!parsed.success) {
    throw new ContentError(
      file,
      parsed.error.issues.map((issue) => `header ${issue.path.join(".") || "(root)"}: ${issue.message}`),
    );
  }
  const frontmatter = parsed.data;

  const problems: string[] = [];
  const rest = text.slice(headerEnd + 4).replace(/^[^\n]*\n?/, "");
  const { sections, samples, files } = parseBody(rest, problems);

  if (sections.body === "") problems.push("the lesson has no explanation");
  if (sections.kid === "") problems.push('the lesson has no "::: kid" block; every lesson needs one');
  problems.push(...kidTextProblems(sections.kid, "kid block"));
  if (frontmatter.titleKid) problems.push(...kidTextProblems(frontmatter.titleKid, "titleKid"));

  const example = samples.example ? sampleOf(samples.example, "example", frontmatter, problems) : undefined;
  if (frontmatter.kind === "mini" && !example) problems.push("a mini lesson needs a {role=example} block");

  // "Try it yourself" is all or nothing: a task, a starting point, an answer and a way to check.
  const tryParts = {
    '"::: try" block': sections.try !== "",
    '"::: try-kid" block': sections["try-kid"] !== "",
    "{role=starter} block": samples.starter !== undefined,
    "{role=solution} block": samples.solution !== undefined,
    "checks in the header": frontmatter.checks.length > 0,
  };
  const present = Object.values(tryParts).filter(Boolean).length;
  let tryIt: Lesson["tryIt"];
  if (present > 0) {
    for (const [name, has] of Object.entries(tryParts)) {
      if (!has) problems.push(`"Try it yourself" is incomplete: missing ${name}`);
    }
    problems.push(...kidTextProblems(sections["try-kid"], "try-kid block"));
    frontmatter.hintsKid.forEach((hint, index) => problems.push(...kidTextProblems(hint, `hintsKid[${index}]`)));
    if (frontmatter.hints.length !== frontmatter.hintsKid.length) {
      problems.push(`hints (${frontmatter.hints.length}) and hintsKid (${frontmatter.hintsKid.length}) must have the same number of entries`);
    }
    for (const check of frontmatter.checks) {
      if (check.type === "file-equals" && (frontmatter.language === "matlab" || frontmatter.language === "cpp")) {
        problems.push("check file-equals only works in C and Python lessons; C++ and MATLAB programs cannot write files here yet");
      }
      if (check.type !== "stdout-regex" && check.type !== "code-contains") continue;
      try {
        new RegExp(check.pattern);
      } catch {
        problems.push(`check ${check.type}: "${check.pattern}" is not a valid regular expression`);
      }
    }
    if (samples.starter && samples.solution) {
      tryIt = {
        promptHtml: render(sections.try),
        promptKidHtml: render(sections["try-kid"]),
        starter: sampleOf(samples.starter, "starter", frontmatter, problems),
        solution: sampleOf(samples.solution, "solution", frontmatter, problems),
        checks: frontmatter.checks,
        hints: frontmatter.hints,
        hintsKid: frontmatter.hintsKid,
      };
    }
  } else if (frontmatter.hints.length > 0 || frontmatter.hintsKid.length > 0) {
    problems.push('hints are only used by "Try it yourself", which this lesson does not have');
  }

  if (problems.length > 0) throw new ContentError(file, problems);

  return {
    id: frontmatter.id,
    kind: frontmatter.kind,
    track: frontmatter.track,
    unit: frontmatter.unit,
    order: frontmatter.order,
    title: frontmatter.title,
    titleKid: frontmatter.titleKid ?? frontmatter.title,
    ...(frontmatter.symbol ? { symbol: frontmatter.symbol } : {}),
    language: frontmatter.language,
    concepts: frontmatter.concepts,
    prereqs: frontmatter.prereqs,
    minutes: frontmatter.est_minutes,
    hasExample: example !== undefined,
    hasTryIt: tryIt !== undefined,
    links: frontmatter.links,
    bodyHtml: render(sections.body),
    kidHtml: render(sections.kid),
    ...(example ? { example } : {}),
    ...(tryIt ? { tryIt } : {}),
    files,
  };
}

/** Problems that only show when lessons are looked at together. Empty when the set is sound. */
export function validateLibrary(lessons: readonly Lesson[]): string[] {
  const problems: string[] = [];
  const byId = new Map<string, Lesson>();
  const slots = new Map<string, string>();

  for (const lesson of lessons) {
    if (byId.has(lesson.id)) problems.push(`${lesson.id}: this id is used by two lessons`);
    byId.set(lesson.id, lesson);

    if (!findTrack(lesson.track)) problems.push(`${lesson.id}: unknown track "${lesson.track}"`);
    else if (!findUnit(lesson.track, lesson.unit)) {
      problems.push(`${lesson.id}: unit "${lesson.unit}" is not listed for track "${lesson.track}" in tracks.ts`);
    }

    const slot = `${lesson.track}/${lesson.unit}/${lesson.order}`;
    const taken = slots.get(slot);
    if (taken) problems.push(`${lesson.id}: same unit and order as ${taken}; give each its own order`);
    else slots.set(slot, lesson.id);
  }

  for (const lesson of lessons) {
    for (const prereq of lesson.prereqs) {
      if (prereq === lesson.id) problems.push(`${lesson.id}: lists itself as a prerequisite`);
      else if (!byId.has(prereq)) problems.push(`${lesson.id}: prerequisite "${prereq}" does not exist`);
    }
    for (const link of lesson.links) {
      if (!byId.has(link.to)) problems.push(`${lesson.id}: link to "${link.to}" does not exist`);
    }
  }

  // A prerequisite loop would leave every lesson in it locked behind another.
  const state = new Map<string, "visiting" | "done">();
  const visit = (id: string, path: string[]): void => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") {
      problems.push(`prerequisite loop: ${[...path.slice(path.indexOf(id)), id].join(" -> ")}`);
      return;
    }
    state.set(id, "visiting");
    for (const prereq of byId.get(id)?.prereqs ?? []) {
      if (byId.has(prereq) && prereq !== id) visit(prereq, [...path, id]);
    }
    state.set(id, "done");
  };
  for (const lesson of lessons) visit(lesson.id, []);

  return problems;
}
