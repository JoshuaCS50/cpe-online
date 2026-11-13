// Learn mode: the lesson list on one side, the open lesson on the other.
// A lesson has up to three tabs: the explanation, a worked example, and a
// task whose answer is checked by running it.
//
// Every address is a link (#/learn, #/learn/<lesson>, #/learn/<lesson>/<tab>),
// so the browser's back button works and a lesson can be bookmarked.

import "./learn.css";

import type { CodeSample, Lesson, LessonMeta, TryIt } from "../content/schema";
import { TRACKS, findUnit } from "../content/tracks";
import { createEditor } from "../editor/editor";
import { button, el } from "../shell/dom";
import { icon } from "../shell/icons";
import { createModeSwitch } from "../shell/mode-switch";
import type { AppStore, Settings } from "../storage/types";
import { createProgramRunner } from "./capture-run";
import { allPassed, runChecks } from "./checker";
import type { CheckOutcome } from "./checker";
import { LESSONS, findLesson, lessonAfter, loadLesson } from "./library";
import { loadDraft, loadProgress, markDone, saveDraft } from "./progress";
import type { Progress } from "./progress";
import { createRunBox, fileMap } from "./run-box";

export type LessonTab = "overview" | "example" | "try";

const TAB_LABELS: Record<LessonTab, string> = { overview: "Overview", example: "Example", try: "Try it yourself" };

export function isLessonTab(value: string | undefined): value is LessonTab {
  return value === "overview" || value === "example" || value === "try";
}

export interface LearnOptions {
  store: AppStore;
  getSettings(): Settings;
  updateSettings(patch: Partial<Settings>): void;
  onSettingsChange(listener: (settings: Settings) => void): void;
  /** Copies code into the IDE as a new file. */
  openInEditor(fileName: string, code: string, dataFiles?: Record<string, string>): Promise<void>;
}

export interface LearnApp {
  element: HTMLElement;
  /** Shows the lesson list (`null`) or a lesson, on the given tab. */
  show(lessonId: string | null, tab?: LessonTab): void;
}

function lessonHref(id: string, tab?: LessonTab): string {
  return `#/learn/${id}${tab && tab !== "overview" ? `/${tab}` : ""}`;
}

/** Plain text where `backticks` mark code. Built as text nodes, so nothing in it is treated as HTML. */
export function withInlineCode(text: string): (Node | string)[] {
  return text.split("`").map((part, index) => (index % 2 === 1 ? el("code", {}, [part]) : part));
}

/** Lesson text compiled at build time from the project's own files, with raw HTML already escaped. */
function prose(html: string, extraClass = ""): HTMLElement {
  const node = el("div", { class: `prose ${extraClass}`.trim() });
  node.innerHTML = html;
  // Wide tables scroll inside themselves instead of widening the page.
  for (const table of node.querySelectorAll("table")) {
    const scroller = el("div", { class: "table-scroll" });
    table.replaceWith(scroller);
    scroller.append(table);
  }
  return node;
}

export async function createLearnApp(options: LearnOptions): Promise<LearnApp> {
  const { store } = options;
  let progress: Progress = await loadProgress(store);
  let kid = options.getSettings().kidMode;
  let currentId: string | null = null;
  let currentTab: LessonTab = "overview";
  let lesson: Lesson | null = null;
  /** Undoes whatever the open lesson set up: editors, running programs, timers. */
  let cleanup: (() => void)[] = [];
  let loadToken = 0;

  const titleOf = (item: LessonMeta): string => (kid ? item.titleKid : item.title);
  const isDone = (id: string): boolean => progress.done[id] !== undefined;

  // ───── Frame ─────

  const pill = el("span", { class: "learn-pill", role: "status" });
  const kidButton = el("button", { type: "button", class: "btn btn-outline kid-toggle" }, [
    icon("moodKid"),
    el("span", { class: "btn-label" }, ["Simple words"]),
  ]);
  kidButton.title = "Show every explanation in short, simple words";
  kidButton.addEventListener("click", () => options.updateSettings({ kidMode: !kid }));

  const bar = el("header", { class: "learn-bar" }, [
    el("span", { class: "brand" }, [
      el("span", { class: "brand-mark", "aria-hidden": "true" }, [">_"]),
      el("span", { class: "brand-name" }, ["cpe-online"]),
    ]),
    createModeSwitch("learn"),
    el("span", { class: "learn-bar-spacer" }),
    pill,
    kidButton,
  ]);

  const listEl = el("nav", { class: "learn-list", "aria-label": "Lessons" });
  const mainEl = el("main", { class: "learn-main" });
  const body = el("div", { class: "learn-body", "data-screen": "list" }, [listEl, mainEl]);
  const element = el("div", { class: "learn" }, [bar, body]);

  function renderChrome(): void {
    const done = LESSONS.filter((item) => isDone(item.id)).length;
    pill.textContent = `${done} of ${LESSONS.length} done`;
    kidButton.setAttribute("aria-pressed", String(kid));
    element.dataset.kid = String(kid);
  }

  // ───── Lesson list ─────

  function lessonCard(item: LessonMeta, index: number): HTMLElement {
    const done = isDone(item.id);
    const marker = el("span", { class: "lesson-card-mark", "aria-hidden": "true" }, done ? [icon("check")] : [String(index + 1)]);
    const kind = item.kind === "mini" ? "Quick reference" : "Lesson";
    return el("li", {}, [
      el(
        "a",
        {
          class: "lesson-card",
          href: lessonHref(item.id),
          "aria-current": item.id === currentId ? "page" : undefined,
          "data-done": String(done),
        },
        [
          marker,
          el("span", { class: "lesson-card-text" }, [
            el("span", { class: "lesson-card-title" }, [titleOf(item)]),
            el("span", { class: "lesson-card-meta" }, [`${kind} · ${item.minutes} min${done ? " · done" : ""}`]),
          ]),
        ],
      ),
    ]);
  }

  function renderList(): void {
    const sections: HTMLElement[] = [];
    for (const track of TRACKS) {
      const inTrack = LESSONS.filter((item) => item.track === track.id);
      if (inTrack.length === 0) continue;
      sections.push(el("h2", { class: "learn-track" }, [kid ? track.titleKid : track.title]));
      for (const unit of track.units) {
        const inUnit = inTrack.filter((item) => item.unit === unit.id);
        if (inUnit.length === 0) continue;
        sections.push(
          el("h3", { class: "learn-unit" }, [kid ? unit.titleKid : unit.title]),
          el("ol", { class: "lesson-cards" }, inUnit.map(lessonCard)),
        );
      }
    }
    listEl.replaceChildren(...sections);
  }

  // ───── Welcome (no lesson open) ─────

  function renderWelcome(): void {
    const next = LESSONS.find((item) => !isDone(item.id)) ?? LESSONS[0];
    const tracks = TRACKS.map((track) => {
      const count = LESSONS.filter((item) => item.track === track.id).length;
      return el("li", { class: "track-card", "data-empty": String(count === 0) }, [
        el("h3", {}, [kid ? track.titleKid : track.title]),
        el("p", {}, [track.blurb]),
        el("span", { class: "track-count" }, [count === 0 ? "Coming later" : `${count} ${count === 1 ? "lesson" : "lessons"}`]),
      ]);
    });
    mainEl.replaceChildren(
      el("article", { class: "welcome" }, [
        el("p", { class: "eyebrow" }, ["Learn"]),
        el("h1", {}, [kid ? "Let's learn to code" : "Learn by running real code"]),
        el("p", { class: "welcome-lead" }, [
          kid
            ? "Read a little. Then try it. The computer tells you if you got it."
            : "Each lesson explains one idea, shows it working, and gives you a task that is checked by running your program.",
        ]),
        ...(next
          ? [
              el("a", { class: "btn btn-run welcome-start", href: lessonHref(next.id) }, [
                icon("play"),
                el("span", {}, [`${isDone(next.id) ? "Open" : Object.keys(progress.done).length > 0 ? "Continue" : "Start"}: ${titleOf(next)}`]),
              ]),
            ]
          : []),
        el("ul", { class: "track-cards" }, tracks),
      ]),
    );
  }

  // ───── Lesson ─────

  function disposeLesson(): void {
    for (const undo of cleanup) undo();
    cleanup = [];
  }

  function lessonLinks(heading: string, ids: { id: string; note?: string }[]): HTMLElement[] {
    const items = ids.flatMap(({ id, note }) => {
      const target = findLesson(id);
      if (!target) return [];
      return [
        el("li", {}, [
          el("a", { class: "related-link", href: lessonHref(id) }, [
            isDone(id) ? icon("check") : icon("chevronRight"),
            el("span", {}, [titleOf(target)]),
          ]),
          ...(note ? [el("span", { class: "related-note" }, [note])] : []),
        ]),
      ];
    });
    return items.length === 0 ? [] : [el("section", { class: "related" }, [el("h2", {}, [heading]), el("ul", {}, items)])];
  }

  function buildOverview(item: Lesson): HTMLElement {
    const next = lessonAfter(item.id);
    const footer: HTMLElement[] = [];
    if (item.tryIt) {
      footer.push(
        el("a", { class: "btn btn-run", href: lessonHref(item.id, "try") }, [icon("pencil"), el("span", {}, [kid ? "Now you try" : "Try it yourself"])]),
      );
    } else if (!isDone(item.id)) {
      footer.push(
        button({
          label: "Mark as done",
          icon: "check",
          showLabel: true,
          class: "btn btn-run",
          onClick: () => {
            void markDone(store, progress, item.id).then((updated) => {
              progress = updated;
              renderChrome();
              renderList();
              rebuildLesson();
            });
          },
        }),
      );
    }
    if (item.example) {
      footer.push(el("a", { class: "btn btn-outline", href: lessonHref(item.id, "example") }, [icon("play"), el("span", {}, ["See it run"])]));
    }
    if (next && (isDone(item.id) || !item.tryIt)) {
      footer.push(el("a", { class: "btn btn-outline", href: lessonHref(next.id) }, [el("span", {}, [`Next: ${titleOf(next)}`]), icon("chevronRight")]));
    }
    return el("section", { class: "lesson-panel", "data-tab": "overview" }, [
      prose(kid ? item.kidHtml : item.bodyHtml, kid ? "prose-kid" : ""),
      ...lessonLinks(kid ? "Do these first" : "Before this lesson", item.prereqs.map((id) => ({ id }))),
      ...lessonLinks(
        kid ? "The same idea somewhere else" : "Related",
        item.links.map((link) => ({ id: link.to, note: link.note })),
      ),
      el("div", { class: "lesson-footer" }, footer),
    ]);
  }

  /** The lesson's data files, shown where a program can open them. */
  function dataFiles(item: Lesson): HTMLElement[] {
    if (item.files.length === 0) return [];
    return [
      el("p", { class: "panel-lead" }, [kid ? "The program can open these saved pages:" : "Files the program can open with fopen:"]),
      ...item.files.map((file) =>
        el("div", { class: "code-sample data-file" }, [el("span", { class: "code-sample-name" }, [file.name]), el("pre", {}, [el("code", {}, [file.text])])]),
      ),
    ];
  }

  function buildExample(item: Lesson, example: CodeSample): HTMLElement {
    const openButton = button({
      label: "Open in the editor",
      icon: "externalLink",
      showLabel: true,
      class: "btn btn-outline",
      onClick: () => {
        void options.openInEditor(example.fileName, example.code, fileMap(item.files)).then(() => {
          window.location.hash = "#/code";
        });
      },
    });
    const runBox = createRunBox({
      language: example.language,
      fileName: example.fileName,
      getCode: () => example.code,
      kid: () => kid,
      actions: [openButton],
      files: item.files,
    });
    cleanup.push(() => runBox.dispose());
    return el("section", { class: "lesson-panel", "data-tab": "example" }, [
      el("p", { class: "panel-lead" }, [
        kid ? "Press Run. Watch what the computer does." : "Run the example, then open it in the editor to change it and see what happens.",
      ]),
      el("div", { class: "code-sample" }, [
        el("span", { class: "code-sample-name" }, [example.fileName]),
        el("pre", {}, [el("code", {}, [example.code])]),
      ]),
      ...dataFiles(item),
      runBox.element,
    ]);
  }

  function outcomeRow(outcome: CheckOutcome): HTMLElement {
    const row = el("li", { class: "check-row", "data-pass": String(outcome.pass) }, [
      el("span", { class: "check-mark", "aria-hidden": "true" }, [icon(outcome.pass ? "check" : "x")]),
      el("div", { class: "check-text" }, [
        el("span", { class: "check-title" }, [`${outcome.pass ? "Passed" : "Not yet"}: ${outcome.title}`]),
        ...(outcome.detail ? [el("span", { class: "check-detail" }, [outcome.detail])] : []),
      ]),
    ]);
    if (!outcome.pass && outcome.expected !== undefined) {
      row.append(
        el("div", { class: "check-diff" }, [
          el("div", {}, [el("span", { class: "check-diff-label" }, ["Expected"]), el("pre", {}, [outcome.expected || "(nothing)"])]),
          el("div", {}, [el("span", { class: "check-diff-label" }, [outcome.actualLabel ?? "Your program printed"]), el("pre", {}, [outcome.actual || "(nothing)"])]),
        ]),
      );
    }
    return row;
  }

  async function buildTry(item: Lesson, tryIt: TryIt): Promise<HTMLElement> {
    const { starter } = tryIt;
    const draft = await loadDraft(store, item.id);
    let disposed = false;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let checking: AbortController | null = null;

    const editorHost = el("div", { class: "try-editor" });
    const editor = createEditor(editorHost, {
      initialDoc: draft ?? starter.code,
      language: starter.language,
      fontSize: options.getSettings().fontSize,
      wrap: true,
      onChange: (doc) => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => void saveDraft(store, item.id, doc).catch(console.warn), 500);
      },
    });

    // Handle for manual checks in the dev server console; absent in builds.
    if (import.meta.env.DEV) (window as unknown as { __cpeLearn: unknown }).__cpeLearn = { editor };

    const results = el("div", { class: "try-results", "aria-live": "polite" });
    const hintList = el("ol", { class: "try-hints" });
    const hints = kid ? tryIt.hintsKid : tryIt.hints;
    let shownHints = 0;

    const checkButton = button({ label: "Check my answer", icon: "check", showLabel: true, class: "btn btn-check", onClick: () => void check() });
    const hintButton = button({ label: "Hint", icon: "bulb", showLabel: true, class: "btn btn-outline", onClick: () => showHint() });
    const resetButton = button({ label: "Start over", icon: "refresh", showLabel: true, class: "btn btn-quiet", onClick: () => reset() });
    if (hints.length === 0) hintButton.hidden = true;

    const runBox = createRunBox({
      language: starter.language,
      fileName: starter.fileName,
      getCode: () => editor.getDoc(),
      kid: () => kid,
      files: item.files,
      onErrorLine: (line) => {
        if (line === null) editor.clearErrorLine();
        else editor.highlightErrorLine(line);
      },
      actions: [checkButton, hintButton, resetButton],
    });

    function showHint(): void {
      const hint = hints[shownHints];
      if (hint === undefined) return;
      shownHints += 1;
      hintList.append(el("li", {}, withInlineCode(hint)));
      const label = hintButton.querySelector(".btn-label");
      if (shownHints >= hints.length) hintButton.disabled = true;
      else if (label) label.textContent = `Another hint (${shownHints} of ${hints.length} shown)`;
    }

    // Starting over throws work away, so it takes two presses.
    let resetArmed: ReturnType<typeof setTimeout> | undefined;
    function reset(): void {
      const label = resetButton.querySelector(".btn-label");
      if (resetArmed === undefined) {
        if (label) label.textContent = "Press again to erase your code";
        resetArmed = setTimeout(() => {
          resetArmed = undefined;
          if (label) label.textContent = "Start over";
        }, 4000);
        return;
      }
      clearTimeout(resetArmed);
      resetArmed = undefined;
      if (label) label.textContent = "Start over";
      editor.setDoc(starter.code);
      editor.clearErrorLine();
      results.replaceChildren();
    }

    async function check(): Promise<void> {
      if (checking || runBox.running) return;
      checking = new AbortController();
      checkButton.disabled = true;
      runBox.setBusy(true);
      editor.clearErrorLine();
      results.replaceChildren(el("p", { class: "try-status" }, ["Checking your answer by running it…"]));
      const code = editor.getDoc();
      try {
        const outcomes = await runChecks(code, starter.language, tryIt.checks, createProgramRunner(starter.language, starter.fileName, checking.signal, fileMap(item.files)));
        if (disposed) return;
        const passed = allPassed(outcomes);
        const summary = passed
          ? el("div", { class: "try-solved" }, [
              el("h3", {}, [icon("check"), kid ? "You did it!" : "Solved"]),
              el("p", {}, [kid ? "Your program does the job. Well done." : "Your program passes every check."]),
              (() => {
                const next = lessonAfter(item.id);
                return next
                  ? el("a", { class: "btn btn-run", href: lessonHref(next.id) }, [el("span", {}, [`Next: ${titleOf(next)}`]), icon("chevronRight")])
                  : el("a", { class: "btn btn-run", href: "#/learn" }, [el("span", {}, ["Back to all lessons"])]);
              })(),
            ])
          : el("p", { class: "try-status" }, [
              `${outcomes.filter((outcome) => outcome.pass).length} of ${outcomes.length} checks passed.` +
                (outcomes.some((outcome) => outcome.detail?.includes("stopped with an error")) ? " Press Run to see the error explained." : ""),
            ]);
        results.replaceChildren(summary, el("ul", { class: "check-rows" }, outcomes.map(outcomeRow)));
        if (passed && !isDone(item.id)) {
          progress = await markDone(store, progress, item.id);
          renderChrome();
          renderList();
        }
      } catch (error) {
        if (!disposed) {
          results.replaceChildren(
            el("p", { class: "try-status is-error" }, [`The check could not run: ${error instanceof Error ? error.message : String(error)}`]),
          );
        }
      } finally {
        checking = null;
        checkButton.disabled = false;
        runBox.setBusy(false);
      }
    }

    cleanup.push(() => {
      disposed = true;
      clearTimeout(saveTimer);
      clearTimeout(resetArmed);
      checking?.abort();
      runBox.dispose();
      // Keep what was typed, so the lesson reopens where the learner left it.
      void saveDraft(store, item.id, editor.getDoc()).catch(console.warn);
      editor.destroy();
    });

    return el("section", { class: "lesson-panel", "data-tab": "try" }, [
      prose(kid ? tryIt.promptKidHtml : tryIt.promptHtml, "try-prompt"),
      ...dataFiles(item),
      el("div", { class: "code-sample-name try-file" }, [starter.fileName]),
      editorHost,
      runBox.element,
      results,
      hintList,
    ]);
  }

  async function renderLesson(item: Lesson, token: number): Promise<void> {
    const tabs: LessonTab[] = ["overview", ...(item.example ? (["example"] as const) : []), ...(item.tryIt ? (["try"] as const) : [])];
    if (!tabs.includes(currentTab)) currentTab = "overview";
    const unit = findUnit(item.track, item.unit);
    const kind = item.kind === "mini" ? "Quick reference" : "Lesson";

    const panels: HTMLElement[] = [buildOverview(item)];
    if (item.example) panels.push(buildExample(item, item.example));
    if (item.tryIt) panels.push(await buildTry(item, item.tryIt));
    // Another lesson was opened while this one was loading its draft.
    if (token !== loadToken) return;

    mainEl.replaceChildren(
      el("article", { class: "lesson" }, [
        el("a", { class: "lesson-back", href: "#/learn" }, [icon("arrowLeft"), el("span", {}, ["All lessons"])]),
        el("p", { class: "eyebrow" }, [`${unit ? (kid ? unit.titleKid : unit.title) : item.unit} · ${kind} · ${item.minutes} min`]),
        el("h1", {}, [titleOf(item), ...(isDone(item.id) ? [el("span", { class: "done-badge" }, [icon("check"), "Done"])] : [])]),
        el(
          "nav",
          { class: "lesson-tabs", "aria-label": "Parts of this lesson" },
          tabs.map((tab) => el("a", { class: "lesson-tab", href: lessonHref(item.id, tab), "data-tab": tab }, [TAB_LABELS[tab]])),
        ),
        ...panels,
      ]),
    );
    showTab();
    mainEl.scrollTop = 0;
  }

  function showTab(): void {
    for (const panel of mainEl.querySelectorAll<HTMLElement>(".lesson-panel")) panel.hidden = panel.dataset.tab !== currentTab;
    for (const tab of mainEl.querySelectorAll<HTMLElement>(".lesson-tab")) {
      if (tab.dataset.tab === currentTab) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    }
  }

  /** Builds the open lesson again, for example after the wording changes. Typed code is kept as a draft. */
  function rebuildLesson(): void {
    if (!lesson) return;
    disposeLesson();
    const token = ++loadToken;
    void renderLesson(lesson, token);
  }

  function show(lessonId: string | null, tab: LessonTab = "overview"): void {
    const id = lessonId !== null && findLesson(lessonId) ? lessonId : null;
    const sameLesson = id !== null && id === currentId && lesson !== null;
    currentId = id;
    currentTab = tab;
    body.dataset.screen = id === null ? "list" : "lesson";
    renderList();

    if (id === null) {
      loadToken += 1;
      disposeLesson();
      lesson = null;
      renderWelcome();
      return;
    }
    if (sameLesson) {
      // Only the tab changed: keep the editor and its contents.
      showTab();
      return;
    }
    disposeLesson();
    lesson = null;
    const token = ++loadToken;
    mainEl.replaceChildren(el("p", { class: "learn-loading" }, ["Opening the lesson…"]));
    loadLesson(id)
      .then(async (loaded) => {
        if (token !== loadToken) return;
        lesson = loaded;
        await renderLesson(loaded, token);
      })
      .catch((error: unknown) => {
        if (token !== loadToken) return;
        mainEl.replaceChildren(
          el("div", { class: "learn-error" }, [
            el("h1", {}, ["This lesson could not be opened"]),
            el("p", {}, [error instanceof Error ? error.message : String(error)]),
            el("a", { class: "btn btn-outline", href: "#/learn" }, ["Back to all lessons"]),
          ]),
        );
      });
  }

  options.onSettingsChange((settings) => {
    if (settings.kidMode === kid) return;
    kid = settings.kidMode;
    renderChrome();
    renderList();
    if (lesson) rebuildLesson();
    else renderWelcome();
  });

  renderChrome();
  renderList();
  renderWelcome();

  return { element, show };
}
