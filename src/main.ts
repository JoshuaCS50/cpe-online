// App entry. The address decides the mode:
//   #/code (or nothing)            the IDE
//   #/learn                        the lesson list
//   #/learn/<lesson>[/<tab>]       a lesson
// The lessons are loaded the first time Learn mode is opened.

import type { LearnApp } from "./learn/learn-app";
import { registerServiceWorker } from "./pwa/register";
import { bootShell } from "./shell/shell";

const shell = await bootShell();

let learn: Promise<LearnApp> | null = null;

function openLearn(): Promise<LearnApp> {
  learn ??= import("./learn/learn-app").then(async ({ createLearnApp }) => {
    const app = await createLearnApp({
      store: shell.store,
      getSettings: shell.getSettings,
      updateSettings: shell.updateSettings,
      onSettingsChange: shell.onSettingsChange,
      openInEditor: shell.openInEditor,
    });
    document.body.append(app.element);
    return app;
  });
  return learn;
}

async function route(): Promise<void> {
  const [, mode, lessonId, tab] = window.location.hash.split("/");
  if (mode !== "learn") {
    shell.setMode("code");
    return;
  }
  const [{ isLessonTab }, app] = await Promise.all([import("./learn/learn-app"), openLearn()]);
  app.show(lessonId ? decodeURIComponent(lessonId) : null, isLessonTab(tab) ? tab : undefined);
  shell.setMode("learn");
}

window.addEventListener("hashchange", () => void route());
await route();

document.documentElement.dataset.ready = "true";
registerServiceWorker(() => document.dispatchEvent(new CustomEvent("cpe:updated")));
