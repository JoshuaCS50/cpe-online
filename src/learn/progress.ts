// What a learner has finished, and the code they were last working on in
// each lesson. Kept on the device with the rest of the app's data.

import type { AppStore } from "../storage/types";

export const PROGRESS_KEY = "learn.progress";
const DRAFT_PREFIX = "learn.draft.";

export interface Progress {
  /** Lesson id -> when its check first passed (milliseconds since the epoch). */
  done: Record<string, number>;
}

/** Builds valid progress from anything stored. */
export function sanitizeProgress(raw: unknown): Progress {
  const done: Record<string, number> = {};
  const source = typeof raw === "object" && raw !== null ? (raw as { done?: unknown }).done : undefined;
  if (typeof source === "object" && source !== null) {
    for (const [id, when] of Object.entries(source)) {
      if (typeof when === "number" && Number.isFinite(when)) done[id] = when;
    }
  }
  return { done };
}

export async function loadProgress(store: AppStore): Promise<Progress> {
  return sanitizeProgress(await store.getValue(PROGRESS_KEY));
}

/** Records a finished lesson. The first finish time is kept. */
export async function markDone(store: AppStore, progress: Progress, id: string, now = Date.now()): Promise<Progress> {
  if (progress.done[id] !== undefined) return progress;
  const next: Progress = { done: { ...progress.done, [id]: now } };
  await store.setValue(PROGRESS_KEY, next);
  return next;
}

export async function loadDraft(store: AppStore, id: string): Promise<string | null> {
  const draft = await store.getValue<unknown>(DRAFT_PREFIX + id);
  return typeof draft === "string" ? draft : null;
}

export function saveDraft(store: AppStore, id: string, code: string): Promise<void> {
  return store.setValue(DRAFT_PREFIX + id, code);
}
