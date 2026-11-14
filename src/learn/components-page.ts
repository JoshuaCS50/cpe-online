// The components catalogue: every board and part the simulator has, what it
// is, where it is used, how to wire and program it, and the lessons that use
// it. At #/learn/components, linked above the Arduino lessons.

import { COMPONENTS } from "../content/glossary/components";
import type { LessonMeta } from "../content/schema";
import { el } from "../shell/dom";

/** Catalogue order: boards, then inputs, then outputs, then building blocks. */
const GROUPS: { title: string; ids: string[] }[] = [
  { title: "Boards", ids: ["board-uno", "board-esp32"] },
  { title: "Inputs and sensors", ids: ["button", "knob", "ldr", "fsr", "temp-sensor", "soil-sensor", "ultrasonic", "touch-pad"] },
  { title: "Outputs", ids: ["led", "rgb-led", "buzzer", "servo", "motor", "stepper", "oled"] },
  { title: "Building blocks", ids: ["breadboard", "jumper-wire", "resistor"] },
];

export function componentsPage(lessons: readonly LessonMeta[], titleOf: (lesson: LessonMeta) => string, href: (id: string) => string): HTMLElement {
  const usedIn = (id: string): LessonMeta[] =>
    lessons.filter((lesson) => lesson.parts?.includes(id) || (id === "resistor" && lesson.parts?.some((part) => part === "led" || part === "rgb-led" || part === "ldr" || part === "fsr")) || ((id === "breadboard" || id === "jumper-wire") && (lesson.parts?.length ?? 0) > 1));
  return el("article", { class: "lesson components-page" }, [
    el("a", { class: "lesson-back", href: "#/learn" }, ["← All lessons"]),
    el("p", { class: "eyebrow" }, ["Reference"]),
    el("h1", {}, ["Components"]),
    el("p", { class: "board-page-intro" }, [
      "Every board and part the simulator can build, what it does, where it is used and how to wire and program it. Each one is in at least one lesson's circuit, and all of them can go into your own circuit in Code mode (Board tab, Edit circuit).",
    ]),
    ...GROUPS.flatMap((group) => [
      el("h2", {}, [group.title]),
      el(
        "div",
        { class: "components-grid" },
        group.ids
          .filter((id) => COMPONENTS[id])
          .map((id) => {
            const entry = COMPONENTS[id]!;
            const lessonsUsing = usedIn(id);
            return el("section", { class: "extra-card component-card", id: `component-${id}` }, [
              el("h3", {}, [entry.term]),
              el("p", {}, [entry.meaning]),
              ...(entry.usedFor ? [el("p", {}, [el("strong", {}, ["Where it is used: "]), entry.usedFor])] : []),
              ...(entry.howTo ? [el("p", {}, [el("strong", {}, ["How to use it: "]), entry.howTo])] : []),
              ...(entry.code ? [el("pre", { class: "extra-code" }, [el("code", {}, [entry.code])])] : []),
              ...(entry.watchOut ? [el("p", { class: "extra-watch" }, [el("strong", {}, ["Watch out: "]), entry.watchOut])] : []),
              ...(lessonsUsing.length
                ? [
                    el("p", { class: "component-lessons" }, [
                      el("strong", {}, ["In lessons: "]),
                      ...lessonsUsing.slice(0, 6).flatMap((lesson, index) => [index ? ", " : "", el("a", { href: href(lesson.id) }, [titleOf(lesson)])]),
                      lessonsUsing.length > 6 ? ` and ${lessonsUsing.length - 6} more` : "",
                    ]),
                  ]
                : []),
            ]);
          }),
      ),
    ]),
  ]);
}
