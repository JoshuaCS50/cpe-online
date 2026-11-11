// One-time move of drafts and settings from the old localStorage format into
// the device store.
//
// Guarantees:
//   - localStorage is only read, never changed, so the old data stays as a
//     backup whatever happens.
//   - Everything is written in one atomic import; a failure leaves the store
//     as it was and the migration runs again on the next visit.
//   - Running it twice changes nothing: a flag records completion, and record
//     ids are derived from the old draft ids, so even a repeated import
//     overwrites the same records instead of duplicating them.

import { languageFromFilename } from "./file-types";
import { SETTINGS_KEY, sanitizeSettings } from "./settings";
import { isLanguage } from "./types";
import type { AppStore, FileRecord, ProjectRecord } from "./types";

export const LEGACY_KEY_V1 = "cpe-online.state.v1";
export const LEGACY_KEY_V2 = "cpe-online.state.v2";
export const MIGRATION_FLAG = "migration.localStorage";
export const LEGACY_PROJECT_ID = "legacy-drafts";

/** The part of `localStorage` the migration needs. */
export interface LegacyStorage {
  getItem(key: string): string | null;
}

export type MigrationResult =
  | { status: "migrated"; source: "v1" | "v2"; files: number }
  | { status: "already-done" }
  | { status: "nothing-to-migrate" }
  | { status: "failed"; error: string };

interface LegacyDraft {
  id?: unknown;
  name?: unknown;
  language?: unknown;
  doc?: unknown;
  savedAt?: unknown;
}

interface LegacyState {
  drafts: LegacyDraft[];
  active: unknown;
  settings: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

/** Reads either format. v1 called drafts "tabs" and the open draft "activeTab". */
function readLegacyState(storage: LegacyStorage): { state: LegacyState; source: "v1" | "v2" } | null {
  for (const [key, source] of [
    [LEGACY_KEY_V2, "v2"],
    [LEGACY_KEY_V1, "v1"],
  ] as const) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    const parsed = asRecord(JSON.parse(raw));
    if (!parsed) continue;
    const list = Array.isArray(parsed.drafts) ? parsed.drafts : Array.isArray(parsed.tabs) ? parsed.tabs : [];
    return {
      source,
      state: {
        drafts: list.filter((entry): entry is LegacyDraft => asRecord(entry) !== null),
        active: parsed.activeDraft ?? parsed.activeTab,
        settings: parsed.settings,
      },
    };
  }
  return null;
}

function toFiles(drafts: LegacyDraft[], now: number): { files: FileRecord[]; idByLegacyId: Map<string, string> } {
  const files: FileRecord[] = [];
  const idByLegacyId = new Map<string, string>();
  const used = new Set<string>();

  drafts.forEach((draft, index) => {
    const legacyId = typeof draft.id === "string" && draft.id !== "" ? draft.id : `draft-${index + 1}`;
    let id = `legacy-${legacyId}`;
    // Two drafts with the same old id must not overwrite each other.
    for (let copy = 2; used.has(id); copy++) id = `legacy-${legacyId}-${copy}`;
    used.add(id);
    if (!idByLegacyId.has(legacyId)) idByLegacyId.set(legacyId, id);

    const name = typeof draft.name === "string" && draft.name.trim() !== "" ? draft.name : "untitled.c";
    files.push({
      id,
      projectId: LEGACY_PROJECT_ID,
      name,
      language: isLanguage(draft.language) ? draft.language : languageFromFilename(name),
      doc: typeof draft.doc === "string" ? draft.doc : "",
      // Offsets keep the old tab order when files are listed by creation time.
      createdAt: now + index,
      savedAt: typeof draft.savedAt === "number" && Number.isFinite(draft.savedAt) ? draft.savedAt : now,
    });
  });
  return { files, idByLegacyId };
}

export async function migrateLegacyState(
  store: AppStore,
  storage: LegacyStorage,
  now: number = Date.now(),
): Promise<MigrationResult> {
  try {
    if ((await store.getValue(MIGRATION_FLAG)) !== undefined) return { status: "already-done" };

    const legacy = readLegacyState(storage);
    if (!legacy) return { status: "nothing-to-migrate" };

    const { files, idByLegacyId } = toFiles(legacy.state.drafts, now);
    const activeFileId =
      (typeof legacy.state.active === "string" ? idByLegacyId.get(legacy.state.active) : undefined) ??
      files[0]?.id ??
      null;
    const project: ProjectRecord = { id: LEGACY_PROJECT_ID, name: "My drafts", createdAt: now, activeFileId };

    await store.importSnapshot({
      projects: [project],
      files,
      values: {
        [SETTINGS_KEY]: sanitizeSettings(legacy.state.settings),
        [MIGRATION_FLAG]: { source: legacy.source, at: now, files: files.length },
      },
    });
    return { status: "migrated", source: legacy.source, files: files.length };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}
