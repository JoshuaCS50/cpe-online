import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { openIdbStore } from "../../src/storage/idb-store";
import { createMemoryStore } from "../../src/storage/memory-store";
import {
  LEGACY_KEY_V1,
  LEGACY_KEY_V2,
  LEGACY_PROJECT_ID,
  MIGRATION_FLAG,
  migrateLegacyState,
} from "../../src/storage/migrate-localstorage";
import { DEFAULT_SETTINGS, loadSettings } from "../../src/storage/settings";
import type { AppStore } from "../../src/storage/types";

const NOW = 1_700_000_000_000;

/** A read-only stand-in for localStorage that records every access. */
function fakeStorage(entries: Record<string, string>) {
  const reads: string[] = [];
  return {
    reads,
    getItem(key: string): string | null {
      reads.push(key);
      return entries[key] ?? null;
    },
  };
}

const V2_STATE = {
  drafts: [
    { id: "d1", name: "hello.c", language: "c", doc: "int main(){}", savedAt: 111 },
    { id: "d7", name: "sum.py", language: "python", doc: "print(1+1)", savedAt: 222 },
    { id: "d3", name: "Main.java", language: "java", doc: "class Main {}", savedAt: 333 },
  ],
  activeDraft: "d7",
  settings: { theme: "catppuccin", fontSize: 18, wrap: true, outputWrap: false, seenOnboarding: true, streamingMode: true },
};

const V1_STATE = {
  tabs: [
    { id: "t1", name: "old.c", language: "c", doc: "// v1" },
    { id: "t2", name: "calc.cpp", doc: "// no language field" },
  ],
  activeTab: "t2",
  settings: { theme: "light", fontSize: 14 },
};

let databaseCounter = 0;
const stores: [string, () => Promise<AppStore>][] = [
  ["memory", async () => createMemoryStore()],
  ["IndexedDB", () => openIdbStore(`migrate-db-${++databaseCounter}`)],
];

describe.each(stores)("migrateLegacyState into the %s store", (_name, open) => {
  it("moves v2 drafts, the open draft and the settings", async () => {
    const store = await open();
    const result = await migrateLegacyState(store, fakeStorage({ [LEGACY_KEY_V2]: JSON.stringify(V2_STATE) }), NOW);

    expect(result).toEqual({ status: "migrated", source: "v2", files: 3 });
    const files = await store.listFiles(LEGACY_PROJECT_ID);
    expect(files.map((f) => [f.id, f.name, f.language, f.doc, f.savedAt])).toEqual([
      ["legacy-d1", "hello.c", "c", "int main(){}", 111],
      ["legacy-d7", "sum.py", "python", "print(1+1)", 222],
      ["legacy-d3", "Main.java", "java", "class Main {}", 333],
    ]);
    expect(await store.getProject(LEGACY_PROJECT_ID)).toEqual({
      id: LEGACY_PROJECT_ID,
      name: "My drafts",
      createdAt: NOW,
      activeFileId: "legacy-d7",
    });
    expect(await loadSettings(store)).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "catppuccin",
      fontSize: 18,
      wrap: true,
      outputWrap: false,
      seenOnboarding: true,
    });
  });

  it("moves v1 tabs when there is no v2 state, inferring a missing language from the name", async () => {
    const store = await open();
    const result = await migrateLegacyState(store, fakeStorage({ [LEGACY_KEY_V1]: JSON.stringify(V1_STATE) }), NOW);

    expect(result).toEqual({ status: "migrated", source: "v1", files: 2 });
    const files = await store.listFiles(LEGACY_PROJECT_ID);
    expect(files.map((f) => [f.name, f.language, f.savedAt])).toEqual([
      ["old.c", "c", NOW],
      ["calc.cpp", "cpp", NOW],
    ]);
    expect((await store.getProject(LEGACY_PROJECT_ID))?.activeFileId).toBe("legacy-t2");
    expect((await loadSettings(store)).theme).toBe("light");
  });

  it("prefers v2 when both formats are present", async () => {
    const store = await open();
    const storage = fakeStorage({ [LEGACY_KEY_V1]: JSON.stringify(V1_STATE), [LEGACY_KEY_V2]: JSON.stringify(V2_STATE) });
    expect(await migrateLegacyState(store, storage, NOW)).toMatchObject({ source: "v2" });
  });

  it("does nothing the second time", async () => {
    const store = await open();
    const storage = fakeStorage({ [LEGACY_KEY_V2]: JSON.stringify(V2_STATE) });
    await migrateLegacyState(store, storage, NOW);

    // The user edits a migrated file; a second migration must not undo that.
    const edited = (await store.listFiles(LEGACY_PROJECT_ID))[0];
    if (!edited) throw new Error("expected a migrated file");
    await store.putFile({ ...edited, doc: "edited after migration" });

    expect(await migrateLegacyState(store, storage, NOW + 5000)).toEqual({ status: "already-done" });
    const files = await store.listFiles(LEGACY_PROJECT_ID);
    expect(files).toHaveLength(3);
    expect(files[0]?.doc).toBe("edited after migration");
  });

  it("reports nothing to migrate for a new user and leaves the store empty", async () => {
    const store = await open();
    expect(await migrateLegacyState(store, fakeStorage({}), NOW)).toEqual({ status: "nothing-to-migrate" });
    expect(await store.listProjects()).toEqual([]);
    expect(await store.getValue(MIGRATION_FLAG)).toBeUndefined();
  });

  it("fails without writing anything when the old data is not valid JSON, and can run again later", async () => {
    const store = await open();
    const result = await migrateLegacyState(store, fakeStorage({ [LEGACY_KEY_V2]: "{not json" }), NOW);
    expect(result.status).toBe("failed");
    expect(await store.listProjects()).toEqual([]);
    expect(await store.getValue(MIGRATION_FLAG)).toBeUndefined();

    const retry = await migrateLegacyState(store, fakeStorage({ [LEGACY_KEY_V2]: JSON.stringify(V2_STATE) }), NOW);
    expect(retry.status).toBe("migrated");
  });

  it("survives damaged drafts: missing ids, names, text, duplicate ids, non-object entries", async () => {
    const store = await open();
    const damaged = {
      drafts: [
        { id: "same", name: "a.c", doc: "A" },
        { id: "same", name: "b.py", doc: "B" },
        { name: "", language: "klingon", doc: 42 },
        null,
        "junk",
      ],
      activeDraft: "gone",
    };
    const result = await migrateLegacyState(store, fakeStorage({ [LEGACY_KEY_V2]: JSON.stringify(damaged) }), NOW);

    expect(result).toEqual({ status: "migrated", source: "v2", files: 3 });
    const files = await store.listFiles(LEGACY_PROJECT_ID);
    expect(files.map((f) => [f.id, f.name, f.language, f.doc])).toEqual([
      ["legacy-same", "a.c", "c", "A"],
      ["legacy-same-2", "b.py", "python", "B"],
      ["legacy-draft-3", "untitled.c", "c", ""],
    ]);
    // The remembered draft no longer exists, so the first file opens.
    expect((await store.getProject(LEGACY_PROJECT_ID))?.activeFileId).toBe("legacy-same");
    expect(await loadSettings(store)).toEqual(DEFAULT_SETTINGS);
  });

  it("migrates a state with no drafts into an empty project", async () => {
    const store = await open();
    const result = await migrateLegacyState(store, fakeStorage({ [LEGACY_KEY_V2]: JSON.stringify({ drafts: [] }) }), NOW);
    expect(result).toEqual({ status: "migrated", source: "v2", files: 0 });
    expect((await store.getProject(LEGACY_PROJECT_ID))?.activeFileId).toBeNull();
  });
});

describe("migrateLegacyState", () => {
  it("only ever reads from the old storage", async () => {
    const storage = fakeStorage({ [LEGACY_KEY_V2]: JSON.stringify(V2_STATE) });
    await migrateLegacyState(createMemoryStore(), storage, NOW);
    // The stand-in has no write methods at all; reaching here means none were called.
    expect(storage.reads).toEqual([LEGACY_KEY_V2]);
  });

  it("reports a failed import and leaves the flag unset", async () => {
    const store = createMemoryStore();
    const failing: AppStore = {
      ...store,
      importSnapshot: () => Promise.reject(new Error("quota exceeded")),
    };
    const result = await migrateLegacyState(failing, fakeStorage({ [LEGACY_KEY_V2]: JSON.stringify(V2_STATE) }), NOW);
    expect(result).toEqual({ status: "failed", error: "quota exceeded" });
    expect(await store.getValue(MIGRATION_FLAG)).toBeUndefined();
  });
});
